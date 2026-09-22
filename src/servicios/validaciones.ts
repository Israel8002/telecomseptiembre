/**
 * Servicio de Validaciones de Entrada
 * Contiene reglas estrictas de validación de campos para registro y autenticación.
 * Proporciona mensajes claros en español.
 */

export interface ResultadoValidacion {
  esValido: boolean;
  error?: string;
}

/**
 * Valida que la matrícula sea alfanumérica, sin espacios, de 5 a 15 caracteres
 */
export function validarMatricula(matricula: string): ResultadoValidacion {
  const limpia = matricula ? matricula.trim() : '';
  if (!limpia) {
    return { esValido: false, error: 'La matrícula es obligatoria.' };
  }

  // Solo caracteres alfanuméricos sin espacios ni guiones
  const formatoValido = /^[a-zA-Z0-9]{5,15}$/.test(matricula);
  if (!formatoValido) {
    return {
      esValido: false,
      error: 'La matrícula debe ser alfanumérica de 5 a 15 caracteres sin espacios.'
    };
  }

  return { esValido: true };
}

/**
 * Valida que el correo electrónico cumpla con formato estándar
 */
export function validarCorreoElectronico(correo: string): ResultadoValidacion {
  const limpia = correo ? correo.trim() : '';
  if (!limpia) {
    return { esValido: false, error: 'El correo electrónico es obligatorio.' };
  }

  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexCorreo.test(limpia)) {
    return { esValido: false, error: 'El formato de correo electrónico no es válido.' };
  }

  return { esValido: true };
}

/**
 * Valida que el número de WhatsApp contenga exactamente 10 dígitos numéricos
 */
export function validarNumeroWhatsapp(whatsapp: string): ResultadoValidacion {
  const limpia = whatsapp ? whatsapp.trim() : '';
  if (!limpia) {
    return { esValido: false, error: 'El número de WhatsApp es obligatorio.' };
  }

  const regexWhatsapp = /^[0-9]{10}$/;
  if (!regexWhatsapp.test(limpia)) {
    return { esValido: false, error: 'El número de WhatsApp debe tener exactamente 10 dígitos numéricos.' };
  }

  return { esValido: true };
}

/**
 * Valida que el nombre completo tenga al menos 3 caracteres
 */
export function validarNombreCompleto(nombre: string): ResultadoValidacion {
  const limpia = nombre ? nombre.trim() : '';
  if (!limpia || limpia.length < 3) {
    return { esValido: false, error: 'El nombre completo debe tener al menos 3 caracteres.' };
  }

  return { esValido: true };
}

/**
 * Valida que la contraseña tenga mínimo 8 caracteres con letras y números
 */
export function validarContrasena(contrasena: string): ResultadoValidacion {
  if (!contrasena || contrasena.length < 8) {
    return { esValido: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  const tieneLetra = /[a-zA-Z]/.test(contrasena);
  const tieneNumero = /[0-9]/.test(contrasena);

  if (!tieneLetra || !tieneNumero) {
    return { esValido: false, error: 'La contraseña debe contener al menos una letra y un número.' };
  }

  return { esValido: true };
}
