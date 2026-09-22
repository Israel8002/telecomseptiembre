/**
 * Modelos y tipos para la entidad Usuario
 */

export type RolUsuario = 'ADMINISTRADOR' | 'USUARIO_NORMAL';

export interface Usuario {
  id: string;
  matricula: string;
  nombreCompleto: string;
  correoElectronico: string;
  numeroWhatsapp: string;
  hashContrasena: string;
  salContrasena: string;
  rol: RolUsuario;
  fotografiaBase64: string | null;
  creadoEn: string;
  actualizadoEn: string;
  sincronizado: boolean;
  version: number;
}

export interface DatosRegistroUsuario {
  matricula: string;
  nombreCompleto: string;
  correoElectronico: string;
  numeroWhatsapp: string;
  contrasena: string;
  fotografiaBase64?: string | null;
}
