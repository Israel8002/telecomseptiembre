import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAutenticacion } from '../../contextos/ContextoAutenticacion';
import { RepositorioEvaluaciones } from '../../db/repositorios/repositorioEvaluaciones';
import { RepositorioEvidencias } from '../../db/repositorios/repositorioEvidencias';
import {
  Evaluacion,
  SeccionEvaluacion,
  PreguntaEvaluacion
} from '../../modelos/evaluacion';
import { EvidenciaFotografica } from '../../modelos/evidenciaFotografica';
import {
  SECCIONES_SUPERVISION,
  CRITERIOS_SUPERVISION,
  COMPLIANT_VALUES,
  NEUTRAL_VALUES,
  evaluarVisibilidad,
  MAPA_TIPO_CUARTO,
  esPreguntaInformativaONumerica
} from '../../servicios/catalogoSupervision';
import { ModuloEvidenciaCriterio } from '../../componentes/ModuloFotografico/ModuloEvidenciaCriterio';
import { ModalGaleriaCompleta } from '../../componentes/ModuloFotografico/ModalGaleriaCompleta';
import { ModalExportacion } from '../../componentes/ModalExportacion/ModalExportacion';
import './PantallaEvaluacion.css';

interface PropsPantallaEvaluacion {
  idEvaluacion: string;
  alVolver: () => void;
  alFinalizada: () => void;
}

