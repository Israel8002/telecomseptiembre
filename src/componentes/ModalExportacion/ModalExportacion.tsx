import React, { useState } from 'react';
import { Evaluacion } from '../../modelos/evaluacion';
import { EvidenciaFotografica } from '../../modelos/evidenciaFotografica';
import { descargarReportePdf } from '../../servicios/generadorPdf';
import { descargarReporteExcel } from '../../servicios/exportadorExcel';
import { descargarRespaldoZip } from '../../servicios/generadorRespaldoZip';
import { MAPA_TIPO_CUARTO } from '../../servicios/catalogoSupervision';
import './ModalExportacion.css';

interface PropsModalExportacion {
  evaluacion: Evaluacion;
  evidencias: EvidenciaFotografica[];
  alCerrar: () => void;
}

export const ModalExportacion: React.FC<PropsModalExportacion> = ({
  evaluacion,
  evidencias,
  alCerrar
}) => {
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [descargandoExcel, setDescargandoExcel] = useState(false);
  const [descargandoZip, setDescargandoZip] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const nombreCuarto = MAPA_TIPO_CUARTO[evaluacion.tipoCuarto] || evaluacion.tipoCuarto;

  const notificarExito = (texto: string) => {
    setMensajeExito(texto);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const manejarDescargarPdf = () => {
    try {
      setDescargandoPdf(true);
      descargarReportePdf(evaluacion, evidencias);
      notificarExito('Reporte PDF descargado con éxito.');
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Hubo un error al generar el reporte PDF.');
    } finally {
      setDescargandoPdf(false);
    }
  };

  const manejarDescargarExcel = () => {
    try {
      setDescargandoExcel(true);
      descargarReporteExcel(evaluacion, evidencias);
      notificarExito('Hoja de cálculo Excel (.xlsx) descargada con éxito.');
    } catch (err) {
      console.error('Error al generar Excel:', err);
      alert('Hubo un error al generar la hoja Excel.');
    } finally {
      setDescargandoExcel(false);
    }
  };

  const manejarDescargarZip = async () => {
    try {
      setDescargandoZip(true);
      await descargarRespaldoZip(evaluacion, evidencias);
      notificarExito('Respaldo comprimido (.zip) generado y descargado con éxito.');
    } catch (err) {
      console.error('Error al generar ZIP:', err);
      alert('Hubo un error al generar el archivo de respaldo comprimido.');
    } finally {
      setDescargandoZip(false);
    }
  };

  return (
    <div className="modal-exportacion-overlay" onClick={alCerrar}>
      <div
        className="modal-exportacion-contenido"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-exportacion"
      >
        <div className="modal-exportacion-cabecera">
          <div>
            <h2 id="titulo-modal-exportacion" className="modal-exportacion-titulo">
              <span>📥</span> Reportes y Exportación de Supervisión
            </h2>
            <p className="modal-exportacion-subtitulo">
              {evaluacion.unidad} • {nombreCuarto} • Folio: {evaluacion.id}
            </p>
          </div>
          <button
            type="button"
            className="boton-cerrar-modal"
            onClick={alCerrar}
            aria-label="Cerrar ventana de exportación"
          >
            ×
          </button>
        </div>

        <div className="modal-exportacion-cuerpo">
          {/* Ficha Resumen Rápida */}
          <div className="ficha-resumen-exportacion">
            <div className="item-resumen-exportacion">
              <span className="item-resumen-etiqueta">Cumplimiento</span>
              <span
                className="item-resumen-valor"
                style={{
                  color: evaluacion.calificacionCumplimiento >= 80 ? 'var(--color-exito)' : 'var(--color-error)'
                }}
              >
                {evaluacion.calificacionCumplimiento}%
              </span>
            </div>
            <div className="item-resumen-exportacion">
              <span className="item-resumen-etiqueta">Estado</span>
              <span className="item-resumen-valor">
                {evaluacion.estado === 'COMPLETADA' ? 'Concluida' : 'En Proceso'}
              </span>
            </div>
            <div className="item-resumen-exportacion">
              <span className="item-resumen-etiqueta">Reactivos</span>
              <span className="item-resumen-valor">
                {evaluacion.totalRespondidos}/{evaluacion.totalCriterios}
              </span>
            </div>
            <div className="item-resumen-exportacion">
              <span className="item-resumen-etiqueta">Evidencias</span>
              <span className="item-resumen-valor" style={{ color: 'var(--color-primario)' }}>
                {evidencias.length} fotos
              </span>
            </div>
          </div>

          {mensajeExito && (
            <div className="banner-mensaje-exito" role="status">
              <span>✅</span> {mensajeExito}
            </div>
          )}

          {/* Opciones de descarga */}
          <div className="lista-opciones-exportacion">
            {/* Opción 1: Reporte PDF */}
            <article className="tarjeta-opcion-exportacion">
              <div className="info-opcion-exportacion">
                <div className="icono-opcion-exportacion">📄</div>
                <div className="textos-opcion-exportacion">
                  <h3 className="titulo-opcion-exportacion">Reporte Ejecutivo Oficial (PDF)</h3>
                  <p className="descripcion-opcion-exportacion">
                    Documento institucional tamaño carta con membrete oficial, resultados por sección, recomendaciones técnicas UEOD, anexo fotográfico y recuadros de firma y sello.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="boton-primario boton-accion-descarga"
                onClick={manejarDescargarPdf}
                disabled={descargandoPdf}
              >
                {descargandoPdf ? 'Generando...' : 'Descargar PDF'}
              </button>
            </article>

            {/* Opción 2: Excel XLSX */}
            <article className="tarjeta-opcion-exportacion">
              <div className="info-opcion-exportacion">
                <div className="icono-opcion-exportacion">📊</div>
                <div className="textos-opcion-exportacion">
                  <h3 className="titulo-opcion-exportacion">Libro de Cálculo Excel (.xlsx)</h3>
                  <p className="descripcion-opcion-exportacion">
                    Hojas estructuradas para análisis: Resumen Ejecutivo, Detalle completo de los 42 reactivos con dictamen y observaciones, y Registro de Evidencias.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="boton-primario boton-accion-descarga"
                style={{ backgroundColor: '#107c41', borderColor: '#107c41' }}
                onClick={manejarDescargarExcel}
                disabled={descargandoExcel}
              >
                {descargandoExcel ? 'Generando...' : 'Descargar Excel'}
              </button>
            </article>

            {/* Opción 3: Respaldo ZIP */}
            <article className="tarjeta-opcion-exportacion">
              <div className="info-opcion-exportacion">
                <div className="icono-opcion-exportacion">📦</div>
                <div className="textos-opcion-exportacion">
                  <h3 className="titulo-opcion-exportacion">Paquete de Respaldo Completo (.zip)</h3>
                  <p className="descripcion-opcion-exportacion">
                    Archivo comprimido de auditoría con la base íntegra: evaluación en JSON, reporte PDF, datos en Excel y la carpeta completa de fotografías en alta calidad.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="boton-primario boton-accion-descarga"
                style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
                onClick={manejarDescargarZip}
                disabled={descargandoZip}
              >
                {descargandoZip ? 'Empaquetando...' : 'Descargar .ZIP'}
              </button>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
};
