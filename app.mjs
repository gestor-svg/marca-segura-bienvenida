/**
 * MARCA SEGURA — App de generación del paquete de bienvenida
 * -------------------------------------------------------------------------
 * Flujo:
 *  1. El usuario sube el PDF del título del IMPI (cédula + título).
 *  2. Se extraen los datos automáticamente (extract.mjs).
 *  3. Se muestran en un formulario editable (por si algo hay que corregir).
 *  4. Al generar: se arma el logo del cliente (si es mixta), el QR de
 *     referido, se renderizan las 3 hojas con html2canvas, y se fusionan
 *     con el PDF original usando pdf-lib. Se descarga el resultado.
 *
 * Dependencias externas (cargadas por CDN en index.html):
 *   pdfjsLib, html2canvas, PDFLib, QRCode
 */

import { extractImpiTitulo } from './extract.mjs';
import { extractClientLogoDataUrl } from './extractLogo.mjs';
import { buildHoja1, buildHoja2, buildHoja3 } from './templates.mjs';
import { parseSpanishDate, formatLargo, ventanaDeclaracionUso, formatMesAnio } from './date-utils.mjs';
import { MS_LOGO_BASE64 } from './assets.mjs';

// ====== CONFIGURACIÓN — AJUSTA ESTOS DOS VALORES ======
// URL de tu Apps Script Web App (ver referidos_qr.gs) — termina en /exec
const WEBAPP_URL = localStorage.getItem('ms_webapp_url') || 'https://script.google.com/macros/s/REEMPLAZAR/exec';
// =======================================================

const state = {
  originalBytes: null,
  originalFileName: null,
  pdfjsDoc: null,
  extracted: null,
  clientLogoDataUrl: null, // dataURL completo "data:image/png;base64,...."
};

const $ = (id) => document.getElementById(id);

function dataUrlToBase64(dataUrl) {
  return dataUrl.split(',')[1];
}

async function fileToUint8Array(file) {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}

async function handleFileUpload(file) {
  $('status').textContent = 'Leyendo PDF y extrayendo datos…';
  $('formSection').style.display = 'none';
  $('resultSection').style.display = 'none';

  state.originalBytes = await fileToUint8Array(file);
  state.originalFileName = file.name;

  // pdfjsLib.getDocument consume el buffer; usamos una copia para no afectar el original
  const bytesForExtract = state.originalBytes.slice();
  state.extracted = await extractImpiTitulo(window.pdfjsLib, bytesForExtract);

  // Cargar el doc de nuevo (independiente) para extraer el logo si aplica
  const loadingTask = window.pdfjsLib.getDocument({ data: state.originalBytes.slice() });
  state.pdfjsDoc = await loadingTask.promise;

  state.clientLogoDataUrl = null;
  if (state.extracted.tipo === 'mixta') {
    try {
      state.clientLogoDataUrl = await extractClientLogoDataUrl(window.pdfjsLib, state.pdfjsDoc, state.extracted.dataPageNum);
    } catch (e) {
      console.warn('No se pudo extraer el logo del cliente automáticamente:', e);
    }
  }

  populateForm(state.extracted, state.clientLogoDataUrl);
  $('status').textContent = 'Datos extraídos. Revisa y corrige si algo no cuadra antes de generar.';
  $('formSection').style.display = 'block';
}

function populateForm(data, logoDataUrl) {
  $('f_marca').value = data.marca || '';
  $('f_registro').value = data.registro || '';
  $('f_expediente').value = data.expediente || '';
  $('f_titulares').value = (data.titulares || []).join(', ');
  $('f_domicilio').value = data.domicilio || '';
  $('f_clase').value = data.clase || '';
  $('f_seAplicaA').value = data.seAplicaA || '';
  $('f_fechaEmision').value = data.fechaEmision || '';
  $('f_fechaVigencia').value = data.fechaVigencia || '';
  $('f_tipo').value = data.tipo || 'nominativa';

  const preview = $('logoPreview');
  if (logoDataUrl) {
    preview.src = logoDataUrl;
    preview.style.display = 'block';
    $('logoPreviewLabel').textContent = 'Logo del cliente detectado automáticamente:';
  } else {
    preview.style.display = 'none';
    $('logoPreviewLabel').textContent = 'No se detectó logo del cliente (o la marca es nominativa). Puedes subir uno manualmente abajo si aplica.';
  }
}

async function generateQrDataUrl(marca, expediente) {
  const webappUrl = $('webappUrlInput').value.trim() || WEBAPP_URL;
  const params = new URLSearchParams({ marca, exp: expediente });
  const url = `${webappUrl}?${params.toString()}`;
  return new Promise((resolve, reject) => {
    window.QRCode.toDataURL(url, { width: 400, margin: 1, color: { dark: '#0E51C4', light: '#FFFFFF' } }, (err, dataUrl) => {
      if (err) reject(err); else resolve(dataUrl);
    });
  });
}

