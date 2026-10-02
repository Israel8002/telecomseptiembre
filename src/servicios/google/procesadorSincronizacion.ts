/**
 * Motor de Sincronización en Segundo Plano con Google Sheets y Google Drive
 * Procesa la cola de sincronización local con reintentos inteligentes y retroceso exponencial.
 */

import { BaseDatosLocal, bdLocal } from '../../db/baseDatos';
import { ElementoColaSincronizacion } from '../../modelos/sincronizacion';
import { obtenerEstadoRedActual, suscribirEstadoRed } from '../detectorRed';
import { servicioGoogleSheets } from './servicioGoogleSheets';
import { servicioGoogleDrive } from './servicioGoogleDrive';
import { obtenerBlobReportePdf } from '../generadorPdf';

export type EstadoMotorSync = 'INACTIVO' | 'SINCRONIZANDO' | 'COMPLETADO' | 'ERROR';

export interface ResumenEstadoSincronizacion {
  estado: EstadoMotorSync;
  enLinea: boolean;
  totalPendientes: number;
  ultimoError: string | null;
  ultimaSincronizacionExitosa: string | null;
}

export class ProcesadorSincronizacion {
  private bd: BaseDatosLocal;
  private sincronizando = false;
  private estado: EstadoMotorSync = 'INACTIVO';
  private ultimoError: string | null = null;
  private ultimaSincronizacionExitosa: string | null = null;
  private totalPendientes = 0;
  private desuscribirRed: (() => void) | null = null;
  private oyentes: Set<(resumen: ResumenEstadoSincronizacion) => void> = new Set();

  constructor(bd: BaseDatosLocal = bdLocal) {
    this.bd = bd;
  }

  /**
   * Inicia el monitoreo reactivo de red y la cola de sincronización
   */
  iniciar(): void {
    if (this.desuscribirRed) return;

    this.actualizarConteoPendientes();

    // Al recuperar conectividad, procesar la cola de inmediato
    this.desuscribirRed = suscribirEstadoRed((enLinea) => {
      this.notificarOyentes();
      if (enLinea) {
        this.procesarCola();
      }
    });

    // Si ya estamos en línea al arrancar, procesar pendientes
    if (obtenerEstadoRedActual()) {
      this.procesarCola();
    }
  }

  /**
   * Detiene el monitoreo reactivo
   */
  detener(): void {
    if (this.desuscribirRed) {
      this.desuscribirRed();
      this.desuscribirRed = null;
    }
  }

  /**
   * Suscribe un callback para recibir cambios de estado en tiempo real
   */
  suscribir(oyente: (resumen: ResumenEstadoSincronizacion) => void): () => void {
    this.oyentes.add(oyente);
    oyente(this.obtenerResumen());
    return () => {
      this.oyentes.delete(oyente);
    };
  }

  /**
   * Obtiene una instantánea del estado actual
   */
  obtenerResumen(): ResumenEstadoSincronizacion {
    return {
      estado: this.estado,
      enLinea: obtenerEstadoRedActual(),
      totalPendientes: this.totalPendientes,
      ultimoError: this.ultimoError,
      ultimaSincronizacionExitosa: this.ultimaSincronizacionExitosa
    };
  }

  private notificarOyentes(): void {
    const resumen = this.obtenerResumen();
    this.oyentes.forEach((fn) => {
      try {
        fn(resumen);
      } catch (err) {
        console.error('Error en oyente de sincronización:', err);
      }
    });
  }

  private async actualizarConteoPendientes(): Promise<number> {
    try {
      this.totalPendientes = await this.bd.colaSincronizacion
        .where('estado')
        .anyOf(['PENDIENTE', 'FALLIDO'])
        .count();
      this.notificarOyentes();
      return this.totalPendientes;
    } catch {
      return 0;
    }
  }

