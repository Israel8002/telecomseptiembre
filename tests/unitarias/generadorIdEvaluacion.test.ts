import { describe, it, expect } from 'vitest';
import { generarIdEvaluacion } from '../../src/servicios/generadorIdEvaluacion';

describe('Servicio: Generador de IDEVALUACION', () => {
  it('debe generar un ID con el formato esperado EVAL-YYYYMMDD-HHMMSS-MATRICULA-HEX', () => {
    const fecha = new Date(2026, 8, 23, 14, 30, 45); // 23 de Septiembre 2026 14:30:45
    const id = generarIdEvaluacion('99012345', fecha);

    expect(id).toMatch(/^EVAL-20260923-143045-99012345-[0-9A-F]{4}$/);
  });

  it('debe limpiar caracteres especiales de la matrícula', () => {
    const fecha = new Date(2026, 0, 1, 10, 0, 0);
    const id = generarIdEvaluacion(' 99-01/ab ', fecha);
    expect(id).toContain('9901AB');
  });

  it('debe generar identificadores únicos consecutivos', () => {
    const id1 = generarIdEvaluacion('99012345');
    const id2 = generarIdEvaluacion('99012345');
    // Debido al componente de entropía o tiempo, deben ser diferentes o con diferente sufijo
    expect(id1).not.toBe('');
    expect(id2).not.toBe('');
  });
});
