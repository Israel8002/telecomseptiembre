import React, { useState } from 'react';
import { SesionLocal } from '../../modelos/sesion';
import { BotonSincronizacion } from '../Sincronizacion/BotonSincronizacion';
import './BarraSuperior.css';

interface PropsBarraSuperior {
  sesion: SesionLocal | null;
  fotografiaBase64?: string | null;
  estaEnLinea: boolean;
  alCerrarSesion: () => void;
  alHacerClicMarca?: () => void;
  alIrAAdmin?: () => void;
  alIrAPrincipal?: () => void;
  vistaActual?: string;
}

export const BarraSuperior: React.FC<PropsBarraSuperior> = ({
  sesion,
  fotografiaBase64,
  estaEnLinea,
  alCerrarSesion,
  alHacerClicMarca,
  alIrAAdmin,
  alIrAPrincipal,
  vistaActual
}) => {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const iniciales = sesion?.nombreCompleto
    ? sesion.nombreCompleto
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase()
    : 'U';

  const toggleMenuMovil = () => {
    setMenuMovilAbierto((prev) => !prev);
  };

  const cerrarMenuMovil = () => {
    setMenuMovilAbierto(false);
  };

  return (
    <>
      <header className="barra-superior">
        <div
          className="barra-superior-marca"
          onClick={alHacerClicMarca}
          style={{ cursor: alHacerClicMarca ? 'pointer' : 'default' }}
        >
          <svg className="icono-marca-chico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="18" height="7" rx="1.5" stroke="#2563EB" strokeWidth="2" fill="#0B1329" />
            <rect x="3" y="14" width="18" height="7" rx="1.5" stroke="#3B82F6" strokeWidth="2" fill="#0B1329" />
            <circle cx="6" cy="6.5" r="1" fill="#10B981" />
            <circle cx="9" cy="6.5" r="1" fill="#3B82F6" />
            <line x1="13" y1="6.5" x2="18" y2="6.5" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="6" cy="17.5" r="1" fill="#10B981" />
            <circle cx="9" cy="17.5" r="1" fill="#F59E0B" />
            <line x1="13" y1="17.5" x2="18" y2="17.5" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="texto-marca">Supervisión Telecom IMSS</span>
        </div>

        <div className="barra-superior-derecha">
          {/* Indicador de conectividad */}
          <div className={`badge-conectividad ${estaEnLinea ? 'en-linea' : 'fuera-linea'}`}>
            <span className="punto-estado" aria-hidden="true"></span>
            <span>{estaEnLinea ? 'En línea' : 'Modo Local'}</span>
          </div>

          {sesion && (
            <>
              {/* Indicador y botón de sincronización Google (Escritorio) */}
              <div className="contenedor-sync-escritorio">
                <BotonSincronizacion />
              </div>

              {/* Acceso directo al Módulo de Administración para rol ADMINISTRADOR (Escritorio) */}
              {sesion.rol === 'ADMINISTRADOR' && (
                <button
                  type="button"
                  className={`boton-navegacion-admin boton-admin-escritorio ${
                    vistaActual === 'administracion' ? 'activo' : ''
                  }`}
                  onClick={vistaActual === 'administracion' ? alIrAPrincipal : alIrAAdmin}
                  title={
                    vistaActual === 'administracion'
                      ? 'Regresar a mis evaluaciones'
                      : 'Ir a Supervisión Estatal y Auditoría'
                  }
                >
                  <span>
                    {vistaActual === 'administracion' ? '📋 Mis Evaluaciones' : '🛡️ Panel Admin'}
                  </span>
                </button>
              )}

              {/* Perfil en Escritorio */}
              <div className="perfil-resumen perfil-escritorio">
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

              {/* Botón Salir Escritorio */}
              <button
                type="button"
                className="boton-secundario boton-salir-escritorio"
                onClick={alCerrarSesion}
                title="Cerrar sesión activa"
              >
                Salir
              </button>

              {/* Botón Menú Hamburguesa para Móvil */}
              <button
                type="button"
                className="boton-hamburguesa-movil"
                onClick={toggleMenuMovil}
                aria-label="Abrir menú de usuario"
                aria-expanded={menuMovilAbierto}
              >
                <span className="icono-hamburguesa">☰</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Menú Desplegable / Drawer para Celular */}
      {sesion && menuMovilAbierto && (
        <div className="overlay-menu-movil" onClick={cerrarMenuMovil}>
          <div className="drawer-menu-movil" onClick={(e) => e.stopPropagation()}>
            <div className="cabecera-drawer">
              <div className="perfil-drawer">
                {fotografiaBase64 ? (
                  <img
                    src={fotografiaBase64}
                    alt={`Foto de ${sesion.nombreCompleto}`}
                    className="avatar-drawer"
                  />
                ) : (
                  <div className="avatar-placeholder-drawer">{iniciales}</div>
                )}
                <div>
                  <h4 className="nombre-drawer">{sesion.nombreCompleto}</h4>
                  <div className="matricula-rol-drawer">
                    <span>Mat. {sesion.matricula}</span>
                    <span
                      className={`badge-rol ${
                        sesion.rol === 'ADMINISTRADOR' ? 'admin' : 'usuario'
                      }`}
                    >
                      {sesion.rol === 'ADMINISTRADOR' ? 'ADMIN' : 'TÉCNICO'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="boton-cerrar-drawer"
                onClick={cerrarMenuMovil}
                aria-label="Cerrar menú"
              >
                ✕
              </button>
            </div>

            <div className="cuerpo-drawer">
              <div className="seccion-drawer-sync">
                <span className="label-drawer">Estado de Nube Google:</span>
                <BotonSincronizacion />
              </div>

              <nav className="enlaces-drawer">
                <button
                  type="button"
                  className={`item-enlace-drawer ${vistaActual !== 'administracion' ? 'activo' : ''}`}
                  onClick={() => {
                    alIrAPrincipal?.();
                    cerrarMenuMovil();
                  }}
                >
                  <span className="icono-drawer">📋</span>
                  <span>Mis Evaluaciones</span>
                </button>

                {sesion.rol === 'ADMINISTRADOR' && (
                  <button
                    type="button"
                    className={`item-enlace-drawer ${vistaActual === 'administracion' ? 'activo' : ''}`}
                    onClick={() => {
                      alIrAAdmin?.();
                      cerrarMenuMovil();
                    }}
                  >
                    <span className="icono-drawer">🛡️</span>
                    <span>Panel de Control y Auditoría</span>
                  </button>
                )}
              </nav>

              <div className="pie-drawer">
                <button
                  type="button"
                  className="boton-cerrar-sesion-drawer"
                  onClick={() => {
                    cerrarMenuMovil();
                    alCerrarSesion();
                  }}
                >
                  <span>🚪 Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Navegación Inferior Nativa para Móvil (Bottom Tab Bar) */}
      {sesion && (
        <nav className="barra-inferior-nativa" aria-label="Navegación inferior móvil">
          <button
            type="button"
            className={`tab-inferior ${vistaActual !== 'administracion' ? 'activa' : ''}`}
            onClick={alIrAPrincipal}
          >
            <span className="icono-tab-inferior">📋</span>
            <span className="texto-tab-inferior">Supervisión</span>
          </button>

          {sesion.rol === 'ADMINISTRADOR' && (
            <button
              type="button"
              className={`tab-inferior ${vistaActual === 'administracion' ? 'activa' : ''}`}
              onClick={alIrAAdmin}
            >
              <span className="icono-tab-inferior">🛡️</span>
              <span className="texto-tab-inferior">Admin</span>
            </button>
          )}

          <div className="tab-inferior tab-inferior-sync">
            <BotonSincronizacion />
          </div>

          <button
            type="button"
            className="tab-inferior"
            onClick={toggleMenuMovil}
          >
            <span className="icono-tab-inferior">👤</span>
            <span className="texto-tab-inferior">Menú</span>
          </button>
        </nav>
      )}
    </>
  );
};