  /**
   * Procesa de manera atómica todos los elementos pendientes en la cola
   */
  async procesarCola(forzarInmediato: boolean = false): Promise<void> {
    if (this.sincronizando) return;
    if (!obtenerEstadoRedActual()) {
      await this.actualizarConteoPendientes();
      return;
    }

    try {
      this.sincronizando = true;
      this.estado = 'SINCRONIZANDO';
      this.ultimoError = null;
      this.notificarOyentes();

      const elementos = await this.bd.colaSincronizacion
        .where('estado')
        .anyOf(['PENDIENTE', 'FALLIDO'])
        .sortBy('creadoEn');

      if (elementos.length === 0) {
        this.estado = 'COMPLETADO';
        this.totalPendientes = 0;
        this.notificarOyentes();
        return;
      }

      for (const item of elementos) {
        // Si no se fuerza de inmediato, verificar retroceso exponencial
        if (!forzarInmediato && item.intentos > 0) {
          const esperaMs = Math.min(Math.pow(2, item.intentos) * 1000, 60_000);
          const tiempoDesdeFallo = Date.now() - new Date(item.creadoEn).getTime();
          if (tiempoDesdeFallo < esperaMs) {
            continue; // Esperar siguiente ciclo
          }
        }

        try {
          await this.procesarElemento(item);

          // Si fue exitoso, eliminar de la cola de sincronización
          await this.bd.colaSincronizacion.delete(item.id);
        } catch (error) {
          const errorMsg = (error as Error).message || 'Error desconocido';
          console.error(`Error al sincronizar elemento ${item.id} (${item.tipoEntidad}):`, error);

          await this.bd.colaSincronizacion.update(item.id, {
            intentos: item.intentos + 1,
            ultimoError: errorMsg,
            estado: 'FALLIDO'
          });

          this.ultimoError = errorMsg;
        }
      }

      await this.actualizarConteoPendientes();

      if (this.totalPendientes === 0) {
        this.estado = 'COMPLETADO';
        this.ultimaSincronizacionExitosa = new Date().toISOString();
      } else {
        this.estado = 'ERROR';
      }
    } catch (errorGlobal) {
      console.error('Error global en procesador de sincronización:', errorGlobal);
      this.estado = 'ERROR';
      this.ultimoError = (errorGlobal as Error).message || 'Error en sincronización remota';
    } finally {
      this.sincronizando = false;
      this.notificarOyentes();
    }
  }

