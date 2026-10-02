import { describe, it, expect } from 'vitest';
import {
  generarRespaldoZip,
  obtenerBlobRespaldoZip
} from '../../src/servicios/generadorRespaldoZip';
import { Evaluacion } from '../../src/modelos/evaluacion';
import { EvidenciaFotografica } from '../../src/modelos/evidenciaFotografica';

describe('Servicio: Generador de Respaldos Comprimidos ZIP (Etapa 4)', () => {
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
    },
    porcentajeAvance: 100,
    calificacionCumplimiento: 100,
    totalCriterios: 42,
    totalRespondidos: 42,
    totalCumple: 42,
    totalNoCumple: 0,
    totalNoAplica: 0,
    creadoEn: '2026-10-01T10:00:00.000Z',
    actualizadoEn: '2026-10-01T12:00:00.000Z',
    finalizadoEn: '2026-10-01T12:00:00.000Z',
    sincronizado: false,
    version: 1
  };

  const evidenciaMock: EvidenciaFotografica = {
    id: 'FOTO-20261001-100500-11AA',
    idEvaluacion: evaluacionMock.id,
    idCriterio: 'Q001',
    seccion: 'fisica',
    unidad: evaluacionMock.unidad,
    tipoCuarto: evaluacionMock.tipoCuarto,
    nombreArchivo: 'evidencia_q001.jpg',
    datosBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    tamanoBytes: 120,
    ancho: 1,
    alto: 1,
    descripcion: 'Foto general de puerta de acceso',
    creadoEn: '2026-10-01T10:05:00.000Z',
    sincronizado: false
  };

  it('debe generar un paquete ZIP con los archivos requeridos', async () => {
    const zip = await generarRespaldoZip(evaluacionMock, [evidenciaMock]);
    expect(zip).toBeDefined();

    // Comprobar archivos clave
    expect(zip.file(`evaluacion_${evaluacionMock.id}.json`)).not.toBeNull();
    expect(zip.file('LEEME_RESPALDO.txt')).not.toBeNull();
    expect(zip.file(`reporte_${evaluacionMock.id}.pdf`)).not.toBeNull();
    expect(zip.file(`datos_supervision_${evaluacionMock.id}.xlsx`)).not.toBeNull();

    // Carpeta de evidencias
    const carpetaEvidencias = zip.folder('evidencias');
    expect(carpetaEvidencias).not.toBeNull();
    expect(carpetaEvidencias?.file('evidencia_01_Q001.jpg')).not.toBeNull();
    expect(carpetaEvidencias?.file('indice_fotografico.json')).not.toBeNull();
  });

  it('debe generar un Blob ZIP válido', async () => {
    const blob = await obtenerBlobRespaldoZip(evaluacionMock, [evidenciaMock]);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(1000);
  });
});
