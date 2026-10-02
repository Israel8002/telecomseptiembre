/**
 * Servicio de Autenticación con Google Cloud (Service Account OAuth2)
 * Genera tokens JWT firmados criptográficamente con Web Crypto API (RS256).
 */

import { GOOGLE_CONFIG } from '../../config/googleConfig';

interface CacheToken {
  token: string;
  expiraEn: number;
}

let cacheTokenActual: CacheToken | null = null;
let claveCriptograficaCache: CryptoKey | null = null;

/**
 * Convierte una clave privada en formato PEM a ArrayBuffer binario DER (PKCS#8)
 */
function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');

  let binario: string;
  if (typeof atob === 'function') {
    binario = atob(b64);
  } else if (typeof Buffer !== 'undefined') {
    binario = Buffer.from(b64, 'base64').toString('binary');
  } else {
    throw new Error('No se encontró función de decodificación Base64 en el entorno.');
  }

  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Codifica una cadena o buffer en Base64URL conforme a RFC 7515
 */
function base64UrlEncode(entrada: ArrayBuffer | string): string {
  let b64 = '';
  if (typeof entrada === 'string') {
    if (typeof btoa === 'function') {
      b64 = btoa(unescape(encodeURIComponent(entrada)));
    } else if (typeof Buffer !== 'undefined') {
      b64 = Buffer.from(entrada, 'utf-8').toString('base64');
    }
  } else {
    const bytes = new Uint8Array(entrada);
    let binario = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binario += String.fromCharCode(bytes[i]);
    }
    if (typeof btoa === 'function') {
      b64 = btoa(binario);
    } else if (typeof Buffer !== 'undefined') {
      b64 = Buffer.from(bytes).toString('base64');
    }
  }

  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Obtiene o importa la clave privada RSA en Web Crypto API
 */
async function obtenerClavePrivadaWebCrypto(): Promise<CryptoKey> {
  if (claveCriptograficaCache) {
    return claveCriptograficaCache;
  }

  const der = pemToDer(GOOGLE_CONFIG.privateKey);
  const cryptoSubtle = globalThis.crypto?.subtle;

  if (!cryptoSubtle) {
    throw new Error('Web Crypto API no está disponible en este entorno.');
  }

  claveCriptograficaCache = await cryptoSubtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return claveCriptograficaCache;
}

/**
 * Genera el JWT firmado con RS256 para Google OAuth2
 */
export async function generarAssertionJwt(): Promise<string> {
  const clave = await obtenerClavePrivadaWebCrypto();
  const now = Math.floor(Date.now() / 1000);

  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64UrlEncode(
    JSON.stringify({
      iss: GOOGLE_CONFIG.clientEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    })
  );

  const encoder = new TextEncoder();
  const contenidoAFirmar = encoder.encode(`${header}.${claims}`);

  const cryptoSubtle = globalThis.crypto.subtle;
  const firmaBuffer = await cryptoSubtle.sign('RSASSA-PKCS1-v1_5', clave, contenidoAFirmar);

  const firmaBase64Url = base64UrlEncode(firmaBuffer);
  return `${header}.${claims}.${firmaBase64Url}`;
}

/**
 * Obtiene un token de acceso OAuth2 Bearer válido (reutiliza caché si no ha expirado)
 */
export async function obtenerTokenAccesoGoogle(): Promise<string> {
  // Margen de seguridad: renovar si expira en menos de 2 minutos
  const margenSeguridadMs = 120_000;
  if (cacheTokenActual && Date.now() < cacheTokenActual.expiraEn - margenSeguridadMs) {
    return cacheTokenActual.token;
  }

  const jwtAssertion = await generarAssertionJwt();

  const esNavegador = typeof window !== 'undefined' && window.location.protocol.startsWith('http');
  const tokenUrl = esNavegador ? '/api/google-oauth/token' : 'https://oauth2.googleapis.com/token';

  let respuesta: Response;
  try {
    respuesta = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtAssertion
      })
    });
  } catch (errorRed) {
    if (tokenUrl !== 'https://oauth2.googleapis.com/token') {
      respuesta = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwtAssertion
        })
      });
    } else {
      throw errorRed;
    }
  }

  if (!respuesta.ok) {
    const errorTexto = await respuesta.text();
    throw new Error(`Error al solicitar token de acceso a Google OAuth2: ${respuesta.status} - ${errorTexto}`);
  }

  const datos = await respuesta.json();
  const duracionMs = (datos.expires_in || 3600) * 1000;

  cacheTokenActual = {
    token: datos.access_token,
    expiraEn: Date.now() + duracionMs
  };

  return cacheTokenActual.token;
}

/**
 * Limpia la caché de token para forzar renovación (útil tras errores 401)
 */
export function invalidarTokenGoogle(): void {
  cacheTokenActual = null;
}
