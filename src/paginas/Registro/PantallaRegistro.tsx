import React, { useState } from 'react';
import { useAutenticacion } from '../../contextos/ContextoAutenticacion';
import {
  validarMatricula,
  validarNombreCompleto,
  validarCorreoElectronico,
  validarNumeroWhatsapp,
  validarContrasena
} from '../../servicios/validaciones';
import { comprimirImagenPerfil } from '../../servicios/compresionImagen';
import './PantallaRegistro.css';

interface PropsPantallaRegistro {
  alRegistroExitoso: () => void;
  alIrALogin: () => void;
  alVolverAInicio: () => void;
}

export const PantallaRegistro: React.FC<PropsPantallaRegistro> = ({
  alRegistroExitoso,
  alIrALogin,
  alVolverAInicio
}) => {
  const { registrar, totalUsuarios } = useAutenticacion();

  const [matricula, setMatricula] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [correoElectronico, setCorreoElectronico] = useState('');
  const [numeroWhatsapp, setNumeroWhatsapp] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [fotografiaBase64, setFotografiaBase64] = useState<string | null>(null);

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const esPrimerUsuario = totalUsuarios === 0;

  const manejarCambioFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    try {
      const fotoComprimida = await comprimirImagenPerfil(archivo, 800, 0.8);
      setFotografiaBase64(fotoComprimida);
    } catch {
      setErrorGeneral('No se pudo procesar la fotografía. Intente con otra imagen.');
    }
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGeneral(null);

    const nuevosErrores: Record<string, string> = {};

    const valMatricula = validarMatricula(matricula);
    if (!valMatricula.esValido && valMatricula.error) nuevosErrores.matricula = valMatricula.error;

    const valNombre = validarNombreCompleto(nombreCompleto);
    if (!valNombre.esValido && valNombre.error) nuevosErrores.nombreCompleto = valNombre.error;

    const valCorreo = validarCorreoElectronico(correoElectronico);
    if (!valCorreo.esValido && valCorreo.error) nuevosErrores.correoElectronico = valCorreo.error;

    const valWhatsapp = validarNumeroWhatsapp(numeroWhatsapp);
    if (!valWhatsapp.esValido && valWhatsapp.error) nuevosErrores.numeroWhatsapp = valWhatsapp.error;

    const valContrasena = validarContrasena(contrasena);
    if (!valContrasena.esValido && valContrasena.error) nuevosErrores.contrasena = valContrasena.error;

    if (contrasena !== confirmarContrasena) {
      nuevosErrores.confirmarContrasena = 'Las contraseñas no coinciden.';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setErrores({});
    setEnviando(true);

    try {
      await registrar({
        matricula,
        nombreCompleto,
        correoElectronico,
        numeroWhatsapp,
        contrasena,
        fotografiaBase64
      });
      alRegistroExitoso();
    } catch (err: any) {
      setErrorGeneral(err.message || 'Error al completar el registro.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="pantalla-formulario-contenedor">
      <div className="formulario-envoltorio">
        <div className="cabecera-formulario">
          <h1 className="titulo-formulario">
            {esPrimerUsuario ? 'Registro de Administrador' : 'Registro de Usuario'}
          </h1>
          <p className="subtitulo-formulario">
            {esPrimerUsuario
              ? 'Configure la cuenta principal que administrará las supervisiones.'
              : 'Complete sus datos para registrarse en el sistema de supervisión.'}
          </p>
        </div>

        {esPrimerUsuario && (
          <div className="aviso-administrador" role="status">
            <span className="icono-aviso" aria-hidden="true">★</span>
            <div>
              <strong>Primer usuario detectado:</strong> Esta cuenta será asignada automáticamente como <strong>ADMINISTRADOR</strong> con acceso completo a las supervisiones de todas las unidades.
            </div>
          </div>
        )}

        {errorGeneral && (
          <div className="alerta-error-general" role="alert">
            {errorGeneral}
          </div>
        )}

        <form onSubmit={manejarEnvio} noValidate>
          {/* Fotografía de perfil */}
          <div className="seccion-fotografia">
            {fotografiaBase64 ? (
              <img src={fotografiaBase64} alt="Previsualización de perfil" className="preview-foto" />
            ) : (
              <div className="preview-foto-vacia">Sin foto</div>
            )}
            <div className="controles-foto">
              <label htmlFor="input-foto" className="boton-subir-foto">
                <span>{fotografiaBase64 ? 'Cambiar Fotografía' : 'Tomar / Subir Fotografía'}</span>
              </label>
              <input
                id="input-foto"
                type="file"
                accept="image/*"
                className="input-archivo-oculto"
                onChange={manejarCambioFoto}
              />
              {fotografiaBase64 && (
                <button
                  type="button"
                  onClick={() => setFotografiaBase64(null)}
                  style={{ color: 'var(--color-error)', fontSize: '0.8rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Quitar fotografía
                </button>
              )}
            </div>
          </div>

          <div className="fila-formulario-doble" style={{ marginTop: 'var(--espacio-md)' }}>
            <div className="campo-formulario">
              <label htmlFor="matricula" className="etiqueta-formulario">Matrícula (Identificador Único)</label>
              <input
                id="matricula"
                type="text"
                className="entrada-texto"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                placeholder="Ej. 99012345"
                required
              />
              {errores.matricula && <span className="texto-error">{errores.matricula}</span>}
            </div>

            <div className="campo-formulario">
              <label htmlFor="nombreCompleto" className="etiqueta-formulario">Nombre Completo</label>
              <input
                id="nombreCompleto"
                type="text"
                className="entrada-texto"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Ej. Ing. Juan Pérez González"
                required
              />
              {errores.nombreCompleto && <span className="texto-error">{errores.nombreCompleto}</span>}
            </div>
          </div>

          <div className="fila-formulario-doble">
            <div className="campo-formulario">
              <label htmlFor="correo" className="etiqueta-formulario">Correo Institucional / Electrónico</label>
              <input
                id="correo"
                type="email"
                className="entrada-texto"
                value={correoElectronico}
                onChange={(e) => setCorreoElectronico(e.target.value)}
                placeholder="usuario@imss.gob.mx"
                required
              />
              {errores.correoElectronico && <span className="texto-error">{errores.correoElectronico}</span>}
            </div>

            <div className="campo-formulario">
              <label htmlFor="whatsapp" className="etiqueta-formulario">WhatsApp (10 Dígitos)</label>
              <input
                id="whatsapp"
                type="tel"
                className="entrada-texto"
                value={numeroWhatsapp}
                onChange={(e) => setNumeroWhatsapp(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                placeholder="Ej. 6861234567"
                required
              />
              {errores.numeroWhatsapp && <span className="texto-error">{errores.numeroWhatsapp}</span>}
            </div>
          </div>

          <div className="fila-formulario-doble">
            <div className="campo-formulario">
              <label htmlFor="contrasena" className="etiqueta-formulario">Contraseña Segura</label>
              <input
                id="contrasena"
                type="password"
                className="entrada-texto"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Mínimo 8 caracteres (letras y números)"
                required
              />
              {errores.contrasena && <span className="texto-error">{errores.contrasena}</span>}
            </div>

            <div className="campo-formulario">
              <label htmlFor="confirmarContrasena" className="etiqueta-formulario">Confirmar Contraseña</label>
              <input
                id="confirmarContrasena"
                type="password"
                className="entrada-texto"
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
                placeholder="Repita la contraseña"
                required
              />
              {errores.confirmarContrasena && <span className="texto-error">{errores.confirmarContrasena}</span>}
            </div>
          </div>

          <button
            type="submit"
            className="boton-primario"
            disabled={enviando}
            style={{ marginTop: 'var(--espacio-sm)' }}
          >
            {enviando ? 'Guardando localmente...' : 'Completar Registro'}
          </button>
        </form>

        <div className="acciones-inferiores">
          <button type="button" onClick={alVolverAInicio} style={{ color: 'var(--texto-secundario)' }}>
            ← Volver al inicio
          </button>
          {!esPrimerUsuario && (
            <button type="button" onClick={alIrALogin} style={{ color: 'var(--color-primario)' }}>
              Ya tengo una cuenta, Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
