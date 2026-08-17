const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

// Parsea "7 DE AGOSTO DE 2026" o "7/Agosto/2026" -> Date
export function parseSpanishDate(str) {
  if (!str) return null;
  let m = str.match(/(\d{1,2})\s+DE\s+(\w+)\s+DE\s+(\d{4})/i);
  if (!m) m = str.match(/(\d{1,2})\/(\w+)\/(\d{4})/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const monthName = m[2].toLowerCase();
  const monthIdx = MESES.findIndex(mm => mm === monthName);
  const year = parseInt(m[3], 10);
  if (monthIdx === -1) return null;
  return new Date(year, monthIdx, day);
}

export function formatLargo(date) {
  return `${date.getDate()} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`;
}

export function formatMesAnio(date) {
  return `${MESES[date.getMonth()]} de ${date.getFullYear()}`;
}

// Declaración de uso: dentro de los 3 meses posteriores al 3er aniversario del registro
export function ventanaDeclaracionUso(fechaEmisionDate) {
  if (!fechaEmisionDate) return null;
  const tercerAniversario = new Date(fechaEmisionDate);
  tercerAniversario.setFullYear(tercerAniversario.getFullYear() + 3);
  const limite = new Date(tercerAniversario);
  limite.setMonth(limite.getMonth() + 3);
  return { inicio: tercerAniversario, limite };
}
