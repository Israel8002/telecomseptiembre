import React from 'react';
import { SesionLocal } from '../../modelos/sesion';
import './BarraSuperior.css';

interface PropsBarraSuperior {
  sesion: SesionLocal | null;
  fotografiaBase64?: string | null;
  estaEnLinea: boolean;
  alCerrarSesion: () => void;
  alHacerClicMarca?: () => void;
}

export const BarraSuperior: React.FC<PropsBarraSuperior> = ({
  sesion,
  fotografiaBase64,
  estaEnLinea,
  alCerrarSesion,
  alHacerClicMarca
}) => {
  const iniciales = sesion?.nombreCompleto
    ? sesion.nombreCompleto
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <header className="barra-superior">
      <div
        className="barra-superior-marca"
        onClick={alHacerClicMarca}
        style={{ cursor: alHacerClicMarca ? 'pointer' : 'default' }}
      >
        <svg className="icono-marca-chico" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="44" stroke="#2563EB" strokeWidth="6" />
          <path d="M50 24L50 76" stroke="#F3F4F6" strokeWidth="6" strokeLinecap="round" />
          <path d="M34 46L50 30L66 46" stroke="#2563EB" strokeWidth="6" strokeLinecap="round" />
          <path d="M26 62L50 42L74 62" stroke="#60A5FA" strokeWidth="6" strokeLinecap="round" />
        </svg>
        <span>Supervisión Telecom IMSS</span>
      </div>

      <div className="barra-superior-derecha">
        {/* Indicador de conectividad */}
        <div className={`badge-conectividad ${estaEnLinea ? 'en-linea' : 'fuera-linea'}`}>
          <span className="punto-estado" aria-hidden="true"></span>
          <span>{estaEnLinea ? 'En línea' : 'Modo Local'}</span>
        </div>

        {sesion && (
          <>
            <div className="perfil-resumen">
              {fotografiaBase64 ? (
                <img
                  src={fotografiaBase64}
                  alt={`Foto de ${sesion.nombreCompleto}`}
                  className="avatar-miniatura"
                />
              ) : (
                <div className="avatar-placeholder" aria-label="Iniciales de usuario">
                  {iniciales}
                </div>
              )}

              <div className="datos-usuario-texto">
                <span className="nombre-usuario">{sesion.nombreCompleto}</span>
                <span className="matricula-rol">
                  <span>Mat. {sesion.matricula}</span>
                  <span
                    className={`badge-rol ${
                      sesion.rol === 'ADMINISTRADOR' ? 'admin' : 'usuario'
                    }`}
                  >
                    {sesion.rol === 'ADMINISTRADOR' ? 'ADMIN' : 'TÉCNICO'}
                  </span>
                </span>
              </div>
            </div>

            <button
              type="button"
              className="boton-secundario"
              onClick={alCerrarSesion}
              title="Cerrar sesión activa"
            >
              Salir
            </button>
          </>
        )}
      </div>
    </header>
  );
};
