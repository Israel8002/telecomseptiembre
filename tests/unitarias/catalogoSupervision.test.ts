import { describe, it, expect } from 'vitest';
import {
  SECCIONES_SUPERVISION,
  CRITERIOS_SUPERVISION,
  calcularMetricasEvaluacion,
  evaluarVisibilidad,
  COMPLIANT_VALUES,
  NEUTRAL_VALUES,
  sections,
  questions
} from '../../src/servicios/catalogoSupervision';
import { RespuestaCriterio } from '../../src/modelos/evaluacion';

describe('Catálogo Oficial de Supervisión (Catalogos del sistema.txt)', () => {
  it('debe contar con las 8 secciones institucionales oficiales', () => {
    const idsSecciones = SECCIONES_SUPERVISION.map((s) => s.id);
    expect(idsSecciones).toEqual([
      'fisica',
      'seguridad',
      'control',
      'infraestructura',
      'equipos',
      'telefonia',
      'ups',
      'observaciones'
    ]);
    expect(sections.length).toBe(8);
  });

  it('debe contar con exactamente 42 reactivos institucionales (Q001 a Q042) con IDs únicos', () => {
    expect(CRITERIOS_SUPERVISION.length).toBe(42);
    expect(questions.length).toBe(42);

    const ids = new Set<string>();
    for (const q of CRITERIOS_SUPERVISION) {
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);
      expect([
        'fisica',
        'seguridad',
        'control',
        'infraestructura',
        'equipos',
        'telefonia',
        'ups',
        'observaciones'
      ]).toContain(q.seccion);
      expect(['radio', 'number', 'textarea']).toContain(q.tipo);
    }

    // Verificar primer y último reactivo
    expect(CRITERIOS_SUPERVISION[0].id).toBe('Q001');
    expect(CRITERIOS_SUPERVISION[41].id).toBe('Q042');
    expect(CRITERIOS_SUPERVISION[41].tipo).toBe('textarea');
  });

  it('debe evaluar correctamente la visibilidad condicional de reactivos (visibleIf)', () => {
    const respuestas: Record<string, RespuestaCriterio> = {};

    // Q014 depende de Q013 === 'Existe'
    const q014 = CRITERIOS_SUPERVISION.find((q) => q.id === 'Q014')!;
    expect(evaluarVisibilidad(q014, respuestas)).toBe(false);

    respuestas['Q013'] = { idCriterio: 'Q013', valor: 'No existe', actualizadoEn: '' };
    expect(evaluarVisibilidad(q014, respuestas)).toBe(false);

    respuestas['Q013'] = { idCriterio: 'Q013', valor: 'Existe', actualizadoEn: '' };
    expect(evaluarVisibilidad(q014, respuestas)).toBe(true);

    // Q015 depende de Q014 === 'CO₂'
    const q015 = CRITERIOS_SUPERVISION.find((q) => q.id === 'Q015')!;
    expect(evaluarVisibilidad(q015, respuestas)).toBe(false);

    respuestas['Q014'] = { idCriterio: 'Q014', valor: 'CO₂', actualizadoEn: '' };
    expect(evaluarVisibilidad(q015, respuestas)).toBe(true);

    // Q032 a Q036 dependen de Q031 === 'Sí'
    const q032 = CRITERIOS_SUPERVISION.find((q) => q.id === 'Q032')!;
    expect(evaluarVisibilidad(q032, respuestas)).toBe(false);

    respuestas['Q031'] = { idCriterio: 'Q031', valor: 'Sí', actualizadoEn: '' };
    expect(evaluarVisibilidad(q032, respuestas)).toBe(true);
  });

  it('debe calcular métricas de avance y cumplimiento institucional con COMPLIANT_VALUES y NEUTRAL_VALUES', () => {
    const respuestas: Record<string, RespuestaCriterio> = {
      // Q002: peso 5, Cumple -> 5 pts
      Q002: { idCriterio: 'Q002', valor: 'Cumple', actualizadoEn: '' },
      // Q003: peso 5, Limpios -> 5 pts
      Q003: { idCriterio: 'Q003', valor: 'Limpios', actualizadoEn: '' },
      // Q004: peso 5, Sucios -> No conforme -> 0 pts
      Q004: { idCriterio: 'Q004', valor: 'Sucios', actualizadoEn: '' },
      // Q006: peso 5, No Aplica -> Neutro
      Q006: { idCriterio: 'Q006', valor: 'No Aplica', actualizadoEn: '' }
    };

    const metricas = calcularMetricasEvaluacion(respuestas, CRITERIOS_SUPERVISION);
    expect(metricas.totalRespondidos).toBe(4);
    expect(metricas.totalCumple).toBe(2);
    expect(metricas.totalNoCumple).toBe(1);
    expect(metricas.totalNoAplica).toBe(1);

    expect(COMPLIANT_VALUES.has('Cumple')).toBe(true);
    expect(COMPLIANT_VALUES.has('Limpios')).toBe(true);
    expect(NEUTRAL_VALUES.has('No Aplica')).toBe(true);
  });
});
