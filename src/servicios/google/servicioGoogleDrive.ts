/**
 * Conector con Google Drive API (v3)
 * Administra la creación de carpetas jerárquicas y la subida de fotografías y reportes PDF.
 * Jerarquía: [Carpeta Raíz] / [Unidad u OOAD] / [Tipo de Cuarto] / [Archivos]
 */

import { GOOGLE_CONFIG } from '../../config/googleConfig';
import { obtenerTokenAccesoGoogle, invalidarTokenGoogle } from './autenticadorGoogle';
import { EvidenciaFotografica } from '../../modelos/evidenciaFotografica';
import { Evaluacion } from '../../modelos/evaluacion';

const esNavegador = typeof window !== 'undefined' && window.location.protocol.startsWith('http');
const DRIVE_API_BASE = esNavegador ? '/api/google-drive/drive/v3' : 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = esNavegador
  ? '/api/google-drive/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true'
  : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true';

/**
 * Caché en memoria para IDs de carpetas jerárquicas resueltas
 */
const cacheCarpetas = new Map<string, string>();

/**
 * Petición con reintentos exponenciales a Google Drive
 */
async function peticionDrive(
  urlCompleta: string,
  opciones: RequestInit = {},
  reintentosRestantes = 3
): Promise<any> {
  const token = await obtenerTokenAccesoGoogle();

  const headers = {
    Authorization: `Bearer ${token}`,
    ...(opciones.headers || {})
  };

  try {
    let respuesta: Response;
    try {
      respuesta = await fetch(urlCompleta, { ...opciones, headers });
    } catch (errProxy) {
      if (urlCompleta.startsWith('/api/google-drive')) {
        const urlDirecta = urlCompleta.replace('/api/google-drive', 'https://www.googleapis.com');
        respuesta = await fetch(urlDirecta, { ...opciones, headers });
      } else {
        throw errProxy;
      }
    }

    if (respuesta.status === 401 && reintentosRestantes > 0) {
      invalidarTokenGoogle();
      return peticionDrive(urlCompleta, opciones, reintentosRestantes - 1);
    }

    if ((respuesta.status === 429 || respuesta.status >= 500) && reintentosRestantes > 0) {
      const esperaMs = Math.pow(2, 4 - reintentosRestantes) * 1000 + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, esperaMs));
      return peticionDrive(urlCompleta, opciones, reintentosRestantes - 1);
    }

    if (!respuesta.ok) {
      const errorMsg = await respuesta.text();
      throw new Error(`Google Drive API Error (${respuesta.status}): ${errorMsg}`);
    }

    return await respuesta.json();
  } catch (error) {
    if (reintentosRestantes > 0 && (error as Error).message.includes('Failed to fetch')) {
      const esperaMs = Math.pow(2, 4 - reintentosRestantes) * 1000;
      await new Promise((resolve) => setTimeout(resolve, esperaMs));
      return peticionDrive(urlCompleta, opciones, reintentosRestantes - 1);
    }
    throw error;
  }
}

/**
 * Convierte datos base64 (con o sin encabezado data URL) a Uint8Array
 */
function base64AUint8Array(base64ODataUrl: string): Uint8Array {
  const b64 = base64ODataUrl.includes(',') ? base64ODataUrl.split(',')[1] : base64ODataUrl;

  let binario: string;
  if (typeof atob === 'function') {
    binario = atob(b64);
  } else if (typeof Buffer !== 'undefined') {
    binario = Buffer.from(b64, 'base64').toString('binary');
  } else {
    throw new Error('No se encontró función atob para decodificar base64.');
  }

  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convierte un Uint8Array a cadena Base64
 */
function uint8ArrayABase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binario = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binario += String.fromCharCode(bytes[i]);
  }
  return btoa(binario);
}

/**
 * Convierte un Blob a cadena Base64
 */
