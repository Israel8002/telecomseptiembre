/**
 * Modelos para la cola de sincronización local
 */

export type TipoEntidadSincronizable = 'USUARIO' | 'EVALUACION' | 'FOTOGRAFIA' | 'REPORTE';
export type TipoOperacionSincronizacion = 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR';
export type EstadoSincronizacion = 'PENDIENTE' | 'PROCESANDO' | 'SINCRONIZADO' | 'FALLIDO';

export interface ElementoColaSincronizacion {
  id: string;
  tipoEntidad: TipoEntidadSincronizable;
  idEntidad: string;
  operacion: TipoOperacionSincronizacion;
  datos: string;
  creadoEn: string;
  intentos: number;
  ultimoError: string | null;
  estado: EstadoSincronizacion;
}
