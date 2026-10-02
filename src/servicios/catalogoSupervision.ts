/**
 * Servicio y Catálogo de Supervisión de Cuartos Telecom
 * 100% alineado con Catalogos del sistema.txt e IMSS OOAD Baja California.
 */

import {
  sections,
  questions,
  COMPLIANT_VALUES,
  NEUTRAL_VALUES,
  evaluarVisibilidad,
  calcularMetricasEvaluacion as calcularMetricasOficiales,
  cities,
  units,
  rooms,
  obtenerCuartosPorUnidad,
  pdfLayout
} from './catalogosOficiales';
import {
  CriterioEvaluacion,
  SeccionEvaluacion,
  RespuestaCriterio,
  MetricasEvaluacion
} from '../modelos/evaluacion';

export interface InfoSeccion {
  id: SeccionEvaluacion;
  titulo: string;
  nombre: string;
  subtitulo: string;
  icono: string;
}

// 8 Secciones oficiales del catálogo
export const SECCIONES_SUPERVISION: InfoSeccion[] = sections.map((s) => ({
  id: s.id as SeccionEvaluacion,
  nombre: s.nombre,
  titulo: s.titulo || s.nombre,
  subtitulo: s.subtitulo || '',
  icono: s.icono || '📋',
}));

// 42 Reactivos oficiales del catálogo Q001 - Q042
export const CRITERIOS_SUPERVISION: CriterioEvaluacion[] = questions;

export {
  sections,
  questions,
  COMPLIANT_VALUES,
  NEUTRAL_VALUES,
  evaluarVisibilidad,
  cities,
  units,
  rooms,
  obtenerCuartosPorUnidad,
  pdfLayout,
};

export const MAPA_TIPO_CUARTO: Record<string, string> = {
  MDF: 'MDF (Main Distribution Frame)',
  IDF: 'IDF (Intermediate Distribution Frame)',
  RACK: 'Rack de Telecomunicaciones',
  GABINETE: 'Gabinete de Pared',
  SITE_DATACENTER: 'Site / Centro de Cómputo Principal',
};

export const LISTA_OOAD_SUGERIDAS: string[] = [
  'OOAD Baja California',
  'OOAD Baja California Sur',
  'OOAD Sonora',
  'OOAD Chihuahua',
  'OOAD Sinaloa',
  'OOAD Coahuila',
  'OOAD Nuevo León',
  'OOAD Tamaulipas',
  'OOAD Jalisco',
  'OOAD Ciudad de México Norte',
  'OOAD Ciudad de México Sur',
  'OOAD Estado de México Poniente',
  'OOAD Estado de México Oriente',
];

export const UNIDADES_IMSS_BC: string[] = units.map((u) => `${u.id} - ${u.nombre}`);

/**
 * Determina si una pregunta es de tipo numérico o puramente informativa (inventario de equipos/nodos),
 * la cual registra datos pero NO representa una no-conformidad ni penaliza el cumplimiento.
 */
export function esPreguntaInformativaONumerica(criterio?: {
  id?: string;
  tipo?: string;
  peso?: number;
  opciones?: string[];
} | null): boolean {
  if (!criterio) return false;
  if (criterio.tipo === 'number') return true;
  // Criterios específicos de conteo o inventario técnico
  const idsNumericos = new Set(['Q023', 'Q024', 'Q025', 'Q026', 'Q028', 'Q029', 'Q033', 'Q034']);
  if (criterio.id && idsNumericos.has(criterio.id)) return true;
  if (criterio.peso === 0 && (!criterio.opciones || !criterio.opciones.includes('No Cumple'))) {
    return true;
  }
  return false;
}

/**
 * Calcula métricas institucionales de avance y cumplimiento
 */
export function calcularMetricasEvaluacion(
  respuestas: Record<string, RespuestaCriterio>,
  criterios: CriterioEvaluacion[] = CRITERIOS_SUPERVISION
): MetricasEvaluacion {
  return calcularMetricasOficiales(respuestas, criterios);
}

