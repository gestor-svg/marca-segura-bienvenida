/**
 * MARCA SEGURA — Extractor de logo del cliente (marca mixta)
 * -------------------------------------------------------------------------
 * Usa pdf.js para localizar la imagen más grande y "cuadrada" (no las franjas
 * decorativas de la plantilla IMPI, que son muy alargadas) en la página del
 * título, y le quita el fondo casi-blanco para que se integre al diseño sin
 * verse "pegada". Requiere DOM (canvas) — corre en el navegador.
 */

export async function extractClientLogoDataUrl(pdfjsLib, doc, pageNum) {
  const page = await doc.getPage(pageNum);
  const opList = await page.getOperatorList();
  const OPS = pdfjsLib.OPS;

  let bestImg = null;
  for (let i = 0; i < opList.fnArray.length; i++) {
    const isImage = opList.fnArray[i] === OPS.paintImageXObject || opList.fnArray[i] === OPS.paintJpegXObject;
    if (!isImage) continue;
    const imgName = opList.argsArray[i][0];
    const img = await new Promise((resolve) => page.objs.get(imgName, resolve));
    // Filtra franjas/gráficos de plantilla (muy alargados) y decoraciones diminutas.
    if (img && img.width > 150 && img.height > 150 && (img.width / img.height) < 3) {
      if (!bestImg || img.width * img.height > bestImg.width * bestImg.height) {
        bestImg = img;
      }
    }
  }
  if (!bestImg) return null;

  const canvas = document.createElement('canvas');
  canvas.width = bestImg.width;
  canvas.height = bestImg.height;
  const ctx = canvas.getContext('2d');

  // pdf.js puede exponer la imagen de dos formas distintas según el navegador
  // y el tipo de codec: como ImageBitmap ya decodificado (.bitmap) o como
  // buffer de píxeles crudo (.data). Cubrimos ambos casos.
  if (bestImg.bitmap) {
    ctx.drawImage(bestImg.bitmap, 0, 0, bestImg.width, bestImg.height);
  } else if (bestImg.data) {
    const imageData = ctx.createImageData(bestImg.width, bestImg.height);
    const src = bestImg.data;
    const dst = imageData.data;
    if (src.length === bestImg.width * bestImg.height * 4) {
      dst.set(src);
    } else if (src.length === bestImg.width * bestImg.height * 3) {
      for (let p = 0, s = 0; p < dst.length; p += 4, s += 3) {
        dst[p] = src[s]; dst[p + 1] = src[s + 1]; dst[p + 2] = src[s + 2]; dst[p + 3] = 255;
      }
    } else {
      return null; // formato de imagen no soportado (poco común en estos títulos)
    }
    ctx.putImageData(imageData, 0, 0);
  } else {
    return null;
  }

  // Releemos los píxeles ya dibujados (unifica ambas rutas anteriores) para
  // aplicarles la remoción de fondo casi-blanco con borde suavizado.
  const imageData = ctx.getImageData(0, 0, bestImg.width, bestImg.height);
  const dst = imageData.data;
  for (let p = 0; p < dst.length; p += 4) {
    const r = dst[p], g = dst[p + 1], b = dst[p + 2];
    const dist = Math.abs(r - 255) + Math.abs(g - 255) + Math.abs(b - 255);
    let alpha = 255;
    if (dist < 10) alpha = 0;
    else if (dist < 40) alpha = Math.round(((dist - 10) / 30) * 255);
    dst[p + 3] = Math.min(dst[p + 3], alpha);
  }
  ctx.putImageData(imageData, 0, 0);

  const bbox = getContentBBox(imageData, bestImg.width, bestImg.height);
  if (!bbox) return canvas.toDataURL('image/png');

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = bbox.w;
  cropCanvas.height = bbox.h;
  cropCanvas.getContext('2d').drawImage(canvas, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, bbox.w, bbox.h);
  return cropCanvas.toDataURL('image/png');
}

function getContentBBox(imageData, w, h) {
  const d = imageData.data;
  let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = d[(y * w + x) * 4 + 3];
      if (a > 10) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}