async function blobABase64(blob: Blob): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  const arrayBuffer = await blob.arrayBuffer();
  return uint8ArrayABase64(new Uint8Array(arrayBuffer));
}

export class ServicioGoogleDrive {
  /**
   * Busca o crea una carpeta en Drive dentro de un padre específico
   */
  async obtenerOCrearCarpeta(nombre: string, parentId: string): Promise<string> {
    const claveCache = `${parentId}/${nombre}`;
    if (cacheCarpetas.has(claveCache)) {
      return cacheCarpetas.get(claveCache)!;
    }

    // 1. Buscar si ya existe la carpeta activa con ese nombre bajo el padre
    const query = encodeURIComponent(`'${parentId}' in parents and name = '${nombre}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
    const buscarUrl = `${DRIVE_API_BASE}/files?q=${query}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`;

    const resultado = await peticionDrive(buscarUrl);
    if (resultado.files && resultado.files.length > 0) {
      const idExistente = resultado.files[0].id;
      cacheCarpetas.set(claveCache, idExistente);
      return idExistente;
    }

    // 2. Si no existe, crear la carpeta (con soporte para Unidades Compartidas)
    const crearUrl = `${DRIVE_API_BASE}/files?supportsAllDrives=true`;
    const nuevaCarpeta = await peticionDrive(crearUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nombre,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      })
    });

    const idCreado = nuevaCarpeta.id;
    cacheCarpetas.set(claveCache, idCreado);
    return idCreado;
  }

  /**
   * Resuelve o crea de forma automática la jerarquía: [Raíz] -> [Unidad] -> [TipoCuarto]
   */
  async resolverCarpetaDestino(unidad: string, tipoCuarto: string): Promise<string> {
    const rootId = GOOGLE_CONFIG.driveRootFolderId;
    const nombreUnidad = unidad.trim() || 'Unidad_Sin_Nombre';
    const nombreCuarto = tipoCuarto.trim() || 'General';

    try {
      // Nivel 1: Carpeta de Unidad u OOAD
      const idCarpetaUnidad = await this.obtenerOCrearCarpeta(nombreUnidad, rootId);

      // Nivel 2: Subcarpeta de Tipo de Cuarto (MDF, IDF, etc.)
      const idCarpetaCuarto = await this.obtenerOCrearCarpeta(nombreCuarto, idCarpetaUnidad);

      return idCarpetaCuarto;
    } catch (error) {
      console.warn('No se pudo crear subcarpeta jerárquica en Drive, usando carpeta raíz configurada:', error);
      return rootId;
    }
  }

  /**
   * Sube un archivo mediante Google Apps Script Web App cuando se usa una cuenta personal de Gmail (evita error 403 de cuota)
   */
  async subirViaAppsScript(opciones: {
    nombreArchivo: string;
    contenidoBase64: string;
    tipoMime: string;
    idCarpetaPadre: string;
    descripcion?: string;
  }): Promise<{ id: string; urlDrive: string }> {
    const url = GOOGLE_CONFIG.appsScriptUploadUrl;
    if (!url) {
      throw new Error('No hay URL de Google Apps Script configurada');
    }

    const payload = {
      nombreArchivo: opciones.nombreArchivo,
      contenidoBase64: opciones.contenidoBase64.includes(',')
        ? opciones.contenidoBase64.split(',')[1]
        : opciones.contenidoBase64,
      tipoMime: opciones.tipoMime,
      idCarpetaPadre: opciones.idCarpetaPadre,
      descripcion: opciones.descripcion || ''
    };

    const respuesta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const resultado = await respuesta.json();
    if (!resultado || (!resultado.id && !resultado.urlDrive)) {
      throw new Error(resultado?.error || 'Respuesta inválida del puente Google Apps Script');
    }

    const fileId = resultado.id || 'id_desconocido';
    const urlDrive = resultado.urlDrive || `https://drive.google.com/file/d/${fileId}/view`;

    return { id: fileId, urlDrive };
  }

  /**
   * Sube un archivo binario mediante solicitud multipart a Google Drive
   */
  async subirArchivoMultipart(opciones: {
    nombreArchivo: string;
    contenidoBinario: Uint8Array | Blob;
    tipoMime: string;
    idCarpetaPadre: string;
    descripcion?: string;
  }): Promise<{ id: string; urlDrive: string }> {
    if (GOOGLE_CONFIG.appsScriptUploadUrl) {
      let b64 = '';
      if (opciones.contenidoBinario instanceof Blob) {
        b64 = await blobABase64(opciones.contenidoBinario);
      } else {
        b64 = uint8ArrayABase64(opciones.contenidoBinario);
      }
      return this.subirViaAppsScript({
        nombreArchivo: opciones.nombreArchivo,
        contenidoBase64: b64,
        tipoMime: opciones.tipoMime,
        idCarpetaPadre: opciones.idCarpetaPadre,
        descripcion: opciones.descripcion
      });
    }

    const boundary = `----IMSSDriveBoundary${Date.now()}`;

    const metadata = {
      name: opciones.nombreArchivo,
      parents: [opciones.idCarpetaPadre],
      description: opciones.descripcion || 'Archivo generado por Supervisión de Telecomunicaciones IMSS'
    };

    const parte1 = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
    const parte2 = `\r\n--${boundary}\r\nContent-Type: ${opciones.tipoMime}\r\n\r\n`;
    const parteFinal = `\r\n--${boundary}--`;

    const contenidoParaBlob =
      opciones.contenidoBinario instanceof Blob
        ? opciones.contenidoBinario
        : (opciones.contenidoBinario.buffer as ArrayBuffer);

    const blobCuerpo = new Blob(
      [parte1, parte2, contenidoParaBlob, parteFinal],
      { type: `multipart/related; boundary=${boundary}` }
    );

    const respuestaSubida = await peticionDrive(DRIVE_UPLOAD_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: blobCuerpo
    });

    const fileId = respuestaSubida.id;
    const urlDrive = `https://drive.google.com/file/d/${fileId}/view`;

    return { id: fileId, urlDrive };
  }

