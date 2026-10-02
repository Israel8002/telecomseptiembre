import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAutenticacion } from '../../contextos/ContextoAutenticacion';
import { RepositorioEvaluaciones } from '../../db/repositorios/repositorioEvaluaciones';
import { RepositorioEvidencias } from '../../db/repositorios/repositorioEvidencias';
import { Evaluacion, TipoCuartoTelecom } from '../../modelos/evaluacion';
import { EvidenciaFotografica } from '../../modelos/evidenciaFotografica';
import { ElementoColaSincronizacion } from '../../modelos/sincronizacion';
import {
  servicioGoogleSheets,
  RegistroLogSincronizacion
} from '../../servicios/google/servicioGoogleSheets';
import { procesadorSincronizacion } from '../../servicios/google/procesadorSincronizacion';
import { GOOGLE_CONFIG } from '../../config/googleConfig';
import { units, MAPA_TIPO_CUARTO } from '../../servicios/catalogoSupervision';
import { ModalExportacion } from '../../componentes/ModalExportacion/ModalExportacion';
import './PantallaAdministracion.css';

interface PropsPantallaAdministracion {
  alVolver: () => void;
  alVerEvaluacion?: (id: string) => void;
}

// Interfaz unificada de evaluación para la vista de administración
export interface ItemEvaluacionAdmin {
  id: string;
  matriculaEvaluador: string;
  nombreEvaluador: string;
  ooad: string;
  unidad: string;
  tipoCuarto: TipoCuartoTelecom;
  ubicacionDetallada: string;
  estado: 'EN_PROCESO' | 'COMPLETADA';
  calificacionCumplimiento: number;
  totalCriterios: number;
  totalRespondidos: number;
  totalCumple: number;
  totalNoCumple: number;
  creadoEn: string;
  finalizadoEn: string | null;
  urlReporteDrive?: string;
  origen: 'local' | 'remoto' | 'ambos';
  esLocal: boolean;
}

