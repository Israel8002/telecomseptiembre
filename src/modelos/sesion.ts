/**
 * Modelo para la sesión local persistente
 */
import { RolUsuario } from './usuario';

export interface SesionLocal {
  id: 'sesion_activa';
  idUsuario: string;
  matricula: string;
  nombreCompleto: string;
  rol: RolUsuario;
  iniciadoEn: string;
}