async function renderHojaToCanvas(html) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '816px';
  container.style.height = '1056px';
  document.body.appendChild(container);

  // Escribimos el HTML dentro de un iframe para aislar estilos/fuentes por hoja
  const iframe = document.createElement('iframe');
  iframe.style.width = '816px';
  iframe.style.height = '1056px';
  iframe.style.border = 'none';
  container.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();

  // esperar fuentes/carga
  await new Promise(resolve => setTimeout(resolve, 600));
  if (iframe.contentDocument.fonts && iframe.contentDocument.fonts.ready) {
    try { await iframe.contentDocument.fonts.ready; } catch (e) {}
  }

  const target = iframe.contentDocument.getElementById('page-render-target');
  const canvas = await window.html2canvas(target, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#F7F5F0',
    width: 816,
    height: 1056,
  });

  document.body.removeChild(container);
  return canvas;
}

async function generateAndDownload() {
  $('status').textContent = 'Generando hojas de bienvenida…';
  $('generateBtn').disabled = true;

  try {
    const titulares = $('f_titulares').value.split(',').map(s => s.trim()).filter(Boolean);
    const manualLogoInput = $('manualLogoUpload');
    let clientLogoDataUrl = state.clientLogoDataUrl;
    if (manualLogoInput.files && manualLogoInput.files[0]) {
      clientLogoDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(manualLogoInput.files[0]);
      });
    }
    const tipo = $('f_tipo').value; // permite forzar mixta/nominativa manualmente

    const data = {
      marca: $('f_marca').value,
      registro: $('f_registro').value,
      expediente: $('f_expediente').value,
      titulares,
      domicilio: $('f_domicilio').value,
      clase: $('f_clase').value,
      seAplicaA: $('f_seAplicaA').value,
      fechaEmision: $('f_fechaEmision').value,
      fechaVigencia: $('f_fechaVigencia').value,
      tipo,
    };

    const fechaEmisionDate = parseSpanishDate(data.fechaEmision);
    const fechaVigenciaDate = parseSpanishDate(data.fechaVigencia);
    const ventana = ventanaDeclaracionUso(fechaEmisionDate);

    const templateData = {
      ...data,
      fechaEmisionLargo: fechaEmisionDate ? formatLargo(fechaEmisionDate) : data.fechaEmision,
      fechaVigenciaLargo: fechaVigenciaDate ? formatLargo(fechaVigenciaDate) : data.fechaVigencia,
      declaracionVenceStr: ventana ? formatMesAnio(ventana.limite) : '',
    };

    $('status').textContent = 'Generando código QR de referido…';
    const qrDataUrl = await generateQrDataUrl(data.marca, data.expediente);

    const assets = {
      msLogoBase64: MS_LOGO_BASE64,
      qrBase64: dataUrlToBase64(qrDataUrl),
      clientLogoBase64: (tipo === 'mixta' && clientLogoDataUrl) ? dataUrlToBase64(clientLogoDataUrl) : null,
    };

    $('status').textContent = 'Dibujando hoja 1 de 3…';
    const canvas1 = await renderHojaToCanvas(buildHoja1(templateData, assets));
    $('status').textContent = 'Dibujando hoja 2 de 3…';
    const canvas2 = await renderHojaToCanvas(buildHoja2(templateData, assets));
    $('status').textContent = 'Dibujando hoja 3 de 3…';
    const canvas3 = await renderHojaToCanvas(buildHoja3(templateData, assets));

    $('status').textContent = 'Fusionando con el título original…';
    const { PDFDocument } = window.PDFLib;
    const merged = await PDFDocument.create();

    for (const canvas of [canvas1, canvas2, canvas3]) {
      const pngDataUrl = canvas.toDataURL('image/png');
      const pngBytes = Uint8Array.from(atob(pngDataUrl.split(',')[1]), c => c.charCodeAt(0));
      const png = await merged.embedPng(pngBytes);
      const page = merged.addPage([612, 792]);
      page.drawImage(png, { x: 0, y: 0, width: 612, height: 792 });
    }

    const originalDoc = await PDFDocument.load(state.originalBytes);
    const copiedPages = await merged.copyPages(originalDoc, originalDoc.getPageIndices());
    copiedPages.forEach(p => merged.addPage(p));

    const finalBytes = await merged.save();
    const blob = new Blob([finalBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const safeMarca = (data.marca || 'marca').replace(/[^a-z0-9]+/gi, '_');
    const downloadName = `${safeMarca}_Bienvenida_MarcaSegura.pdf`;

    const link = $('downloadLink');
    link.href = url;
    link.download = downloadName;
    link.textContent = `Descargar ${downloadName}`;
    $('resultSection').style.display = 'block';
    $('status').textContent = '¡Listo! Tu paquete de bienvenida está preparado.';
  } catch (err) {
    console.error(err);
    $('status').textContent = 'Ocurrió un error: ' + err.message;
  } finally {
    $('generateBtn').disabled = false;
  }
}

// ====== Eventos ======
window.addEventListener('DOMContentLoaded', () => {
  $('fileInput').addEventListener('change', (e) => {
    if (e.target.files[0]) handleFileUpload(e.target.files[0]);
  });
  $('generateBtn').addEventListener('click', generateAndDownload);

  const webappInput = $('webappUrlInput');
  webappInput.value = WEBAPP_URL;
  webappInput.addEventListener('change', () => {
    localStorage.setItem('ms_webapp_url', webappInput.value.trim());
  });
});
