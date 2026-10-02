/**
 * Generador de IDEVALUACION único y reproducible para supervisión de telecomunicaciones IMSS.
 * Formato: EVAL-YYYYMMDD-HHMMSS-[MATRICULA]-[HEX4]
 * Ejemplo: EVAL-20260923-154210-99012345-A1C8
 */

export function generarIdEvaluacion(matricula: string, fechaReferencia: Date = new Date()): string {
  const pad = (num: number, digitos: number = 2) => String(num).padStart(digitos, '0');

  const anio = fechaReferencia.getFullYear();
  const mes = pad(fechaReferencia.getMonth() + 1);
  const dia = pad(fechaReferencia.getDate());
  const horas = pad(fechaReferencia.getHours());
  const minutos = pad(fechaReferencia.getMinutes());
  const segundos = pad(fechaReferencia.getSeconds());

  const fechaFormateada = `${anio}${mes}${dia}`;
  const horaFormateada = `${horas}${minutos}${segundos}`;
  const matriculaLimpia = matricula.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || '00000000';

  // Generar 4 caracteres hexadecimales pseudoaleatorios criptográficos si es posible
  let sufijoHex: string;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(2);
    crypto.getRandomValues(bytes);
    sufijoHex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  } else {
    sufijoHex = Math.floor(Math.random() * 0x10000)
      .toString(16)
      .padStart(4, '0')
      .toUpperCase();
  }

  return `EVAL-${fechaFormateada}-${horaFormateada}-${matriculaLimpia}-${sufijoHex}`;
}
