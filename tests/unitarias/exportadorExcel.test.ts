import { describe, it, expect } from 'vitest';
import {
  generarLibroExcel,
  obtenerBufferExcel,
  obtenerBlobExcel
} from '../../src/servicios/exportadorExcel';
import { Evaluacion } from '../../src/modelos/evaluacion';
import { EvidenciaFotografica } from '../../src/modelos/evidenciaFotografica';

describe('Servicio: Exportador a Hojas de Cálculo Excel (Etapa 4)', () => {
  const evaluacionMock: Evaluacion = {
    id: 'EVAL-20261001-120000-99012345-ABCD',
    idUsuario: 'usr-123',
    matriculaEvaluador: '99012345',
    nombreEvaluador: 'Ing. Carlos Mendoza',
    ooad: 'OOAD Baja California',
    unidad: 'HGZ-MF 8 ENS',
    tipoCuarto: 'MDF',
    ubicacionDetallada: 'Planta Baja - Edificio A',
    estado: 'COMPLETADA',
    respuestas: {
      Q001: { idCriterio: 'Q001', valor: 'Cumple', observaciones: 'Puerta sellada y delimitada', actualizadoEn: new Date().toISOString() },
      Q008: { idCriterio: 'Q008', valor: 'No Cumple', observaciones: 'AC requiere mantenimiento', actualizadoEn: new Date().toISOString() },
    },
    porcentajeAvance: 100,
    calificacionCumplimiento: 85,
    totalCriterios: 42,
    totalRespondidos: 42,
    totalCumple: 36,
    totalNoCumple: 4,
    totalNoAplica: 2,
    creadoEn: '2026-10-01T10:00:00.000Z',
    actualizadoEn: '2026-10-01T12:00:00.000Z',
    finalizadoEn: '2026-10-01T12:00:00.000Z',
    sincronizado: false,
    version: 1
  };

  const evidenciaMock: EvidenciaFotografica = {
    id: 'FOTO-20261001-100500-11AA',
    idEvaluacion: evaluacionMock.id,
    idCriterio: 'Q008',
    seccion: 'fisica',
    unidad: evaluacionMock.unidad,
    tipoCuarto: evaluacionMock.tipoCuarto,
    nombreArchivo: 'evidencia_q008.jpg',
    datosBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    tamanoBytes: 120,
    ancho: 1,
    alto: 1,
    descripcion: 'Detalle de evaporador con termostato averiado',
    creadoEn: '2026-10-01T10:05:00.000Z',
    sincronizado: false
  };

  it('debe generar un libro de trabajo Excel con 3 hojas estructuradas', () => {
    const libro = generarLibroExcel(evaluacionMock, [evidenciaMock]);
    expect(libro).toBeDefined();
    expect(libro.SheetNames).toEqual([
      'Resumen Ejecutivo',
      'Detalle de Respuestas',
      'Registro de Evidencias'
    ]);
  });

  it('debe incluir los datos de la evaluación en la hoja Resumen Ejecutivo', () => {
    const libro = generarLibroExcel(evaluacionMock, [evidenciaMock]);
    const hojaResumen = libro.Sheets['Resumen Ejecutivo'];
    expect(hojaResumen).toBeDefined();
    // Validar celdas con datos
    expect(JSON.stringify(hojaResumen)).toContain('HGZ-MF 8 ENS');
    expect(JSON.stringify(hojaResumen)).toContain(evaluacionMock.id);
  });

  it('debe generar un buffer binario y un Blob válido de tipo xlsx', () => {
    const buffer = obtenerBufferExcel(evaluacionMock, [evidenciaMock]);
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(1000);

    const blob = obtenerBlobExcel(evaluacionMock, [evidenciaMock]);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(blob.size).toBeGreaterThan(1000);
  });
});
