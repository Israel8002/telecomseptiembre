import React, { useState } from 'react';
import { EvidenciaFotografica } from '../../modelos/evidenciaFotografica';
import './ModuloFotografico.css';

interface PropsModalVisorFoto {
  foto: EvidenciaFotografica;
  alCerrar: () => void;
  alEliminar: (idFoto: string) => Promise<void>;
  alActualizarDescripcion: (idFoto: string, descripcion: string) => Promise<void>;
}

export const ModalVisorFoto: React.FC<PropsModalVisorFoto> = ({
  foto,
  alCerrar,
  alEliminar,
  alActualizarDescripcion
}) => {
  const [descripcion, setDescripcion] = useState(foto.descripcion || '');
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [confirmandoEliminacion, setConfirmandoEliminacion] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const guardarDescripcion = async () => {
    try {
      setGuardando(true);
      await alActualizarDescripcion(foto.id, descripcion);
      setEditando(false);
    } catch (error) {
      console.error('Error al guardar descripción:', error);
    } finally {
      setGuardando(false);
    }
  };

  const ejecutarEliminacion = async () => {
    try {
      setEliminando(true);
      await alEliminar(foto.id);
      alCerrar();
    } catch (error) {
      console.error('Error al eliminar fotografía:', error);
      setEliminando(false);
    }
  };

  const formatearTamano = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatearFecha = (iso: string): string => {
    try {
      const d = new Date(iso);
      return d.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div
      className="modal-visor-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Visor de Evidencia Fotográfica"
      onClick={alCerrar}
    >
      <div
        className="modal-visor-contenido"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-visor-cabecera">
          <div className="modal-visor-titulos">
            <span className="badge-foto-id">{foto.id}</span>
            {foto.idCriterio && (
              <span className="badge-foto-criterio">{foto.idCriterio}</span>
            )}
            <span className="foto-metadatos">
              {foto.ancho}×{foto.alto} px • {formatearTamano(foto.tamanoBytes)} • {formatearFecha(foto.creadoEn)}
            </span>
          </div>
          <button
            type="button"
            className="boton-cerrar-visor"
            onClick={alCerrar}
            aria-label="Cerrar visor"
          >
            ✕
          </button>
        </div>

        <div className="modal-visor-imagen-wrap">
          <img
            src={foto.datosBase64}
            alt={foto.descripcion || `Evidencia ${foto.id}`}
            className="modal-visor-img"
          />
        </div>

        <div className="modal-visor-pie">
          <div className="modal-visor-descripcion-seccion">
            <label className="etiqueta-visor-descripcion">
              Hallazgo / Nota Técnica:
            </label>
            {editando ? (
              <div className="edicion-descripcion-wrap">
                <textarea
                  className="textarea-edicion-descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalla el hallazgo técnico observado en la fotografía..."
                  rows={2}
                  autoFocus
                />
                <div className="edicion-descripcion-botones">
                  <button
                    type="button"
                    className="boton-cancelar-edicion"
                    onClick={() => {
                      setDescripcion(foto.descripcion || '');
                      setEditando(false);
                    }}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="boton-guardar-edicion"
                    onClick={guardarDescripcion}
                    disabled={guardando}
                  >
                    {guardando ? 'Guardando...' : 'Guardar Nota'}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="descripcion-texto-clickeable"
                onClick={() => setEditando(true)}
                title="Clic para editar la nota técnica"
              >
                {foto.descripcion ? (
                  <p className="texto-descripcion-activa">{foto.descripcion}</p>
                ) : (
                  <p className="texto-descripcion-vacio">
                    <em>(Sin nota técnica. Clic aquí para redactar un hallazgo)</em>
                  </p>
                )}
                <span className="icono-editar-lapiz">✏️</span>
              </div>
            )}
          </div>

          <div className="modal-visor-acciones">
            {confirmandoEliminacion ? (
              <div className="confirmacion-eliminar-wrap">
                <span className="texto-aviso-eliminar">¿Eliminar esta fotografía?</span>
                <button
                  type="button"
                  className="boton-cancelar-edicion"
                  onClick={() => setConfirmandoEliminacion(false)}
                  disabled={eliminando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="boton-peligro-eliminar"
                  onClick={ejecutarEliminacion}
                  disabled={eliminando}
                >
                  {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="boton-eliminar-foto"
                onClick={() => setConfirmandoEliminacion(true)}
              >
                🗑 Eliminar Evidencia
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
