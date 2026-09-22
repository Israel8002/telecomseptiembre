import { describe, it, expect } from 'vitest';

describe('Entorno de Pruebas', () => {
  it('debe ejecutar pruebas unitarias con Vitest y jsdom correctamente', () => {
    expect(1 + 1).toBe(2);
    expect(window).toBeDefined();
    expect(indexedDB).toBeDefined();
  });
});
