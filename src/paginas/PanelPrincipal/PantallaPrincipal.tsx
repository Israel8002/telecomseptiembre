import React, { useState } from 'react';
import { useAutenticacion } from '../../contextos/ContextoAutenticacion';
import { LogoInteractivo } from '../../componentes/LogoInteractivo/LogoInteractivo';
import './PantallaPrincipal.css';

export const PantallaPrincipal: React.FC = () => {
  const { usuario, totalUsuarios, estaEnLinea } = useAutenticacion();
  const [mostrarMensajeEtapa2, setMostrarMensajeEtapa2] = useState(false);

  const alPresionarIniciarEvaluacion = () => {
    setMostrarMensajeEtapa2(true);
  };

  return (
    <main className="pantalla-principal-contenedor" aria-label="Panel Principal de Supervisión">
      <div className="cabecera-panel">
        <div>
          <h1 className="titulo-bienvenida">
            Bienvenido, {usuario?.nombreCompleto || 'Usuario'}
          </h1>
          <p className="subtitulo-bienvenida">
            Supervisión de Cuartos de Comunicaciones — Unidades Médicas y Administrativas
          </p>
        </div>
      </div>

      <div className="tarjeta-estado-sistema">
        <div className="elemento-estado">
          <span className="etiqueta-estado">Matrícula</span>
          <span className="valor-estado">{usuario?.matricula}</span>
        </div>
        <div className="elemento-estado">
          <span className="etiqueta-estado">Rol Asignado</span>
          <span className="valor-estado">
            {usuario?.rol === 'ADMINISTRADOR' ? 'Administrador General' : 'Usuario Técnico'}
          </span>
        </div>
        <div className="elemento-estado">
          <span className="etiqueta-estado">Estado de Red</span>
          <span className="valor-estado" style={{ color: estaEnLinea ? 'var(--color-exito)' : 'var(--color-aviso)' }}>
            {estaEnLinea ? 'En línea' : 'Modo Local (Offline)'}
          </span>
        </div>
        <div className="elemento-estado">
          <span className="etiqueta-estado">Usuarios en Dispositivo</span>
          <span className="valor-estado">{totalUsuarios}</span>
        </div>
      </div>

      <div className="area-accion-central">
        <LogoInteractivo
          alPresionar={alPresionarIniciarEvaluacion}
          subtitulo="Iniciar nueva evaluación"
        />

        {mostrarMensajeEtapa2 && (
          <div className="aviso-etapa-siguiente" role="status">
            <strong>Arquitectura de Etapa 1 Completada y Verificada:</strong>
            <p>
              El motor local, persistencia con Dexie, seguridad PBKDF2 y cola de sincronización están listos.
              Los cuestionarios interactivos de evaluación y captura fotográfica se activarán en la <strong>Etapa 2</strong>.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};
