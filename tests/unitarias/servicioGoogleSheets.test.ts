import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServicioGoogleSheets } from '../../src/servicios/google/servicioGoogleSheets';
import * as authGoogle from '../../src/servicios/google/autenticadorGoogle';
import { Usuario } from '../../src/modelos/usuario';
import { Evaluacion } from '../../src/modelos/evaluacion';

describe('Servicio: Google Sheets API v4 (Etapa 5)', () => {
  let servicio: ServicioGoogleSheets;

  beforeEach(() => {
    servicio = new ServicioGoogleSheets();
    vi.spyOn(authGoogle, 'obtenerTokenAccesoGoogle').mockResolvedValue('fake-access-token');
  });

  it('debe estructurar y enviar la fila de un usuario a la pestaña Usuarios', async () => {
    let urlLlamada = '';
    let cuerpoLlamada = '';

    globalThis.fetch = vi.fn().mockImplementation((url: string, opts: any) => {
      urlLlamada = url;
      cuerpoLlamada = opts?.body || '';

      if (url.includes('values/Usuarios!A:A')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ values: [] })
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ updates: { updatedRows: 1 } })
      });
    }) as any;

    const mockUsuario: Usuario = {
      id: 'usr-abc-123',
      matricula: '99012345',
      nombreCompleto: 'Juan Pérez Técnico',
      correoElectronico: 'juan.perez@imss.gob.mx',
      numeroWhatsapp: '6861234567',
      rol: 'USUARIO_NORMAL',
      hashContrasena: 'hash-secreto-que-no-debe-subirse',
      salContrasena: 'sal-secreta',
      fotografiaBase64: null,
      creadoEn: '2026-10-02T10:00:00.000Z',
      actualizadoEn: '2026-10-02T10:00:00.000Z',
      sincronizado: false,
      version: 1
    };

    await servicio.sincronizarUsuario(mockUsuario);

    expect(urlLlamada).toContain('values/Usuarios!A:G:append');
    expect(cuerpoLlamada).toContain('Juan Pérez Técnico');
    expect(cuerpoLlamada).toContain('juan.perez@imss.gob.mx');
    // Asegurar que la contraseña nunca se envíe
    expect(cuerpoLlamada).not.toContain('hash-secreto');
  });

  it('debe estructurar y enviar la fila de una evaluación a la pestaña Evaluaciones', async () => {
    let urlLlamada = '';
    let cuerpoLlamada = '';

    globalThis.fetch = vi.fn().mockImplementation((url: string, opts: any) => {
      urlLlamada = url;
      cuerpoLlamada = opts?.body || '';

      if (url.includes('values/Evaluaciones!A:A')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ values: [['EVAL-PREVIA']] })
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ updates: { updatedRows: 1 } })
      });
    }) as any;

    const mockEval: Evaluacion = {
      id: 'EVAL-20261002-120000-99012345-ABCD',
      idUsuario: 'usr-1',
      matriculaEvaluador: '99012345',
      nombreEvaluador: 'Ing. Carlos Mendoza',
      ooad: 'OOAD Baja California',
      unidad: 'HGZ-MF 8 ENS',
      tipoCuarto: 'MDF',
      ubicacionDetallada: 'Planta Baja',
      estado: 'COMPLETADA',
      respuestas: {},
      porcentajeAvance: 100,
      calificacionCumplimiento: 92,
      totalCriterios: 42,
      totalRespondidos: 42,
      totalCumple: 39,
      totalNoCumple: 3,
      totalNoAplica: 0,
      creadoEn: '2026-10-02T08:00:00.000Z',
      actualizadoEn: '2026-10-02T09:00:00.000Z',
      finalizadoEn: '2026-10-02T09:00:00.000Z',
      sincronizado: false,
      version: 1
    };

    await servicio.sincronizarEvaluacion(mockEval, 'https://drive.google.com/file/d/xyz/view');

    expect(urlLlamada).toContain('values/Evaluaciones!A:P:append');
    expect(cuerpoLlamada).toContain(mockEval.id);
    expect(cuerpoLlamada).toContain('HGZ-MF 8 ENS');
    expect(cuerpoLlamada).toContain('https://drive.google.com/file/d/xyz/view');
  });

  it('debe obtener y mapear evaluaciones remotas desde la pestaña Evaluaciones', async () => {
    const mockFilaRemota = [
      'EVAL-20261002-140000-88888888-ZXCV', // id
      '88888888',                           // matriculaEvaluador
      'Ing. Laura Gómez',                   // nombreEvaluador
      'OOAD Baja California',               // ooad
      'HGR 20 TIJ',                         // unidad
      'IDF',                                // tipoCuarto
      'Piso 2 Ala Norte',                   // ubicacionDetallada
      'COMPLETADA',                         // estado
      '88',                                 // calificacionCumplimiento
      '42',                                 // totalCriterios
      '42',                                 // totalRespondidos
      '37',                                 // totalCumple
      '5',                                  // totalNoCumple
      '2026-10-02T10:00:00.000Z',           // creadoEn
      '2026-10-02T11:00:00.000Z',           // finalizadoEn
      'https://drive.google.com/open?id=123'// urlReporteDrive
    ];

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('values/Evaluaciones!A2:P')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ values: [mockFilaRemota] })
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    }) as any;

    const evaluaciones = await servicio.obtenerEvaluacionesRemotas();

    expect(evaluaciones).toHaveLength(1);
    expect(evaluaciones[0].id).toBe('EVAL-20261002-140000-88888888-ZXCV');
    expect(evaluaciones[0].nombreEvaluador).toBe('Ing. Laura Gómez');
    expect(evaluaciones[0].unidad).toBe('HGR 20 TIJ');
    expect(evaluaciones[0].tipoCuarto).toBe('IDF');
    expect(evaluaciones[0].estado).toBe('COMPLETADA');
    expect(evaluaciones[0].calificacionCumplimiento).toBe(88);
    expect(evaluaciones[0].urlReporteDrive).toBe('https://drive.google.com/open?id=123');
    expect(evaluaciones[0].origen).toBe('remoto');
  });

  it('debe obtener y mapear bitácora de auditoría desde Log_Sincronizacion', async () => {
    const mockLogs = [
      ['OP-1', '2026-10-02T10:00:00.000Z', 'EVALUACION', 'CREAR', '99012345', 'EXITO'],
      ['OP-2', '2026-10-02T10:05:00.000Z', 'EVIDENCIA', 'SUBIR_FOTO', '99012345', 'EXITO']
    ];

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('values/Log_Sincronizacion!A2:F')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ values: mockLogs })
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    }) as any;

    const logs = await servicio.obtenerLogsRemotos();

    expect(logs).toHaveLength(2);
    expect(logs[0].idOperacion).toBe('OP-2'); // Ordenado descendentemente por fecha
    expect(logs[0].accion).toBe('SUBIR_FOTO');
    expect(logs[1].idOperacion).toBe('OP-1');
  });

  it('debe eliminar la fila de la evaluación y las filas de sus fotografías en Google Sheets mediante batchUpdate', async () => {
    let batchUpdateBody: any = null;

    globalThis.fetch = vi.fn().mockImplementation((url: string, opts: any) => {
      if (url.includes('?fields=sheets')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            sheets: [
              { properties: { title: 'Evaluaciones', sheetId: 101 } },
              { properties: { title: 'Fotografias_Metadatos', sheetId: 202 } }
            ]
          })
        });
      }

      if (url.includes('values/Evaluaciones!A:P')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            values: [
              ['EVAL-OTHER', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
              ['EVAL-A-BORRAR', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'https://drive.google.com/file/d/pdf-drive-123/view']
            ]
          })
        });
      }

      if (url.includes('values/Fotografias_Metadatos!A:I')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            values: [
              ['FOTO-1', 'EVAL-A-BORRAR', '', '', '', '', '', '', 'https://drive.google.com/file/d/foto-drive-456/view'],
              ['FOTO-2', 'OTRA-EVAL', '', '', '', '', '', '', ''],
              ['FOTO-3', 'EVAL-A-BORRAR', '', '', '', '', '', '', 'https://drive.google.com/file/d/foto-drive-789/view']
            ]
          })
        });
      }

      if (url.includes(':batchUpdate')) {
        batchUpdateBody = JSON.parse(opts?.body || '{}');
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ replies: [] })
        });
      }

      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    }) as any;

    const urlsDrive = await servicio.eliminarEvaluacionYMetadatos('EVAL-A-BORRAR');

    expect(urlsDrive).toContain('https://drive.google.com/file/d/pdf-drive-123/view');
    expect(urlsDrive).toContain('https://drive.google.com/file/d/foto-drive-456/view');
    expect(urlsDrive).toContain('https://drive.google.com/file/d/foto-drive-789/view');
    expect(batchUpdateBody).toBeDefined();
    expect(batchUpdateBody.requests).toBeDefined();
    // 1 de Evaluaciones + 2 de Fotografias_Metadatos = 3 solicitudes deleteDimension
    expect(batchUpdateBody.requests.length).toBe(3);
  });
});

