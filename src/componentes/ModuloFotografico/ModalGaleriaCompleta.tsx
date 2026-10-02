import React, { useState, useMemo } from 'react';
import { EvidenciaFotografica } from '../../modelos/evidenciaFotografica';
import { ModalVisorFoto } from './ModalVisorFoto';
import './ModuloFotografico.css';

interface PropsModalGaleriaCompleta {
  evidencias: EvidenciaFotografica[];
  alCerrar: () => void;
  alEliminar: (idFoto: string) => Promise<void>;
  alActualizarDescripcion: (idFoto: string, descripcion: string) => Promise<void>;
}

export const ModalGaleriaCompleta: React.FC<PropsModalGaleriaCompleta> = ({
  evidencias,
  alCerrar,
  alEliminar,
  alActualizarDescripcion
}) => {
  const [filtroSeccion, setFiltroSeccion] = useState<string>('todas');
  const [fotoSeleccionada, setFotoSeleccionada] = useState<EvidenciaFotografica | null>(null);

  const seccionesDisponibles = useMemo(() => {
    const s = new Set<string>();
    evidencias.forEach((ev) => {
      if (ev.seccion) s.add(ev.seccion);
    });
    return Array.from(s);
  }, [evidencias]);

  const evidenciasFiltradas = useMemo(() => {
    if (filtroSeccion === 'todas') return evidencias;
    return evidencias.filter((ev) => ev.seccion === filtroSeccion);
  }, [evidencias, filtroSeccion]);

  const fotoActualVisor = fotoSeleccionada
    ? evidencias.find((ev) => ev.id === fotoSeleccionada.id) || null
    : null;

  return (
    <div
      className="modal-galeria-completa-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Galería General de Evidencias de la Evaluación"
    >
      <div className="modal-galeria-completa-panel">
        <div className="modal-galeria-cabecera">
          <div>
            <h2 className="modal-galeria-titulo">
              📷 Galería de Evidencias Fotográficas
            </h2>
            <p className="modal-galeria-subtitulo">
              Total de capturas: <strong>{evidencias.length}</strong> fotografías registradas en este cuarto.
            </p>
          </div>
          <button
            type="button"
            className="boton-cerrar-visor"
            onClick={alCerrar}
            aria-label="Cerrar galería"
          >
            ✕
          </button>
        </div>

        {seccionesDisponibles.length > 1 && (
          <div className="filtros-seccion-galeria">
            <button
              type="button"
              className={`boton-filtro-galeria ${filtroSeccion === 'todas' ? 'activo' : ''}`}
              onClick={() => setFiltroSeccion('todas')}
            >
              Todas ({evidencias.length})
            </button>
            {seccionesDisponibles.map((sec) => (
              <button
                key={sec}
                type="button"
                className={`boton-filtro-galeria ${filtroSeccion === sec ? 'activo' : ''}`}
                onClick={() => setFiltroSeccion(sec)}
              >
                {sec.toUpperCase()} ({evidencias.filter((e) => e.seccion === sec).length})
              </button>
            ))}
          </div>
        )}

        <div className="modal-galeria-cuerpo">
          {evidenciasFiltradas.length === 0 ? (
            <div className="galeria-vacia-estado">
              <span className="icono-galeria-vacia">📷</span>
              <p>No hay fotografías registradas aún en esta sección.</p>
            </div>
          ) : (
            <div className="cuadricula-galeria-completa">
              {evidenciasFiltradas.map((ev) => (
                <div
                  key={ev.id}
                  className="tarjeta-foto-galeria"
                  onClick={() => setFotoSeleccionada(ev)}
                >
                  <div className="tarjeta-foto-img-wrap">
                    <img
                      src={ev.datosBase64}
                      alt={ev.descripcion || ev.id}
                      className="tarjeta-foto-img"
                    />
                    {ev.idCriterio && (
                      <span className="tarjeta-foto-badge-criterio">{ev.idCriterio}</span>
                    )}
                  </div>
                  <div className="tarjeta-foto-info">
                    <span className="tarjeta-foto-id">{ev.id}</span>
                    <p className="tarjeta-foto-desc">
                      {ev.descripcion || '(Sin nota técnica)'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {fotoActualVisor && (
        <ModalVisorFoto
          foto={fotoActualVisor}
          alCerrar={() => setFotoSeleccionada(null)}
          alEliminar={alEliminar}
          alActualizarDescripcion={alActualizarDescripcion}
        />
      )}
    </div>
  );
};
