import { BaseDatosLocal } from '../baseDatos';
import {
  Evaluacion,
  DatosNuevaEvaluacion,
  ValorCumplimiento,
  RespuestaCriterio
} from '../../modelos/evaluacion';
import { ElementoColaSincronizacion } from '../../modelos/sincronizacion';
import { generarIdEvaluacion } from '../../servicios/generadorIdEvaluacion';
import {
  CRITERIOS_SUPERVISION,
  calcularMetricasEvaluacion
} from '../../servicios/catalogoSupervision';

export class RepositorioEvaluaciones {
  constructor(private bd: BaseDatosLocal) {}

  /**
   * Crea una nueva evaluación reservando de inmediato su IDEVALUACION único en IndexedDB.
   * Se almacena con estado 'EN_PROCESO' para garantizar resistencia a cierres accidentales.
   */
  async crearEvaluacion(datos: DatosNuevaEvaluacion): Promise<Evaluacion> {
    const ahora = new Date().toISOString();
    const idEvaluacion = generarIdEvaluacion(datos.matriculaEvaluador);

    const metricasIniciales = calcularMetricasEvaluacion({}, CRITERIOS_SUPERVISION);

    const nuevaEvaluacion: Evaluacion = {
      id: idEvaluacion,
      idUsuario: datos.idUsuario,
      matriculaEvaluador: datos.matriculaEvaluador.trim(),
      nombreEvaluador: datos.nombreEvaluador.trim(),
      ooad: datos.ooad.trim(),
      unidad: datos.unidad.trim(),
      tipoCuarto: datos.tipoCuarto,
      ubicacionDetallada: datos.ubicacionDetallada?.trim() || '',
      estado: 'EN_PROCESO',
      respuestas: {},
      porcentajeAvance: metricasIniciales.porcentajeAvance,
      calificacionCumplimiento: metricasIniciales.calificacionCumplimiento,
      totalCriterios: metricasIniciales.totalCriterios,
      totalRespondidos: metricasIniciales.totalRespondidos,
      totalCumple: metricasIniciales.totalCumple,
      totalNoCumple: metricasIniciales.totalNoCumple,
      totalNoAplica: metricasIniciales.totalNoAplica,
      creadoEn: ahora,
      actualizadoEn: ahora,
      finalizadoEn: null,
      sincronizado: false,
      version: 1
    };

    const elementoCola: ElementoColaSincronizacion = {
      id: crypto.randomUUID(),
      tipoEntidad: 'EVALUACION',
      idEntidad: nuevaEvaluacion.id,
      operacion: 'CREAR',
      datos: JSON.stringify(nuevaEvaluacion),
      creadoEn: ahora,
      intentos: 0,
      ultimoError: null,
      estado: 'PENDIENTE'
    };

    await this.bd.transaction('rw', this.bd.evaluaciones, this.bd.colaSincronizacion, async () => {
      await this.bd.evaluaciones.add(nuevaEvaluacion);
      await this.bd.colaSincronizacion.add(elementoCola);
    });

    return nuevaEvaluacion;
  }

  /**
   * Obtiene una evaluación por su ID único
   */
  async obtenerPorId(id: string): Promise<Evaluacion | null> {
    const evalEncontrada = await this.bd.evaluaciones.get(id);
    return evalEncontrada || null;
  }

  /**
   * Obtiene todas las evaluaciones incompletas ('EN_PROCESO') de un usuario ordenadas por fecha reciente
   */
  async obtenerIncompletasPorUsuario(matricula: string): Promise<Evaluacion[]> {
    const matriculaLimpia = matricula.trim();
    const evaluaciones = await this.bd.evaluaciones
      .where('matriculaEvaluador')
      .equals(matriculaLimpia)
      .and(e => e.estado === 'EN_PROCESO')
      .toArray();

    return evaluaciones.sort(
      (a, b) => new Date(b.actualizadoEn).getTime() - new Date(a.actualizadoEn).getTime()
    );
  }

  /**
   * Obtiene todas las evaluaciones de un usuario (en proceso y completadas)
   */
  async obtenerTodasPorUsuario(matricula: string): Promise<Evaluacion[]> {
    const matriculaLimpia = matricula.trim();
    const evaluaciones = await this.bd.evaluaciones
      .where('matriculaEvaluador')
      .equals(matriculaLimpia)
      .toArray();

    return evaluaciones.sort(
      (a, b) => new Date(b.actualizadoEn).getTime() - new Date(a.actualizadoEn).getTime()
    );
  }

  /**
   * Obtiene todas las evaluaciones registradas localmente en la base de datos (para auditoría y admin)
   */
  async obtenerTodas(): Promise<Evaluacion[]> {
    const evaluaciones = await this.bd.evaluaciones.toArray();
    return evaluaciones.sort(
      (a, b) => new Date(b.actualizadoEn).getTime() - new Date(a.actualizadoEn).getTime()
    );
  }

