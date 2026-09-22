import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { obtenerEstadoRedActual, suscribirEstadoRed } from '../../src/servicios/detectorRed';
import { comprimirImagenPerfil } from '../../src/servicios/compresionImagen';

describe('Detector de Conectividad', () => {
  it('debe reportar el estado de red actual desde navigator.onLine', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    expect(obtenerEstadoRedActual()).toBe(true);

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(obtenerEstadoRedActual()).toBe(false);
  });

  it('debe notificar cambios cuando se disparan eventos online y offline', () => {
    const callback = vi.fn();
    const cancelarSuscripcion = suscribirEstadoRed(callback);

    window.dispatchEvent(new Event('offline'));
    expect(callback).toHaveBeenCalledWith(false);

    window.dispatchEvent(new Event('online'));
    expect(callback).toHaveBeenCalledWith(true);

    cancelarSuscripcion();
    window.dispatchEvent(new Event('offline'));
    expect(callback).toHaveBeenCalledTimes(2);
  });
});

describe('Compresión de Imágenes', () => {
  beforeEach(() => {
    // Mock de Canvas para entorno jsdom
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
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,mockComprimido');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe procesar una cadena base64 y devolver imagen comprimida', async () => {
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

    const resultado = await comprimirImagenPerfil('data:image/png;base64,imagenGigante', 800, 0.8);
    expect(resultado).toBe('data:image/jpeg;base64,mockComprimido');
  });
});
