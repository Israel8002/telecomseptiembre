import React from 'react';
import { LogoInteractivo } from '../../componentes/LogoInteractivo/LogoInteractivo';
import './PantallaInicio.css';

interface PropsPantallaInicio {
  alPresionarLogo: () => void;
}

export const PantallaInicio: React.FC<PropsPantallaInicio> = ({ alPresionarLogo }) => {
  return (
    <main className="pantalla-inicio-contenedor" aria-label="Pantalla de Inicio">
      <LogoInteractivo
        alPresionar={alPresionarLogo}
        subtitulo="Presione para iniciar supervisión"
      />
    </main>
  );
};
