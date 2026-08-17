/**
 * MARCA SEGURA — Extractor de datos de Título de Registro de Marca (IMPI)
 * -------------------------------------------------------------------------
 * Funciona tanto en Node (para pruebas) como en navegador, siempre que se le
 * pase una instancia de pdfjs-dist ya cargada (evita duplicar dependencias).
 *
 * Estrategia:
 *  - La mayoría de los campos se extraen con anclas de texto sobre el texto
 *    plano de la página (orden robusto: el generador de PDF del IMPI siempre
 *    coloca "valor" pegado a su "etiqueta", a veces antes, a veces después,
 *    pero siempre juntos y sin ambigüedad... excepto Titular/Domicilio.
 *  - Titular y Domicilio se separan usando coordenadas x/y, porque en el
 *    texto plano quedan pegados sin separador (ver notas en el código).
 */

export async function extractImpiTitulo(pdfjsLib, pdfBytes) {
  const doc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;

  // 1. Encontrar la página que contiene "TITULO DE REGISTRO DE MARCA" con los datos
  //    (la primera ocurrencia trae todos los campos; puede haber una 2a página
  //    de "Establecimiento" que solo repite el domicilio fiscal).
  let dataPageNum = null;
  let dataPageText = null;
  let dataPageItems = null;
  let lastPageText = ''; // para capturar fecha de emisión / folio en la última página

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items = content.items.map(it => ({
      str: it.str,
      x: Math.round(it.transform[4]),
      y: Math.round(it.transform[5]),
    }));
    const text = items.map(it => it.str).join(' ');

    if (text.includes('TITULO DE REGISTRO DE MARCA') && text.includes('EXPEDIENTE')) {
      dataPageNum = i;
      dataPageText = text;
      dataPageItems = items;
    }
    if (i === doc.numPages) lastPageText = text;
  }

  if (!dataPageNum) {
    throw new Error('No se encontró una página de "TITULO DE REGISTRO DE MARCA" con datos en este PDF.');
  }

  const get = (regex, text = dataPageText) => {
    const m = text.match(regex);
    return m ? m[1].trim() : null;
  };

  const registro = get(/Registro\s+(\d+)/);
  const marca = get(/TITULO DE REGISTRO DE MARCA\s+(.+?)\s+\d+\s*EXPEDIENTE:/s);
  const expediente = get(/(\d+)\s*EXPEDIENTE:/);
  const fechaPresentacion = get(/(\d{1,2}\/\w+\/\d{4}\s+\d{1,2}:\d{2}:\d{2}\s*[AP]M)\s*FECHA DE PRESENTACIÓN:/);
  const fechaPrimerUso = get(/([\d]{1,2}\/\w+\/\d{4})\s*FECHA DE PRIMER USO:/);
  const fechaVigencia = get(/([\d]{1,2}\/\w+\/\d{4})\s*FECHA DE VIGENCIA:/);
  const clase = get(/CLASE:\s+(\d+)/);
  let seAplicaA = get(/SE APLICA A:\s+(.+?)\s*(?=TOTAL DE VIENA|La impresión del signo distintivo|El registro de referencia se otorga|FECHA DE PRIMER USO:|$)/s);
  if (seAplicaA) {
    // limpia fecha de primer uso que a veces queda pegada al final (orden invertido valor/etiqueta)
    seAplicaA = seAplicaA.replace(/\s+\d{1,2}\/\w+\/\d{4}\s*$/, '').trim();
  }
  const fechaEmision = get(/CIUDAD DE MÉXICO,\s*A\s*(.+?\d{4})/, lastPageText);
  const folio = get(/\b(\d{11})\b/, dataPageText) || get(/\b(\d{11})\b/, lastPageText);

  // 2. Titular y Domicilio — separados por posición (columna x=127, filas entre
  //    la etiqueta "TITULAR:" y la etiqueta "CLASE:")
  const rows = [];
  for (const it of dataPageItems) {
    if (!it.str.trim()) continue;
    let row = rows.find(r => Math.abs(r.y - it.y) <= 3);
    if (!row) { row = { y: it.y, items: [] }; rows.push(row); }
    row.items.push(it);
  }
  rows.sort((a, b) => b.y - a.y);
  rows.forEach(r => r.items.sort((a, b) => a.x - b.x));

  const titularRowIdx = rows.findIndex(r => r.items.some(it => it.str.trim() === 'TITULAR:'));
  const claseRowIdx = rows.findIndex(r => r.items.some(it => it.str.trim().startsWith('CLASE:')));

  let titular = null, domicilio = null;
  if (titularRowIdx !== -1 && claseRowIdx !== -1) {
    // Todas las líneas de valor (columna x>=100) entre TITULAR: y CLASE:
    const valueLines = [];
    for (let i = titularRowIdx; i < claseRowIdx; i++) {
      const valueItems = rows[i].items.filter(it => it.x >= 100);
      if (valueItems.length) {
        valueLines.push(valueItems.map(it => it.str).join(' '));
      }
    }
    // El domicilio siempre contiene "MEXICO" como última palabra relevante;
    // usamos eso para partir el bloque en titular(es) vs domicilio.
    const fullBlock = valueLines.join(' ');
    const mexicoIdx = fullBlock.lastIndexOf('MEXICO');
    if (mexicoIdx !== -1) {
      // Buscar hacia atrás el inicio del domicilio: una línea que contenga
      // un patrón de calle (dígitos, "NUM", o similar) o simplemente usamos
      // la línea completa que contiene el código postal + MEXICO y todo lo
      // que quedó "colgado" desde la penúltima línea de nombres.
      // Heurística robusta: domicilio = últimas 1-2 líneas de valueLines que
      // contienen dígitos (número de calle o CP); titular = el resto.
      let splitIdx = valueLines.length;
      for (let i = valueLines.length - 1; i >= 0; i--) {
        if (/\d/.test(valueLines[i])) {
          splitIdx = i;
        } else {
          break;
        }
      }
      titular = valueLines.slice(0, splitIdx).join(' ').replace(/,\s*$/, '').trim();
      domicilio = valueLines.slice(splitIdx).join(' ').trim();
    } else {
      titular = fullBlock.trim();
    }
  }

  const titulares = titular
    ? titular.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  // 3. Detección mixta vs nominativa: buscamos imágenes grandes (no
  //    decorativas) en la página de datos.
  let tieneLogo = false;
  try {
    const page = await doc.getPage(dataPageNum);
    const opList = await page.getOperatorList();
    const OPS = pdfjsLib.OPS;
    for (let i = 0; i < opList.fnArray.length; i++) {
      if (opList.fnArray[i] === OPS.paintImageXObject || opList.fnArray[i] === OPS.paintJpegXObject) {
        const imgName = opList.argsArray[i][0];
        try {
          const img = await new Promise((resolve, reject) => {
            page.objs.get(imgName, resolve);
          });
          if (img && img.width > 150 && img.height > 150 && (img.width / img.height) < 3) {
            tieneLogo = true;
            break;
          }
        } catch (e) { /* ignore */ }
      }
    }
  } catch (e) { /* si falla la detección, asumimos nominativa */ }

  return {
    marca,
    tipo: tieneLogo ? 'mixta' : 'nominativa',
    registro,
    expediente,
    titulares,
    domicilio,
    clase,
    seAplicaA: seAplicaA ? seAplicaA.replace(/\s+/g, ' ').trim() : null,
    fechaPresentacion,
    fechaPrimerUso,
    fechaVigencia,
    fechaEmision,
    folio,
    dataPageNum,
  };
}
