/**
 * Motor de Exportación de Evaluaciones a Hojas de Cálculo Excel (.xlsx)
 * Genera libros de trabajo con Resumen Ejecutivo, Detalle de Respuestas y Evidencias.
 */

import * as XLSX from 'xlsx';
import { Evaluacion } from '../modelos/evaluacion';
import { EvidenciaFotografica } from '../modelos/evidenciaFotografica';
import {
  CRITERIOS_SUPERVISION,
  SECCIONES_SUPERVISION,
  MAPA_TIPO_CUARTO,
  COMPLIANT_VALUES,
  NEUTRAL_VALUES,
  esPreguntaInformativaONumerica
} from './catalogoSupervision';

/**
 * Dispara la descarga de un Blob en el navegador o webview
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
 * Genera el libro de cálculo estructurado de la evaluación
 */
export function generarLibroExcel(
  evaluacion: Evaluacion,
  evidencias: EvidenciaFotografica[] = []
): XLSX.WorkBook {
  const libro = XLSX.utils.book_new();

  // ==========================================
  // HOJA 1: RESUMEN EJECUTIVO
  // ==========================================
  const nombreCuarto = MAPA_TIPO_CUARTO[evaluacion.tipoCuarto] || evaluacion.tipoCuarto;
  const fechaCreacion = evaluacion.creadoEn ? new Date(evaluacion.creadoEn).toLocaleString('es-MX') : 'N/A';
  const fechaCierre = evaluacion.finalizadoEn
    ? new Date(evaluacion.finalizadoEn).toLocaleString('es-MX')
    : new Date(evaluacion.actualizadoEn).toLocaleString('es-MX');

  const filasResumen: (string | number)[][] = [
    ['INSTITUTO MEXICANO DEL SEGURO SOCIAL'],
    ['Órgano de Operación Administrativa Desconcentrada Baja California'],
    ['Coordinación Delegacional de Informática - Supervisión Técnica de Telecomunicaciones'],
    [''],
    ['DATOS GENERALES DE LA EVALUACIÓN', ''],
    ['Folio de Evaluación (IDEVALUACION)', evaluacion.id],
    ['Órgano / Delegación (OOAD)', evaluacion.ooad],
    ['Unidad Médica / Administrativa', evaluacion.unidad],
    ['Tipo de Cuarto', nombreCuarto],
    ['Ubicación Específica', evaluacion.ubicacionDetallada || 'No especificada'],
    ['Evaluador Técnico', evaluacion.nombreEvaluador],
    ['Matrícula Evaluador', evaluacion.matriculaEvaluador],
    ['Estado de Evaluación', evaluacion.estado],
    ['Fecha de Inicio', fechaCreacion],
    ['Fecha de Cierre / Actualización', fechaCierre],
    [''],
    ['MÉTRICAS Y RESULTADOS INSTITUCIONALES', ''],
    ['Calificación de Cumplimiento (%)', `${evaluacion.calificacionCumplimiento}%`],
    ['Total Reactivos Aplicables', evaluacion.totalCriterios],
    ['Total Reactivos Respondidos', evaluacion.totalRespondidos],
    ['Porcentaje de Avance (%)', `${evaluacion.porcentajeAvance}%`],
    ['Reactivos Conformes (Cumple)', evaluacion.totalCumple],
    ['Reactivos No Conformes (No Cumple)', evaluacion.totalNoCumple],
    ['Reactivos No Aplica', evaluacion.totalNoAplica],
    ['Total Fotografías de Evidencia', evidencias.length],
    [''],
    ['FUNDAMENTO LEGAL', ''],
    [
      'Alineación UEOD',
      'Unidad de Evaluación de Órganos Desconcentrados (UEOD). Manual de Organización de la Coordinación Delegacional de Informática (Funciones 7.1 incisos 18 y 24).'
    ]
  ];

  const hojaResumen = XLSX.utils.aoa_to_sheet(filasResumen);

  // Ajustar anchos de columnas
  hojaResumen['!cols'] = [{ wch: 38 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(libro, hojaResumen, 'Resumen Ejecutivo');

  // ==========================================
  // HOJA 2: DETALLE DE RESPUESTAS (42 REACTIVOS)
  // ==========================================
  const mapaSecciones = new Map(SECCIONES_SUPERVISION.map((s) => [s.id, s.nombre]));

  const encabezadosDetalle = [
    'ID Reactivo',
    'Sección',
    'Criterio / Reactivo Oficial',
    'Criticidad',
    'Peso (Pts)',
    'Campo JSON',
    'Respuesta Registrada',
    'Dictamen Oficial',
    'Observaciones Técnicas en Sitio',
    'Recomendación Institucional UEOD'
  ];

  const filasDetalle: (string | number)[][] = [encabezadosDetalle];

  CRITERIOS_SUPERVISION.forEach((crit) => {
    const resp = evaluacion.respuestas[crit.id];
    const valor = resp?.valor || 'Sin responder';
    const obs = resp?.observaciones || '';

    const esInformativo = esPreguntaInformativaONumerica(crit);
    let dictamen = 'PENDIENTE';
    if (valor !== 'Sin responder') {
      if (esInformativo) {
        dictamen = 'REGISTRO';
      } else if (COMPLIANT_VALUES.has(valor)) {
        dictamen = 'CONFORME';
      } else if (NEUTRAL_VALUES.has(valor)) {
        dictamen = 'NO APLICA';
      } else {
        dictamen = 'NO CONFORME';
      }
    }

    let recomendacion = '';
    if (dictamen === 'NO CONFORME' && crit.recommendations) {
      const rec = crit.recommendations.find((r) => r.when === valor);
      recomendacion = rec ? rec.text : 'Subsanar anomalía a la brevedad conforme a norma.';
    }

    filasDetalle.push([
      crit.id,
      mapaSecciones.get(crit.seccion) || crit.seccion,
      crit.titulo,
      crit.criticidad,
      crit.peso,
      crit.jsonField,
      valor,
      dictamen,
      obs,
      recomendacion
    ]);
  });

  const hojaDetalle = XLSX.utils.aoa_to_sheet(filasDetalle);
  hojaDetalle['!cols'] = [
    { wch: 12 }, // ID
    { wch: 22 }, // Sección
    { wch: 42 }, // Criterio
    { wch: 12 }, // Criticidad
    { wch: 10 }, // Puntos
    { wch: 20 }, // Campo JSON
    { wch: 22 }, // Respuesta
    { wch: 15 }, // Dictamen
    { wch: 35 }, // Observaciones
    { wch: 45 }  // Recomendación
  ];
  XLSX.utils.book_append_sheet(libro, hojaDetalle, 'Detalle de Respuestas');

  // ==========================================
  // HOJA 3: REGISTRO DE EVIDENCIAS FOTOGRÁFICAS
  // ==========================================
  const encabezadosEvidencias = [
    'ID Evidencia',
    'ID Reactivo',
    'Sección Asociada',
    'Nombre Archivo',
    'Fecha / Hora de Captura',
    'Observaciones / Pie de Foto',
    'Resolución',
    'Tamaño Aprox (KB)'
  ];

  const filasEvidencias: (string | number)[][] = [encabezadosEvidencias];

  evidencias.forEach((ev) => {
    const fecha = ev.creadoEn ? new Date(ev.creadoEn).toLocaleString('es-MX') : 'N/A';
    const tamanoKb = Math.round(ev.tamanoBytes / 1024);
    const resolucion = ev.ancho && ev.alto ? `${ev.ancho}x${ev.alto} px` : 'N/A';

    filasEvidencias.push([
      ev.id,
      ev.idCriterio || 'General',
      ev.seccion || 'General',
      ev.nombreArchivo,
      fecha,
      ev.descripcion || 'Sin observaciones adicionales',
      resolucion,
      tamanoKb
    ]);
  });

  const hojaEvidencias = XLSX.utils.aoa_to_sheet(filasEvidencias);
  hojaEvidencias['!cols'] = [
    { wch: 28 }, // ID
    { wch: 14 }, // Reactivo
    { wch: 18 }, // Sección
    { wch: 30 }, // Nombre archivo
    { wch: 22 }, // Fecha
    { wch: 40 }, // Observaciones
    { wch: 15 }, // Resolución
    { wch: 16 }  // Tamaño KB
  ];
  XLSX.utils.book_append_sheet(libro, hojaEvidencias, 'Registro de Evidencias');

  return libro;
}

/**
 * Obtiene el archivo binario Uint8Array del libro Excel
 */
export function obtenerBufferExcel(
  evaluacion: Evaluacion,
  evidencias: EvidenciaFotografica[] = []
): Uint8Array {
  const libro = generarLibroExcel(evaluacion, evidencias);
  const buffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(buffer);
}

/**
 * Obtiene el archivo como Blob para descargas o empaquetado ZIP
 */
export function obtenerBlobExcel(
  evaluacion: Evaluacion,
  evidencias: EvidenciaFotografica[] = []
): Blob {
  const buffer = obtenerBufferExcel(evaluacion, evidencias);
  return new Blob([buffer.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

/**
 * Descarga directamente el archivo Excel .xlsx en el dispositivo
 */
export function descargarReporteExcel(
  evaluacion: Evaluacion,
  evidencias: EvidenciaFotografica[] = []
): void {
  const blob = obtenerBlobExcel(evaluacion, evidencias);
  const nombreLimpioUnidad = evaluacion.unidad.replace(/[^a-zA-Z0-9_-]/g, '_');
  const nombreLimpioCuarto = evaluacion.tipoCuarto.replace(/[^a-zA-Z0-9_-]/g, '_');
  const nombreArchivo = `Supervision_${nombreLimpioCuarto}_${evaluacion.id}_${nombreLimpioUnidad}.xlsx`;
  descargarBlob(blob, nombreArchivo);
}
