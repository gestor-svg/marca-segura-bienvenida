/**
 * MARCA SEGURA — Extractor de datos del Acuse de Solicitud Electrónica (IMPI)
 * -------------------------------------------------------------------------
 * Complementa a ../extract.mjs (que lee el título de registro): este archivo
 * lee el ACUSE DE RECEPCIÓN de la solicitud electrónica presentada ante el
 * IMPI, que trae datos que el título nunca tiene — CURP/RFC, domicilio para
 * notificaciones, tipo de trámite, teléfono y correo del solicitante.
 *
 * Igual que el título, no es un AcroForm (0 campos) y no es texto de flujo
 * simple: es una plantilla de posiciones fijas. La mayoría de los pares
 * etiqueta→valor comparten fila y se leen con una sola regex sobre el texto
 * de la página completa. Dos bloques sí necesitan agrupación por fila/columna
 * porque la plantilla los dibuja a 2 columnas (personas física/moral) o
 * porque el valor de una etiqueta larga cae en la fila de abajo en vez de
 * la misma línea (p. ej. "Municipio o demarcación territorial:").
 *
 * Tailored a la plantilla observada en un acuse real de "Registro de Marca";
 * otros tipos de trámite (Aviso Comercial, Nombre Comercial, etc.) pueden
 * variar el texto de algunas etiquetas y no estar cubiertos aún.
 */

function groupRows(items, tol = 3) {
  const rows = [];
  for (const it of items) {
    if (!it.str.trim()) continue;
    let row = rows.find(r => Math.abs(r.y - it.y) <= tol);
    if (!row) { row = { y: it.y, items: [] }; rows.push(row); }
    row.items.push(it);
  }
  rows.sort((a, b) => b.y - a.y);
  rows.forEach(r => r.items.sort((a, b) => a.x - b.x));
  return rows;
}

function rowText(row) {
  return row.items.map(it => it.str).join(' ').trim();
}

function colText(row, xMin, xMax) {
  return row.items.filter(it => it.x >= xMin && it.x < xMax).map(it => it.str).join(' ').trim();
}

function sliceRows(rows, fromText, toText) {
  const startIdx = rows.findIndex(r => rowText(r).includes(fromText));
  if (startIdx === -1) return [];
  let endIdx = rows.length;
  if (toText) {
    const found = rows.findIndex((r, i) => i > startIdx && rowText(r).includes(toText));
    if (found !== -1) endIdx = found;
  }
  return rows.slice(startIdx, endIdx);
}

async function getPageData(doc) {
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items = content.items.map(it => ({
      str: it.str,
      x: Math.round(it.transform[4]),
      y: Math.round(it.transform[5]),
    }));
    pages.push({ num: i, items, text: items.map(it => it.str).join(' '), rows: groupRows(items) });
  }
  return pages;
}

function findPage(pages, ...mustInclude) {
  return pages.find(p => mustInclude.every(s => p.text.includes(s))) || null;
}

// ---------------------------------------------------------------------
// Bloque persona física / persona moral: 2 columnas paralelas, valores
// siempre en la misma fila que su etiqueta.
// ---------------------------------------------------------------------
const PERSONA_FISICA_LABELS = [
  ['curp', /^CURP\b.*?:\s*(.*)$/i],
  ['nombres', /^Nombre\(s\):\s*(.*)$/i],
  ['apellido1', /^Primer apellido:\s*(.*)$/i],
  ['apellido2', /^Segundo apellido:\s*(.*)$/i],
  ['nacionalidad', /^Nacionalidad:\s*(.*)$/i],
  ['telefono', /^Teléfono[^:]*:\s*(.*)$/i],
  ['correo', /^Correo electrónico:\s*(.*)$/i],
];
const PERSONA_MORAL_LABELS = [
  ['rfc', /^RFC\b.*?:\s*(.*)$/i],
  ['denominacion', /^Denominación o razón social:\s*(.*)$/i],
  ['nacionalidad', /^Nacionalidad:\s*(.*)$/i],
  ['telefono', /^Teléfono[^:]*:\s*(.*)$/i],
  ['correo', /^Correo electrónico:\s*(.*)$/i],
];

function extractPersonaColumn(rows, xMin, xMax, labelDefs) {
  const result = {};
  for (const row of rows) {
    const text = colText(row, xMin, xMax);
    if (!text) continue;
    for (const [key, re] of labelDefs) {
      if (result[key]) continue;
      const m = text.match(re);
      if (m && m[1] && m[1].trim()) result[key] = m[1].trim();
    }
  }
  return result;
}