  /**
   * Sube una evidencia fotográfica a su carpeta correspondiente
   */
  async subirEvidenciaFotografica(evidencia: EvidenciaFotografica): Promise<{ idArchivo: string; urlDrive: string }> {
    const idCarpeta = await this.resolverCarpetaDestino(evidencia.unidad, evidencia.tipoCuarto);

    const nombreLimpio = `${evidencia.tipoCuarto.toLowerCase()}_${evidencia.id}.jpg`;
    const descripcion = evidencia.descripcion
      ? `Evidencia punto ${evidencia.idCriterio || 'General'}: ${evidencia.descripcion}`
      : `Evidencia fotográfica en ${evidencia.unidad}`;

    if (GOOGLE_CONFIG.appsScriptUploadUrl) {
      const resultado = await this.subirViaAppsScript({
        nombreArchivo: nombreLimpio,
        contenidoBase64: evidencia.datosBase64,
        tipoMime: 'image/jpeg',
        idCarpetaPadre: idCarpeta,
        descripcion
      });
      return { idArchivo: resultado.id, urlDrive: resultado.urlDrive };
    }

    const bytes = base64AUint8Array(evidencia.datosBase64);

    const resultado = await this.subirArchivoMultipart({
      nombreArchivo: nombreLimpio,
      contenidoBinario: bytes,
      tipoMime: 'image/jpeg',
      idCarpetaPadre: idCarpeta,
      descripcion
    });

    return { idArchivo: resultado.id, urlDrive: resultado.urlDrive };
  }

