import Dexie, { Table } from 'dexie';
import { Usuario } from '../modelos/usuario';
import { ElementoColaSincronizacion } from '../modelos/sincronizacion';
import { SesionLocal } from '../modelos/sesion';

/**
 * Base de Datos Local para Supervisión de Cuartos de Telecomunicaciones
 * Gestionada mediante Dexie.js sobre IndexedDB del navegador o WebView.
 */
export class BaseDatosLocal extends Dexie {
  usuarios!: Table<Usuario, string>;
  colaSincronizacion!: Table<ElementoColaSincronizacion, string>;
  sesiones!: Table<SesionLocal, string>;

  constructor(nombreBaseDatos: string = 'SupervisionCuartosTelecomBD') {
    super(nombreBaseDatos);

    this.version(1).stores({
      usuarios: 'id, &matricula, &correoElectronico, rol, creadoEn, sincronizado',
      colaSincronizacion: 'id, tipoEntidad, idEntidad, estado, creadoEn',
      sesiones: 'id, idUsuario, matricula'
    });
  }
}

// Instancia singleton por defecto para la aplicación
export const bdLocal = new BaseDatosLocal();
