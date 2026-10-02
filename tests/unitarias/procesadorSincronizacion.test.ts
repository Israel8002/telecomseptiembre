import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseDatosLocal } from '../../src/db/baseDatos';
import { ProcesadorSincronizacion } from '../../src/servicios/google/procesadorSincronizacion';
import { servicioGoogleSheets } from '../../src/servicios/google/servicioGoogleSheets';
import * as detectorRed from '../../src/servicios/detectorRed';
import { Usuario } from '../../src/modelos/usuario';

describe('Servicio: Procesador de Sincronización en Segundo Plano (Etapa 5)', () => {
  let bd: BaseDatosLocal;
  let procesador: ProcesadorSincronizacion;

  beforeEach(async () => {
    // Base de datos en memoria para prueba aislada
    bd = new BaseDatosLocal(`TestSyncDB_${Date.now()}_${Math.random()}`);
    await bd.open();

    procesador = new ProcesadorSincronizacion(bd);
    vi.spyOn(detectorRed, 'obtenerEstadoRedActual').mockReturnValue(true);
  });

  it('debe procesar un usuario en cola, enviarlo a Sheets y marcarlo como sincronizado', async () => {
    const mockUsuario: Usuario = {
      id: 'usr-1',
      matricula: '99012345',
      nombreCompleto: 'Prueba Técnico',
      correoElectronico: 'prueba@imss.gob.mx',
      numeroWhatsapp: '6861234567',
      hashContrasena: 'hash123',
      salContrasena: 'sal123',
      rol: 'ADMINISTRADOR',
      fotografiaBase64: null,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
      sincronizado: false,
      version: 1
    };

    await bd.usuarios.add(mockUsuario);

    await bd.colaSincronizacion.add({
      id: 'cola-1',
      tipoEntidad: 'USUARIO',
      idEntidad: mockUsuario.id,
      operacion: 'CREAR',
      datos: JSON.stringify(mockUsuario),
      creadoEn: new Date().toISOString(),
      intentos: 0,
      ultimoError: null,
      estado: 'PENDIENTE'
    });

    const spySheets = vi.spyOn(servicioGoogleSheets, 'sincronizarUsuario').mockResolvedValue(undefined);
    const spyLog = vi.spyOn(servicioGoogleSheets, 'registrarLog').mockResolvedValue(undefined);

    await procesador.procesarCola();

    expect(spySheets).toHaveBeenCalledTimes(1);
    expect(spyLog).toHaveBeenCalledTimes(1);

    // Debe eliminarse de la cola de sincronización
    const pendientes = await bd.colaSincronizacion.count();
    expect(pendientes).toBe(0);

    // El usuario local debe tener sincronizado = true
    const usuarioActualizado = await bd.usuarios.get(mockUsuario.id);
    expect(usuarioActualizado?.sincronizado).toBe(true);
  });

  it('debe incrementar intentos y registrar el error si la sincronización falla', async () => {
    await bd.colaSincronizacion.add({
      id: 'cola-error-1',
      tipoEntidad: 'USUARIO',
      idEntidad: 'usr-inexistente',
      operacion: 'CREAR',
      datos: JSON.stringify({ id: 'usr-inexistente', matricula: '00000000' }),
      creadoEn: new Date().toISOString(),
      intentos: 0,
      ultimoError: null,
      estado: 'PENDIENTE'
    });

    vi.spyOn(servicioGoogleSheets, 'sincronizarUsuario').mockRejectedValue(new Error('Fallo de red 503'));

    await procesador.procesarCola();

    const item = await bd.colaSincronizacion.get('cola-error-1');
    expect(item).toBeDefined();
    expect(item?.intentos).toBe(1);
    expect(item?.estado).toBe('FALLIDO');
    expect(item?.ultimoError).toContain('Fallo de red 503');
  });

  it('debe procesar la operación ELIMINAR de una evaluación purgando Sheets y Drive', async () => {
    const idEvaluacion = 'EVAL-BORRAR-999';

    await bd.colaSincronizacion.add({
      id: 'cola-eliminar-1',
      tipoEntidad: 'EVALUACION',
      idEntidad: idEvaluacion,
      operacion: 'ELIMINAR',
      datos: JSON.stringify({ id: idEvaluacion }),
      creadoEn: new Date().toISOString(),
      intentos: 0,
      ultimoError: null,
      estado: 'PENDIENTE'
    });

    const spyEliminarSheets = vi.spyOn(servicioGoogleSheets, 'eliminarEvaluacionYMetadatos').mockResolvedValue([
      'https://drive.google.com/file/d/pdf-1/view'
    ]);
    const spyLog = vi.spyOn(servicioGoogleSheets, 'registrarLog').mockResolvedValue(undefined);

    await procesador.procesarCola();

    expect(spyEliminarSheets).toHaveBeenCalledWith(idEvaluacion);
    expect(spyLog).toHaveBeenCalledWith(expect.objectContaining({
      tipoEntidad: 'EVALUACION',
      accion: 'ELIMINAR',
      resultado: 'EXITOSO_PURGADO_COMPLETO'
    }));

    // Se debe retirar de la cola
    const restantes = await bd.colaSincronizacion.count();
    expect(restantes).toBe(0);
  });
});
