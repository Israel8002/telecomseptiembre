/**
 * Conector con Google Sheets API (v4)
 * Administra la sincronización remota e inserción de filas en las 4 pestañas oficiales:
 * - Usuarios
 * - Evaluaciones
 * - Fotografias_Metadatos
 * - Log_Sincronizacion
 */

import { GOOGLE_CONFIG } from '../../config/googleConfig';
import { obtenerTokenAccesoGoogle, invalidarTokenGoogle } from './autenticadorGoogle';
import { Usuario } from '../../modelos/usuario';
import { Evaluacion } from '../../modelos/evaluacion';
import { EvidenciaFotografica } from '../../modelos/evidenciaFotografica';

function obtenerUrlSheets(endpoint: string): { urlPrimaria: string; urlRespaldo: string } {
  const esNavegador = typeof window !== 'undefined' && window.location.protocol.startsWith('http');
  const separador = endpoint.startsWith(':') || endpoint.startsWith('?') ? '' : '/';
  const urlRespaldo = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_CONFIG.spreadsheetId}${separador}${endpoint}`;
  const urlPrimaria = esNavegador
    ? `/api/google-sheets/v4/spreadsheets/${GOOGLE_CONFIG.spreadsheetId}${separador}${endpoint}`
    : urlRespaldo;
  return { urlPrimaria, urlRespaldo };
}

/**
 * Ejecuta una petición fetch autenticada con Google Sheets API con reintentos exponenciales
 */
async function peticionSheets(
  endpoint: string,
  opciones: RequestInit = {},
  reintentosRestantes = 3
): Promise<any> {
  const token = await obtenerTokenAccesoGoogle();
  const { urlPrimaria, urlRespaldo } = obtenerUrlSheets(endpoint);

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(opciones.headers || {})
  };

  try {
    let respuesta: Response;
    try {
      respuesta = await fetch(urlPrimaria, { ...opciones, headers });
    } catch (errProxy) {
      if (urlPrimaria !== urlRespaldo) {
        respuesta = await fetch(urlRespaldo, { ...opciones, headers });
      } else {
        throw errProxy;
      }
    }

    if (respuesta.status === 401 && reintentosRestantes > 0) {
      invalidarTokenGoogle();
      return peticionSheets(endpoint, opciones, reintentosRestantes - 1);
    }

    if ((respuesta.status === 429 || respuesta.status >= 500) && reintentosRestantes > 0) {
      const esperaMs = Math.pow(2, 4 - reintentosRestantes) * 1000 + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, esperaMs));
      return peticionSheets(endpoint, opciones, reintentosRestantes - 1);
    }

    if (!respuesta.ok) {
      const errorMsg = await respuesta.text();
      throw new Error(`Google Sheets API Error (${respuesta.status}): ${errorMsg}`);
    }

    return await respuesta.json();
  } catch (error) {
    if (reintentosRestantes > 0 && (error as Error).message.includes('Failed to fetch')) {
      const esperaMs = Math.pow(2, 4 - reintentosRestantes) * 1000;
      await new Promise((resolve) => setTimeout(resolve, esperaMs));
      return peticionSheets(endpoint, opciones, reintentosRestantes - 1);
    }
    throw error;
  }
}

/**
 * Caché en memoria para IDs numéricos de hojas (sheetId) requeridos por batchUpdate
 */
const cacheSheetIds = new Map<string, number>();

/**
 * Consulta y resuelve el sheetId numérico correspondiente al nombre de una pestaña
 */
async function obtenerSheetIdPorTitulo(titulo: string): Promise<number | null> {
  if (cacheSheetIds.has(titulo)) {
    return cacheSheetIds.get(titulo)!;
  }
  try {
    const data = await peticionSheets('?fields=sheets(properties(sheetId,title))');
    if (data.sheets && Array.isArray(data.sheets)) {
      for (const sheet of data.sheets) {
        if (sheet.properties?.title && sheet.properties.sheetId !== undefined) {
          cacheSheetIds.set(sheet.properties.title, Number(sheet.properties.sheetId));
        }
      }
    }
    return cacheSheetIds.get(titulo) ?? null;
  } catch (error) {
    console.warn(`No se pudo obtener sheetId para la pestaña '${titulo}':`, error);
    return null;
  }
}

/**
 * Busca el índice de fila de un ID en una pestaña dada
 */
async function buscarFilaPorId(nombrePestana: string, idBuscado: string): Promise<number | null> {
  try {
    const data = await peticionSheets(`values/${encodeURIComponent(nombrePestana)}!A:A`);
    const valores: string[][] = data.values || [];
    for (let i = 0; i < valores.length; i++) {
      if (valores[i][0] === idBuscado) {
        return i + 1; // 1-indexed para A1 notation
      }
    }
    return null;
  } catch {
    return null;
  }
}

export class ServicioGoogleSheets {
  /**
   * Elimina completamente el renglón de la evaluación en 'Evaluaciones'
   * y todos los renglones asociados en 'Fotografias_Metadatos',
   * retornando las URLs de Google Drive encontradas para su posterior purga.
   */
  async eliminarEvaluacionYMetadatos(idEvaluacion: string): Promise<string[]> {
    const urlsDriveAEliminar: string[] = [];

    // 1. Obtener los IDs numéricos de las hojas
    const sheetIdEvaluaciones = await obtenerSheetIdPorTitulo('Evaluaciones');
    const sheetIdFotos = await obtenerSheetIdPorTitulo('Fotografias_Metadatos');

    const requestsBatch: any[] = [];

    // 2. Buscar renglón en 'Evaluaciones'
    try {
      const dataEval = await peticionSheets('values/Evaluaciones!A:P');
      const filasEval: string[][] = dataEval.values || [];
      for (let i = 0; i < filasEval.length; i++) {
        if (filasEval[i][0] === idEvaluacion) {
          const urlPdfDrive = filasEval[i][15];
          if (urlPdfDrive && urlPdfDrive.startsWith('http')) {
            urlsDriveAEliminar.push(urlPdfDrive);
          }

          if (sheetIdEvaluaciones !== null) {
            requestsBatch.push({
              deleteDimension: {
                range: {
                  sheetId: sheetIdEvaluaciones,
                  dimension: 'ROWS',
                  startIndex: i,
                  endIndex: i + 1
                }
              }
            });
          }
          break;
        }
      }
    } catch (errEval) {
      console.warn('Error al buscar fila en Evaluaciones para eliminación:', errEval);
    }

    // 3. Buscar renglones en 'Fotografias_Metadatos' (Columna B es idEvaluacion)
    try {
      const dataFotos = await peticionSheets('values/Fotografias_Metadatos!A:I');
      const filasFotos: string[][] = dataFotos.values || [];
      const indicesFilasFotos: number[] = [];

      for (let i = 0; i < filasFotos.length; i++) {
        if (filasFotos[i][1] === idEvaluacion) {
          indicesFilasFotos.push(i);
          const urlFotoDrive = filasFotos[i][8];
          if (urlFotoDrive && urlFotoDrive.startsWith('http')) {
            urlsDriveAEliminar.push(urlFotoDrive);
          }
        }
      }

      // Ordenar en forma descendente para preservar índices al eliminar
      indicesFilasFotos.sort((a, b) => b - a);

      if (sheetIdFotos !== null) {
        for (const idx of indicesFilasFotos) {
          requestsBatch.push({
            deleteDimension: {
              range: {
                sheetId: sheetIdFotos,
                dimension: 'ROWS',
                startIndex: idx,
                endIndex: idx + 1
              }
            }
          });
        }
      }
    } catch (errFotos) {
      console.warn('Error al buscar evidencias en Fotografias_Metadatos para eliminación:', errFotos);
    }

    // 4. Ejecutar la eliminación atómica en Google Sheets
    if (requestsBatch.length > 0) {
      try {
        await peticionSheets(':batchUpdate', {
          method: 'POST',
          body: JSON.stringify({ requests: requestsBatch })
        });
      } catch (errBatch) {
        console.warn('Error al ejecutar batchUpdate de eliminación en Google Sheets:', errBatch);
      }
    }

    return urlsDriveAEliminar;
  }
  /**
   * Sincroniza un usuario registrado en la pestaña 'Usuarios'
   */
  async sincronizarUsuario(usuario: Usuario): Promise<void> {
    const filaExistente = await buscarFilaPorId('Usuarios', usuario.id);

    const valoresFila = [
      usuario.id,
      usuario.matricula,
      usuario.nombreCompleto,
      usuario.correoElectronico,
      usuario.numeroWhatsapp,
      usuario.rol,
      usuario.creadoEn
    ];

    if (filaExistente) {
      // Actualizar fila existente
      await peticionSheets(`values/Usuarios!A${filaExistente}:G${filaExistente}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        body: JSON.stringify({ values: [valoresFila] })
      });
    } else {
      // Agregar al final
      await peticionSheets('values/Usuarios!A:G:append?valueInputOption=USER_ENTERED', {
        method: 'POST',
        body: JSON.stringify({ values: [valoresFila] })
      });
    }
  }

  /**
   * Sincroniza una evaluación en la pestaña 'Evaluaciones'
   */
  async sincronizarEvaluacion(evaluacion: Evaluacion, urlReporteDrive = ''): Promise<void> {
    const filaExistente = await buscarFilaPorId('Evaluaciones', evaluacion.id);

    const fechaCierre = evaluacion.finalizadoEn || evaluacion.actualizadoEn || new Date().toISOString();

    const valoresFila = [
      evaluacion.id,
      evaluacion.matriculaEvaluador,
      evaluacion.nombreEvaluador,
      evaluacion.ooad,
      evaluacion.unidad,
      evaluacion.tipoCuarto,
      evaluacion.ubicacionDetallada || '',
      evaluacion.estado,
      evaluacion.calificacionCumplimiento,
      evaluacion.totalCriterios,
      evaluacion.totalRespondidos,
      evaluacion.totalCumple,
      evaluacion.totalNoCumple,
      evaluacion.creadoEn,
      fechaCierre,
      urlReporteDrive
    ];

    if (filaExistente) {
      await peticionSheets(
        `values/Evaluaciones!A${filaExistente}:P${filaExistente}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          body: JSON.stringify({ values: [valoresFila] })
        }
      );
    } else {
      await peticionSheets('values/Evaluaciones!A:P:append?valueInputOption=USER_ENTERED', {
        method: 'POST',
        body: JSON.stringify({ values: [valoresFila] })
      });
    }
  }

  /**
   * Registra los metadatos de una fotografía de evidencia en 'Fotografias_Metadatos'
   */
  async registrarEvidenciaFotografica(
    evidencia: EvidenciaFotografica,
    urlDrive: string
  ): Promise<void> {
    const filaExistente = await buscarFilaPorId('Fotografias_Metadatos', evidencia.id);

    const valoresFila = [
      evidencia.id,
      evidencia.idEvaluacion,
      evidencia.idCriterio || 'General',
      evidencia.seccion || 'General',
      evidencia.unidad,
      evidencia.tipoCuarto,
      evidencia.descripcion || '',
      evidencia.creadoEn,
      urlDrive
    ];

    if (filaExistente) {
      await peticionSheets(
        `values/Fotografias_Metadatos!A${filaExistente}:I${filaExistente}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          body: JSON.stringify({ values: [valoresFila] })
        }
      );
    } else {
      await peticionSheets('values/Fotografias_Metadatos!A:I:append?valueInputOption=USER_ENTERED', {
        method: 'POST',
        body: JSON.stringify({ values: [valoresFila] })
      });
    }
  }

  /**
   * Registra una transacción en la pestaña de auditoría 'Log_Sincronizacion'
   */
  async registrarLog(log: {
    idOperacion: string;
    tipoEntidad: string;
    accion: string;
    matriculaUsuario: string;
    resultado: string;
  }): Promise<void> {
    const valoresFila = [
      log.idOperacion,
      new Date().toISOString(),
      log.tipoEntidad,
      log.accion,
      log.matriculaUsuario,
      log.resultado
    ];

    await peticionSheets('values/Log_Sincronizacion!A:F:append?valueInputOption=USER_ENTERED', {
      method: 'POST',
      body: JSON.stringify({ values: [valoresFila] })
    });
  }

  /**
   * Obtiene todas las evaluaciones registradas en la pestaña 'Evaluaciones' de Google Sheets
   */
  async obtenerEvaluacionesRemotas(): Promise<EvaluacionRemota[]> {
    try {
      const data = await peticionSheets('values/Evaluaciones!A2:P');
      const filas: string[][] = data.values || [];

      return filas
        .filter((fila) => fila.length > 0 && fila[0])
        .map((fila) => ({
          id: fila[0] || '',
          matriculaEvaluador: fila[1] || '',
          nombreEvaluador: fila[2] || '',
          ooad: fila[3] || '',
          unidad: fila[4] || '',
          tipoCuarto: fila[5] || 'MDF',
          ubicacionDetallada: fila[6] || '',
          estado: (fila[7] === 'COMPLETADA' ? 'COMPLETADA' : 'EN_PROCESO') as 'EN_PROCESO' | 'COMPLETADA',
          calificacionCumplimiento: Number(fila[8]) || 0,
          totalCriterios: Number(fila[9]) || 0,
          totalRespondidos: Number(fila[10]) || 0,
          totalCumple: Number(fila[11]) || 0,
          totalNoCumple: Number(fila[12]) || 0,
          creadoEn: fila[13] || '',
          finalizadoEn: fila[14] || null,
          urlReporteDrive: fila[15] || undefined,
          origen: 'remoto'
        }));
    } catch (error) {
      console.warn('No fue posible obtener evaluaciones remotas de Google Sheets:', error);
      return [];
    }
  }

  /**
   * Obtiene el historial de auditoría de sincronizaciones desde 'Log_Sincronizacion'
   */
  async obtenerLogsRemotos(limite = 100): Promise<RegistroLogSincronizacion[]> {
    try {
      const data = await peticionSheets('values/Log_Sincronizacion!A2:F');
      const filas: string[][] = data.values || [];

      const logs: RegistroLogSincronizacion[] = filas
        .filter((fila) => fila.length > 0 && fila[0])
        .map((fila) => ({
          idOperacion: fila[0] || '',
          fechaHora: fila[1] || '',
          tipoEntidad: fila[2] || '',
          accion: fila[3] || '',
          matriculaUsuario: fila[4] || '',
          resultado: fila[5] || ''
        }));

      return logs
        .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())
        .slice(0, limite);
    } catch (error) {
      console.warn('No fue posible obtener logs de auditoría de Google Sheets:', error);
      return [];
    }
  }
}

export interface EvaluacionRemota {
  id: string;
  matriculaEvaluador: string;
  nombreEvaluador: string;
  ooad: string;
  unidad: string;
  tipoCuarto: any;
  ubicacionDetallada: string;
  estado: 'EN_PROCESO' | 'COMPLETADA';
  calificacionCumplimiento: number;
  totalCriterios: number;
  totalRespondidos: number;
  totalCumple: number;
  totalNoCumple: number;
  creadoEn: string;
  finalizadoEn: string | null;
  urlReporteDrive?: string;
  origen: 'remoto' | 'local' | 'ambos';
}

export interface RegistroLogSincronizacion {
  idOperacion: string;
  fechaHora: string;
  tipoEntidad: string;
  accion: string;
  matriculaUsuario: string;
  resultado: string;
}

export const servicioGoogleSheets = new ServicioGoogleSheets();
