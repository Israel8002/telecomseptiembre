import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Usuario, DatosRegistroUsuario } from '../modelos/usuario';
import { SesionLocal } from '../modelos/sesion';
import { BaseDatosLocal, bdLocal } from '../db/baseDatos';
import { RepositorioUsuarios } from '../db/repositorios/repositorioUsuarios';
import { obtenerEstadoRedActual, suscribirEstadoRed } from '../servicios/detectorRed';
import { ProcesadorSincronizacion } from '../servicios/google/procesadorSincronizacion';

interface ContextoAutenticacionTipo {
  bd: BaseDatosLocal;
  sesion: SesionLocal | null;
  usuario: Usuario | null;
  cargando: boolean;
  estaEnLinea: boolean;
  totalUsuarios: number;
  procesador: ProcesadorSincronizacion;
  iniciarSesion: (matricula: string, contrasena: string) => Promise<void>;
  registrar: (datos: DatosRegistroUsuario) => Promise<Usuario>;
  cerrarSesion: () => Promise<void>;
  recargarEstado: () => Promise<void>;
}

const ContextoAutenticacion = createContext<ContextoAutenticacionTipo | undefined>(undefined);

interface PropsProveedor {
  children: React.ReactNode;
  bd?: BaseDatosLocal;
}

export const ProveedorAutenticacion: React.FC<PropsProveedor> = ({ children, bd = bdLocal }) => {
  const [repositorio] = useState(() => new RepositorioUsuarios(bd));
  const [procesador] = useState(() => new ProcesadorSincronizacion(bd));
  const [sesion, setSesion] = useState<SesionLocal | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [estaEnLinea, setEstaEnLinea] = useState<boolean>(obtenerEstadoRedActual());
  const [totalUsuarios, setTotalUsuarios] = useState<number>(0);

  const cargarSesionYEstado = useCallback(async () => {
    try {
      const sesionActiva = await repositorio.obtenerSesionActiva();
      setSesion(sesionActiva);

      if (sesionActiva) {
        const u = await repositorio.obtenerPorMatricula(sesionActiva.matricula);
        setUsuario(u);
      } else {
        setUsuario(null);
      }

      const total = await repositorio.contarUsuarios();
      setTotalUsuarios(total);
    } catch (error) {
      console.error('Error al inicializar sesión:', error);
    } finally {
      setCargando(false);
    }
  }, [repositorio]);

  useEffect(() => {
    cargarSesionYEstado();
    const desuscribirRed = suscribirEstadoRed((enLinea) => {
      setEstaEnLinea(enLinea);
    });

    return () => {
      desuscribirRed();
    };
  }, [cargarSesionYEstado]);

  const iniciarSesion = async (matricula: string, contrasena: string): Promise<void> => {
    const usuarioAutenticado = await repositorio.autenticarUsuario(matricula, contrasena);
    await repositorio.guardarSesion(usuarioAutenticado);
    setUsuario(usuarioAutenticado);
    const sesionNueva = await repositorio.obtenerSesionActiva();
    setSesion(sesionNueva);
  };

  const registrar = async (datos: DatosRegistroUsuario): Promise<Usuario> => {
    const nuevoUsuario = await repositorio.registrarUsuario(datos);
    await repositorio.guardarSesion(nuevoUsuario);
    setUsuario(nuevoUsuario);
    const sesionNueva = await repositorio.obtenerSesionActiva();
    setSesion(sesionNueva);
    const total = await repositorio.contarUsuarios();
    setTotalUsuarios(total);
    return nuevoUsuario;
  };

  const cerrarSesion = async (): Promise<void> => {
    await repositorio.cerrarSesionLocal();
    setSesion(null);
    setUsuario(null);
  };

  const recargarEstado = async (): Promise<void> => {
    await cargarSesionYEstado();
  };

  return (
    <ContextoAutenticacion.Provider
      value={{
        bd,
        sesion,
        usuario,
        cargando,
        estaEnLinea,
        totalUsuarios,
        procesador,
        iniciarSesion,
        registrar,
        cerrarSesion,
        recargarEstado
      }}
    >
      {children}
    </ContextoAutenticacion.Provider>
  );
};

export function useAutenticacion(): ContextoAutenticacionTipo {
  const contexto = useContext(ContextoAutenticacion);
  if (!contexto) {
    throw new Error('useAutenticacion debe ser utilizado dentro de un ProveedorAutenticacion');
  }
  return contexto;
}
