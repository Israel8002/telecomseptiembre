import { BaseDatosLocal } from '../baseDatos';
import {
  EvidenciaFotografica,
  DatosNuevaEvidencia
} from '../../modelos/evidenciaFotografica';
import { ElementoColaSincronizacion } from '../../modelos/sincronizacion';
import {
  comprimirEvidenciaFotografica,
  generarIdFoto
} from '../../servicios/compresionImagen';

export class RepositorioEvidencias {
  constructor(private bd: BaseDatosLocal) {}

  /**
   * Guarda una nueva fotografía de evidencia comprimida en cliente y registra su sincronización
   */
  async guardarEvidencia(datos: DatosNuevaEvidencia): Promise<EvidenciaFotografica> {
    const ahora = new Date().toISOString();
    const idFoto = generarIdFoto();

    // Compresión y optimización en cliente
    const comprimida = await comprimirEvidenciaFotografica(datos.archivoODataUrl);

    const nuevaEvidencia: EvidenciaFotografica = {
      id: idFoto,
      idEvaluacion: datos.idEvaluacion,
      idCriterio: datos.idCriterio,
      seccion: datos.seccion,
      unidad: datos.unidad,
      tipoCuarto: datos.tipoCuarto,
      nombreArchivo: datos.nombreArchivo || `${idFoto}.jpg`,
      datosBase64: comprimida.dataUrl,
      tamanoBytes: comprimida.tamanoBytes,
      ancho: comprimida.ancho,
      alto: comprimida.alto,
      descripcion: datos.descripcion?.trim() || '',
      creadoEn: ahora,
      sincronizado: false
    };

    const elementoCola: ElementoColaSincronizacion = {
      id: crypto.randomUUID(),
      tipoEntidad: 'EVIDENCIA_FOTOGRAFICA',
      idEntidad: nuevaEvidencia.id,
      operacion: 'CREAR',
      datos: JSON.stringify({
        id: nuevaEvidencia.id,
        idEvaluacion: nuevaEvidencia.idEvaluacion,
        idCriterio: nuevaEvidencia.idCriterio,
        seccion: nuevaEvidencia.seccion,
        unidad: nuevaEvidencia.unidad,
        tipoCuarto: nuevaEvidencia.tipoCuarto,
        nombreArchivo: nuevaEvidencia.nombreArchivo,
        descripcion: nuevaEvidencia.descripcion,
        creadoEn: nuevaEvidencia.creadoEn
      }),
      creadoEn: ahora,
      intentos: 0,
      ultimoError: null,
      estado: 'PENDIENTE'
    };

    await this.bd.transaction(
      'rw',
      this.bd.evidenciasFotograficas,
      this.bd.colaSincronizacion,
      async () => {
        await this.bd.evidenciasFotograficas.add(nuevaEvidencia);
        await this.bd.colaSincronizacion.add(elementoCola);
      }
    );

    return nuevaEvidencia;
  }

  /**
   * Obtiene todas las fotografías asociadas a una evaluación
   */
  async obtenerPorEvaluacion(idEvaluacion: string): Promise<EvidenciaFotografica[]> {
    return this.bd.evidenciasFotograficas
      .where('idEvaluacion')
      .equals(idEvaluacion)
      .reverse()
      .sortBy('creadoEn');
  }

  /**
   * Obtiene las fotografías vinculadas a un reactivo específico de la evaluación
   */
  async obtenerPorEvaluacionYCriterio(
    idEvaluacion: string,
    idCriterio: string
  ): Promise<EvidenciaFotografica[]> {
    return this.bd.evidenciasFotograficas
      .where('idEvaluacion')
      .equals(idEvaluacion)
      .filter((ev) => ev.idCriterio === idCriterio)
      .toArray();
  }

  /**
   * Actualiza el pie de foto o nota técnica de una fotografía
   */
  async actualizarDescripcion(idFoto: string, descripcion: string): Promise<void> {
    await this.bd.evidenciasFotograficas.update(idFoto, {
      descripcion: descripcion.trim()
    });
  }

  /**
   * Elimina una fotografía de la base de datos local y encola su eliminación remota
   */
  async eliminarEvidencia(idFoto: string): Promise<void> {
    const ahora = new Date().toISOString();
    const elementoCola: ElementoColaSincronizacion = {
      id: crypto.randomUUID(),
      tipoEntidad: 'EVIDENCIA_FOTOGRAFICA',
      idEntidad: idFoto,
      operacion: 'ELIMINAR',
      datos: JSON.stringify({ id: idFoto }),
      creadoEn: ahora,
      intentos: 0,
      ultimoError: null,
      estado: 'PENDIENTE'
    };

    await this.bd.transaction(
      'rw',
      this.bd.evidenciasFotograficas,
      this.bd.colaSincronizacion,
      async () => {
        await this.bd.evidenciasFotograficas.delete(idFoto);
        await this.bd.colaSincronizacion.add(elementoCola);
      }
    );
  }
}
