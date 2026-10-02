/**
 * Motor de Generación de Respaldos Comprimidos (.zip)
 * Empaqueta la evaluación íntegra: JSON, Reporte PDF, Excel XLSX y Evidencias Fotográficas.
 */

import JSZip from 'jszip';
import { Evaluacion } from '../modelos/evaluacion';
import { EvidenciaFotografica } from '../modelos/evidenciaFotografica';
import { obtenerArrayBufferPdf } from './generadorPdf';
import { obtenerBufferExcel } from './exportadorExcel';

/**
 * Dispara la descarga de un archivo Blob en el navegador o webview
 */
function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Genera el archivo ZIP con todos los datos y respaldos de la supervisión
 */
export async function generarRespaldoZip(
  evaluacion: Evaluacion,
  evidencias: EvidenciaFotografica[] = []
): Promise<JSZip> {
  const zip = new JSZip();

  // 1. Archivo de datos crudos estructurados JSON
  const jsonString = JSON.stringify(evaluacion, null, 2);
  zip.file(`evaluacion_${evaluacion.id}.json`, jsonString);

  // 2. Archivo Léame con metadatos institucionales
  const leeme = `======================================================================
INSTITUTO MEXICANO DEL SEGURO SOCIAL (IMSS)
ÓRGANO DE OPERACIÓN ADMINISTRATIVA DESCONCENTRADA BAJA CALIFORNIA
COORDINACIÓN DELEGACIONAL DE INFORMÁTICA
RESPALDO OFICIAL DE SUPERVISIÓN TÉCNICA DE TELECOMUNICACIONES
======================================================================

Folio de Evaluación : ${evaluacion.id}
Unidad Médica / Inm : ${evaluacion.unidad}
Tipo de Cuarto      : ${evaluacion.tipoCuarto}
Ubicación Detallada : ${evaluacion.ubicacionDetallada || 'No especificada'}
Evaluador Técnico   : ${evaluacion.nombreEvaluador} (Matrícula: ${evaluacion.matriculaEvaluador})
Fecha de Emisión    : ${evaluacion.finalizadoEn || evaluacion.actualizadoEn || new Date().toISOString()}
Estado Evaluación   : ${evaluacion.estado}
Cumplimiento Global : ${evaluacion.calificacionCumplimiento}%
Total de Evidencias : ${evidencias.length} fotografías

CONTENIDO DEL ARCHIVO COMPRIMIDO:
1. evaluacion_${evaluacion.id}.json -> Estructura completa de datos y respuestas.
2. reporte_ejecutivo.pdf          -> Reporte oficial con firmas, sellos y recomendaciones.
3. datos_supervision.xlsx         -> Libro de cálculo estructurado con todas las métricas.
4. evidencias/                    -> Fotografías tomadas en sitio con sus notas técnicas.

Alineado a los criterios de supervisión de la Unidad de Evaluación de Órganos
Desconcentrados (UEOD) y al Manual de Organización de la Coordinación Delegacional
de Informática (Funciones Sustantivas 7.1 incisos 18 y 24).
======================================================================`;
  zip.file('LEEME_RESPALDO.txt', leeme);

  // 3. Generar y anexar Reporte PDF
  try {
    const pdfBuffer = obtenerArrayBufferPdf(evaluacion, evidencias);
    zip.file(`reporte_${evaluacion.id}.pdf`, pdfBuffer);
  } catch (err) {
    console.warn('Advertencia al generar PDF para ZIP:', err);
  }

  // 4. Generar y anexar Libro Excel .xlsx
  try {
    const excelBuffer = obtenerBufferExcel(evaluacion, evidencias);
    zip.file(`datos_supervision_${evaluacion.id}.xlsx`, excelBuffer);
  } catch (err) {
    console.warn('Advertencia al generar Excel para ZIP:', err);
  }

  // 5. Carpeta de evidencias fotográficas en sitio
  if (evidencias.length > 0) {
    const carpetaFotos = zip.folder('evidencias');

    const metadataFotos: Array<{
      id: string;
      archivo: string;
      criterio?: string;
      seccion?: string;
      descripcion?: string;
      fecha: string;
    }> = [];

    evidencias.forEach((ev, index) => {
      const sufijoCriterio = ev.idCriterio ? `_${ev.idCriterio}` : '';
      const indiceStr = String(index + 1).padStart(2, '0');
      const nombreFoto = `evidencia_${indiceStr}${sufijoCriterio}.jpg`;

      if (carpetaFotos && ev.datosBase64) {
        const base64Limpia = ev.datosBase64.includes(',')
          ? ev.datosBase64.split(',')[1]
          : ev.datosBase64;

        carpetaFotos.file(nombreFoto, base64Limpia, { base64: true });
      }

      metadataFotos.push({
        id: ev.id,
        archivo: nombreFoto,
        criterio: ev.idCriterio,
        seccion: ev.seccion,
        descripcion: ev.descripcion,
        fecha: ev.creadoEn
      });
    });

    if (carpetaFotos) {
      carpetaFotos.file('indice_fotografico.json', JSON.stringify(metadataFotos, null, 2));
    }
  }

  return zip;
}

/**
 * Obtiene el archivo ZIP como Blob binario
 */
export async function obtenerBlobRespaldoZip(
  evaluacion: Evaluacion,
  evidencias: EvidenciaFotografica[] = []
): Promise<Blob> {
  const zip = await generarRespaldoZip(evaluacion, evidencias);
  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}

/**
 * Descarga directamente el archivo ZIP de respaldo en el dispositivo
 */
export async function descargarRespaldoZip(
  evaluacion: Evaluacion,
  evidencias: EvidenciaFotografica[] = []
): Promise<void> {
  const blob = await obtenerBlobRespaldoZip(evaluacion, evidencias);
  const nombreLimpioUnidad = evaluacion.unidad.replace(/[^a-zA-Z0-9_-]/g, '_');
  const nombreArchivo = `Respaldo_Supervision_${evaluacion.id}_${nombreLimpioUnidad}.zip`;
  descargarBlob(blob, nombreArchivo);
}
