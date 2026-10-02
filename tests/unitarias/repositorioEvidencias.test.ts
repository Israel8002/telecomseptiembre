import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { BaseDatosLocal } from '../../src/db/baseDatos';
import { RepositorioEvidencias } from '../../src/db/repositorios/repositorioEvidencias';
import { generarIdFoto } from '../../src/servicios/compresionImagen';

describe('RepositorioEvidencias y Módulo Fotográfico', () => {
  let bd: BaseDatosLocal;
  let repo: RepositorioEvidencias;

  beforeEach(async () => {
    // Mock de Canvas para simular compresión en jsdom
    const mockContext = {
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
      createImageData: vi.fn(),
      setTransform: vi.fn(),
      drawImageFromRect: vi.fn()
    };

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext as any);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,mockEvidenciaComprimida');

    // Mock de Image para jsdom
    global.Image = class {
      width = 1600;
      height = 1200;
      onload: (() => void) | null = null;
      src = '';
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    } as any;

    bd = new BaseDatosLocal(`test_evidencias_${Date.now()}_${Math.random()}`);
    await bd.open();
    repo = new RepositorioEvidencias(bd);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await bd.delete();
  });

  it('debe generar identificadores de foto con formato estándar FOTO-YYYYMMDD-HHMMSS-HEX4', () => {
    const id = generarIdFoto();
    expect(id).toMatch(/^FOTO-\d{8}-\d{6}-[A-F0-9]{4}$/);
  });

  it('debe guardar una nueva evidencia fotográfica y encolar su sincronización', async () => {
    const nuevaFoto = await repo.guardarEvidencia({
      idEvaluacion: 'EVAL-20260923-120000-TEST-0001',
      idCriterio: 'Q002',
      seccion: 'fisica',
      unidad: 'HGE 30 MXL',
      tipoCuarto: 'mdf_principal',
      nombreArchivo: 'rack_puerta_danada.jpg',
      archivoODataUrl: 'data:image/jpeg;base64,datosPruebaOriginales',
      descripcion: 'Cerradura de la puerta del cuarto con daño evidente'
    });

    expect(nuevaFoto.id).toMatch(/^FOTO-/);
    expect(nuevaFoto.idEvaluacion).toBe('EVAL-20260923-120000-TEST-0001');
    expect(nuevaFoto.idCriterio).toBe('Q002');
    expect(nuevaFoto.seccion).toBe('fisica');
    expect(nuevaFoto.descripcion).toBe('Cerradura de la puerta del cuarto con daño evidente');
    expect(nuevaFoto.datosBase64).toBe('data:image/jpeg;base64,mockEvidenciaComprimida');
    expect(nuevaFoto.sincronizado).toBe(false);

    // Verificar en la cola de sincronización
    const cola = await bd.colaSincronizacion.toArray();
    expect(cola.length).toBe(1);
    expect(cola[0].tipoEntidad).toBe('EVIDENCIA_FOTOGRAFICA');
    expect(cola[0].operacion).toBe('CREAR');
    expect(cola[0].idEntidad).toBe(nuevaFoto.id);
  });

  it('debe filtrar evidencias por evaluación y por reactivo específico', async () => {
    const idEval = 'EVAL-20260923-120000-TEST-0002';

    await repo.guardarEvidencia({
      idEvaluacion: idEval,
      idCriterio: 'Q002',
      seccion: 'fisica',
      unidad: 'HGE 30 MXL',
      tipoCuarto: 'mdf_principal',
      nombreArchivo: 'foto1.jpg',
      archivoODataUrl: 'data:image/jpeg;base64,foto1',
      descripcion: 'Foto reactivo 2'
    });

    await repo.guardarEvidencia({
      idEvaluacion: idEval,
      idCriterio: 'Q013',
      seccion: 'seguridad',
      unidad: 'HGE 30 MXL',
      tipoCuarto: 'mdf_principal',
      nombreArchivo: 'foto2.jpg',
      archivoODataUrl: 'data:image/jpeg;base64,foto2',
      descripcion: 'Foto extintor'
    });

    const todas = await repo.obtenerPorEvaluacion(idEval);
    expect(todas.length).toBe(2);

    const soloQ002 = await repo.obtenerPorEvaluacionYCriterio(idEval, 'Q002');
    expect(soloQ002.length).toBe(1);
    expect(soloQ002[0].idCriterio).toBe('Q002');

    const soloQ013 = await repo.obtenerPorEvaluacionYCriterio(idEval, 'Q013');
    expect(soloQ013.length).toBe(1);
    expect(soloQ013[0].idCriterio).toBe('Q013');
  });

  it('debe actualizar la descripción técnica o pie de foto', async () => {
    const foto = await repo.guardarEvidencia({
      idEvaluacion: 'EVAL-20260923-120000-TEST-0003',
      idCriterio: 'Q037',
      seccion: 'ups',
      unidad: 'HGE 30 MXL',
      tipoCuarto: 'mdf_principal',
      nombreArchivo: 'ups_baterias.jpg',
      archivoODataUrl: 'data:image/jpeg;base64,ups',
      descripcion: 'Texto inicial'
    });

    await repo.actualizarDescripcion(foto.id, 'Baterías infladas en módulo 2 con alarma encendida');

    const fotosActualizadas = await repo.obtenerPorEvaluacion('EVAL-20260923-120000-TEST-0003');
    expect(fotosActualizadas[0].descripcion).toBe(
      'Baterías infladas en módulo 2 con alarma encendida'
    );
  });

  it('debe eliminar la evidencia y encolar la operación ELIMINAR en la sincronización', async () => {
    const foto = await repo.guardarEvidencia({
      idEvaluacion: 'EVAL-20260923-120000-TEST-0004',
      unidad: 'HGE 30 MXL',
      tipoCuarto: 'mdf_principal',
      nombreArchivo: 'a_borrar.jpg',
      archivoODataUrl: 'data:image/jpeg;base64,borrar'
    });

    await repo.eliminarEvidencia(foto.id);

    const fotos = await repo.obtenerPorEvaluacion('EVAL-20260923-120000-TEST-0004');
    expect(fotos.length).toBe(0);

    const cola = await bd.colaSincronizacion.toArray();
    const elementoEliminar = cola.find((c) => c.operacion === 'ELIMINAR');
    expect(elementoEliminar).toBeDefined();
    expect(elementoEliminar?.idEntidad).toBe(foto.id);
  });
});
