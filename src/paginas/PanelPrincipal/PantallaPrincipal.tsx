import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAutenticacion } from '../../contextos/ContextoAutenticacion';
import { RepositorioEvaluaciones } from '../../db/repositorios/repositorioEvaluaciones';
import { RepositorioEvidencias } from '../../db/repositorios/repositorioEvidencias';
import { Evaluacion, TipoCuartoTelecom } from '../../modelos/evaluacion';
import { EvidenciaFotografica } from '../../modelos/evidenciaFotografica';
import { MAPA_TIPO_CUARTO } from '../../servicios/catalogoSupervision';
import { LogoInteractivo } from '../../componentes/LogoInteractivo/LogoInteractivo';
import { ModalNuevaEvaluacion } from '../Evaluacion/ModalNuevaEvaluacion';
import { ModalExportacion } from '../../componentes/ModalExportacion/ModalExportacion';
import './PantallaPrincipal.css';

interface PropsPantallaPrincipal {
  alContinuarEvaluacion: (idEvaluacion: string) => void;
}

export const PantallaPrincipal: React.FC<PropsPantallaPrincipal> = ({
  alContinuarEvaluacion
}) => {
  const { bd, usuario } = useAutenticacion();
  const repo = useMemo(() => new RepositorioEvaluaciones(bd), [bd]);

  const [incompletas, setIncompletas] = useState<Evaluacion[]>([]);
  const [completadas, setCompletadas] = useState<Evaluacion[]>([]);
  const [mostrarModalNueva, setMostrarModalNueva] = useState(false);
  const [evaluacionAExportar, setEvaluacionAExportar] = useState<{
    evaluacion: Evaluacion;
    evidencias: EvidenciaFotografica[];
  } | null>(null);

  const cargarEvaluaciones = useCallback(async () => {
    if (!usuario?.matricula) return;
    try {
      const todas = await repo.obtenerTodasPorUsuario(usuario.matricula);
      setIncompletas(todas.filter((e) => e.estado === 'EN_PROCESO'));
      setCompletadas(todas.filter((e) => e.estado === 'COMPLETADA'));
    } catch (error) {
      console.error('Error al cargar evaluaciones:', error);
    }
  }, [repo, usuario?.matricula]);

  useEffect(() => {
    cargarEvaluaciones();
  }, [cargarEvaluaciones]);

  const alIniciarNueva = async (datos: {
    ooad: string;
    unidad: string;
    tipoCuarto: TipoCuartoTelecom;
    ubicacionDetallada: string;
  }) => {
    if (!usuario) return;
    const nueva = await repo.crearEvaluacion({
      idUsuario: usuario.id,
      matriculaEvaluador: usuario.matricula,
      nombreEvaluador: usuario.nombreCompleto,
      ooad: datos.ooad,
      unidad: datos.unidad,
      tipoCuarto: datos.tipoCuarto,
      ubicacionDetallada: datos.ubicacionDetallada
    });
    setMostrarModalNueva(false);
    alContinuarEvaluacion(nueva.id);
  };

  const alDescartar = async (id: string) => {
    if (window.confirm('¿Está seguro de descartar esta evaluación incompleta?')) {
      await repo.eliminarEvaluacion(id);
      await cargarEvaluaciones();
    }
  };

  const alEliminarEvaluacion = async (id: string, unidad?: string) => {
    const textoConfirmar = unidad
      ? `¿Está seguro de eliminar la evaluación de ${unidad} (${id})?\n\nEsta acción eliminará sus respuestas y todas las fotografías registradas en este dispositivo.`
      : `¿Está seguro de eliminar la evaluación ${id}?`;
    if (window.confirm(textoConfirmar)) {
      await repo.eliminarEvaluacion(id);
      await cargarEvaluaciones();
    }
  };

  const abrirExportacion = async (e: React.MouseEvent, ev: Evaluacion) => {
    e.stopPropagation();
    try {
      const repoEvidencias = new RepositorioEvidencias(bd);
      const evs = await repoEvidencias.obtenerPorEvaluacion(ev.id);
      setEvaluacionAExportar({ evaluacion: ev, evidencias: evs });
    } catch (error) {
      console.error('Error al cargar evidencias para exportar:', error);
    }
  };

  return (
    <main className="pantalla-principal-contenedor" aria-label="Panel Principal de Supervisión">
      {/* Flujo: Continuar evaluación incompleta */}
      {incompletas.length > 0 && (
        <section className="seccion-evaluaciones-pendientes" aria-label="Evaluaciones en proceso">
          <h2 className="titulo-seccion-pendientes">
            <span>⏳</span> Evaluaciones en Proceso (Incompletas)
          </h2>
          <div className="lista-evaluaciones-pendientes">
            {incompletas.map((ev) => (
              <article key={ev.id} className="tarjeta-evaluacion-pendiente">
                <div className="cabecera-tarjeta-pendiente">
                  <div>
                    <h3 className="unidad-tarjeta-pendiente">{ev.unidad}</h3>
                    <span className="tipo-cuarto-pendiente">{MAPA_TIPO_CUARTO[ev.tipoCuarto]}</span>
                  </div>
                  <span className="id-pendiente-tag">{ev.id}</span>
                </div>

                <div className="contenedor-progreso-global">
                  <div className="progreso-textos">
                    <span>Avance: {ev.totalRespondidos}/{ev.totalCriterios} ({ev.porcentajeAvance}%)</span>
                    <span>Cumplimiento: {ev.calificacionCumplimiento}%</span>
                  </div>
                  <div className="barra-progreso-fondo">
                    <div className="barra-progreso-relleno" style={{ width: `${ev.porcentajeAvance}%` }} />
                  </div>
                </div>

                <div className="acciones-tarjeta-pendiente">
                  <button
                    type="button"
                    className="boton-primario"
                    style={{ height: '38px', fontSize: '0.875rem' }}
                    onClick={() => alContinuarEvaluacion(ev.id)}
                  >
                    Continuar Evaluación →
                  </button>
                  <button
                    type="button"
                    className="boton-secundario"
                    style={{ height: '38px', fontSize: '0.875rem' }}
                    onClick={() => alDescartar(ev.id)}
                    aria-label={`Descartar evaluación ${ev.id}`}
                  >
                    Descartar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Acción central: Iniciar supervisión */}
      <div className="area-accion-central">
        <LogoInteractivo
          alPresionar={() => setMostrarModalNueva(true)}
          subtitulo="Nueva Supervisión"
        />
      </div>

      {/* Historial de Evaluaciones Concluidas */}
      {completadas.length > 0 && (
        <section className="seccion-historial-completadas" aria-label="Historial de evaluaciones concluidas">
          <h2 className="titulo-seccion-historial">
            <span>✅</span> Historial de Evaluaciones Concluidas
          </h2>
          {/* Vista móvil de tarjetas táctiles de fácil acceso */}
          <div className="vista-movil-historial" role="list">
            {completadas.map((ev) => {
              let badgeClase = 'badge-cumplimiento-medio';
              if (ev.calificacionCumplimiento >= 80) badgeClase = 'badge-cumplimiento-alto';
              else if (ev.calificacionCumplimiento < 60) badgeClase = 'badge-cumplimiento-bajo';

              const fecha = ev.finalizadoEn
                ? new Date(ev.finalizadoEn).toLocaleDateString()
                : new Date(ev.actualizadoEn).toLocaleDateString();

              return (
                <article
                  key={`movil-${ev.id}`}
                  className="tarjeta-historial-movil"
                  onClick={() => alContinuarEvaluacion(ev.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      alContinuarEvaluacion(ev.id);
                    }
                  }}
                  aria-label={`Ver evaluación concluida de ${ev.unidad}`}
                >
                  <div className="cabecera-tarjeta-historial-movil">
                    <div className="info-unidad-historial-movil">
                      <h3 className="unidad-historial-movil">{ev.unidad}</h3>
                      <span className="cuarto-historial-movil">
                        {MAPA_TIPO_CUARTO[ev.tipoCuarto] || ev.tipoCuarto}
                      </span>
                    </div>
                    <span className={`badge-cumplimiento-historial ${badgeClase}`}>
                      {ev.calificacionCumplimiento}%
                    </span>
                  </div>

                  <div className="metadatos-historial-movil">
                    <span className="id-historial-movil-tag">{ev.id}</span>
                    <span className="fecha-historial-movil">📅 {fecha}</span>
                  </div>

                  <div className="accion-historial-movil" style={{ display: 'flex', gap: 'var(--espacio-xs)' }}>
                    <button
                      type="button"
                      className="boton-secundario"
                      style={{ height: '36px', fontSize: '0.8rem', padding: '0 12px' }}
                      onClick={(e) => abrirExportacion(e, ev)}
                      aria-label={`Exportar reportes de ${ev.unidad}`}
                    >
                      📥 Exportar
                    </button>
                    <button
                      type="button"
                      style={{
                        height: '36px',
                        fontSize: '0.8rem',
                        padding: '0 10px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radio-sm)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        alEliminarEvaluacion(ev.id, ev.unidad);
                      }}
                      aria-label={`Eliminar evaluación de ${ev.unidad}`}
                    >
                      🗑️ Borrar
                    </button>
                    <button
                      type="button"
                      className="boton-entrar-evaluacion-movil"
                      onClick={(e) => {
                        e.stopPropagation();
                        alContinuarEvaluacion(ev.id);
                      }}
                    >
                      Ver Detalle →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Vista escritorio con tabla tradicional y filas clickeables */}
          <div className="tabla-historial-contenedor vista-escritorio-historial">
            <table className="tabla-historial">
              <thead>
                <tr>
                  <th>IDEVALUACION</th>
                  <th>Unidad</th>
                  <th>Tipo de Cuarto</th>
                  <th>Cumplimiento</th>
                  <th>Fecha de Cierre</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {completadas.map((ev) => {
                  let badgeClase = 'badge-cumplimiento-medio';
                  if (ev.calificacionCumplimiento >= 80) badgeClase = 'badge-cumplimiento-alto';
                  else if (ev.calificacionCumplimiento < 60) badgeClase = 'badge-cumplimiento-bajo';

                  return (
                    <tr
                      key={ev.id}
                      className="fila-historial-interactiva"
                      onClick={() => alContinuarEvaluacion(ev.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          alContinuarEvaluacion(ev.id);
                        }
                      }}
                      title="Clic para ver o continuar la evaluación"
                    >
                      <td style={{ fontFamily: 'var(--fuente-mono)', fontSize: '0.8rem' }}>{ev.id}</td>
                      <td>{ev.unidad}</td>
                      <td>{MAPA_TIPO_CUARTO[ev.tipoCuarto] || ev.tipoCuarto}</td>
                      <td>
                        <span className={`badge-cumplimiento-historial ${badgeClase}`}>
                          {ev.calificacionCumplimiento}%
                        </span>
                      </td>
                      <td>
                        {ev.finalizadoEn
                          ? new Date(ev.finalizadoEn).toLocaleDateString()
                          : new Date(ev.actualizadoEn).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="boton-secundario"
                            style={{ height: '32px', fontSize: '0.8rem', padding: '0 8px' }}
                            onClick={(e) => abrirExportacion(e, ev)}
                            title="Exportar Reporte PDF, Excel y Respaldo ZIP"
                          >
                            📥 Exportar
                          </button>
                          <button
                            type="button"
                            className="boton-secundario"
                            style={{ height: '32px', fontSize: '0.8rem', padding: '0 8px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              alContinuarEvaluacion(ev.id);
                            }}
                          >
                            Ver Detalle
                          </button>
                          <button
                            type="button"
                            style={{
                              height: '32px',
                              fontSize: '0.8rem',
                              padding: '0 8px',
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: 'var(--radio-sm)',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              alEliminarEvaluacion(ev.id, ev.unidad);
                            }}
                            title="Eliminar evaluación concluida"
                          >
                            🗑️ Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal para iniciar nueva evaluación */}
      {mostrarModalNueva && (
        <ModalNuevaEvaluacion
          alCerrar={() => setMostrarModalNueva(false)}
          alIniciar={alIniciarNueva}
        />
      )}

      {/* Modal de exportación y reportes ejecutivos */}
      {evaluacionAExportar && (
        <ModalExportacion
          evaluacion={evaluacionAExportar.evaluacion}
          evidencias={evaluacionAExportar.evidencias}
          alCerrar={() => setEvaluacionAExportar(null)}
        />
      )}
    </main>
  );
};
