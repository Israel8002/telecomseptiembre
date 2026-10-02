import React, { useRef, useState } from 'react';
import { EvidenciaFotografica } from '../../modelos/evidenciaFotografica';
import { ModalVisorFoto } from './ModalVisorFoto';
import './ModuloFotografico.css';

interface PropsModuloEvidenciaCriterio {
  idEvaluacion: string;
  idCriterio?: string;
  seccion?: string;
  unidad: string;
  tipoCuarto: string;
  evidencias: EvidenciaFotografica[];
  alAgregarEvidencia: (archivo: File) => Promise<void>;
  alEliminarEvidencia: (idFoto: string) => Promise<void>;
  alActualizarDescripcion: (idFoto: string, descripcion: string) => Promise<void>;
}

export const ModuloEvidenciaCriterio: React.FC<PropsModuloEvidenciaCriterio> = ({
  idCriterio,
  evidencias,
  alAgregarEvidencia,
  alEliminarEvidencia,
  alActualizarDescripcion
}) => {
  const inputCamaraRef = useRef<HTMLInputElement>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState<EvidenciaFotografica | null>(null);

  const manejarSeleccionArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = e.target.files;
    if (!archivos || archivos.length === 0) return;

    try {
      setProcesando(true);
      for (let i = 0; i < archivos.length; i++) {
        await alAgregarEvidencia(archivos[i]);
      }
    } catch (error) {
      console.error('Error al procesar fotografía:', error);
    } finally {
      setProcesando(false);
      // Reset input para permitir volver a seleccionar el mismo archivo si se desea
      e.target.value = '';
    }
  };

  const fotoActualVisor = fotoSeleccionada
    ? evidencias.find((ev) => ev.id === fotoSeleccionada.id) || null
    : null;

  return (
    <div className="modulo-evidencia-criterio" aria-label={`Evidencia fotográfica para ${idCriterio || 'cuarto'}`}>
      <div className="modulo-evidencia-cabecera">
        <div className="modulo-evidencia-titulo-fila">
          <span className="icono-camara-pequeno">📸</span>
          <span className="modulo-evidencia-etiqueta">
            Evidencia Fotográfica {evidencias.length > 0 && `(${evidencias.length})`}
          </span>
        </div>

        <div className="modulo-evidencia-botones-captura">
          {/* Input para captura directa con cámara en móviles/tablets */}
          <input
            ref={inputCamaraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="input-oculto"
            onChange={manejarSeleccionArchivo}
            id={`camara-${idCriterio || 'general'}`}
          />
          {/* Input para selección desde galería/archivos */}
          <input
            ref={inputArchivoRef}
            type="file"
            accept="image/*"
            multiple
            className="input-oculto"
            onChange={manejarSeleccionArchivo}
            id={`galeria-${idCriterio || 'general'}`}
          />

          <button
            type="button"
            className="boton-captura-accion boton-camara"
            onClick={() => inputCamaraRef.current?.click()}
            disabled={procesando}
            title="Tomar foto con la cámara"
            aria-label="Tomar foto con cámara"
          >
            📷 Tomar Foto
          </button>

          <button
            type="button"
            className="boton-captura-accion boton-galeria"
            onClick={() => inputArchivoRef.current?.click()}
            disabled={procesando}
            title="Cargar imagen existente de la galería"
            aria-label="Cargar foto desde galería"
          >
            🖼 Galería
          </button>
        </div>
      </div>

      {procesando && (
        <div className="indicador-procesamiento-foto" role="status">
          <span className="spinner-foto" />
          <span>Optimizando y comprimiendo imagen...</span>
        </div>
      )}

      {evidencias.length > 0 && (
        <div className="galeria-miniaturas-criterio" role="list">
          {evidencias.map((ev) => (
            <div
              key={ev.id}
              className="miniatura-foto-item"
              role="listitem"
              onClick={() => setFotoSeleccionada(ev)}
              title={ev.descripcion ? `${ev.id}: ${ev.descripcion}` : `${ev.id} (Clic para ampliar)`}
            >
              <img
                src={ev.datosBase64}
                alt={ev.descripcion || `Evidencia ${ev.id}`}
                className="miniatura-foto-img"
              />
              {ev.descripcion && <span className="indicador-tiene-nota" title="Tiene nota técnica">📝</span>}
              <span className="miniatura-tamano-tag">
                {Math.round(ev.tamanoBytes / 1024)} KB
              </span>
            </div>
          ))}
        </div>
      )}

      {fotoActualVisor && (
        <ModalVisorFoto
          foto={fotoActualVisor}
          alCerrar={() => setFotoSeleccionada(null)}
          alEliminar={alEliminarEvidencia}
          alActualizarDescripcion={alActualizarDescripcion}
        />
      )}
    </div>
  );
};
