import React, { useState } from 'react';
import { useAutenticacion } from '../../contextos/ContextoAutenticacion';
import '../Registro/PantallaRegistro.css';

interface PropsPantallaLogin {
  alLoginExitoso: () => void;
  alIrARegistro: () => void;
  alVolverAInicio: () => void;
}

export const PantallaLogin: React.FC<PropsPantallaLogin> = ({
  alLoginExitoso,
  alIrARegistro,
  alVolverAInicio
}) => {
  const { iniciarSesion } = useAutenticacion();

  const [matricula, setMatricula] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGeneral(null);

    if (!matricula.trim() || !contrasena) {
      setErrorGeneral('Por favor ingrese su matrícula y contraseña.');
      return;
    }

    setEnviando(true);
    try {
      await iniciarSesion(matricula.trim(), contrasena);
      alLoginExitoso();
    } catch (err: any) {
      setErrorGeneral(err.message || 'Error al iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="pantalla-formulario-contenedor">
      <div className="formulario-envoltorio" style={{ maxWidth: '440px' }}>
        <div className="cabecera-formulario">
          <h1 className="titulo-formulario">Iniciar Sesión</h1>
          <p className="subtitulo-formulario">
            Ingrese con su matrícula para acceder a las evaluaciones locales.
          </p>
        </div>

        {errorGeneral && (
          <div className="alerta-error-general" role="alert">
            {errorGeneral}
          </div>
        )}

        <form onSubmit={manejarEnvio} noValidate>
          <div className="campo-formulario">
            <label htmlFor="login-matricula" className="etiqueta-formulario">Matrícula</label>
            <input
              id="login-matricula"
              type="text"
              className="entrada-texto"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.toUpperCase())}
              placeholder="Ej. 99012345"
              autoFocus
              required
            />
          </div>

          <div className="campo-formulario">
            <label htmlFor="login-contrasena" className="etiqueta-formulario">Contraseña</label>
            <input
              id="login-contrasena"
              type="password"
              className="entrada-texto"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Ingrese su contraseña"
              required
            />
          </div>

          <button
            type="submit"
            className="boton-primario"
            disabled={enviando}
            style={{ marginTop: 'var(--espacio-sm)' }}
          >
            {enviando ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="acciones-inferiores">
          <button type="button" onClick={alVolverAInicio} style={{ color: 'var(--texto-secundario)' }}>
            ← Volver al inicio
          </button>
          <button type="button" onClick={alIrARegistro} style={{ color: 'var(--color-primario)' }}>
            Registrar nuevo usuario
          </button>
        </div>
      </div>
    </div>
  );
};
