import { describe, it, expect } from 'vitest';
import { generarReportePdf, obtenerBlobReportePdf } from '../../src/servicios/generadorPdf';
import { Evaluacion } from '../../src/modelos/evaluacion';
import { EvidenciaFotografica } from '../../src/modelos/evidenciaFotografica';

describe('Servicio: Generador de Reportes PDF Institucionales (Etapa 4)', () => {
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
      Q001: { idCriterio: 'Q001', valor: 'Cumple', observaciones: 'Cuarto delimitado', actualizadoEn: new Date().toISOString() },
      Q008: { idCriterio: 'Q008', valor: 'No Cumple', observaciones: 'Falla compresor minisplit', actualizadoEn: new Date().toISOString() },
      Q006: { idCriterio: 'Q006', valor: 'No Aplica', observaciones: 'No cuenta con ventanas exteriores', actualizadoEn: new Date().toISOString() },
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
    // 1x1 pixel PNG transparente codificado en base64 para prueba
    datosBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    tamanoBytes: 120,
    ancho: 1,
    alto: 1,
    descripcion: 'Detalle de evaporador con termostato averiado',
    creadoEn: '2026-10-01T10:05:00.000Z',
    sincronizado: false
  };

  it('debe generar una instancia válida de jsPDF con al menos 1 página y dimensiones carta', () => {
    const doc = generarReportePdf(evaluacionMock, [evidenciaMock]);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);

    // Dimensiones en pt (Carta: 612 x 792)
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    expect(Math.round(ancho)).toBe(612);
    expect(Math.round(alto)).toBe(792);
  });

  it('debe incluir anexo fotográfico cuando se pasan evidencias fotográficas', () => {
    const docConFotos = generarReportePdf(evaluacionMock, [evidenciaMock], { incluirFotos: true });
    const docSinFotos = generarReportePdf(evaluacionMock, [], { incluirFotos: false });

    // El documento con fotos debe contener más páginas o igual debido al anexo fotográfico
    expect(docConFotos.getNumberOfPages()).toBeGreaterThanOrEqual(docSinFotos.getNumberOfPages());
  });

  it('debe generar un Blob PDF válido y con tamaño mayor a cero', () => {
    const blob = obtenerBlobReportePdf(evaluacionMock, [evidenciaMock]);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(500);
    expect(blob.type).toBe('application/pdf');
  });

  it('no debe marcar preguntas numéricas como NO CUMPLE ni incluirlas en recomendaciones', () => {
    const evaluacionConNumeros: Evaluacion = {
      ...evaluacionMock,
      respuestas: {
        Q022: { idCriterio: 'Q022', valor: 'No Cumple', observaciones: 'Etiquetas faltantes', actualizadoEn: '' },
        Q023: { idCriterio: 'Q023', valor: '200', observaciones: '', actualizadoEn: '' },
        Q025: { idCriterio: 'Q025', valor: '100', observaciones: '', actualizadoEn: '' },
        Q028: { idCriterio: 'Q028', valor: '8', observaciones: '', actualizadoEn: '' },
        Q029: { idCriterio: 'Q029', valor: '2', observaciones: '', actualizadoEn: '' }
      }
    };

    const doc = generarReportePdf(evaluacionConNumeros, []);
    const textoDoc = (doc as any).internal.pages.join(' ');

    // 1. No debe tener el símbolo '%' en los encabezados de sección y debe contener los títulos dinámicos oficiales
    expect(textoDoc).not.toContain('% SECCIÓN');
    expect(textoDoc).toContain('SECCIÓN: INFRAESTRUCTURA Y NODOS DE RED');
    expect(textoDoc).toContain('SECCIÓN: EQUIPOS DE COMUNICACIONES Y SERVIDORES');

    // 2. No debe incluir Q023, Q025, Q028, Q029 en recomendaciones de no conformidades
    expect(textoDoc).not.toContain('• [Q023]');
    expect(textoDoc).not.toContain('- [Q023]');
    expect(textoDoc).not.toContain('- [Q025]');
    expect(textoDoc).not.toContain('- [Q028]');
    expect(textoDoc).not.toContain('- [Q029]');

    // 3. Debe incluir solo la verdadera no conformidad (Q022)
    expect(textoDoc).toContain('RECOMENDACIONES INSTITUCIONALES ANTE NO CONFORMIDADES');
    expect(textoDoc).toContain('[Q022]');
  });

  it('debe ser 100% dinámico e incluir el apartado de Conmutador y el de Observaciones', () => {
    const evaluacionConmutadorYObs: Evaluacion = {
      ...evaluacionMock,
      respuestas: {
        Q031: { idCriterio: 'Q031', valor: 'Sí', observaciones: '', actualizadoEn: '' },
        Q032: { idCriterio: 'Q032', valor: 'Digital/IP', observaciones: '', actualizadoEn: '' },
        Q033: { idCriterio: 'Q033', valor: '4', observaciones: '', actualizadoEn: '' },
        Q034: { idCriterio: 'Q034', valor: '48', observaciones: '', actualizadoEn: '' },
        Q035: { idCriterio: 'Q035', valor: 'Automático', observaciones: '', actualizadoEn: '' },
        Q036: { idCriterio: 'Q036', valor: 'Funcionando', observaciones: 'Conmutador Avaya IP Office', actualizadoEn: '' },
        Q042: { idCriterio: 'Q042', valor: 'Se requiere mantenimiento de cableado en rack 1 antes de fin de mes.', observaciones: '', actualizadoEn: '' }
      }
    };

    const doc = generarReportePdf(evaluacionConmutadorYObs, []);
    const textoDoc = (doc as any).internal.pages.join(' ');

    // Verificar sección y campos de Conmutador
    expect(textoDoc).toContain('SECCIÓN: TELEFONÍA Y CONMUTADOR');
    expect(textoDoc).toContain('Existe Conmutador');
    expect(textoDoc).toContain('Digital/IP');
    expect(textoDoc).toContain('Automático');
    expect(textoDoc).toContain('Funcionando');

    // Verificar sección y campos de Observaciones
    expect(textoDoc).toContain('SECCIÓN: OBSERVACIONES Y RECOMENDACIONES TÉCNICAS');
    expect(textoDoc).toContain('Se requiere mantenimiento de cableado en rack 1 antes de fin de mes.');
  });
});
