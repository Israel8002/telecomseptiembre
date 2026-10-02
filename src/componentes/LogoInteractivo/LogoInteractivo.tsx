import React from 'react';
import './LogoInteractivo.css';

interface PropsLogoInteractivo {
  alPresionar: () => void;
  subtitulo?: string;
}

export const LogoInteractivo: React.FC<PropsLogoInteractivo> = ({
  alPresionar,
  subtitulo = 'Nueva Supervisión'
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
      aria-label="Nueva Supervisión"
    >
      <svg
        className="emblema-svg"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Anillo de topología de red exterior */}
        <circle cx="60" cy="60" r="56" stroke="#1E3A8A" strokeWidth="2" strokeDasharray="6 4" opacity="0.7" />
        
        {/* Nodos de red distribuidos en la periferia */}
        <circle cx="60" cy="8" r="4.5" fill="#3B82F6" stroke="#93C5FD" strokeWidth="1.5" />
        <circle cx="112" cy="60" r="4.5" fill="#10B981" stroke="#A7F3D0" strokeWidth="1.5" />
        <circle cx="60" cy="112" r="4.5" fill="#3B82F6" stroke="#93C5FD" strokeWidth="1.5" />
        <circle cx="8" cy="60" r="4.5" fill="#06B6D4" stroke="#A5F3FC" strokeWidth="1.5" />
        
        {/* Enlaces de fibra óptica radiales */}
        <line x1="60" y1="12" x2="60" y2="24" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="2 2" />
        <line x1="108" y1="60" x2="94" y2="60" stroke="#34D399" strokeWidth="1.5" strokeDasharray="2 2" />
        <line x1="60" y1="108" x2="60" y2="96" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="2 2" />
        <line x1="12" y1="60" x2="26" y2="60" stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="2 2" />

        {/* Bastidor / Gabinete Rack de Telecomunicaciones 19" */}
        <rect x="26" y="24" width="68" height="72" rx="6" fill="#0B1329" stroke="#3B82F6" strokeWidth="2.5" />
        
        {/* Rieles de montaje vertical del Rack */}
        <line x1="33" y1="28" x2="33" y2="92" stroke="#1E293B" strokeWidth="2" />
        <line x1="87" y1="28" x2="87" y2="92" stroke="#1E293B" strokeWidth="2" />

        {/* Unidad 1: Patch Panel de Conectores RJ45 */}
        <rect x="35" y="28" width="50" height="12" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />
        {/* Puertos de red ethernet */}
        <rect x="38" y="32" width="4" height="4" rx="1" fill="#020617" />
        <rect x="44" y="32" width="4" height="4" rx="1" fill="#020617" />
        <rect x="50" y="32" width="4" height="4" rx="1" fill="#020617" />
        <rect x="56" y="32" width="4" height="4" rx="1" fill="#020617" />
        <rect x="62" y="32" width="4" height="4" rx="1" fill="#020617" />
        <rect x="68" y="32" width="4" height="4" rx="1" fill="#020617" />
        {/* LEDs de actividad de puerto */}
        <circle cx="77" cy="34" r="1.5" fill="#10B981" />
        <circle cx="81" cy="34" r="1.5" fill="#3B82F6" />

        {/* Unidad 2: Switch de Red Core de Alta Densidad */}
        <rect x="35" y="44" width="50" height="14" rx="2" fill="#0F172A" stroke="#2563EB" strokeWidth="1" />
        {/* Bloque de puertos SFP / Fibra Óptica */}
        <rect x="38" y="48" width="18" height="6" rx="1" fill="#1E293B" />
        <line x1="41" y1="51" x2="43" y2="51" stroke="#38BDF8" strokeWidth="1.5" />
        <line x1="46" y1="51" x2="48" y2="51" stroke="#38BDF8" strokeWidth="1.5" />
        <line x1="51" y1="51" x2="53" y2="51" stroke="#38BDF8" strokeWidth="1.5" />
        {/* LEDs de tráfico y velocidad Gigabit */}
        <circle cx="62" cy="51" r="1.5" fill="#10B981" />
        <circle cx="67" cy="51" r="1.5" fill="#10B981" />
        <circle cx="72" cy="51" r="1.5" fill="#F59E0B" />
        <circle cx="77" cy="51" r="1.5" fill="#10B981" />
        <circle cx="82" cy="51" r="1.5" fill="#3B82F6" />

        {/* Cables de parcheo UTP / Fibra con curvas dinámicas */}
        <path d="M40 36 C42 42, 40 46, 42 48" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M46 36 C48 42, 46 46, 48 48" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M52 36 C55 41, 54 45, 53 48" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Unidad 3: Router de Distribución y Enlace WAN */}
        <rect x="35" y="62" width="50" height="12" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />
        <circle cx="42" cy="68" r="2" fill="#10B981" />
        <line x1="48" y1="68" x2="68" y2="68" stroke="#020617" strokeWidth="3" strokeLinecap="round" />
        <rect x="73" y="65" width="8" height="6" rx="1" fill="#020617" />
        <circle cx="77" cy="68" r="1.5" fill="#38BDF8" />

        {/* Unidad 4: Servidor Rack 1U / Sistema de Comunicaciones */}
        <rect x="35" y="78" width="50" height="13" rx="2" fill="#0F172A" stroke="#334155" strokeWidth="1" />
        {/* Ranuras de ventilación frontales */}
        <line x1="39" y1="83" x2="55" y2="83" stroke="#334155" strokeWidth="1.5" />
        <line x1="39" y1="86" x2="55" y2="86" stroke="#334155" strokeWidth="1.5" />
        {/* LEDs de estado de encendido y disco */}
        <circle cx="75" cy="84" r="1.5" fill="#10B981" />
        <circle cx="80" cy="84" r="1.5" fill="#3B82F6" />
        
        {/* Base de soporte del Rack */}
        <rect x="30" y="96" width="60" height="4" rx="2" fill="#334155" />
      </svg>

      <div className="texto-logo-titulo">Telecomunicaciones y Redes</div>
      <div className="texto-logo-subtitulo">
        <span className="indicador-pulso" aria-hidden="true"></span>
        <span>{subtitulo}</span>
      </div>
    </button>
  );
};