// ---------------------------------------------------------------------
// Bloque "Domicilio para oír y recibir notificaciones": una sola columna
// salvo la fila "Número exterior: X  Número interior: Y", y con el caso
// especial de que el valor de "Municipio o demarcación territorial:"
// (etiqueta larga) cae en la fila siguiente en vez de la misma línea.
// ---------------------------------------------------------------------
function extractDomicilioBlock(rows) {
  const result = {};
  const simple = [
    ['cp', /Código postal:\s*(\S+)/i],
    ['calle', /Calle:\s*(.+)/i],
    ['colonia', /Colonia:\s*(.+)/i],
    ['entidad', /Entidad federativa:\s*(.+)/i],
  ];
  for (let i = 0; i < rows.length; i++) {
    const text = rowText(rows[i]);
    if (/^\(Por ejemplo/i.test(text)) continue;

    const mExtInt = text.match(/Número exterior:\s*(\S*)\s*(?:Número interior:\s*(\S*))?/i);
    if (mExtInt) {
      if (mExtInt[1] && !result.numExt) result.numExt = mExtInt[1];
      if (mExtInt[2] && !result.numInt) result.numInt = mExtInt[2];
    }

    for (const [key, re] of simple) {
      if (result[key]) continue;
      const m = text.match(re);
      if (m && m[1] && m[1].trim()) result[key] = m[1].trim();
    }

    if (!result.municipio && /Municipio o demarcación territorial:\s*(?:Localidad:|$)/i.test(text)) {
      const next = rows[i + 1] ? colText(rows[i + 1], 0, 250).trim() : '';
      if (next && !next.includes(':') && !/^\(Por ejemplo/i.test(next)) {
        result.municipio = next;
      }
    }
  }
  return result;
}

export async function extractImpiSolicitud(pdfjsLib, pdfBytes) {
  const doc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  const pages = await getPageData(doc);

  const page1 = findPage(pages, 'SOLICITUD DE:', 'EXPEDIENTE');
  const page2 = findPage(pages, 'Domicilio para oír y recibir notificaciones');
  const page3 = findPage(pages, 'Datos del signo distintivo');

  if (!page1 && !page2 && !page3) {
    throw new Error('No se reconoció este PDF como un acuse de solicitud electrónica del IMPI.');
  }

  const get = (regex, text) => {
    const m = text ? text.match(regex) : null;
    return m ? m[1].trim() : null;
  };

  // ---- Página 1: expediente, tipo de trámite, folio de recepción ----
  let expediente = null, tipoTramite = null, folioRecepcion = null,
      fechaRecepcion = null, solicitanteNombre = null;
  if (page1) {
    expediente = get(/(\d+)\s*EXPEDIENTE:/, page1.text);
    tipoTramite = get(/SOLICITUD DE:\s*([A-ZÁÉÍÓÚÑ\s]+?)\s*SOLICITANTE/, page1.text);
    const recepcion = page1.text.match(/(\d+)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2}:\d{2})/);
    if (recepcion) { folioRecepcion = recepcion[1]; fechaRecepcion = recepcion[2]; }
    solicitanteNombre = get(/SOLICITANTE\(S\) O REPRESENTANTE LEGAL:\s*(.+?)\s*DOCUMENTOS ANEXOS:/, page1.text);
  }

  // ---- Página 2: fecha de trámite, persona física/moral, domicilio ----
  let fechaTramite = null;
  let personaFisica = {}, personaMoral = {}, domicilioNotificaciones = {};
  if (page2) {
    const fecha = page2.text.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})\s*Fecha de solicitud del trámite/);
    if (fecha) fechaTramite = `${fecha[3]}-${fecha[2].padStart(2, '0')}-${fecha[1].padStart(2, '0')}`;

    const personaRows = sliceRows(page2.rows, 'Personas físicas', 'Domicilio del solicitante');
    personaFisica = extractPersonaColumn(personaRows, 0, 250, PERSONA_FISICA_LABELS);
    personaMoral = extractPersonaColumn(personaRows, 250, 100000, PERSONA_MORAL_LABELS);

    const notifRows = sliceRows(page2.rows, 'Domicilio para oír y recibir notificaciones', null);
    domicilioNotificaciones = extractDomicilioBlock(notifRows);
  }

  // ---- Página 3: clase, productos/servicios, nombre de quien firma ----
  let clase = null, productosServicios = null, nombreFirma = null;
  if (page3) {
    clase = get(/Clase:\s*(\d+)/, page3.text);
    productosServicios =
      get(/casilla\s+(.+?)\s+Continúa en anexo\s+Clase:/s, page3.text) ||
      get(/casilla\s+(.+?)\s+Clase:/s, page3.text);

    const firmaIdx = page3.rows.findIndex(r => rowText(r).includes('Nombre del solicitante o de su representante'));
    if (firmaIdx !== -1) {
      // La firma digital (letras/dígitos/símbolos) puede caer en la misma
      // fila que el nombre por la tolerancia de agrupación; se aíslan por
      // columna (el nombre queda a la izquierda, el token de firma a la
      // derecha) en vez de leer la fila completa.
      for (let j = firmaIdx + 1; j < page3.rows.length && j <= firmaIdx + 3; j++) {
        const candidate = colText(page3.rows[j], 0, 200);
        if (/^[A-ZÁÉÍÓÚÑ\s.,]+$/.test(candidate) && candidate.trim().length > 3) {
          nombreFirma = candidate.trim();
          break;
        }
      }
    }
  }

  const hasFisica = Object.values(personaFisica).some(Boolean);
  const hasMoral = Object.values(personaMoral).some(Boolean);

  return {
    expediente,
    tipoTramite,
    folioRecepcion,
    fechaRecepcion,
    solicitanteNombre,
    fechaTramite,
    personaFisica,
    personaMoral,
    personaSugerida: hasMoral && !hasFisica ? 'moral' : 'fisica',
    domicilioNotificaciones,
    clase,
    productosServicios: productosServicios ? productosServicios.replace(/\s+/g, ' ').trim() : null,
    nombreFirma,
  };
}