export const PantallaAdministracion: React.FC<PropsPantallaAdministracion> = ({
  alVolver,
  alVerEvaluacion
}) => {
  const { bd, estaEnLinea } = useAutenticacion();
  const repoEvaluaciones = useMemo(() => new RepositorioEvaluaciones(bd), [bd]);
  const repoEvidencias = useMemo(() => new RepositorioEvidencias(bd), [bd]);

  // Pestaña activa
  const [tabActiva, setTabActiva] = useState<'supervision' | 'auditoria'>('supervision');

  // Estados de datos
  const [cargando, setCargando] = useState(true);
  const [cargandoRemoto, setCargandoRemoto] = useState(false);
  const [evaluaciones, setEvaluaciones] = useState<ItemEvaluacionAdmin[]>([]);
  const [logsSincronizacion, setLogsSincronizacion] = useState<RegistroLogSincronizacion[]>([]);
  const [elementosCola, setElementosCola] = useState<ElementoColaSincronizacion[]>([]);
  const [sincronizandoManual, setSincronizandoManual] = useState(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);

  // Modal de exportación
  const [evaluacionAExportar, setEvaluacionAExportar] = useState<{
    evaluacion: Evaluacion;
    evidencias: EvidenciaFotografica[];
  } | null>(null);

  // Modal de confirmación para eliminar evaluación
  const [evaluacionAEliminar, setEvaluacionAEliminar] = useState<ItemEvaluacionAdmin | null>(null);
  const [eliminandoEvaluacion, setEliminandoEvaluacion] = useState(false);

  // Filtros de búsqueda
  const [filtroUnidad, setFiltroUnidad] = useState('');
  const [filtroTipoCuarto, setFiltroTipoCuarto] = useState('');
  const [filtroEvaluador, setFiltroEvaluador] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCumplimiento, setFiltroCumplimiento] = useState(''); // 'cumple' | 'riesgo' | 'no_cumple'
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [busquedaTexto, setBusquedaTexto] = useState('');

  const mostrarAviso = (msg: string) => {
    setNotificacion(msg);
    setTimeout(() => setNotificacion(null), 4000);
  };

  const ejecutarEliminarEvaluacion = async () => {
    if (!evaluacionAEliminar) return;
    try {
      setEliminandoEvaluacion(true);
      await repoEvaluaciones.eliminarEvaluacion(evaluacionAEliminar.id);
      setEvaluaciones((prev) => prev.filter((e) => e.id !== evaluacionAEliminar.id));
      mostrarAviso(`Evaluación ${evaluacionAEliminar.id} eliminada con éxito.`);
      setEvaluacionAEliminar(null);
    } catch (error) {
      console.error('Error al eliminar evaluación:', error);
      mostrarAviso('Ocurrió un error al intentar eliminar la evaluación.');
    } finally {
      setEliminandoEvaluacion(false);
    }
  };

  const descartarElementoCola = async (idCola: string) => {
    if (window.confirm('¿Está seguro de descartar este elemento de la cola de sincronización?')) {
      await bd.colaSincronizacion.delete(idCola);
      setElementosCola((prev) => prev.filter((i) => i.id !== idCola));
      mostrarAviso('Elemento descartado de la cola de sincronización.');
    }
  };

  const descartarFallidosCola = async () => {
    const fallidos = elementosCola.filter((i) => i.estado === 'FALLIDO');
    if (fallidos.length === 0) {
      mostrarAviso('No hay elementos con error en la cola.');
      return;
    }
    if (window.confirm(`¿Desea descartar ${fallidos.length} elemento(s) con error de la cola?`)) {
      await bd.colaSincronizacion.where('estado').equals('FALLIDO').delete();
      const actualizados = await bd.colaSincronizacion.toArray();
      setElementosCola(actualizados);
      mostrarAviso(`${fallidos.length} elemento(s) con error eliminados.`);
    }
  };

  // Carga unificada de datos locales y remotos de Google Sheets
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      // 1. Cargar datos locales de IndexedDB
      const locales = await repoEvaluaciones.obtenerTodas();
      const cola = await bd.colaSincronizacion.toArray();
      setElementosCola(cola);

      const mapaUnificado = new Map<string, ItemEvaluacionAdmin>();

      locales.forEach((loc) => {
        mapaUnificado.set(loc.id, {
          id: loc.id,
          matriculaEvaluador: loc.matriculaEvaluador,
          nombreEvaluador: loc.nombreEvaluador,
          ooad: loc.ooad,
          unidad: loc.unidad,
          tipoCuarto: loc.tipoCuarto,
          ubicacionDetallada: loc.ubicacionDetallada || '',
          estado: loc.estado,
          calificacionCumplimiento: loc.calificacionCumplimiento,
          totalCriterios: loc.totalCriterios,
          totalRespondidos: loc.totalRespondidos,
          totalCumple: loc.totalCumple,
          totalNoCumple: loc.totalNoCumple,
          creadoEn: loc.creadoEn,
          finalizadoEn: loc.finalizadoEn || null,
          origen: 'local',
          esLocal: true
        });
      });

      setEvaluaciones(Array.from(mapaUnificado.values()));
      setCargando(false);

      // 2. Si está en línea y configurado Google, cargar evaluaciones remotas y logs
      if (estaEnLinea && GOOGLE_CONFIG.spreadsheetId) {
        setCargandoRemoto(true);
        try {
          const [remotas, logs] = await Promise.all([
            servicioGoogleSheets.obtenerEvaluacionesRemotas(),
            servicioGoogleSheets.obtenerLogsRemotos(150)
          ]);

          setLogsSincronizacion(logs);

          remotas.forEach((rem) => {
            const existente = mapaUnificado.get(rem.id);
            if (existente) {
              mapaUnificado.set(rem.id, {
                ...existente,
                urlReporteDrive: rem.urlReporteDrive || existente.urlReporteDrive,
                origen: 'ambos'
              });
            } else {
              mapaUnificado.set(rem.id, {
                ...rem,
                finalizadoEn: rem.finalizadoEn || null,
                origen: 'remoto',
                esLocal: false
              });
            }
          });

          // Ordenar por fecha más reciente
          const listaFinal = Array.from(mapaUnificado.values()).sort(
            (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
          );

          setEvaluaciones(listaFinal);
        } catch (errRemoto) {
          console.warn('Error al consultar datos remotos de Google Sheets:', errRemoto);
        } finally {
          setCargandoRemoto(false);
        }
      }
    } catch (error) {
      console.error('Error al cargar panel de administración:', error);
      mostrarAviso('Error al consultar información de evaluaciones.');
      setCargando(false);
    }
  }, [bd, repoEvaluaciones, estaEnLinea]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Lista única de evaluadores para selector de filtro
  const listaEvaluadores = useMemo(() => {
    const evaluadoresMap = new Map<string, string>();
    evaluaciones.forEach((e) => {
      if (e.matriculaEvaluador) {
        evaluadoresMap.set(e.matriculaEvaluador, e.nombreEvaluador || e.matriculaEvaluador);
      }
    });
    return Array.from(evaluadoresMap.entries()).map(([matricula, nombre]) => ({
      matricula,
      nombre
    }));
  }, [evaluaciones]);

  // Métricas ejecutivas consolidadas
  const metricas = useMemo(() => {
    const total = evaluaciones.length;
    const completadas = evaluaciones.filter((e) => e.estado === 'COMPLETADA');
    const enProceso = evaluaciones.filter((e) => e.estado === 'EN_PROCESO');

    let sumaCumplimiento = 0;
    let cumple = 0;
    let enRiesgo = 0;
    let noCumple = 0;

    completadas.forEach((e) => {
      sumaCumplimiento += e.calificacionCumplimiento;
      if (e.calificacionCumplimiento >= 80) cumple++;
      else if (e.calificacionCumplimiento >= 60) enRiesgo++;
      else noCumple++;
    });

    const promedioCumplimiento = completadas.length > 0
      ? Math.round(sumaCumplimiento / completadas.length)
      : 0;

    // Cobertura de Unidades del Catálogo Oficial
    const unidadesEvaluadasUnicas = new Set(evaluaciones.map((e) => e.unidad.trim().toUpperCase()));
    const totalUnidadesOficiales = units.length;
    const porcentajeCobertura = totalUnidadesOficiales > 0
      ? Math.round((unidadesEvaluadasUnicas.size / totalUnidadesOficiales) * 100)
      : 0;

    return {
      total,
      totalCompletadas: completadas.length,
      totalEnProceso: enProceso.length,
      promedioCumplimiento,
      cumple,
      enRiesgo,
      noCumple,
      unidadesSupervisadas: unidadesEvaluadasUnicas.size,
      totalUnidadesOficiales,
      porcentajeCobertura
    };
  }, [evaluaciones]);

  // Filtrado reactivo de evaluaciones
  const evaluacionesFiltradas = useMemo(() => {
    return evaluaciones.filter((ev) => {
      if (filtroUnidad && ev.unidad !== filtroUnidad) return false;
      if (filtroTipoCuarto && ev.tipoCuarto !== filtroTipoCuarto) return false;
      if (filtroEvaluador && ev.matriculaEvaluador !== filtroEvaluador) return false;
      if (filtroEstado && ev.estado !== filtroEstado) return false;

      if (filtroCumplimiento) {
        if (ev.estado !== 'COMPLETADA') return false;
        if (filtroCumplimiento === 'cumple' && ev.calificacionCumplimiento < 80) return false;
        if (filtroCumplimiento === 'riesgo' && (ev.calificacionCumplimiento < 60 || ev.calificacionCumplimiento >= 80)) return false;
        if (filtroCumplimiento === 'no_cumple' && ev.calificacionCumplimiento >= 60) return false;
      }

      if (filtroFechaDesde) {
        const fechaEv = new Date(ev.creadoEn).getTime();
        const desde = new Date(filtroFechaDesde).getTime();
        if (fechaEv < desde) return false;
      }

      if (filtroFechaHasta) {
        const fechaEv = new Date(ev.creadoEn).getTime();
        const hasta = new Date(filtroFechaHasta + 'T23:59:59').getTime();
        if (fechaEv > hasta) return false;
      }

      if (busquedaTexto.trim()) {
        const q = busquedaTexto.toLowerCase();
        const coincideId = ev.id.toLowerCase().includes(q);
        const coincideUnidad = ev.unidad.toLowerCase().includes(q);
        const coincideNombre = ev.nombreEvaluador.toLowerCase().includes(q);
        const coincideMatricula = ev.matriculaEvaluador.toLowerCase().includes(q);
        const coincideUbicacion = (ev.ubicacionDetallada || '').toLowerCase().includes(q);

        if (!coincideId && !coincideUnidad && !coincideNombre && !coincideMatricula && !coincideUbicacion) {
          return false;
        }
      }

      return true;
    });
  }, [
    evaluaciones,
    filtroUnidad,
    filtroTipoCuarto,
    filtroEvaluador,
    filtroEstado,
    filtroCumplimiento,
    filtroFechaDesde,
    filtroFechaHasta,
    busquedaTexto
  ]);

  // Manejador de sincronización manual
  const forzarSincronizacion = async () => {
    if (!estaEnLinea) {
      alert('Se requiere conexión a Internet para sincronizar con Google Cloud.');
      return;
    }
    setSincronizandoManual(true);
    try {
      await procesadorSincronizacion.procesarCola();
      mostrarAviso('Sincronización manual ejecutada exitosamente.');
      await cargarDatos();
    } catch (err) {
      console.error('Error al forzar sincronización:', err);
      mostrarAviso('Error durante la sincronización.');
    } finally {
      setSincronizandoManual(false);
    }
  };

  // Manejador de exportación desde la tabla
  const abrirModalExportacion = async (item: ItemEvaluacionAdmin) => {
    try {
      // Intentar cargar evaluación completa local
      let evaluacionCompleta = await repoEvaluaciones.obtenerPorId(item.id);
      let evidencias: EvidenciaFotografica[] = [];

      if (!evaluacionCompleta) {
        // Si no está en IndexedDB local, construir objeto de solo lectura
        evaluacionCompleta = {
          id: item.id,
          idUsuario: 'remoto',
          matriculaEvaluador: item.matriculaEvaluador,
          nombreEvaluador: item.nombreEvaluador,
          ooad: item.ooad,
          unidad: item.unidad,
          tipoCuarto: item.tipoCuarto,
          ubicacionDetallada: item.ubicacionDetallada,
          estado: item.estado,
          respuestas: {},
          porcentajeAvance: 100,
          calificacionCumplimiento: item.calificacionCumplimiento,
          totalCriterios: item.totalCriterios,
          totalRespondidos: item.totalRespondidos,
          totalCumple: item.totalCumple,
          totalNoCumple: item.totalNoCumple,
          totalNoAplica: 0,
          creadoEn: item.creadoEn,
          actualizadoEn: item.finalizadoEn || item.creadoEn,
          finalizadoEn: item.finalizadoEn,
          sincronizado: true,
          version: 1
        };
      } else {
        evidencias = await repoEvidencias.obtenerPorEvaluacion(item.id);
      }

      setEvaluacionAExportar({ evaluacion: evaluacionCompleta, evidencias });
    } catch (err) {
      console.error('Error al preparar exportación:', err);
      alert('No se pudo preparar la exportación para esta evaluación.');
    }
  };

  // Exportar resumen CSV de la tabla filtrada
  const exportarAuditoriaCsv = () => {
    if (evaluacionesFiltradas.length === 0) {
      alert('No hay evaluaciones para exportar con los filtros seleccionados.');
      return;
    }

    const encabezados = [
      'Folio',
      'Fecha Creacion',
      'Fecha Finalizacion',
      'Unidad',
      'Tipo Cuarto',
      'Ubicacion Detallada',
      'Evaluador',
      'Matricula',
      'Estado',
      'Cumplimiento %',
      'Criterios Respondidos',
      'Criterios Cumple',
      'Criterios No Cumple',
      'Origen',
      'Enlace Drive'
    ];

    const filasCsv = evaluacionesFiltradas.map((e) => [
      `"${e.id}"`,
      `"${e.creadoEn}"`,
      `"${e.finalizadoEn || ''}"`,
      `"${e.unidad.replace(/"/g, '""')}"`,
      `"${e.tipoCuarto}"`,
      `"${(e.ubicacionDetallada || '').replace(/"/g, '""')}"`,
      `"${e.nombreEvaluador.replace(/"/g, '""')}"`,
      `"${e.matriculaEvaluador}"`,
      `"${e.estado}"`,
      `"${e.calificacionCumplimiento}%"`,
      `"${e.totalRespondidos}"`,
      `"${e.totalCumple}"`,
      `"${e.totalNoCumple}"`,
      `"${e.origen}"`,
      `"${e.urlReporteDrive || ''}"`
    ]);

    const contenidoCsv = '\uFEFF' + [encabezados.join(','), ...filasCsv.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `auditoria_supervision_telecom_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    mostrarAviso('Reporte de auditoría CSV descargado con éxito.');
  };

  const limpiarFiltros = () => {
    setFiltroUnidad('');
    setFiltroTipoCuarto('');
    setFiltroEvaluador('');
    setFiltroEstado('');
    setFiltroCumplimiento('');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setBusquedaTexto('');
  };

  return (
    <div className="pantalla-administracion" role="main" aria-label="Módulo de Administración y Auditoría">
      {/* Barra superior del módulo de administración */}
      <header className="cabecera-admin">
        <div className="cabecera-admin-titulos">
          <div className="etiqueta-modulo">
            <span className="icono-escudo">🛡️</span>
            <span>MÓDULO DE CONTROL CENTRAL Y AUDITORÍA MULTI-UNIDAD</span>
          </div>
          <h1 className="titulo-admin">Supervisión Estatal de Telecomunicaciones</h1>
          <p className="subtitulo-admin">
            Órgano de Operación Administrativa Desconcentrada Baja California — IMSS
          </p>
        </div>

        <div className="acciones-cabecera-admin">
          <button
            type="button"
            className="boton-recargar-admin"
            onClick={cargarDatos}
            disabled={cargando || cargandoRemoto}
            title="Recargar datos de la base local y Google Sheets"
          >
            <span className={cargando || cargandoRemoto ? 'animacion-rotar' : ''}>🔄</span>
            <span>{cargandoRemoto ? 'Sincronizando Nube...' : 'Actualizar Datos'}</span>
          </button>

          <button
            type="button"
            className="boton-volver-principal"
            onClick={alVolver}
          >
            ← Volver al Panel
          </button>
        </div>
      </header>

      {/* Alerta de notificación flotante */}
      {notificacion && (
        <div className="notificacion-flotante-admin" role="status" aria-live="polite">
          <span>ℹ️</span> {notificacion}
        </div>
      )}

      {/* Selector de pestañas */}
      <nav className="pestanas-admin" aria-label="Secciones del panel de administración">
        <button
          type="button"
          className={`boton-pestana ${tabActiva === 'supervision' ? 'activa' : ''}`}
          onClick={() => setTabActiva('supervision')}
        >
          <span>📊</span>
          <span>Supervisión Estatal ({evaluaciones.length})</span>
        </button>

        <button
          type="button"
          className={`boton-pestana ${tabActiva === 'auditoria' ? 'activa' : ''}`}
          onClick={() => setTabActiva('auditoria')}
        >
          <span>☁️</span>
          <span>Auditoría de Nube y Respaldos</span>
          {elementosCola.length > 0 && (
            <span className="badge-cola-pendiente">{elementosCola.length}</span>
          )}
        </button>
      </nav>

      {tabActiva === 'supervision' && (
        <div className="contenido-supervision-estatal">
          {/* Tarjetas de Métricas Ejecutivas Estatales */}
          <section className="grid-metricas-admin" aria-label="Métricas estatales clave">
            <div className="tarjeta-metrica-admin">
              <span className="icono-metrica">📁</span>
              <div className="datos-metrica">
                <span className="valor-metrica">{metricas.total}</span>
                <span className="etiqueta-metrica">Total Evaluaciones</span>
              </div>
              <div className="desglose-metrica">
                <span className="texto-verde">✔ {metricas.totalCompletadas} Cerradas</span>
                <span className="texto-amarillo">⏳ {metricas.totalEnProceso} En Curso</span>
              </div>
            </div>

            <div className="tarjeta-metrica-admin">
              <span className="icono-metrica">📈</span>
              <div className="datos-metrica">
                <span
                  className={`valor-metrica ${
                    metricas.promedioCumplimiento >= 80
                      ? 'color-exito'
                      : metricas.promedioCumplimiento >= 60
                      ? 'color-alerta'
                      : 'color-peligro'
                  }`}
                >
                  {metricas.promedioCumplimiento}%
                </span>
                <span className="etiqueta-metrica">Cumplimiento Estatal Promedio</span>
              </div>
              <div className="barra-progreso-estatal">
                <div
                  className="progreso-relleno"
                  style={{ width: `${metricas.promedioCumplimiento}%` }}
                />
              </div>
            </div>

            <div className="tarjeta-metrica-admin">
              <span className="icono-metrica">🏥</span>
              <div className="datos-metrica">
                <span className="valor-metrica">
                  {metricas.unidadesSupervisadas}{' '}
                  <span className="subvalor">/ {metricas.totalUnidadesOficiales}</span>
                </span>
                <span className="etiqueta-metrica">Cobertura de Unidades BC</span>
              </div>
              <div className="desglose-metrica">
                <span className="texto-azul">{metricas.porcentajeCobertura}% del catálogo oficial</span>
              </div>
            </div>

            <div className="tarjeta-metrica-admin">
              <span className="icono-metrica">⚖️</span>
              <div className="datos-metrica">
                <span className="valor-metrica">{metricas.cumple}</span>
                <span className="etiqueta-metrica">Cuartos Normativos (≥80%)</span>
              </div>
              <div className="desglose-metrica">
                <span className="texto-amarillo">⚠️ {metricas.enRiesgo} En riesgo</span>
                <span className="texto-rojo">❌ {metricas.noCumple} Críticos</span>
              </div>
            </div>
          </section>

          {/* Barra de Filtros Avanzados */}
          <section className="seccion-filtros-admin" aria-label="Filtros de búsqueda avanzada">
            <div className="filtros-cabecera">
              <h2 className="filtros-titulo">
                <span>🔍</span> Filtrado Multicriterio de Evaluaciones
              </h2>
              <div className="acciones-filtros">
                <button
                  type="button"
                  className="boton-limpiar-filtros"
                  onClick={limpiarFiltros}
                  title="Restablecer todos los filtros"
                >
                  Limpiar Filtros
                </button>
                <button
                  type="button"
                  className="boton-exportar-csv"
                  onClick={exportarAuditoriaCsv}
                  title="Descargar lista filtrada en formato CSV"
                >
                  📥 Exportar Tabla CSV
                </button>
              </div>
            </div>

            <div className="grid-campos-filtros">
              {/* Búsqueda libre */}
              <div className="campo-filtro campo-busqueda-ancha">
                <label htmlFor="filtro-busqueda">Búsqueda rápida:</label>
                <input
                  id="filtro-busqueda"
                  type="search"
                  placeholder="Buscar por Folio, Unidad, Evaluador o Ubicación..."
                  value={busquedaTexto}
                  onChange={(e) => setBusquedaTexto(e.target.value)}
                  className="input-filtro"
                />
              </div>

              {/* Filtro por Unidad */}
              <div className="campo-filtro">
                <label htmlFor="filtro-unidad">Unidad Médica / Admin:</label>
                <select
                  id="filtro-unidad"
                  value={filtroUnidad}
                  onChange={(e) => setFiltroUnidad(e.target.value)}
                  className="select-filtro"
                >
                  <option value="">Todas las Unidades ({units.length})</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.nombre}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Tipo de Cuarto */}
              <div className="campo-filtro">
                <label htmlFor="filtro-tipo-cuarto">Tipo de Cuarto:</label>
                <select
                  id="filtro-tipo-cuarto"
                  value={filtroTipoCuarto}
                  onChange={(e) => setFiltroTipoCuarto(e.target.value)}
                  className="select-filtro"
                >
                  <option value="">Todos los tipos</option>
                  <option value="MDF">MDF (Principal)</option>
                  <option value="IDF">IDF (Intermedio)</option>
                  <option value="RACK">RACK de Telecom</option>
                  <option value="GABINETE">Gabinete de Pared</option>
                </select>
              </div>

              {/* Filtro por Evaluador */}
              <div className="campo-filtro">
                <label htmlFor="filtro-evaluador">Personal Evaluador:</label>
                <select
                  id="filtro-evaluador"
                  value={filtroEvaluador}
                  onChange={(e) => setFiltroEvaluador(e.target.value)}
                  className="select-filtro"
                >
                  <option value="">Todos los evaluadores</option>
                  {listaEvaluadores.map((ev) => (
                    <option key={ev.matricula} value={ev.matricula}>
                      {ev.nombre} (Mat. {ev.matricula})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Estado */}
              <div className="campo-filtro">
                <label htmlFor="filtro-estado">Estatus:</label>
                <select
                  id="filtro-estado"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="select-filtro"
                >
                  <option value="">Todos los estatus</option>
                  <option value="COMPLETADA">Completadas (Cerradas)</option>
                  <option value="EN_PROCESO">En Proceso (Incompletas)</option>
                </select>
              </div>

              {/* Filtro por Rango de Cumplimiento */}
              <div className="campo-filtro">
                <label htmlFor="filtro-cumplimiento">Nivel Cumplimiento:</label>
                <select
                  id="filtro-cumplimiento"
                  value={filtroCumplimiento}
                  onChange={(e) => setFiltroCumplimiento(e.target.value)}
                  className="select-filtro"
                >
                  <option value="">Todos los niveles</option>
                  <option value="cumple">Cumplimiento Alto (≥ 80%)</option>
                  <option value="riesgo">En Riesgo (60% - 79%)</option>
                  <option value="no_cumple">No Cumple (&lt; 60%)</option>
                </select>
              </div>

              {/* Filtro por Fecha Desde */}
              <div className="campo-filtro">
                <label htmlFor="filtro-desde">Fecha Desde:</label>
                <input
                  id="filtro-desde"
                  type="date"
                  value={filtroFechaDesde}
                  onChange={(e) => setFiltroFechaDesde(e.target.value)}
                  className="input-filtro"
                />
              </div>

              {/* Filtro por Fecha Hasta */}
              <div className="campo-filtro">
                <label htmlFor="filtro-hasta">Fecha Hasta:</label>
                <input
                  id="filtro-hasta"
                  type="date"
                  value={filtroFechaHasta}
                  onChange={(e) => setFiltroFechaHasta(e.target.value)}
                  className="input-filtro"
                />
              </div>
            </div>

            {/* Contador de resultados */}
            <div className="resumen-resultados-filtros">
              Mostrando <strong>{evaluacionesFiltradas.length}</strong> de <strong>{evaluaciones.length}</strong> evaluaciones registradas.
            </div>
          </section>

          {/* Tabla Consolidada de Evaluaciones */}
          <section className="seccion-tabla-admin" aria-label="Tabla de evaluaciones multi-unidad">
            {cargando ? (
              <div className="cargando-admin">
                <span className="spinner-admin">⏳</span>
                <p>Cargando catálogo consolidado de evaluaciones...</p>
              </div>
            ) : evaluacionesFiltradas.length === 0 ? (
              <div className="sin-resultados-admin">
                <span>📭</span>
                <h3>No se encontraron evaluaciones con los filtros actuales</h3>
                <p>Intente ajustar los criterios de búsqueda o limpie los filtros.</p>
                <button type="button" className="boton-limpiar-filtros" onClick={limpiarFiltros}>
                  Limpiar Filtros
                </button>
              </div>
            ) : (
              <>
                {/* Vista Escritorio: Tabla Consolidada densa */}
                <div className="tabla-responsive-contenedor vista-escritorio-admin-tabla">
                  <table className="tabla-evaluaciones-admin">
                    <thead>
                      <tr>
                        <th>Folio / ID</th>
                        <th>Fecha</th>
                        <th>Unidad Médica / Hospital</th>
                        <th>Cuarto</th>
                        <th>Evaluador</th>
                        <th>Cumplimiento</th>
                        <th>Estatus</th>
                        <th>Sincronización</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluacionesFiltradas.map((ev) => {
                        const fechaCorta = new Date(ev.creadoEn).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        });

                        const nombreCuarto = MAPA_TIPO_CUARTO[ev.tipoCuarto] || ev.tipoCuarto;

                        return (
                          <tr key={ev.id} className="fila-evaluacion-admin">
                            <td className="celda-id">
                              <span className="id-texto" title={ev.id}>
                                {ev.id}
                              </span>
                            </td>
                            <td className="celda-fecha">{fechaCorta}</td>
                            <td className="celda-unidad">
                              <strong>{ev.unidad}</strong>
                              {ev.ubicacionDetallada && (
                                <span className="ubicacion-subtexto">{ev.ubicacionDetallada}</span>
                              )}
                            </td>
                            <td className="celda-cuarto">
                              <span className="badge-tipo-cuarto">{nombreCuarto}</span>
                            </td>
                            <td className="celda-evaluador">
                              <span className="nombre-evaluador-tabla">{ev.nombreEvaluador}</span>
                              <span className="matricula-evaluador-tabla">Mat. {ev.matriculaEvaluador}</span>
                            </td>
                            <td className="celda-cumplimiento">
                              {ev.estado === 'COMPLETADA' ? (
                                <div className="cumplimiento-indicador">
                                  <span
                                    className={`porcentaje-texto ${
                                      ev.calificacionCumplimiento >= 80
                                        ? 'cumple'
                                        : ev.calificacionCumplimiento >= 60
                                        ? 'riesgo'
                                        : 'peligro'
                                    }`}
                                  >
                                    {ev.calificacionCumplimiento}%
                                  </span>
                                  <div className="mini-barra">
                                    <div
                                      className={`mini-barra-relleno ${
                                        ev.calificacionCumplimiento >= 80
                                          ? 'cumple'
                                          : ev.calificacionCumplimiento >= 60
                                          ? 'riesgo'
                                          : 'peligro'
                                      }`}
                                      style={{ width: `${ev.calificacionCumplimiento}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="texto-en-proceso">En captura</span>
                              )}
                            </td>
                            <td className="celda-estado">
                              <span
                                className={`badge-estado ${
                                  ev.estado === 'COMPLETADA' ? 'cerrada' : 'proceso'
                                }`}
                              >
                                {ev.estado === 'COMPLETADA' ? 'CERRADA' : 'EN CURSO'}
                              </span>
                            </td>
                            <td className="celda-sincronizacion">
                              {ev.origen === 'ambos' ? (
                                <span className="badge-sync-admin synced" title="Respaldado en Nube y Local">
                                  ☁️ Nube & Local
                                </span>
                              ) : ev.origen === 'remoto' ? (
                                <span className="badge-sync-admin cloud" title="Registrado en Google Sheets">
                                  ☁️ En Sheets
                                </span>
                              ) : (
                                <span className="badge-sync-admin local" title="Guardado solo en este dispositivo">
                                  💻 Local
                                </span>
                              )}
                            </td>
                            <td className="celda-acciones">
                              <div className="grupo-botones-accion">
                                {ev.urlReporteDrive && (
                                  <a
                                    href={ev.urlReporteDrive}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="boton-accion-admin drive"
                                    title="Ver expediente en Google Drive"
                                  >
                                    📁 Drive
                                  </a>
                                )}

                                <button
                                  type="button"
                                  className="boton-accion-admin exportar"
                                  onClick={() => abrirModalExportacion(ev)}
                                  title="Exportar Reporte Oficial (PDF, Excel, ZIP)"
                                >
                                  📥 Exportar
                                </button>

                                {ev.esLocal && alVerEvaluacion && (
                                  <button
                                    type="button"
                                    className="boton-accion-admin abrir"
                                    onClick={() => alVerEvaluacion(ev.id)}
                                    title="Abrir formulario de captura"
                                  >
                                    👁️ Ver
                                  </button>
                                )}

                                <button
                                  type="button"
                                  className="boton-accion-admin eliminar"
                                  onClick={() => setEvaluacionAEliminar(ev)}
                                  title="Eliminar evaluación y evidencias asociadas"
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

                {/* Vista Celular / Móvil: Tarjetas Nativas con botones 100% visibles */}
                <div className="vista-movil-admin-tarjetas">
                  {evaluacionesFiltradas.map((ev) => {
                    const fechaCorta = new Date(ev.creadoEn).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    });

                    const nombreCuarto = MAPA_TIPO_CUARTO[ev.tipoCuarto] || ev.tipoCuarto;

                    return (
                      <article key={`movil-${ev.id}`} className="tarjeta-evaluacion-movil-admin">
                        <div className="cabecera-tarjeta-movil-admin">
                          <div className="folio-y-sync-movil">
                            <span className="id-texto-movil">{ev.id}</span>
                            {ev.origen === 'ambos' ? (
                              <span className="badge-sync-admin synced">☁️ Nube & Local</span>
                            ) : ev.origen === 'remoto' ? (
                              <span className="badge-sync-admin cloud">☁️ Sheets</span>
                            ) : (
                              <span className="badge-sync-admin local">💻 Local</span>
                            )}
                          </div>
                          <span className="fecha-movil-admin">{fechaCorta}</span>
                        </div>

                        <div className="cuerpo-tarjeta-movil-admin">
                          <h3 className="unidad-movil-admin">{ev.unidad}</h3>
                          {ev.ubicacionDetallada && (
                            <p className="ubicacion-movil-admin">📍 {ev.ubicacionDetallada}</p>
                          )}
                          <div className="metadatos-fila-movil">
                            <span className="badge-tipo-cuarto">{nombreCuarto}</span>
                            <span className="evaluador-movil-tag">👤 {ev.nombreEvaluador}</span>
                          </div>
                        </div>

                        <div className="estado-y-cumplimiento-movil">
                          <div className="cumplimiento-bloque-movil">
                            <span className="label-cumplimiento-movil">Cumplimiento:</span>
                            <span
                              className={`porcentaje-texto-movil ${
                                ev.calificacionCumplimiento >= 80
                                  ? 'cumple'
                                  : ev.calificacionCumplimiento >= 60
                                  ? 'riesgo'
                                  : 'peligro'
                              }`}
                            >
                              {ev.estado === 'COMPLETADA' ? `${ev.calificacionCumplimiento}%` : 'En captura'}
                            </span>
                          </div>
                          <span
                            className={`badge-estado ${
                              ev.estado === 'COMPLETADA' ? 'cerrada' : 'proceso'
                            }`}
                          >
                            {ev.estado === 'COMPLETADA' ? 'CERRADA' : 'EN CURSO'}
                          </span>
                        </div>

                        {/* Botones de acción 100% visibles y cómodos para tocar en celular */}
                        <div className="acciones-movil-admin-grid">
                          {ev.urlReporteDrive && (
                            <a
                              href={ev.urlReporteDrive}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="boton-accion-movil drive"
                            >
                              <span>📁 Ver en Drive</span>
                            </a>
                          )}

                          <button
                            type="button"
                            className="boton-accion-movil exportar"
                            onClick={() => abrirModalExportacion(ev)}
                          >
                            <span>📥 Exportar Reporte</span>
                          </button>

                          {ev.esLocal && alVerEvaluacion && (
                            <button
                              type="button"
                              className="boton-accion-movil ver"
                              onClick={() => alVerEvaluacion(ev.id)}
                            >
                              <span>👁️ Ver / Editar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="boton-accion-movil eliminar"
                            onClick={() => setEvaluacionAEliminar(ev)}
                          >
                            <span>🗑️ Borrar</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {tabActiva === 'auditoria' && (
        <div className="contenido-auditoria">
          {/* Tarjetas de Estado de Conectividad con Google Cloud */}
          <section className="seccion-diagnostico-nube" aria-label="Diagnóstico de sincronización en la nube">
            <h2 className="titulo-seccion-auditoria">
              <span>☁️</span> Arquitectura de Nube y Respaldos Institucionales
            </h2>

            <div className="grid-servicios-nube">
              {/* Google Sheets */}
              <div className="tarjeta-servicio-nube">
                <div className="cabecera-servicio">
                  <span className="icono-servicio">📊</span>
                  <div>
                    <h3 className="nombre-servicio">Google Sheets Database</h3>
                    <span className="estatus-servicio conectado">● ACTIVO Y ENLAZADO</span>
                  </div>
                </div>
                <div className="detalles-servicio">
                  <div className="linea-detalle">
                    <span className="label-detalle">ID de Hoja:</span>
                    <code className="codigo-detalle">{GOOGLE_CONFIG.spreadsheetId}</code>
                  </div>
                  <div className="linea-detalle">
                    <span className="label-detalle">Pestañas Oficiales:</span>
                    <span className="valor-detalle">Usuarios, Evaluaciones, Fotografias, Logs</span>
                  </div>
                  <div className="linea-detalle">
                    <span className="label-detalle">Cuenta de Servicio:</span>
                    <span className="valor-detalle valor-sa">{GOOGLE_CONFIG.clientEmail}</span>
                  </div>
                </div>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${GOOGLE_CONFIG.spreadsheetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="enlace-servicio-externo"
                >
                  Abrir Hoja de Cálculo en Google Sheets ↗
                </a>
              </div>

              {/* Google Drive */}
              <div className="tarjeta-servicio-nube">
                <div className="cabecera-servicio">
                  <span className="icono-servicio">📂</span>
                  <div>
                    <h3 className="nombre-servicio">Google Drive Storage</h3>
                    <span className="estatus-servicio conectado">● ALMACENAMIENTO ACTIVO</span>
                  </div>
                </div>
                <div className="detalles-servicio">
                  <div className="linea-detalle">
                    <span className="label-detalle">Carpeta Raíz:</span>
                    <code className="codigo-detalle">{GOOGLE_CONFIG.driveRootFolderId}</code>
                  </div>
                  <div className="linea-detalle">
                    <span className="label-detalle">Estructura Jerárquica:</span>
                    <span className="valor-detalle">IMSS_DRIVE / [Unidad] / [Cuarto] /</span>
                  </div>
                  <div className="linea-detalle">
                    <span className="label-detalle">Archivos Respaldados:</span>
                    <span className="valor-detalle">Evidencias JPG (85% calidad) + Reportes PDF</span>
                  </div>
                </div>
                <a
                  href={`https://drive.google.com/drive/folders/${GOOGLE_CONFIG.driveRootFolderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="enlace-servicio-externo"
                >
                  Abrir Carpeta Raíz en Google Drive ↗
                </a>
              </div>
            </div>
          </section>

          {/* Cola de Sincronización Local Pendiente */}
          <section className="seccion-cola-local" aria-label="Cola de sincronización local">
            <div className="cabecera-cola-local">
              <div>
                <h3 className="titulo-cola">
                  <span>📥</span> Cola Local de Sincronización en este Dispositivo
                </h3>
                <p className="descripcion-cola">
                  Elementos pendientes de transmitirse hacia Google Cloud (IndexedDB → Google Sheets/Drive).
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {elementosCola.some((i) => i.estado === 'FALLIDO') && (
                  <button
                    type="button"
                    className="boton-accion-admin eliminar"
                    onClick={descartarFallidosCola}
                    title="Descartar todos los elementos con error de la cola local"
                    style={{ padding: '0.5rem 0.85rem' }}
                  >
                    🗑️ Limpiar Errores ({elementosCola.filter((i) => i.estado === 'FALLIDO').length})
                  </button>
                )}

                <button
                  type="button"
                  className="boton-sincronizar-ahora"
                  onClick={forzarSincronizacion}
                  disabled={sincronizandoManual || !estaEnLinea}
                  title="Procesar inmediatamente todos los elementos pendientes"
                >
                  <span className={sincronizandoManual ? 'animacion-rotar' : ''}>⚡</span>
                  <span>{sincronizandoManual ? 'Sincronizando...' : 'Sincronizar Pendientes Ahora'}</span>
                </button>
              </div>
            </div>

            {elementosCola.length === 0 ? (
              <div className="cola-vacia">
                <span className="icono-vacio">✅</span>
                <p><strong>Dispositivo al día.</strong> No hay transacciones pendientes en la cola local.</p>
              </div>
            ) : (
              <div className="tabla-responsive-contenedor">
                <table className="tabla-cola-admin">
                  <thead>
                    <tr>
                      <th>ID Cola</th>
                      <th>Entidad</th>
                      <th>ID Entidad</th>
                      <th>Operación</th>
                      <th>Fecha Creación</th>
                      <th>Intentos</th>
                      <th>Estado</th>
                      <th>Último Error</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elementosCola.map((item) => (
                      <tr key={item.id}>
                        <td><code>{item.id.slice(0, 8)}...</code></td>
                        <td><span className="badge-entidad">{item.tipoEntidad}</span></td>
                        <td><code>{item.idEntidad.slice(0, 12)}...</code></td>
                        <td><strong>{item.operacion}</strong></td>
                        <td>{new Date(item.creadoEn).toLocaleTimeString('es-MX')}</td>
                        <td>{item.intentos}</td>
                        <td>
                          <span className={`badge-cola-estado ${item.estado.toLowerCase()}`}>
                            {item.estado}
                          </span>
                        </td>
                        <td className="celda-error-cola">
                          {item.ultimoError || 'Ninguno'}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="boton-accion-admin eliminar"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                            onClick={() => descartarElementoCola(item.id)}
                            title="Descartar este elemento de la cola de sincronización"
                          >
                            🗑️ Descartar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Bitácora de Transacciones (Log_Sincronizacion) */}
          <section className="seccion-logs-auditoria" aria-label="Bitácora remota de auditoría">
            <div className="cabecera-logs-auditoria">
              <h3 className="titulo-logs">
                <span>📋</span> Bitácora Central de Sincronización (Log_Sincronizacion)
              </h3>
              <span className="subtitulo-logs">
                Últimas {logsSincronizacion.length} transacciones registradas en Google Sheets por todos los dispositivos.
              </span>
            </div>

            {logsSincronizacion.length === 0 ? (
              <div className="cola-vacia">
                <p>No se encontraron registros de auditoría en la hoja remota o está trabajando en modo sin conexión.</p>
              </div>
            ) : (
              <div className="tabla-responsive-contenedor">
                <table className="tabla-logs-admin">
                  <thead>
                    <tr>
                      <th>Folio Transacción</th>
                      <th>Fecha y Hora</th>
                      <th>Entidad</th>
                      <th>Acción</th>
                      <th>Usuario / Matrícula</th>
                      <th>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsSincronizacion.map((log) => (
                      <tr key={log.idOperacion}>
                        <td><code>{log.idOperacion.slice(0, 12)}...</code></td>
                        <td>{new Date(log.fechaHora).toLocaleString('es-MX')}</td>
                        <td><span className="badge-entidad">{log.tipoEntidad}</span></td>
                        <td><strong>{log.accion}</strong></td>
                        <td>{log.matriculaUsuario}</td>
                        <td>
                          <span
                            className={`badge-resultado ${
                              log.resultado.toUpperCase().includes('EXITO') || log.resultado.toUpperCase().includes('OK')
                                ? 'exito'
                                : 'error'
                            }`}
                          >
                            {log.resultado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modal de confirmación para eliminar evaluación */}
      {evaluacionAEliminar && (
        <div className="modal-superpuesto-admin" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-eliminar">
          <div className="modal-contenido-admin modal-peligro-admin">
            <div className="modal-cabecera-peligro">
              <span className="icono-peligro-grande">⚠️</span>
              <h3 id="titulo-modal-eliminar">Confirmar Eliminación de Evaluación</h3>
            </div>
            <div className="modal-cuerpo-peligro">
              <p>
                Está a punto de eliminar de forma permanente la evaluación con folio:
              </p>
              <div className="bloque-detalle-eliminar">
                <p><strong>Folio:</strong> <code>{evaluacionAEliminar.id}</code></p>
                <p><strong>Unidad:</strong> {evaluacionAEliminar.unidad}</p>
                <p><strong>Cuarto:</strong> {MAPA_TIPO_CUARTO[evaluacionAEliminar.tipoCuarto] || evaluacionAEliminar.tipoCuarto}</p>
                <p><strong>Evaluador:</strong> {evaluacionAEliminar.nombreEvaluador} ({evaluacionAEliminar.matriculaEvaluador})</p>
              </div>
              <p className="texto-advertencia-eliminar">
                Esta acción removerá los registros locales, todas las fotografías y evidencias asociadas, y registrará la baja de la supervisión.
              </p>
            </div>
            <div className="modal-pie-peligro">
              <button
                type="button"
                className="boton-cancelar-peligro"
                onClick={() => setEvaluacionAEliminar(null)}
                disabled={eliminandoEvaluacion}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="boton-confirmar-peligro"
                onClick={ejecutarEliminarEvaluacion}
                disabled={eliminandoEvaluacion}
              >
                {eliminandoEvaluacion ? 'Eliminando...' : '🗑️ Sí, Eliminar Permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exportación (PDF / Excel / ZIP) */}
      {evaluacionAExportar && (
        <ModalExportacion
          evaluacion={evaluacionAExportar.evaluacion}
          evidencias={evaluacionAExportar.evidencias}
          alCerrar={() => setEvaluacionAExportar(null)}
        />
      )}
    </div>
  );
};