  /**
   * Sube el reporte PDF institucional generado a su carpeta correspondiente
   */
  async subirReportePdf(
    evaluacion: Evaluacion,
    pdfBlob: Blob
  ): Promise<{ idArchivo: string; urlDrive: string }> {
    const idCarpeta = await this.resolverCarpetaDestino(evaluacion.unidad, evaluacion.tipoCuarto);
    const nombreArchivo = `${evaluacion.tipoCuarto.toLowerCase()}_reporte_${evaluacion.id}.pdf`;
    const descripcion = `Reporte oficial de supervisión para ${evaluacion.unidad} - ${evaluacion.tipoCuarto}`;

    if (GOOGLE_CONFIG.appsScriptUploadUrl) {
      const b64 = await blobABase64(pdfBlob);
      const resultado = await this.subirViaAppsScript({
        nombreArchivo,
        contenidoBase64: b64,
        tipoMime: 'application/pdf',
        idCarpetaPadre: idCarpeta,
        descripcion
      });
      return { idArchivo: resultado.id, urlDrive: resultado.urlDrive };
    }

    const resultado = await this.subirArchivoMultipart({
      nombreArchivo,
      contenidoBinario: pdfBlob,
      tipoMime: 'application/pdf',
      idCarpetaPadre: idCarpeta,
      descripcion
    });

    return { idArchivo: resultado.id, urlDrive: resultado.urlDrive };
  }

  /**
   * Elimina un archivo permanentemente de Google Drive
   */
  async eliminarArchivo(idArchivo: string): Promise<void> {
    const url = `${DRIVE_API_BASE}/files/${idArchivo}?supportsAllDrives=true`;
    try {
      await peticionDrive(url, {
        method: 'DELETE'
      });
    } catch (error: any) {
      if (error?.message?.includes('404') || error?.message?.includes('notFound')) {
        return; // El archivo ya no existe
      }
      console.warn(`No se pudo eliminar archivo ${idArchivo} de Google Drive:`, error);
    }
  }

  /**
   * Extrae el ID de archivo de una URL o cadena de Google Drive
   */
  extraerIdArchivoDrive(urlOId: string): string | null {
    if (!urlOId) return null;
    if (!urlOId.includes('/') && !urlOId.includes('=')) {
      return urlOId;
    }
    const match1 = urlOId.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1) return match1[1];
    const match2 = urlOId.match(/id=([a-zA-Z0-9_-]+)/);
    if (match2) return match2[1];
    return null;
  }

  /**
   * Purga todos los archivos de Google Drive asociados a una evaluación:
   * 1. Elimina archivos directamente por sus URLs o IDs conocidos.
   * 2. Realiza búsqueda por nombre en Drive para eliminar PDFs y fotos residuales.
   */
  async eliminarArchivosEvaluacion(idEvaluacion: string, urlsOIdsConocidos: string[] = []): Promise<number> {
    let totalEliminados = 0;
    const idsProcesados = new Set<string>();

    // 1. Eliminar archivos conocidos por URL o ID
    for (const urlOId of urlsOIdsConocidos) {
      const id = this.extraerIdArchivoDrive(urlOId);
      if (id && !idsProcesados.has(id)) {
        idsProcesados.add(id);
        await this.eliminarArchivo(id);
        totalEliminados++;
      }
    }

    // 2. Buscar en Drive archivos que contengan el ID de evaluación en su nombre
    try {
      const query = encodeURIComponent(`name contains '${idEvaluacion}' and trashed = false`);
      const buscarUrl = `${DRIVE_API_BASE}/files?q=${query}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`;
      const resultado = await peticionDrive(buscarUrl);

      if (resultado.files && Array.isArray(resultado.files)) {
        for (const f of resultado.files) {
          if (!idsProcesados.has(f.id)) {
            idsProcesados.add(f.id);
            await this.eliminarArchivo(f.id);
            totalEliminados++;
          }
        }
      }
    } catch (errBusqueda) {
      console.warn('Error al buscar archivos residuales en Drive para purga:', errBusqueda);
    }

    return totalEliminados;
  }
}

export const servicioGoogleDrive = new ServicioGoogleDrive();