export const PantallaEvaluacion: React.FC<PropsPantallaEvaluacion> = ({
  idEvaluacion,
  alVolver,
  alFinalizada
}) => {
  const { bd } = useAutenticacion();
  const repo = useMemo(() => new RepositorioEvaluaciones(bd), [bd]);
  const repoEvidencias = useMemo(() => new RepositorioEvidencias(bd), [bd]);

  const [evaluacion, setEvaluacion] = useState<Evaluacion | null>(null);
  const [evidencias, setEvidencias] = useState<EvidenciaFotografica[]>([]);
  const [mostrarGaleriaCompleta, setMostrarGaleriaCompleta] = useState(false);
  const [mostrarModalExportar, setMostrarModalExportar] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState<SeccionEvaluacion>('fisica');
  const [guardando, setGuardando] = useState(false);
  const [horaUltimoGuardado, setHoraUltimoGuardado] = useState<string>('');
  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  const cargar = useCallback(async () => {
    const [ev, evs] = await Promise.all([
      repo.obtenerPorId(idEvaluacion),
      repoEvidencias.obtenerPorEvaluacion(idEvaluacion)
    ]);
    if (ev) {
      setEvaluacion(ev);
    }
    setEvidencias(evs);
  }, [repo, repoEvidencias, idEvaluacion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const desplazarArriba = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (typeof window.scrollTo === 'function') {
        try {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
          window.scrollTo(0, 0);
        }
      }
      if (document.documentElement) {
        if (typeof document.documentElement.scrollTo === 'function') {
          try {
            document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
          } catch {
            document.documentElement.scrollTop = 0;
          }
        } else {
          document.documentElement.scrollTop = 0;
        }
      }
      if (document.body) {
        if (typeof document.body.scrollTo === 'function') {
          try {
            document.body.scrollTo({ top: 0, behavior: 'smooth' });
          } catch {
            document.body.scrollTop = 0;
          }
        } else {
          document.body.scrollTop = 0;
        }
      }
    }
  }, []);

  useEffect(() => {
    desplazarArriba();
  }, [seccionActiva, desplazarArriba]);

  const cambiarSeccion = (nuevaSeccion: SeccionEvaluacion) => {
    setSeccionActiva(nuevaSeccion);
    desplazarArriba();
  };

  const formatearHora = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const manejarRespuesta = async (
    idCriterio: string,
    nuevoValor: string,
    observacionesActuales?: string
  ) => {
    if (!evaluacion) return;

    try {
      setGuardando(true);
      const obs = observacionesActuales !== undefined
        ? observacionesActuales
        : (evaluacion.respuestas[idCriterio]?.observaciones || '');

      const evalActualizada = await repo.guardarRespuesta(evaluacion.id, idCriterio, {
        valor: nuevoValor,
        observaciones: obs
      });

      setEvaluacion(evalActualizada);
      setHoraUltimoGuardado(formatearHora());
    } catch (error) {
      console.error('Error en autoguardado de respuesta:', error);
    } finally {
      setGuardando(false);
    }
  };

  const manejarObservaciones = async (idCriterio: string, texto: string) => {
    if (!evaluacion) return;
    const respActual = evaluacion.respuestas[idCriterio];
    if (!respActual) return;

    try {
      setGuardando(true);
      const evalActualizada = await repo.guardarRespuesta(evaluacion.id, idCriterio, {
        valor: respActual.valor,
        observaciones: texto
      });
      setEvaluacion(evalActualizada);
      setHoraUltimoGuardado(formatearHora());
    } catch (error) {
      console.error('Error al guardar observaciones:', error);
    } finally {
      setGuardando(false);
    }
  };

  const agregarEvidencia = async (
    archivo: File,
    idCriterio?: string,
    seccion?: string
  ) => {
    if (!evaluacion) return;
    try {
      await repoEvidencias.guardarEvidencia({
        idEvaluacion: evaluacion.id,
        idCriterio,
        seccion,
        unidad: evaluacion.unidad,
        tipoCuarto: evaluacion.tipoCuarto,
        nombreArchivo: archivo.name,
        archivoODataUrl: archivo
      });
      const actualizadas = await repoEvidencias.obtenerPorEvaluacion(evaluacion.id);
      setEvidencias(actualizadas);
    } catch (error) {
      console.error('Error al guardar evidencia fotográfica:', error);
    }
  };

  const eliminarEvidencia = async (idFoto: string) => {
    if (!evaluacion) return;
    try {
      await repoEvidencias.eliminarEvidencia(idFoto);
      const actualizadas = await repoEvidencias.obtenerPorEvaluacion(evaluacion.id);
      setEvidencias(actualizadas);
    } catch (error) {
      console.error('Error al eliminar evidencia fotográfica:', error);
    }
  };

  const actualizarDescripcionEvidencia = async (idFoto: string, descripcion: string) => {
    if (!evaluacion) return;
    try {
      await repoEvidencias.actualizarDescripcion(idFoto, descripcion);
      const actualizadas = await repoEvidencias.obtenerPorEvaluacion(evaluacion.id);
      setEvidencias(actualizadas);
    } catch (error) {
      console.error('Error al actualizar descripción de evidencia:', error);
    }
  };

  const manejarFinalizar = async () => {
    if (!evaluacion) return;
    try {
      setFinalizando(true);
      await repo.finalizarEvaluacion(evaluacion.id);
      alFinalizada();
    } catch (error) {
      console.error('Error al finalizar evaluación:', error);
    } finally {
      setFinalizando(false);
    }
  };

  const manejarDescartarEvaluacion = async () => {
    if (!evaluacion) return;
    const confirmacion = window.confirm(
      `¿Está seguro de eliminar y descartar esta evaluación (${evaluacion.id})?\n\nEsta acción borrará todas las respuestas y evidencias fotográficas registradas en este dispositivo.`
    );
    if (confirmacion) {
      try {
        await repo.eliminarEvaluacion(evaluacion.id);
        alVolver();
      } catch (error) {
        console.error('Error al descartar evaluación:', error);
        alert('No se pudo eliminar la evaluación.');
      }
    }
  };

  const criteriosPorSeccion = useMemo(() => {
    if (!evaluacion) return [];
    return CRITERIOS_SUPERVISION.filter(
      (c) => c.seccion === seccionActiva && evaluarVisibilidad(c, evaluacion.respuestas)
    );
  }, [seccionActiva, evaluacion]);

  const indiceSeccionActual = SECCIONES_SUPERVISION.findIndex((s) => s.id === seccionActiva);
  const seccionActualInfo = SECCIONES_SUPERVISION[indiceSeccionActual] || SECCIONES_SUPERVISION[0];

  const totalRespondidosSeccion = (seccion: SeccionEvaluacion) => {
    if (!evaluacion) return { respondidos: 0, total: 0 };
    const criterios = CRITERIOS_SUPERVISION.filter(
      (c) => c.seccion === seccion && evaluarVisibilidad(c, evaluacion.respuestas)
    );
    const respondidos = criterios.filter(
      (c) => evaluacion.respuestas[c.id]?.valor !== undefined && evaluacion.respuestas[c.id]?.valor !== ''
    ).length;
    return { respondidos, total: criterios.length };
  };

  if (!evaluacion) {
    return (
      <main className="pantalla-evaluacion-contenedor">
        <div style={{ padding: 'var(--espacio-xl)', textAlign: 'center', color: 'var(--texto-secundario)' }}>
          Cargando evaluación...
        </div>
      </main>
    );
  }

  const nombreCuarto = MAPA_TIPO_CUARTO[evaluacion.tipoCuarto] || evaluacion.tipoCuarto;

  return (
    <main className="pantalla-evaluacion-contenedor" aria-label="Cuestionario de Supervisión">
      {/* Cabecera superior institucional con estado y progreso */}
      <section className="cabecera-evaluacion">
        <div className="cabecera-evaluacion-fila-superior">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacio-sm)', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="boton-regresar-panel"
              onClick={alVolver}
              aria-label="Guardar y volver al panel principal"
            >
              ← Guardar y Salir
            </button>
            <button
              type="button"
              className="boton-galeria-cabecera"
              onClick={() => setMostrarGaleriaCompleta(true)}
              aria-label="Ver todas las evidencias fotográficas"
            >
              📷 Evidencias ({evidencias.length})
            </button>
            <button
              type="button"
              className="boton-galeria-cabecera"
              onClick={() => setMostrarModalExportar(true)}
              aria-label="Generar reportes oficiales y exportar datos"
              style={{ backgroundColor: 'var(--fondo-superficie)', borderColor: 'var(--borde-medio)' }}
            >
              📥 Reportes / Exportar
            </button>
            <button
              type="button"
              className="boton-galeria-cabecera"
              onClick={manejarDescartarEvaluacion}
              aria-label="Descartar y eliminar esta evaluación"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                borderColor: 'rgba(239, 68, 68, 0.3)'
              }}
            >
              🗑️ Descartar
            </button>
          </div>

          <div
            className={`indicador-autoguardado ${guardando ? 'guardando' : ''}`}
            role="status"
            aria-live="polite"
          >
            <span className="punto-autoguardado" />
            <span>
              {guardando
                ? 'Guardando...'
                : horaUltimoGuardado
                ? `Guardado local (${horaUltimoGuardado})`
                : 'Guardado localmente en IndexedDB'}
            </span>
          </div>
        </div>

        <div className="cabecera-evaluacion-info">
          <h1 className="titulo-evaluacion">
            {evaluacion.unidad}
          </h1>
          <div className="subtitulo-evaluacion">
            <span>{nombreCuarto}</span>
            <span>•</span>
            <span>{evaluacion.ooad}</span>
            <span>•</span>
            <span className="badge-id-evaluacion" title="Identificador único reservado">
              {evaluacion.id}
            </span>
          </div>
        </div>

        <div className="contenedor-progreso-global">
          <div className="progreso-textos">
            <span>
              Progreso: {evaluacion.totalRespondidos} de {evaluacion.totalCriterios} reactivos ({evaluacion.porcentajeAvance}%)
            </span>
            <span>
              Cumplimiento: {evaluacion.calificacionCumplimiento}%
            </span>
          </div>
          <div className="barra-progreso-fondo">
            <div
              className="barra-progreso-relleno"
              style={{ width: `${evaluacion.porcentajeAvance}%` }}
            />
          </div>
        </div>
      </section>

      {/* Pestañas de las 8 secciones oficiales */}
      <nav
        className="contenedor-pestanas-secciones"
        aria-label="Secciones del cuarto de telecomunicaciones"
      >
        {SECCIONES_SUPERVISION.map((seccion) => {
          const { respondidos, total } = totalRespondidosSeccion(seccion.id);
          const esActiva = seccion.id === seccionActiva;
          const esCompleta = respondidos === total && total > 0;

          return (
            <button
              key={seccion.id}
              type="button"
              className={`boton-pestana-seccion ${esActiva ? 'activa' : ''}`}
              onClick={() => cambiarSeccion(seccion.id)}
              aria-current={esActiva ? 'true' : undefined}
            >
              <span className="pestana-icono">{seccion.icono}</span>
              <span className="pestana-nombre">{seccion.nombre}</span>
              <span className={`pestana-contador ${esCompleta ? 'completa' : ''}`}>
                {respondidos}/{total}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Contenido de la sección activa */}
      <section className="seccion-contenido">
        <div className="seccion-encabezado">
          <h2 className="seccion-titulo">
            {seccionActualInfo.icono} {seccionActualInfo.titulo}
          </h2>
          <p className="seccion-subtitulo">{seccionActualInfo.subtitulo}</p>
        </div>

        <div className="lista-criterios">
          {criteriosPorSeccion.map((criterio: PreguntaEvaluacion) => {
            const resp = evaluacion.respuestas[criterio.id];
            const valorActual = resp?.valor;
            const esInformativo = esPreguntaInformativaONumerica(criterio);

            let claseEstado = '';
            if (valorActual !== undefined && valorActual !== '') {
              if (esInformativo) {
                claseEstado = 'respondido-conforme';
              } else if (NEUTRAL_VALUES.has(valorActual)) {
                claseEstado = 'respondido-neutro';
              } else if (COMPLIANT_VALUES.has(valorActual)) {
                claseEstado = 'respondido-conforme';
              } else {
                claseEstado = 'respondido-no-conforme';
              }
            }

            // Recomendación técnica aplicable al valor actual (solo para preguntas auditables)
            const recomendacionActiva = !esInformativo
              ? criterio.recommendations?.find((r) => r.when === valorActual)
              : undefined;

            return (
              <article key={criterio.id} className={`tarjeta-criterio ${claseEstado}`}>
                <div className="criterio-encabezado">
                  <div className="criterio-titulos">
                    <div className="criterio-badges-fila">
                      <span className="codigo-tag">{criterio.id}</span>
                      {criterio.peso > 0 && (
                        <span className="tag-peso">{criterio.peso} pts</span>
                      )}
                      <span className={`tag-criticidad crit-${criterio.criticidad.toLowerCase()}`}>
                        {criterio.criticidad}
                      </span>
                    </div>
                    <h3 className="criterio-titulo-texto">{criterio.titulo}</h3>
                  </div>
                </div>

                <p className="criterio-descripcion">{criterio.descripcion}</p>

                {/* Tipo RADIO: Opciones de selección del catálogo */}
                {criterio.tipo === 'radio' && criterio.opciones && (
                  <div
                    className="grupo-opciones-respuesta"
                    role="group"
                    aria-label={`Respuesta para ${criterio.id}`}
                  >
                    {criterio.opciones.map((opcion) => {
                      const seleccionada = valorActual === opcion;
                      let claseBoton = '';
                      if (seleccionada) {
                        if (NEUTRAL_VALUES.has(opcion)) {
                          claseBoton = 'seleccionado-neutro';
                        } else if (COMPLIANT_VALUES.has(opcion)) {
                          claseBoton = 'seleccionado-conforme';
                        } else {
                          claseBoton = 'seleccionado-no-conforme';
                        }
                      }

                      return (
                        <button
                          key={opcion}
                          type="button"
                          className={`boton-opcion ${claseBoton}`}
                          onClick={() => manejarRespuesta(criterio.id, opcion)}
                        >
                          {seleccionada && <span>{COMPLIANT_VALUES.has(opcion) ? '✔' : '✖'}</span>}
                          {opcion}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tipo NUMBER: Input numérico validado */}
                {criterio.tipo === 'number' && (
                  <div className="contenedor-control-numero">
                    <input
                      type="number"
                      id={`input-${criterio.id}`}
                      className="input-numero-control"
                      placeholder={criterio.placeholder || '0'}
                      min={criterio.validation?.min ?? 0}
                      max={criterio.validation?.max ?? 100000}
                      value={valorActual ?? ''}
                      onChange={(e) => manejarRespuesta(criterio.id, e.target.value)}
                      aria-label={criterio.titulo}
                    />
                  </div>
                )}

                {/* Tipo TEXTAREA: Área de texto de observaciones */}
                {criterio.tipo === 'textarea' && (
                  <div className="contenedor-observaciones-generales">
                    <textarea
                      id={`textarea-${criterio.id}`}
                      className="textarea-observaciones-generales"
                      placeholder={criterio.placeholder || 'Escribe aquí las observaciones...'}
                      value={valorActual ?? ''}
                      onChange={(e) => manejarRespuesta(criterio.id, e.target.value)}
                      aria-label={criterio.titulo}
                    />
                  </div>
                )}

                {/* Alerta de recomendación técnica institucional */}
                {recomendacionActiva && (
                  <div className="alerta-recomendacion" role="alert">
                    <span className="alerta-icono">💡</span>
                    <div className="alerta-texto">
                      <strong>Recomendación institucional:</strong> {recomendacionActiva.text}
                    </div>
                  </div>
                )}

                {/* Campo de notas individuales para preguntas tipo radio */}
                {criterio.tipo === 'radio' && valorActual && (
                  <div className="criterio-observaciones-area">
                    <label htmlFor={`obs-${criterio.id}`}>
                      Observaciones / Evidencia técnica para {criterio.id}:
                    </label>
                    <textarea
                      id={`obs-${criterio.id}`}
                      className="criterio-observaciones-input"
                      rows={2}
                      placeholder="Detalles del hallazgo, marca/modelo, justificación técnica..."
                      defaultValue={resp?.observaciones || ''}
                      onBlur={(e) => manejarObservaciones(criterio.id, e.target.value)}
                    />
                  </div>
                )}

                {/* Evidencia fotográfica asociada al reactivo */}
                <ModuloEvidenciaCriterio
                  idEvaluacion={evaluacion.id}
                  idCriterio={criterio.id}
                  seccion={criterio.seccion}
                  unidad={evaluacion.unidad}
                  tipoCuarto={evaluacion.tipoCuarto}
                  evidencias={evidencias.filter((e) => e.idCriterio === criterio.id)}
                  alAgregarEvidencia={(archivo) =>
                    agregarEvidencia(archivo, criterio.id, criterio.seccion)
                  }
                  alEliminarEvidencia={eliminarEvidencia}
                  alActualizarDescripcion={actualizarDescripcionEvidencia}
                />
              </article>
            );
          })}
        </div>

        {/* Barra inferior de navegación entre secciones y finalizar */}
        <div className="barra-navegacion-inferior">
          <button
            type="button"
            className="boton-secundario"
            disabled={indiceSeccionActual === 0}
            onClick={() => cambiarSeccion(SECCIONES_SUPERVISION[indiceSeccionActual - 1].id)}
          >
            ← Sección Anterior
          </button>

          {indiceSeccionActual < SECCIONES_SUPERVISION.length - 1 ? (
            <button
              type="button"
              className="boton-primario"
              style={{ width: 'auto' }}
              onClick={() => cambiarSeccion(SECCIONES_SUPERVISION[indiceSeccionActual + 1].id)}
            >
              Siguiente Sección →
            </button>
          ) : (
            <button
              type="button"
              className="boton-primario"
              style={{ width: 'auto', backgroundColor: 'var(--color-exito)' }}
              onClick={() => setMostrarModalFinalizar(true)}
            >
              Revisar y Concluir Supervisión ✔
            </button>
          )}
        </div>
      </section>

      {/* Modal de confirmación y resumen final */}
      {mostrarModalFinalizar && (
        <div className="modal-fondo" role="dialog" aria-modal="true">
          <div className="modal-contenido">
            <div className="modal-cabecera">
              <h2 className="modal-titulo">
                <span>📊</span> Resumen de Supervisión
              </h2>
              <p className="modal-subtitulo">
                Verifique los resultados antes de finalizar. El estado cambiará a <strong>COMPLETADA</strong>.
              </p>
            </div>

            <div className="tarjeta-resumen-metricas">
              <div className="metrica-resumen-item">
                <span className="metrica-resumen-valor" style={{ color: 'var(--color-exito)' }}>
                  {evaluacion.calificacionCumplimiento}%
                </span>
                <span className="metrica-resumen-etiqueta">Cumplimiento</span>
              </div>
              <div className="metrica-resumen-item">
                <span className="metrica-resumen-valor">{evaluacion.totalCumple}</span>
                <span className="metrica-resumen-etiqueta">Conforme</span>
              </div>
              <div className="metrica-resumen-item">
                <span className="metrica-resumen-valor" style={{ color: 'var(--color-error)' }}>
                  {evaluacion.totalNoCumple}
                </span>
                <span className="metrica-resumen-etiqueta">No Conforme</span>
              </div>
              <div className="metrica-resumen-item">
                <span className="metrica-resumen-valor">{evaluacion.totalNoAplica}</span>
                <span className="metrica-resumen-etiqueta">No Aplica</span>
              </div>
              <div className="metrica-resumen-item">
                <span className="metrica-resumen-valor" style={{ color: 'var(--color-primario)' }}>
                  {evidencias.length}
                </span>
                <span className="metrica-resumen-etiqueta">Fotos</span>
              </div>
            </div>

            {evaluacion.totalRespondidos < evaluacion.totalCriterios && (
              <div
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid var(--color-aviso)',
                  borderRadius: 'var(--radio-md)',
                  padding: 'var(--espacio-md)',
                  color: 'var(--texto-primario)',
                  fontSize: '0.85rem',
                  marginBottom: 'var(--espacio-lg)'
                }}
              >
                ⚠️ <strong>Aviso:</strong> Aún quedan {evaluacion.totalCriterios - evaluacion.totalRespondidos} reactivos sin responder. Puede finalizarla ahora o regresar a completarlos.
              </div>
            )}

            <div className="modal-acciones">
              <button
                type="button"
                className="boton-secundario"
                onClick={() => setMostrarModalFinalizar(false)}
                disabled={finalizando}
              >
                Regresar a la supervisión
              </button>
              <button
                type="button"
                className="boton-primario"
                style={{ width: 'auto' }}
                onClick={manejarFinalizar}
                disabled={finalizando}
              >
                {finalizando ? 'Finalizando...' : 'Confirmar y Finalizar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visor general de galería fotográfica */}
      {mostrarGaleriaCompleta && (
        <ModalGaleriaCompleta
          evidencias={evidencias}
          alCerrar={() => setMostrarGaleriaCompleta(false)}
          alEliminar={eliminarEvidencia}
          alActualizarDescripcion={actualizarDescripcionEvidencia}
        />
      )}

      {/* Modal de Reportes y Exportación */}
      {mostrarModalExportar && evaluacion && (
        <ModalExportacion
          evaluacion={evaluacion}
          evidencias={evidencias}
          alCerrar={() => setMostrarModalExportar(false)}
        />
      )}
    </main>
  );
};