  /**
   * Autoguardado continuo de una respuesta individual.
   * Recalcula métricas inmediatamente y persiste en base local.
   */
  async guardarRespuesta(
    idEvaluacion: string,
    idCriterio: string,
    datosRespuesta: { valor: ValorCumplimiento; observaciones?: string }
  ): Promise<Evaluacion> {
    return await this.bd.transaction('rw', this.bd.evaluaciones, this.bd.colaSincronizacion, async () => {
      const evaluacion = await this.bd.evaluaciones.get(idEvaluacion);
      if (!evaluacion) {
        throw new Error(`Evaluación no encontrada: ${idEvaluacion}`);
      }

      const ahora = new Date().toISOString();
      const nuevaRespuesta: RespuestaCriterio = {
        idCriterio,
        valor: datosRespuesta.valor,
        observaciones: datosRespuesta.observaciones !== undefined
          ? datosRespuesta.observaciones.trim()
          : (evaluacion.respuestas[idCriterio]?.observaciones || ''),
        actualizadoEn: ahora
      };

      const nuevasRespuestas = {
        ...evaluacion.respuestas,
        [idCriterio]: nuevaRespuesta
      };

      const metricas = calcularMetricasEvaluacion(nuevasRespuestas, CRITERIOS_SUPERVISION);

      const evaluacionActualizada: Evaluacion = {
        ...evaluacion,
        respuestas: nuevasRespuestas,
        porcentajeAvance: metricas.porcentajeAvance,
        calificacionCumplimiento: metricas.calificacionCumplimiento,
        totalCriterios: metricas.totalCriterios,
        totalRespondidos: metricas.totalRespondidos,
        totalCumple: metricas.totalCumple,
        totalNoCumple: metricas.totalNoCumple,
        totalNoAplica: metricas.totalNoAplica,
        actualizadoEn: ahora,
        version: evaluacion.version + 1,
        sincronizado: false
      };

      const elementoCola: ElementoColaSincronizacion = {
        id: crypto.randomUUID(),
        tipoEntidad: 'EVALUACION',
        idEntidad: evaluacionActualizada.id,
        operacion: 'ACTUALIZAR',
        datos: JSON.stringify(evaluacionActualizada),
        creadoEn: ahora,
        intentos: 0,
        ultimoError: null,
        estado: 'PENDIENTE'
      };

      await this.bd.evaluaciones.put(evaluacionActualizada);
      await this.bd.colaSincronizacion.add(elementoCola);

      return evaluacionActualizada;
    });
  }

  /**
   * Finaliza una evaluación cambiando su estado a 'COMPLETADA'
   */
  async finalizarEvaluacion(idEvaluacion: string): Promise<Evaluacion> {
    const evaluacion = await this.bd.evaluaciones.get(idEvaluacion);
    if (!evaluacion) {
      throw new Error(`Evaluación no encontrada: ${idEvaluacion}`);
    }

    const ahora = new Date().toISOString();
    const evaluacionFinalizada: Evaluacion = {
      ...evaluacion,
      estado: 'COMPLETADA',
      finalizadoEn: ahora,
      actualizadoEn: ahora,
      version: evaluacion.version + 1,
      sincronizado: false
    };

    const elementoCola: ElementoColaSincronizacion = {
      id: crypto.randomUUID(),
      tipoEntidad: 'EVALUACION',
      idEntidad: evaluacionFinalizada.id,
      operacion: 'ACTUALIZAR',
      datos: JSON.stringify(evaluacionFinalizada),
      creadoEn: ahora,
      intentos: 0,
      ultimoError: null,
      estado: 'PENDIENTE'
    };

    await this.bd.transaction('rw', this.bd.evaluaciones, this.bd.colaSincronizacion, async () => {
      await this.bd.evaluaciones.put(evaluacionFinalizada);
      await this.bd.colaSincronizacion.add(elementoCola);
    });

    return evaluacionFinalizada;
  }

  /**
   * Elimina una evaluación local y registra la operación en cola de sincronización
   */
  async eliminarEvaluacion(idEvaluacion: string): Promise<void> {
    const ahora = new Date().toISOString();
    const elementoCola: ElementoColaSincronizacion = {
      id: crypto.randomUUID(),
      tipoEntidad: 'EVALUACION',
      idEntidad: idEvaluacion,
      operacion: 'ELIMINAR',
      datos: JSON.stringify({ id: idEvaluacion }),
      creadoEn: ahora,
      intentos: 0,
      ultimoError: null,
      estado: 'PENDIENTE'
    };

    await this.bd.transaction('rw', this.bd.evaluaciones, this.bd.evidenciasFotograficas, this.bd.colaSincronizacion, async () => {
      // 1. Identificar fotos locales asociadas
      const fotosLocales = await this.bd.evidenciasFotograficas.where('idEvaluacion').equals(idEvaluacion).toArray();
      const idsFotos = new Set(fotosLocales.map((f) => f.id));

      // 2. Descartar de la cola cualquier carga pendiente que perteneciera a esta evaluación
      const enCola = await this.bd.colaSincronizacion.toArray();
      for (const item of enCola) {
        if (item.idEntidad === idEvaluacion || idsFotos.has(item.idEntidad)) {
          await this.bd.colaSincronizacion.delete(item.id);
        }
      }

      // 3. Eliminar evaluación y evidencias de la base local
      await this.bd.evaluaciones.delete(idEvaluacion);
      await this.bd.evidenciasFotograficas.where('idEvaluacion').equals(idEvaluacion).delete();

      // 4. Agregar elemento de baja a la cola para purgar Google Sheets y Google Drive
      await this.bd.colaSincronizacion.add(elementoCola);
    });
  }
}
