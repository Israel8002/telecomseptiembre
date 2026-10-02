import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServicioGoogleDrive } from '../../src/servicios/google/servicioGoogleDrive';
import * as authGoogle from '../../src/servicios/google/autenticadorGoogle';
import { EvidenciaFotografica } from '../../src/modelos/evidenciaFotografica';

describe('Servicio: Google Drive API v3 (Etapa 5)', () => {
  let servicio: ServicioGoogleDrive;

  beforeEach(async () => {
    servicio = new ServicioGoogleDrive();
    vi.spyOn(authGoogle, 'obtenerTokenAccesoGoogle').mockResolvedValue('fake-access-token');
    const { GOOGLE_CONFIG } = await import('../../src/config/googleConfig');
    GOOGLE_CONFIG.appsScriptUploadUrl = '';
  });

  it('debe resolver la jerarquía creando carpetas si no existen', async () => {
    const llamadasBuscarOCrear: Array<{ url: string; method?: string; body?: any }> = [];

    globalThis.fetch = vi.fn().mockImplementation((url: string, opts: any) => {
      llamadasBuscarOCrear.push({ url, method: opts?.method, body: opts?.body });

      // Si es búsqueda
      if (url.includes('/files?q=')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ files: [] }) // no existe
        });
      }

      // Si es creación de carpeta
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ id: 'nueva-carpeta-id-' + Math.random().toString(36).substring(7) })
      });
    }) as any;

    const idFinal = await servicio.resolverCarpetaDestino('HGZ-MF 8 ENS', 'MDF');
    expect(idFinal).toBeDefined();
    expect(idFinal).toContain('nueva-carpeta-id-');
    expect(llamadasBuscarOCrear.length).toBeGreaterThanOrEqual(2);
  });

  it('debe subir una evidencia fotográfica en formato multipart a la carpeta destino', async () => {
    let subidaUrl = '';
    let encabezados: any = {};

    globalThis.fetch = vi.fn().mockImplementation((url: string, opts: any) => {
      if (url.includes('/files?q=')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ files: [{ id: 'carpeta-mdf-123', name: 'MDF' }] })
        });
      }

      if (url.includes('upload/drive/v3/files')) {
        subidaUrl = url;
        encabezados = opts?.headers || {};
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ id: 'archivo-drive-999' })
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ id: 'carpeta-creada' })
      });
    }) as any;

    const mockEvidencia: EvidenciaFotografica = {
      id: 'FOTO-20261002-100500-11AA',
      idEvaluacion: 'EVAL-123',
      idCriterio: 'Q008',
      seccion: 'fisica',
      unidad: 'HGZ-MF 8 ENS',
      tipoCuarto: 'MDF',
      nombreArchivo: 'evidencia_q008.jpg',
      datosBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      tamanoBytes: 120,
      ancho: 1,
      alto: 1,
      descripcion: 'Detalle de sensor de clima',
      creadoEn: '2026-10-02T10:05:00.000Z',
      sincronizado: false
    };

    const resultado = await servicio.subirEvidenciaFotografica(mockEvidencia);

    expect(resultado.idArchivo).toBe('archivo-drive-999');
    expect(resultado.urlDrive).toContain('https://drive.google.com/file/d/archivo-drive-999/view');
    expect(subidaUrl).toContain('uploadType=multipart');
    expect(encabezados['Content-Type']).toContain('multipart/related; boundary=');
  });

  it('debe purgar archivos de Google Drive asociados a una evaluación por URL y búsqueda', async () => {
    const urlsEliminadas: string[] = [];

    globalThis.fetch = vi.fn().mockImplementation((url: string, opts: any) => {
      if (opts?.method === 'DELETE') {
        urlsEliminadas.push(url);
        return Promise.resolve({ ok: true, status: 204, json: async () => ({}) });
      }

      if (url.includes('/files?q=')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            files: [
              { id: 'archivo-residual-1', name: 'mdf_reporte_EVAL-ABC.pdf' }
            ]
          })
        });
      }

      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    }) as any;

    const totalPurgados = await servicio.eliminarArchivosEvaluacion('EVAL-ABC', [
      'https://drive.google.com/file/d/archivo-conocido-1/view'
    ]);

    expect(totalPurgados).toBe(2);
    expect(urlsEliminadas.some((u) => u.includes('archivo-conocido-1'))).toBe(true);
    expect(urlsEliminadas.some((u) => u.includes('archivo-residual-1'))).toBe(true);
  });

  it('debe utilizar el puente de Google Apps Script si está configurado para evitar error 403', async () => {
    const { GOOGLE_CONFIG } = await import('../../src/config/googleConfig');
    GOOGLE_CONFIG.appsScriptUploadUrl = 'https://script.google.com/macros/s/test-bridge/exec';

    let urlLlamada = '';
    let cuerpoEnviado: any = null;

    globalThis.fetch = vi.fn().mockImplementation((url: string, opts: any) => {
      urlLlamada = url;
      cuerpoEnviado = JSON.parse(opts.body);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          id: 'gas-file-id-456',
          urlDrive: 'https://drive.google.com/file/d/gas-file-id-456/view'
        })
      });
    }) as any;

    const res = await servicio.subirViaAppsScript({
      nombreArchivo: 'foto.jpg',
      contenidoBase64: 'abc12345',
      tipoMime: 'image/jpeg',
      idCarpetaPadre: 'folder-123'
    });

    expect(res.id).toBe('gas-file-id-456');
    expect(res.urlDrive).toContain('gas-file-id-456');
    expect(urlLlamada).toBe('https://script.google.com/macros/s/test-bridge/exec');
    expect(cuerpoEnviado.nombreArchivo).toBe('foto.jpg');

    // Restaurar
    GOOGLE_CONFIG.appsScriptUploadUrl = '';
  });
});
