import React, { useState, useEffect } from 'react';
import { useAutenticacion } from '../../contextos/ContextoAutenticacion';
import { ResumenEstadoSincronizacion } from '../../servicios/google/procesadorSincronizacion';
import './BotonSincronizacion.css';

export const BotonSincronizacion: React.FC = () => {
  const { procesador } = useAutenticacion();
  const [resumen, setResumen] = useState<ResumenEstadoSincronizacion>(() =>
    procesador.obtenerResumen()
  );
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  useEffect(() => {
    procesador.iniciar();
    const desuscribir = procesador.suscribir((nuevoResumen) => {
      setResumen(nuevoResumen);
      if (nuevoResumen.totalPendientes === 0) {
        setMensajeError(null);
      }
    });
    return () => {
      desuscribir();
    };
  }, [procesador]);

  const sincronizar = async () => {
    try {
      setMensajeError(null);
      await procesador.forzarSincronizacion();
      const actual = procesador.obtenerResumen();
      if (actual.totalPendientes > 0 && actual.ultimoError) {
        setMensajeError(actual.ultimoError);
      }
    } catch (err: any) {
      setMensajeError(err?.message || 'Error de conexión');
    }
  };

  const estaSincronizando = resumen.estado === 'SINCRONIZANDO';

  return (
    <div className="boton-sync-contenedor">
      <button
        type="button"
        className="boton-sync-accion"
        onClick={sincronizar}
        disabled={estaSincronizando || !resumen.enLinea}
        title={
          !resumen.enLinea
            ? 'Sin conexión a Internet. Los datos se guardan localmente.'
            : resumen.totalPendientes > 0
            ? `Hay ${resumen.totalPendientes} registros pendientes de sincronizar con Google Cloud. Clic para sincronizar.`
            : 'Todo sincronizado con Google Sheets y Google Drive.'
        }
      >
        {estaSincronizando ? (
          <>
            <span className="icono-sync-giratorio">🔄</span>
            <span>Sincronizando...</span>
          </>
        ) : !resumen.enLinea ? (
          <>
            <span>☁️</span>
            <span>Offline</span>
            {resumen.totalPendientes > 0 && (
              <span className="badge-pendientes-sync">{resumen.totalPendientes}</span>
            )}
          </>
        ) : resumen.totalPendientes > 0 ? (
          <>
            <span>☁️</span>
            <span>Sincronizar</span>
            <span className="badge-pendientes-sync">{resumen.totalPendientes}</span>
          </>
        ) : (
          <>
            <span className="badge-exito-sync">☁️ ✔</span>
            <span>Sincronizado</span>
          </>
        )}
      </button>

      {mensajeError && (
        <div className="tooltip-sync-error" role="alert">
          <div className="tooltip-sync-texto">
            <span>⚠️ {mensajeError}</span>
          </div>
          <button
            type="button"
            className="tooltip-sync-cerrar"
            onClick={() => setMensajeError(null)}
            title="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
