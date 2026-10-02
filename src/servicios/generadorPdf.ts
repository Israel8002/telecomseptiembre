/**
 * Motor de Generación de Reportes Ejecutivos en PDF
 * Cumple al 100% con los lineamientos oficiales de catalogosOficiales y Especificación UEOD.
 */

import { jsPDF } from 'jspdf';
import { Evaluacion } from '../modelos/evaluacion';
import { EvidenciaFotografica } from '../modelos/evidenciaFotografica';
import {
  CRITERIOS_SUPERVISION,
  SECCIONES_SUPERVISION,
  MAPA_TIPO_CUARTO,
  pdfLayout,
  COMPLIANT_VALUES,
  NEUTRAL_VALUES,
  evaluarVisibilidad,
  esPreguntaInformativaONumerica
} from './catalogoSupervision';

export interface OpcionesReportePdf {
  incluirFotos?: boolean;
  incluirFirmas?: boolean;
}

/**
 * Función auxiliar para limpiar textos y reemplazar caracteres UTF-8 no soportados por helvetica
 */
function limpiarTextoParaPdf(txt: string | undefined | null): string {
  if (!txt) return '';
  return txt
    .replace(/₂/g, '2')
    .replace(/₁/g, '1')
    .replace(/₃/g, '3')
    .replace(/⁴/g, '4')
    .replace(/[▸►•]/g, '-')
    .replace(/[⚠️💡✅❌🔍📌]/g, '');
}

/**
 * Función auxiliar para formatear fechas a DD/MM/AAAA HH:mm
 */
