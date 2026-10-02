/**
 * Modelos de datos para el motor de evaluaciones y supervisión de cuartos de telecomunicaciones
 * Alineados 100% con los Catálogos Oficiales Institucionales IMSS OOAD Baja California.
 */

export type TipoCuartoTelecom = string;

export type SeccionEvaluacion =
  | 'fisica'
  | 'seguridad'
  | 'control'
  | 'infraestructura'
  | 'equipos'
  | 'telefonia'
  | 'ups'
  | 'observaciones'
  | string;

export type TipoPregunta = 'radio' | 'number' | 'textarea';
export type CriticidadPregunta = 'Baja' | 'Media' | 'Alta';

export interface CondicionVisibilidad {
  question: string;
  operator: 'equals';
  value: string;
}

export interface RecomendacionPregunta {
  when: string;
  text: string;
}

export interface ValidacionPregunta {
  min: number;
  max: number;
}

export interface PreguntaEvaluacion {
  id: string; // 'Q001' .. 'Q042'
  titulo: string;
  descripcion: string;
  seccion: SeccionEvaluacion;
  tipo: TipoPregunta;
  required: boolean;
  orden: number;
  peso: number;
  criticidad: CriticidadPregunta;
  visible: boolean;
  visibleIf: CondicionVisibilidad | null;
  opciones?: string[];
  recommendations?: RecomendacionPregunta[];
  placeholder?: string;
  validation?: ValidacionPregunta;
  jsonField: string;
  pdfField: string | null;
}

// Alias para compatibilidad con código existente
export type CriterioEvaluacion = PreguntaEvaluacion;
export type ValorCumplimiento = string;

export type EstadoEvaluacion = 'EN_PROCESO' | 'COMPLETADA';

export interface RespuestaCriterio {
  idCriterio: string; // ID de la pregunta, ej. 'Q001'
  valor: string; // 'Cumple', 'No Cumple', '12', o texto de observaciones
  observaciones?: string;
  actualizadoEn: string;
}

export interface MetricasEvaluacion {
  totalCriterios: number;
  totalRespondidos: number;
  totalCumple: number;
  totalNoCumple: number;
  totalNoAplica: number;
  porcentajeAvance: number; // 0 a 100
  calificacionCumplimiento: number; // 0 a 100
}

export interface Evaluacion {
  id: string; // IDEVALUACION único reservado (ej. EVAL-20260923-120000-99012345-A1B2)
  idUsuario: string;
  matriculaEvaluador: string;
  nombreEvaluador: string;
  ooad: string;
  unidad: string;
  tipoCuarto: TipoCuartoTelecom;
  ubicacionDetallada?: string;
  estado: EstadoEvaluacion;
  respuestas: Record<string, RespuestaCriterio>;
  porcentajeAvance: number; // 0 a 100
  calificacionCumplimiento: number; // 0 a 100
  totalCriterios: number;
  totalRespondidos: number;
  totalCumple: number;
  totalNoCumple: number;
  totalNoAplica: number;
  creadoEn: string; // ISO
  actualizadoEn: string; // ISO
  finalizadoEn?: string | null;
  sincronizado: boolean;
  version: number;
}

export interface DatosNuevaEvaluacion {
  idUsuario: string;
  matriculaEvaluador: string;
  nombreEvaluador: string;
  ooad: string;
  unidad: string;
  tipoCuarto: TipoCuartoTelecom;
  ubicacionDetallada?: string;
}
