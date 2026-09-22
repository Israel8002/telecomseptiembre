import React from 'react';
import './LogoInteractivo.css';

interface PropsLogoInteractivo {
  alPresionar: () => void;
  subtitulo?: string;
}

export const LogoInteractivo: React.FC<PropsLogoInteractivo> = ({
  alPresionar,
  subtitulo = 'Presione para iniciar supervisión'
}) => {
  const manejarTeclado = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      alPresionar();
    }
  };

  return (
    <button
      type="button"
      className="contenedor-logo-interactivo"
      onClick={alPresionar}
      onKeyDown={manejarTeclado}
      aria-label="Iniciar evaluación de cuarto de comunicaciones"
    >
      <svg
        className="emblema-svg"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Círculo exterior de red de telecomunicaciones */}
        <circle cx="50" cy="50" r="46" stroke="#2563EB" strokeWidth="2.5" strokeDasharray="4 4" opacity="0.6" />
        
        {/* Antena / Torre de transmisión central */}
        <path d="M50 18L50 82" stroke="#F3F4F6" strokeWidth="3" strokeLinecap="round" />
        <path d="M36 40L50 24L64 40" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 54L50 36L70 54" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 68L50 48L76 68" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Nodos de telecomunicaciones / conexiones */}
        <circle cx="50" cy="20" r="4" fill="#60A5FA" />
        <circle cx="36" cy="40" r="3" fill="#3B82F6" />
        <circle cx="64" cy="40" r="3" fill="#3B82F6" />
        <circle cx="30" cy="54" r="3" fill="#2563EB" />
        <circle cx="70" cy="54" r="3" fill="#2563EB" />
        <circle cx="24" cy="68" r="3" fill="#1D4ED8" />
        <circle cx="76" cy="68" r="3" fill="#1D4ED8" />
        
        {/* Base de bastidor / rack */}
        <line x1="38" y1="82" x2="62" y2="82" stroke="#F3F4F6" strokeWidth="3.5" strokeLinecap="round" />
      </svg>

      <div className="texto-logo-titulo">Telecom IMSS</div>
      <div className="texto-logo-subtitulo">
        <span className="indicador-pulso" aria-hidden="true"></span>
        <span>{subtitulo}</span>
      </div>
    </button>
  );
};
