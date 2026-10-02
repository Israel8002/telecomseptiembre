/**
 * Modelo de datos para las evidencias fotográficas de supervisión
 * Permite documentar hallazgos visuales vinculados a reactivos o al cuarto completo.
 */

export interface EvidenciaFotografica {
  id: string; // FOTO-YYYYMMDD-HHMMSS-HEX4
  idEvaluacion: string;
  idCriterio?: string; // Opcional: ID de la pregunta, ej. 'Q002', 'Q013'
  seccion?: string; // Opcional: 'fisica', 'seguridad', etc.
  unidad: string;
  tipoCuarto: string;
  nombreArchivo: string;
  datosBase64: string; // Imagen comprimida en formato base64 JPEG/WebP
  tamanoBytes: number;
  ancho: number;
  alto: number;
  descripcion?: string; // Pie de foto / notas técnicas del hallazgo
  creadoEn: string; // ISO
  sincronizado: boolean;
}

export interface DatosNuevaEvidencia {
  idEvaluacion: string;
  idCriterio?: string;
  seccion?: string;
  unidad: string;
  tipoCuarto: string;
  nombreArchivo: string;
  archivoODataUrl: File | string;
  descripcion?: string;
}