  /**
   * Despacha y sincroniza un elemento específico según su entidad
   */
  private async procesarElemento(item: ElementoColaSincronizacion): Promise<void> {
    const datos = JSON.parse(item.datos);

    switch (item.tipoEntidad) {
      case 'USUARIO': {
        const usuario = await this.bd.usuarios.get(item.idEntidad);
        const objUsuario = usuario || datos;

        await servicioGoogleSheets.sincronizarUsuario(objUsuario);

        if (usuario) {
          await this.bd.usuarios.update(usuario.id, { sincronizado: true });
        }

        await servicioGoogleSheets.registrarLog({
          idOperacion: item.id,
          tipoEntidad: 'USUARIO',
          accion: item.operacion,
          matriculaUsuario: objUsuario.matricula || 'SISTEMA',
          resultado: 'EXITOSO'
        });
        break;
      }

      case 'EVALUACION': {
        if (item.operacion === 'ELIMINAR') {
          let urlsDrivePurgadas: string[] = [];

          // 1. Eliminar renglón en 'Evaluaciones' y todos los de 'Fotografias_Metadatos' en Sheets
          try {
            urlsDrivePurgadas = await servicioGoogleSheets.eliminarEvaluacionYMetadatos(item.idEntidad);
          } catch (errSheets) {
            console.warn(`[Sync Sheets] Error al purgar filas para evaluación ${item.idEntidad}:`, errSheets);
          }

          // 2. Eliminar archivos asociados en Google Drive (PDFs y fotos)
          try {
            await servicioGoogleDrive.eliminarArchivosEvaluacion(item.idEntidad, urlsDrivePurgadas);
          } catch (errDrive) {
            console.warn(`[Sync Drive] Error al purgar archivos en Drive para evaluación ${item.idEntidad}:`, errDrive);
          }

          // 3. Registrar auditoría de la baja en Log_Sincronizacion
          await servicioGoogleSheets.registrarLog({
            idOperacion: item.id,
            tipoEntidad: 'EVALUACION',
            accion: 'ELIMINAR',
            matriculaUsuario: datos.matriculaEvaluador || 'ADMIN',
            resultado: 'EXITOSO_PURGADO_COMPLETO'
          });
          break;
        }

        const evaluacion = await this.bd.evaluaciones.get(item.idEntidad);
        const objEvaluacion = evaluacion || datos;

        let urlReporteDrive = '';

        // Si la evaluación está concluida, subir reporte PDF a Google Drive
        if (objEvaluacion.estado === 'COMPLETADA') {
          try {
            const fotos = await this.bd.evidenciasFotograficas
              .where('idEvaluacion')
              .equals(objEvaluacion.id)
              .toArray();

            const pdfBlob = obtenerBlobReportePdf(objEvaluacion, fotos);
            const subidaPdf = await servicioGoogleDrive.subirReportePdf(objEvaluacion, pdfBlob);
            urlReporteDrive = subidaPdf.urlDrive;
          } catch (pdfError: any) {
            const msgPdf = pdfError?.message || String(pdfError);
            console.warn('No se pudo subir PDF a Drive durante sync (se continuará):', msgPdf);
            if (
              msgPdf.includes('storageQuotaExceeded') ||
              msgPdf.includes('Service Accounts do not have storage quota') ||
              msgPdf.includes('403')
            ) {
              urlReporteDrive = 'SIN_CUOTA_DRIVE_REQUIERE_UNIDAD_COMPARTIDA';
            }
          }
        }

        await servicioGoogleSheets.sincronizarEvaluacion(objEvaluacion, urlReporteDrive);

        if (evaluacion) {
          await this.bd.evaluaciones.update(evaluacion.id, { sincronizado: true });
        }

        await servicioGoogleSheets.registrarLog({
          idOperacion: item.id,
          tipoEntidad: 'EVALUACION',
          accion: item.operacion,
          matriculaUsuario: objEvaluacion.matriculaEvaluador || 'DESCONOCIDO',
          resultado: urlReporteDrive.includes('SIN_CUOTA') ? 'EXITOSO_SHEETS_SIN_DRIVE' : 'EXITOSO'
        });
        break;
      }

      case 'EVIDENCIA_FOTOGRAFICA': {
        if (item.operacion === 'ELIMINAR') {
          try {
            if (datos.urlDrive) {
              const fileId = servicioGoogleDrive.extraerIdArchivoDrive(datos.urlDrive);
              if (fileId) await servicioGoogleDrive.eliminarArchivo(fileId);
            }
          } catch (errDrive) {
            console.warn('Error al purgar archivo de evidencia individual en Drive:', errDrive);
          }

          await servicioGoogleSheets.registrarLog({
            idOperacion: item.id,
            tipoEntidad: 'EVIDENCIA_FOTOGRAFICA',
            accion: 'ELIMINAR',
            matriculaUsuario: 'SISTEMA',
            resultado: 'EXITOSO'
          });
          break;
        }

        const evidencia = await this.bd.evidenciasFotograficas.get(item.idEntidad);
        const objEvidencia = evidencia || datos;

        let urlDrive = '';
        let avisoCuotaDrive = false;

        if (objEvidencia.datosBase64) {
          try {
            const resultadoDrive = await servicioGoogleDrive.subirEvidenciaFotografica(objEvidencia);
            urlDrive = resultadoDrive.urlDrive;
          } catch (driveError: any) {
            const mensajeError = driveError?.message || String(driveError);
            console.warn(`[Sync Drive] Advertencia al subir fotografía ${objEvidencia.id} a Drive:`, mensajeError);

            // Si Google Drive rechaza por falta de cuota en cuenta de servicio (requiere Unidad Compartida)
            if (
              mensajeError.includes('storageQuotaExceeded') ||
              mensajeError.includes('Service Accounts do not have storage quota') ||
              mensajeError.includes('403')
            ) {
              avisoCuotaDrive = true;
              urlDrive = 'SIN_CUOTA_DRIVE_REQUIERE_UNIDAD_COMPARTIDA';
            } else {
              // Si es un error transitorio de red u otro, relanzar para reintentar más tarde
              throw driveError;
            }
          }
        }

        await servicioGoogleSheets.registrarEvidenciaFotografica(objEvidencia, urlDrive);

        if (evidencia) {
          await this.bd.evidenciasFotograficas.update(evidencia.id, { sincronizado: true });
        }

        await servicioGoogleSheets.registrarLog({
          idOperacion: item.id,
          tipoEntidad: 'EVIDENCIA_FOTOGRAFICA',
          accion: item.operacion,
          matriculaUsuario: objEvidencia.unidad || 'GENERAL',
          resultado: avisoCuotaDrive ? 'EXITOSO_SHEETS_SIN_DRIVE_CUOTA' : 'EXITOSO'
        });
        break;
      }

      default:
        console.warn(`Tipo de entidad no soportada para sincronización: ${item.tipoEntidad}`);
    }
  }

  /**
   * Fuerza un intento de sincronización manual sin esperar retroceso
   */
  async forzarSincronizacion(): Promise<void> {
    return this.procesarCola(true);
  }
}

// Instancia singleton del motor de sincronización
export const procesadorSincronizacion = new ProcesadorSincronizacion(bdLocal);
