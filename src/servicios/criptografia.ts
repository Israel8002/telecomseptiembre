/**
 * Servicio de Criptografía para Almacenamiento Seguro de Contraseñas
 * Utiliza Web Crypto API nativa: PBKDF2 con HMAC-SHA256 y 100,000 iteraciones.
 * Ninguna contraseña se almacena en texto plano.
 */

const ITERACIONES_PBKDF2 = 100000;
const LONGITUD_HASH_BITS = 256;

/**
 * Convierte un ArrayBuffer o Uint8Array a cadena en base64
 */
function bufferABase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binario = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binario += String.fromCharCode(bytes[i]);
  }
  return btoa(binario);
}

/**
 * Convierte una cadena base64 a Uint8Array
 */
function base64ABuffer(base64: string): Uint8Array {
  const binario = atob(base64);
  const buffer = new ArrayBuffer(binario.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  return bytes;
}

/**
 * Genera una sal criptográfica segura de 16 bytes codificada en base64
 */
export function generarSal(): string {
  const bytesSal = new Uint8Array(16);
  crypto.getRandomValues(bytesSal);
  return bufferABase64(bytesSal);
}

/**
 * Deriva un hash seguro de la contraseña usando PBKDF2-SHA256 con 100,000 iteraciones
 */
export async function derivarHashContrasena(contrasena: string, salBase64: string): Promise<string> {
  const codificador = new TextEncoder();
  const datosContrasena = codificador.encode(contrasena);
  const datosSal = base64ABuffer(salBase64);

  const claveBase = await crypto.subtle.importKey(
    'raw',
    datosContrasena,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bitsDerivados = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: datosSal as unknown as BufferSource,
      iterations: ITERACIONES_PBKDF2,
      hash: 'SHA-256'
    },
    claveBase,
    LONGITUD_HASH_BITS
  );

  return bufferABase64(bitsDerivados);
}

/**
 * Verifica si una contraseña coincide con el hash almacenado utilizando comparación en tiempo constante
 */
export async function verificarContrasena(
  contrasenaCandidata: string,
  hashGuardadoBase64: string,
  salBase64: string
): Promise<boolean> {
  try {
    const hashGeneradoBase64 = await derivarHashContrasena(contrasenaCandidata, salBase64);
    
    // Comparación en tiempo constante para evitar ataques de temporización
    if (hashGeneradoBase64.length !== hashGuardadoBase64.length) {
      return false;
    }

    let diferencia = 0;
    for (let i = 0; i < hashGeneradoBase64.length; i++) {
      diferencia |= hashGeneradoBase64.charCodeAt(i) ^ hashGuardadoBase64.charCodeAt(i);
    }

    return diferencia === 0;
  } catch {
    return false;
  }
}
