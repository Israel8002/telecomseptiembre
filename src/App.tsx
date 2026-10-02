import React, { useState, useEffect } from 'react';
import { ProveedorAutenticacion, useAutenticacion } from './contextos/ContextoAutenticacion';
import { BarraSuperior } from './componentes/Navegacion/BarraSuperior';
import { PantallaInicio } from './paginas/Inicio/PantallaInicio';
import { PantallaRegistro } from './paginas/Registro/PantallaRegistro';
import { PantallaLogin } from './paginas/Login/PantallaLogin';
import { PantallaPrincipal } from './paginas/PanelPrincipal/PantallaPrincipal';
import { PantallaEvaluacion } from './paginas/Evaluacion/PantallaEvaluacion';
import { PantallaAdministracion } from './paginas/Administracion/PantallaAdministracion';
import './estilos/global.css';

type Vista = 'inicio' | 'login' | 'registro' | 'principal' | 'evaluacion' | 'administracion';

const ContenidoApp: React.FC = () => {
  const { sesion, usuario, cargando, estaEnLinea, totalUsuarios, cerrarSesion } = useAutenticacion();
  const [vista, setVista] = useState<Vista>('inicio');
  const [idEvaluacionActiva, setIdEvaluacionActiva] = useState<string | null>(null);

  useEffect(() => {
    if (!cargando) {
      if (sesion) {
        setVista((prev) => (prev === 'evaluacion' || prev === 'administracion' ? prev : 'principal'));
      } else {
        setVista('inicio');
        setIdEvaluacionActiva(null);
      }
    }
  }, [sesion, cargando]);

  const alPresionarLogoInicio = () => {
    if (sesion) {
      setVista('principal');
    } else if (totalUsuarios === 0) {
      setVista('registro');
    } else {
      setVista('login');
    }
  };

  const alCerrarSesion = async () => {
    await cerrarSesion();
    setVista('inicio');
  };

  if (cargando) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--fondo-base)',
          color: 'var(--texto-secundario)'
        }}
      >
        Iniciando base de datos local...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', width: '100%' }}>
      {/* Barra superior visible en todas las pantallas con estado de conectividad */}
      <BarraSuperior
        sesion={sesion}
        fotografiaBase64={usuario?.fotografiaBase64}
        estaEnLinea={estaEnLinea}
        alCerrarSesion={alCerrarSesion}
        alHacerClicMarca={() => setVista(sesion ? 'principal' : 'inicio')}
        alIrAAdmin={() => setVista('administracion')}
        alIrAPrincipal={() => setVista('principal')}
        vistaActual={vista}
      />

      {vista === 'inicio' && <PantallaInicio alPresionarLogo={alPresionarLogoInicio} />}

      {vista === 'registro' && (
        <PantallaRegistro
          alRegistroExitoso={() => setVista('principal')}
          alIrALogin={() => setVista('login')}
          alVolverAInicio={() => setVista('inicio')}
        />
      )}

      {vista === 'login' && (
        <PantallaLogin
          alLoginExitoso={() => setVista('principal')}
          alIrARegistro={() => setVista('registro')}
          alVolverAInicio={() => setVista('inicio')}
        />
      )}

      {vista === 'principal' && (
        <PantallaPrincipal
          alContinuarEvaluacion={(id) => {
            setIdEvaluacionActiva(id);
            setVista('evaluacion');
          }}
        />
      )}

      {vista === 'administracion' && (
        <PantallaAdministracion
          alVolver={() => setVista('principal')}
          alVerEvaluacion={(id) => {
            setIdEvaluacionActiva(id);
            setVista('evaluacion');
          }}
        />
      )}

      {vista === 'evaluacion' && idEvaluacionActiva && (
        <PantallaEvaluacion
          idEvaluacion={idEvaluacionActiva}
          alVolver={() => {
            setIdEvaluacionActiva(null);
            setVista('principal');
          }}
          alFinalizada={() => {
            setIdEvaluacionActiva(null);
            setVista('principal');
          }}
        />
      )}
    </div>
  );
};

import { BaseDatosLocal } from './db/baseDatos';

export const App: React.FC<{ bd?: BaseDatosLocal }> = ({ bd }) => {
  return (
    <ProveedorAutenticacion bd={bd}>
      <ContenidoApp />
    </ProveedorAutenticacion>
  );
};