function formatearFecha(isoString?: string | null): string {
  if (!isoString) return new Date().toLocaleDateString('es-MX');
  try {
    const d = new Date(isoString);
    return `${d.toLocaleDateString('es-MX')} ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return isoString;
  }
}

/**
 * Genera el documento jsPDF con el reporte ejecutivo institucional
 */
export function generarReportePdf(
  evaluacion: Evaluacion,
  evidencias: EvidenciaFotografica[] = [],
  opciones: OpcionesReportePdf = { incluirFotos: true, incluirFirmas: true }
): jsPDF {
  // Dimensiones oficiales: Carta (Letter 612 x 792 pt @ 72dpi), margen 36 pt para mejor aprovechamiento
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter'
  });

  const anchoPagina = 612;
  const altoPagina = 792;
  const margen = 36;
  const anchoUtil = anchoPagina - margen * 2;
  let cursorY = margen;

  // Paleta sobria institucional IMSS
  const COLOR_VERDE_IMSS = [18, 56, 43] as const; // #12382B
  const COLOR_DORADO_IMSS = [179, 142, 93] as const; // #B38E5D
  const COLOR_GRIS_FONDO = [245, 247, 248] as const;
  const COLOR_GRIS_BORDE = [218, 224, 229] as const;
  const COLOR_TEXTO_OSCURO = [33, 37, 41] as const;
  const COLOR_TEXTO_MUTED = [108, 117, 125] as const;
  const COLOR_EXITO = [22, 101, 52] as const;
  const COLOR_ERROR = [153, 27, 27] as const;

  const dibujarEncabezadoPagina = () => {
    // Franja institucional superior discreta en posición fija en el margen superior
    const yBarra = margen - 6;
    doc.setFillColor(...COLOR_VERDE_IMSS);
    doc.rect(margen, yBarra, anchoUtil, 2.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_TEXTO_MUTED);
    doc.text(
      `IMSS OOAD BAJA CALIFORNIA — REPORTE DE EVALUACIÓN | FOLIO: ${evaluacion.id}`,
      margen,
      yBarra + 11
    );
  };

  const nuevaPagina = () => {
    doc.addPage();
    dibujarEncabezadoPagina();
    cursorY = margen + 24;
  };

  const verificarEspacio = (espacioRequerido: number) => {
    if (cursorY + espacioRequerido > altoPagina - margen - 28) {
      nuevaPagina();
    }
  };

  // ==========================================
  // 1. ENCABEZADO INSTITUCIONAL PRINCIPAL
  // ==========================================
  // Fondo de pleca institucional
  doc.setFillColor(...COLOR_VERDE_IMSS);
  doc.rect(margen, cursorY, anchoUtil, 58, 'F');

  doc.setFillColor(...COLOR_DORADO_IMSS);
  doc.rect(margen, cursorY + 58, anchoUtil, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('INSTITUTO MEXICANO DEL SEGURO SOCIAL', margen + 16, cursorY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    'ÓRGANO DE OPERACIÓN ADMINISTRATIVA DESCONCENTRADA BAJA CALIFORNIA',
    margen + 16,
    cursorY + 34
  );
  doc.text(
    'COORDINACIÓN DELEGACIONAL DE INFORMÁTICA • SUPERVISIÓN TÉCNICA DE TELECOMUNICACIONES',
    margen + 16,
    cursorY + 47
  );

  cursorY += 75;

  // ==========================================
  // 2. TÍTULO Y SUBTÍTULO OFICIAL DEL REPORTE
  // ==========================================
  doc.setTextColor(...COLOR_TEXTO_OSCURO);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(pdfLayout.title, margen, cursorY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_TEXTO_MUTED);
  doc.text(`${pdfLayout.subtitle} — ${pdfLayout.focus}`, margen, cursorY + 14);

  cursorY += 30;

  // ==========================================
  // 3. FICHA TÉCNICA DE IDENTIFICACIÓN
  // ==========================================
  const altoFicha = 68;
  doc.setFillColor(...COLOR_GRIS_FONDO);
  doc.setDrawColor(...COLOR_GRIS_BORDE);
  doc.roundedRect(margen, cursorY, anchoUtil, altoFicha, 3, 3, 'FD');

  const anchoCol = (anchoUtil - 24) / 2; // ~258 pt por columna
  const col1X = margen + 10;
  const col2X = margen + anchoCol + 14;
  const nombreCuarto = MAPA_TIPO_CUARTO[evaluacion.tipoCuarto] || evaluacion.tipoCuarto;
  const textoCuarto = evaluacion.ubicacionDetallada
    ? `${nombreCuarto} (${evaluacion.ubicacionDetallada})`
    : nombreCuarto;

  doc.setFontSize(8);

  // Columna 1
  // Fila 1: Unidad Médica
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_VERDE_IMSS);
  doc.text('Unidad Médica:', col1X, cursorY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_TEXTO_OSCURO);
  const valUnidad = doc.splitTextToSize(evaluacion.unidad, anchoCol - 78)[0];
  doc.text(valUnidad, col1X + 74, cursorY + 16);

  // Fila 2: Infraestructura / Cuarto
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_VERDE_IMSS);
  doc.text('Infraestructura:', col1X, cursorY + 32);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_TEXTO_OSCURO);
  const valCuarto = doc.splitTextToSize(textoCuarto, anchoCol - 78)[0];
  doc.text(valCuarto, col1X + 74, cursorY + 32);

  // Fila 3: Órgano Desconcentrado
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_VERDE_IMSS);
  doc.text('Órgano OOAD:', col1X, cursorY + 48);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_TEXTO_OSCURO);
  const valOoad = doc.splitTextToSize(evaluacion.ooad, anchoCol - 78)[0];
  doc.text(valOoad, col1X + 74, cursorY + 48);

  // Fila 4: Estado
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_VERDE_IMSS);
  doc.text('Estado Evaluación:', col1X, cursorY + 62);
  doc.setFont('helvetica', 'bold');
  if (evaluacion.estado === 'COMPLETADA') {
    doc.setTextColor(...COLOR_EXITO);
    doc.text('COMPLETADA / FINALIZADA', col1X + 88, cursorY + 62);
  } else {
    doc.setTextColor(...COLOR_ERROR);
    doc.text('EN PROCESO / PRELIMINAR', col1X + 88, cursorY + 62);
  }

  // Columna 2
  // Fila 1: Folio
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_VERDE_IMSS);
  doc.text('Folio Evaluación:', col2X, cursorY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_TEXTO_OSCURO);
  const valId = doc.splitTextToSize(evaluacion.id, anchoCol - 82)[0];
  doc.text(valId, col2X + 78, cursorY + 16);

  // Fila 2: Evaluador
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_VERDE_IMSS);
  doc.text('Evaluador Técnico:', col2X, cursorY + 32);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_TEXTO_OSCURO);
  const valEval = doc.splitTextToSize(`${evaluacion.nombreEvaluador} (${evaluacion.matriculaEvaluador})`, anchoCol - 82)[0];
  doc.text(valEval, col2X + 78, cursorY + 32);

  // Fila 3: Fecha
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_VERDE_IMSS);
  doc.text('Fecha Emisión:', col2X, cursorY + 48);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_TEXTO_OSCURO);
  doc.text(formatearFecha(evaluacion.finalizadoEn || evaluacion.actualizadoEn), col2X + 78, cursorY + 48);

  // Fila 4: Normativa Oficial
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_VERDE_IMSS);
  doc.text('Normativa:', col2X, cursorY + 62);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_TEXTO_MUTED);
  doc.text('Lineamientos Técnicos UEOD IMSS 2026', col2X + 78, cursorY + 62);

  cursorY += altoFicha + 15;

  // ==========================================
  // 4. RESUMEN EJECUTIVO DE CUMPLIMIENTO (MÉTRICAS)
  // ==========================================
  const cantMetricas = 5;
  const anchoCaja = (anchoUtil - (cantMetricas - 1) * 8) / cantMetricas;
  const altoCaja = 46;

  const metricas: Array<{
    etiqueta: string;
    valor: string;
    color: readonly [number, number, number];
  }> = [
    {
      etiqueta: 'Cumplimiento',
      valor: `${evaluacion.calificacionCumplimiento}%`,
      color: evaluacion.calificacionCumplimiento >= 80 ? COLOR_EXITO : COLOR_ERROR
    },
    {
      etiqueta: 'Conformes',
      valor: `${evaluacion.totalCumple}`,
      color: COLOR_EXITO
    },
    {
      etiqueta: 'No Conformes',
      valor: `${evaluacion.totalNoCumple}`,
      color: COLOR_ERROR
    },
    {
      etiqueta: 'No Aplica',
      valor: `${evaluacion.totalNoAplica}`,
      color: COLOR_TEXTO_MUTED
    },
    {
      etiqueta: 'Evidencias Fotos',
      valor: `${evidencias.length}`,
      color: COLOR_VERDE_IMSS
    }
  ];

  metricas.forEach((m, idx) => {
    const x = margen + idx * (anchoCaja + 8);
    doc.setFillColor(...COLOR_GRIS_FONDO);
    doc.setDrawColor(...COLOR_GRIS_BORDE);
    doc.roundedRect(x, cursorY, anchoCaja, altoCaja, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.valor, x + anchoCaja / 2, cursorY + 20, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_TEXTO_MUTED);
    doc.text(m.etiqueta, x + anchoCaja / 2, cursorY + 34, { align: 'center' });
  });

  cursorY += altoCaja + 18;

  // ==========================================
  // 5. DETALLE DE REACTIVOS POR SECCIONES (100% DINÁMICO)
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_VERDE_IMSS);
  doc.text('DETALLE DE REVISIÓN EN SITIO POR SECCIÓN', margen, cursorY);
  cursorY += 12;

  const preguntasNoConformes: Array<{
    pregunta: (typeof CRITERIOS_SUPERVISION)[0];
    respuesta: string;
    observacion?: string;
  }> = [];

  // Recorrer las 8 secciones de supervisión oficial de forma 100% dinámica
  for (const seccion of SECCIONES_SUPERVISION) {
    // ========================================================
    // SECCIÓN 8: OBSERVACIONES Y RECOMENDACIONES TÉCNICAS
    // ========================================================
    if (seccion.id === 'observaciones') {
      const criterioObs = CRITERIOS_SUPERVISION.find((c) => c.seccion === 'observaciones' || c.id === 'Q042');
      const respObs = criterioObs ? evaluacion.respuestas[criterioObs.id] : undefined;
      const textoObservacion = respObs?.valor?.trim();

      // Recopilar también cualquier nota técnica individual registrada en reactivos
      const notasIndividuales = CRITERIOS_SUPERVISION
        .map((c) => ({
          criterio: c,
          nota: evaluacion.respuestas[c.id]?.observaciones?.trim()
        }))
        .filter((item) => Boolean(item.nota && item.nota.length > 0));

      verificarEspacio(65);

      // Barra de sección
      doc.setFillColor(235, 240, 238);
      doc.setDrawColor(...COLOR_VERDE_IMSS);
      doc.rect(margen, cursorY, anchoUtil, 18, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLOR_VERDE_IMSS);
      const tituloSecObs = limpiarTextoParaPdf(`SECCIÓN: ${seccion.titulo.toUpperCase()}`);
      doc.text(tituloSecObs, margen + 8, cursorY + 12);
      cursorY += 24;

      // Tarjeta contenedora de Observaciones Generales
      const lineasObs = textoObservacion
        ? doc.splitTextToSize(limpiarTextoParaPdf(textoObservacion), anchoUtil - 24)
        : ['Sin observaciones generales adicionales registradas por el evaluador técnico.'];

      const altoCajaObs = Math.max(38, lineasObs.length * 11 + 22);
      verificarEspacio(altoCajaObs + 15);

      doc.setFillColor(...COLOR_GRIS_FONDO);
      doc.setDrawColor(...COLOR_GRIS_BORDE);
      doc.roundedRect(margen, cursorY, anchoUtil, altoCajaObs, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_VERDE_IMSS);
      doc.text('OBSERVACIONES GENERALES DEL EVALUADOR EN SITIO (Q042):', margen + 10, cursorY + 14);

      doc.setFont('helvetica', textoObservacion ? 'normal' : 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_TEXTO_OSCURO);
      doc.text(lineasObs, margen + 10, cursorY + 26);

      cursorY += altoCajaObs + 14;

      // Si además existen notas técnicas individuales en reactivos, listarlas claramente
      if (notasIndividuales.length > 0) {
        verificarEspacio(30);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...COLOR_VERDE_IMSS);
        doc.text('NOTAS TÉCNICAS ESPECÍFICAS REGISTRADAS EN REACTIVOS:', margen + 8, cursorY);
        cursorY += 12;

        for (const item of notasIndividuales) {
          verificarEspacio(24);
          const lineaNota = doc.splitTextToSize(
            `- [${item.criterio.id}] ${limpiarTextoParaPdf(item.criterio.titulo)}: "${limpiarTextoParaPdf(item.nota)}"`,
            anchoUtil - 16
          );
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(...COLOR_TEXTO_OSCURO);
          doc.text(lineaNota, margen + 10, cursorY);
          cursorY += lineaNota.length * 10 + 2;
        }
        cursorY += 8;
      }
      continue;
    }

    // ========================================================
    // SECCIONES 1 A 7 (FÍSICA, SEGURIDAD, CONTROL, INFRAESTRUCTURA, EQUIPOS, TELEFONÍA Y CONMUTADOR, UPS)
    // ========================================================
    const criteriosDeSeccion = CRITERIOS_SUPERVISION.filter((c) => c.seccion === seccion.id);

    // Criterios a mostrar: visibles según reglas condicionales O que ya tengan respuesta guardada
    const criteriosAMostrar = criteriosDeSeccion.filter((c) => {
      const resp = evaluacion.respuestas[c.id];
      const tieneValor = resp?.valor !== undefined && resp.valor !== '';
      return tieneValor || evaluarVisibilidad(c, evaluacion.respuestas);
    });

    if (criteriosAMostrar.length === 0) continue;

    verificarEspacio(45);

    // Barra de sección - Título limpio institucional
    doc.setFillColor(235, 240, 238);
    doc.setDrawColor(...COLOR_VERDE_IMSS);
    doc.rect(margen, cursorY, anchoUtil, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_VERDE_IMSS);
    const tituloSeccion = limpiarTextoParaPdf(`SECCIÓN: ${seccion.titulo.toUpperCase()}`);
    doc.text(tituloSeccion, margen + 8, cursorY + 12);
    cursorY += 22;

    // Encabezado de tabla con anchos optimizados
    doc.setFillColor(...COLOR_GRIS_FONDO);
    doc.rect(margen, cursorY, anchoUtil, 15, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_TEXTO_MUTED);
    doc.text('CRITERIO / REACTIVO EVALUADO', margen + 8, cursorY + 11);
    doc.text('RESPUESTA', margen + 245, cursorY + 11);
    doc.text('ESTADO', margen + 375, cursorY + 11);
    doc.text('OBSERVACIONES', margen + 455, cursorY + 11);
    cursorY += 18;

    for (const preg of criteriosAMostrar) {
      verificarEspacio(20);

      const respObj = evaluacion.respuestas[preg.id];
      const valor = respObj?.valor || 'Sin responder';
      const observaciones = respObj?.observaciones || '';

      const esInformativo = esPreguntaInformativaONumerica(preg);
      const esConforme = COMPLIANT_VALUES.has(valor);
      const esNeutro = NEUTRAL_VALUES.has(valor);

      // Solo preguntas evaluativas con peso de auditoría pueden ser no conformes
      if (!esInformativo && !esConforme && !esNeutro && valor !== 'Sin responder') {
        preguntasNoConformes.push({
          pregunta: preg,
          respuesta: valor,
          observacion: observaciones
        });
      }

      // Línea divisoria
      doc.setDrawColor(240, 242, 244);
      doc.line(margen, cursorY + 14, margen + anchoUtil, cursorY + 14);

      // Criterio / Reactivo con identificador oficial
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_TEXTO_OSCURO);
      const labelLimpia = limpiarTextoParaPdf(`[${preg.id}] ${preg.titulo}`);
      const textoReactivo = labelLimpia.length > 46 ? `${labelLimpia.substring(0, 44)}...` : labelLimpia;
      doc.text(textoReactivo, margen + 8, cursorY + 10);

      // Respuesta
      doc.setFont('helvetica', 'normal');
      const valorLimpio = limpiarTextoParaPdf(valor);
      const textoValor = valorLimpio.length > 25 ? `${valorLimpio.substring(0, 23)}...` : valorLimpio;
      doc.text(textoValor, margen + 245, cursorY + 10);

      // Estado de cumplimiento
      doc.setFont('helvetica', 'bold');
      if (esConforme) {
        doc.setTextColor(...COLOR_EXITO);
        doc.text('CONFORME', margen + 375, cursorY + 10);
      } else if (esNeutro) {
        doc.setTextColor(...COLOR_TEXTO_MUTED);
        doc.text('NO APLICA', margen + 375, cursorY + 10);
      } else if (esInformativo) {
        doc.setTextColor(...COLOR_TEXTO_MUTED);
        doc.text('REGISTRO', margen + 375, cursorY + 10);
      } else if (valor === 'Sin responder') {
        doc.setTextColor(200, 140, 0);
        doc.text('PENDIENTE', margen + 375, cursorY + 10);
      } else {
        doc.setTextColor(...COLOR_ERROR);
        doc.text('NO CUMPLE', margen + 375, cursorY + 10);
      }

      // Observaciones
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLOR_TEXTO_MUTED);
      const obsLimpia = limpiarTextoParaPdf(observaciones);
      const textoObs = obsLimpia.length > 17 ? `${obsLimpia.substring(0, 15)}...` : obsLimpia;
      doc.text(textoObs || '-', margen + 455, cursorY + 10);

      cursorY += 16;
    }

    cursorY += 6;
  }

  // ==========================================
  // 6. HALLAZGOS Y RECOMENDACIONES TÉCNICAS (SI HAY INCUMPLIMIENTOS)
  // ==========================================
  if (preguntasNoConformes.length > 0) {
    verificarEspacio(60);

    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(...COLOR_ERROR);
    doc.rect(margen, cursorY, anchoUtil, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_ERROR);
    doc.text(`RECOMENDACIONES INSTITUCIONALES ANTE NO CONFORMIDADES (${preguntasNoConformes.length})`, margen + 8, cursorY + 12);
    cursorY += 24;

    for (const item of preguntasNoConformes) {
      verificarEspacio(38);

      let recomendacion = 'Se requiere subsanar la observación a la brevedad conforme a lineamientos institucionales.';
      if (item.pregunta.recommendations) {
        const encontrada = item.pregunta.recommendations.find((r) => r.when === item.respuesta);
        if (encontrada) recomendacion = encontrada.text;
      }

      const tituloPregunta = limpiarTextoParaPdf(item.pregunta.titulo);
      const respLimpia = limpiarTextoParaPdf(item.respuesta);
      const recLimpia = limpiarTextoParaPdf(recomendacion);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_TEXTO_OSCURO);
      doc.text(`- [${item.pregunta.id}] ${tituloPregunta}:`, margen + 8, cursorY + 8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLOR_ERROR);
      const textoDictamen = `  Dictamen: "${respLimpia}". Recomendación: ${recLimpia}`;
      const lineasDictamen = doc.splitTextToSize(textoDictamen, anchoUtil - 20);
      doc.text(lineasDictamen, margen + 8, cursorY + 19);

      const altoDictamen = lineasDictamen.length * 10;

      if (item.observacion) {
        doc.setTextColor(...COLOR_TEXTO_MUTED);
        const notaLimpia = limpiarTextoParaPdf(item.observacion);
        const lineasNota = doc.splitTextToSize(`  Nota técnica en sitio: "${notaLimpia}"`, anchoUtil - 20);
        doc.text(lineasNota, margen + 8, cursorY + 19 + altoDictamen);
        cursorY += 22 + altoDictamen + lineasNota.length * 10;
      } else {
        cursorY += 22 + altoDictamen;
      }
    }
  }

  // ==========================================
  // 7. ANEXO FOTOGRÁFICO DE EVIDENCIAS EN SITIO
  // ==========================================
  if (opciones.incluirFotos && evidencias.length > 0) {
    nuevaPagina();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...COLOR_VERDE_IMSS);
    doc.text('ANEXO FOTOGRÁFICO — EVIDENCIAS DE SUPERVISIÓN EN SITIO', margen, cursorY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_TEXTO_MUTED);
    doc.text(`Total de fotografías registradas: ${evidencias.length}`, margen, cursorY + 14);
    cursorY += 28;

    // Organizamos en cuadrícula de 2 columnas
    const anchoFoto = (anchoUtil - 20) / 2; // ~260 pt
    const altoFoto = 160;
    const altoBloque = altoFoto + 46;

    for (let i = 0; i < evidencias.length; i++) {
      const ev = evidencias[i];
      const esColumnaDerecha = i % 2 === 1;
      const xFoto = esColumnaDerecha ? margen + anchoFoto + 20 : margen;

      if (!esColumnaDerecha && i > 0 && (i % 4 === 0)) {
        nuevaPagina();
      }

      const yActual = cursorY;

      // Recuadro contenedor de fotografía
      doc.setFillColor(...COLOR_GRIS_FONDO);
      doc.setDrawColor(...COLOR_GRIS_BORDE);
      doc.rect(xFoto, yActual, anchoFoto, altoBloque, 'FD');

      // Intentar incrustar la imagen
      try {
        if (ev.datosBase64) {
          doc.addImage(ev.datosBase64, 'JPEG', xFoto + 4, yActual + 4, anchoFoto - 8, altoFoto - 8);
        }
      } catch (err) {
        // En caso de que el formato de imagen sea problemático
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(...COLOR_TEXTO_MUTED);
        doc.text('[Fotografía técnica registrada]', xFoto + anchoFoto / 2, yActual + altoFoto / 2, { align: 'center' });
      }

      // Pie de foto
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_VERDE_IMSS);
      const tituloFoto = ev.idCriterio ? `Punto: ${ev.idCriterio}` : `Sección: ${ev.seccion || 'General'}`;
      doc.text(tituloFoto, xFoto + 6, yActual + altoFoto + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...COLOR_TEXTO_MUTED);
      doc.text(formatearFecha(ev.creadoEn), xFoto + anchoFoto - 6, yActual + altoFoto + 12, { align: 'right' });

      const nota = ev.descripcion || 'Sin observaciones adicionales registradas.';
      const notaRecortada = nota.length > 55 ? `${nota.substring(0, 52)}...` : nota;
      doc.text(notaRecortada, xFoto + 6, yActual + altoFoto + 24);

      if (esColumnaDerecha || i === evidencias.length - 1) {
        cursorY += altoBloque + 16;
      }
    }
  }

  // ==========================================
  // 8. NOTA REFERENTE INSTITUCIONAL UEOD Y FIRMAS
  // ==========================================
  if (opciones.incluirFirmas) {
    verificarEspacio(180);

    // Recuadro de Nota Legal UEOD
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(...COLOR_GRIS_BORDE);
    doc.rect(margen, cursorY, anchoUtil, 52, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_VERDE_IMSS);
    doc.text(pdfLayout.legalTitle, margen + 8, cursorY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLOR_TEXTO_OSCURO);

    const lineasLegal = doc.splitTextToSize(pdfLayout.legalText, anchoUtil - 16);
    doc.text(lineasLegal, margen + 8, cursorY + 22);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(...COLOR_TEXTO_MUTED);
    doc.text(`Ref.: ${pdfLayout.legalRef}`, margen + 8, cursorY + 44);

    cursorY += 66;

    // Firmas y Sello de la Unidad
    const anchoRecuadro = (anchoUtil - 20) / 3;
    const altoRecuadroFirma = 75;

    // Caja 1: Evaluador
    doc.setDrawColor(...COLOR_GRIS_BORDE);
    doc.rect(margen, cursorY, anchoRecuadro, altoRecuadroFirma);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_TEXTO_MUTED);
    doc.text('EVALUADOR TÉCNICO', margen + anchoRecuadro / 2, cursorY + 14, { align: 'center' });
    doc.line(margen + 10, cursorY + 50, margen + anchoRecuadro - 10, cursorY + 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_TEXTO_OSCURO);
    doc.text(evaluacion.nombreEvaluador.substring(0, 28), margen + anchoRecuadro / 2, cursorY + 60, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Matrícula: ${evaluacion.matriculaEvaluador}`, margen + anchoRecuadro / 2, cursorY + 69, { align: 'center' });

    // Caja 2: Recepción por la Unidad
    const xFirmaUnidad = margen + anchoRecuadro + 10;
    doc.rect(xFirmaUnidad, cursorY, anchoRecuadro, altoRecuadroFirma);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_TEXTO_MUTED);
    doc.text('RECIBE POR LA UNIDAD', xFirmaUnidad + anchoRecuadro / 2, cursorY + 14, { align: 'center' });
    doc.line(xFirmaUnidad + 10, cursorY + 50, xFirmaUnidad + anchoRecuadro - 10, cursorY + 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_TEXTO_OSCURO);
    doc.text('Nombre y Firma Responsable', xFirmaUnidad + anchoRecuadro / 2, cursorY + 60, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('Administración / Conservación', xFirmaUnidad + anchoRecuadro / 2, cursorY + 69, { align: 'center' });

    // Caja 3: Sello de la Unidad
    const xSello = margen + (anchoRecuadro + 10) * 2;
    doc.setLineDashPattern([3, 2], 0);
    doc.rect(xSello, cursorY, anchoRecuadro, altoRecuadroFirma);
    doc.setLineDashPattern([], 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_TEXTO_MUTED);
    doc.text(pdfLayout.sealLabel, xSello + anchoRecuadro / 2, cursorY + altoRecuadroFirma / 2, { align: 'center' });
  }

  // ==========================================
  // 9. PIE DE PÁGINA CON NUMERACIÓN
  // ==========================================
  const totalPaginas = doc.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_TEXTO_MUTED);
    doc.text(
      `Página ${p} de ${totalPaginas} • Documento Institucional de Supervisión Técnica`,
      anchoPagina / 2,
      altoPagina - 20,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Obtiene el reporte como ArrayBuffer binario (óptimo para ZIP)
 */
export function obtenerArrayBufferPdf(evaluacion: Evaluacion, evidencias: EvidenciaFotografica[] = []): ArrayBuffer {
  const doc = generarReportePdf(evaluacion, evidencias);
  return doc.output('arraybuffer');
}

/**
 * Obtiene el reporte en Blob para vistas previas o descargas
 */
export function obtenerBlobReportePdf(evaluacion: Evaluacion, evidencias: EvidenciaFotografica[] = []): Blob {
  const doc = generarReportePdf(evaluacion, evidencias);
  return doc.output('blob');
}

/**
 * Descarga directamente el reporte PDF en el dispositivo del usuario
 */
export function descargarReportePdf(evaluacion: Evaluacion, evidencias: EvidenciaFotografica[] = []): void {
  const doc = generarReportePdf(evaluacion, evidencias);
  const nombreLimpioUnidad = evaluacion.unidad.replace(/[^a-zA-Z0-9_-]/g, '_');
  const nombreLimpioCuarto = evaluacion.tipoCuarto.replace(/[^a-zA-Z0-9_-]/g, '_');
  const nombreArchivo = `${nombreLimpioCuarto.toLowerCase()}_reporte_${evaluacion.id}_${nombreLimpioUnidad}.pdf`;
  doc.save(nombreArchivo);
}
