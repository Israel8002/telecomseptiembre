import React, { useState, useEffect, useMemo } from 'react';
import { TipoCuartoTelecom } from '../../modelos/evaluacion';
import { LISTA_OOAD_SUGERIDAS } from '../../servicios/catalogoSupervision';
import { units, rooms, Unidad, Cuarto } from '../../servicios/catalogosOficiales';
import './ModalNuevaEvaluacion.css';

interface PropsModalNuevaEvaluacion {
  alCerrar: () => void;
  alIniciar: (datos: {
    ooad: string;
    unidad: string;
    tipoCuarto: TipoCuartoTelecom;
    ubicacionDetallada: string;
  }) => Promise<void>;
}

export const ModalNuevaEvaluacion: React.FC<PropsModalNuevaEvaluacion> = ({ alCerrar, alIniciar }) => {
  const [ooad, setOoad] = useState('OOAD Baja California');
  // Por defecto inicializamos con la primera unidad del catálogo ordenado por ID (ID: 22 OOADBC)
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<string>(units[0]?.nombre || '');
  const [esOtraUnidad, setEsOtraUnidad] = useState<boolean>(false);
  const [unidadManual, setUnidadManual] = useState<string>('');

  const [cuartoSeleccionado, setCuartoSeleccionado] = useState<string>('MDF');
  const [esOtroCuarto, setEsOtroCuarto] = useState<boolean>(false);
  const [cuartoManual, setCuartoManual] = useState<string>('');

  const [ubicacionDetallada, setUbicacionDetallada] = useState('');
  const [errorUnidad, setErrorUnidad] = useState<string | null>(null);
  const [errorCuarto, setErrorCuarto] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Buscar la unidad actual en el catálogo para filtrar sus cuartos específicos
  const unidadObj = useMemo(() => {
    return units.find((u) => u.nombre.toUpperCase() === unidadSeleccionada.toUpperCase());
  }, [unidadSeleccionada]);

  // Cuartos pertenecientes a la unidad seleccionada
  const cuartosDisponibles: Cuarto[] = useMemo(() => {
    if (unidadObj) {
      const encontrados = rooms.filter((r) => r.unitId === unidadObj.id);
      if (encontrados.length > 0) return encontrados;
    }
    // Si no hay cuartos específicos en catálogo para esta unidad, ofrecer MDF por defecto
    return [
      { id: 'cuarto_mdf_def', unitId: unidadObj?.id || 0, nombre: 'MDF' },
      { id: 'cuarto_idf_def', unitId: unidadObj?.id || 0, nombre: 'IDF' },
    ];
  }, [unidadObj]);

  // Al cambiar la unidad, actualizar el cuarto por defecto correspondiente a esa unidad
  useEffect(() => {
    if (cuartosDisponibles.length > 0 && !esOtroCuarto) {
      setCuartoSeleccionado(cuartosDisponibles[0].nombre);
    }
  }, [cuartosDisponibles, esOtroCuarto]);

  const alCambiarUnidad = (valor: string) => {
    if (valor === '__OTRA__') {
      setEsOtraUnidad(true);
      setUnidadSeleccionada('');
    } else {
      setEsOtraUnidad(false);
      setUnidadSeleccionada(valor);
    }
    if (errorUnidad) setErrorUnidad(null);
  };

  const alCambiarCuarto = (valor: string) => {
    if (valor === '__OTRO__') {
      setEsOtroCuarto(true);
      setCuartoSeleccionado('');
    } else {
      setEsOtroCuarto(false);
      setCuartoSeleccionado(valor);
    }
    if (errorCuarto) setErrorCuarto(null);
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();

    const nombreUnidadFinal = esOtraUnidad ? unidadManual.trim() : unidadSeleccionada.trim();
    if (!nombreUnidadFinal) {
      setErrorUnidad('Por favor seleccione o especifique la unidad médica o administrativa.');
      return;
    }

    const nombreCuartoFinal = esOtroCuarto ? cuartoManual.trim() : cuartoSeleccionado.trim();
    if (!nombreCuartoFinal) {
      setErrorCuarto('Por favor seleccione o especifique el cuarto de comunicaciones.');
      return;
    }

    try {
      setGuardando(true);
      setErrorUnidad(null);
      setErrorCuarto(null);

      await alIniciar({
        ooad,
        unidad: nombreUnidadFinal,
        tipoCuarto: nombreCuartoFinal,
        ubicacionDetallada: ubicacionDetallada.trim(),
      });
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al iniciar evaluación';
      setErrorUnidad(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  // Validar si el valor actual no está en la lista de units (por ejemplo en tests de integración)
  const unidadEstaEnCatalogo = units.some((u) => u.nombre === unidadSeleccionada);

  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-labelledby="titulo-nueva-evaluacion">
      <div className="modal-contenido">
        <div className="modal-cabecera">
          <h2 id="titulo-nueva-evaluacion" className="modal-titulo">
            <span>📋</span> Nueva Supervisión de Cuarto Telecom
          </h2>
          <p className="modal-subtitulo">
            Se generará y reservará de inmediato un <strong>IDEVALUACION</strong> único en la base local.
          </p>
        </div>

        <form onSubmit={manejarEnvio} noValidate>
          {/* Órgano de Operación Administrativa Desconcentrada */}
          <div className="campo-formulario">
            <label htmlFor="selector-ooad" className="etiqueta-formulario">
              Órgano de Operación Administrativa Desconcentrada (OOAD) *
            </label>
            <select
              id="selector-ooad"
              className="selector-formulario"
              value={ooad}
              onChange={(e) => setOoad(e.target.value)}
              disabled={guardando}
            >
              {LISTA_OOAD_SUGERIDAS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Unidad Médica o Administrativa (Ordenadas estrictamente por ID de catálogo) */}
          <div className="campo-formulario">
            <label htmlFor="campo-unidad" className="etiqueta-formulario">
              Unidad Médica o Administrativa (Catálogo Oficial por ID) *
            </label>
            <select
              id="campo-unidad"
              className="selector-formulario"
              value={esOtraUnidad ? '__OTRA__' : unidadSeleccionada}
              onChange={(e) => alCambiarUnidad(e.target.value)}
              disabled={guardando}
              autoFocus
            >
              {/* Opción si hay un valor personalizado no existente en catálogo */}
              {!unidadEstaEnCatalogo && unidadSeleccionada && (
                <option value={unidadSeleccionada}>{unidadSeleccionada}</option>
              )}

              {units.map((u: Unidad) => (
                <option key={u.id} value={u.nombre}>
                  [{u.id}] {u.nombre} — {u.tipo} ({u.cityId})
                </option>
              ))}

              <option value="__OTRA__">-- Otra unidad no listada (especificar) --</option>
            </select>

            {esOtraUnidad && (
              <input
                type="text"
                className="entrada-texto"
                style={{ marginTop: '8px' }}
                placeholder="Especifique el nombre de la unidad..."
                value={unidadManual}
                onChange={(e) => {
                  setUnidadManual(e.target.value);
                  if (errorUnidad) setErrorUnidad(null);
                }}
                disabled={guardando}
              />
            )}
            {errorUnidad && <span className="texto-error">{errorUnidad}</span>}
          </div>

          {/* Cuarto de Comunicaciones (Filtrado dinámicamente según la unidad seleccionada) */}
          <div className="campo-formulario">
            <label htmlFor="selector-tipo-cuarto" className="etiqueta-formulario">
              Cuarto de Comunicaciones (Asociado a la Unidad) *
            </label>
            <select
              id="selector-tipo-cuarto"
              className="selector-formulario"
              value={esOtroCuarto ? '__OTRO__' : cuartoSeleccionado}
              onChange={(e) => alCambiarCuarto(e.target.value)}
              disabled={guardando}
            >
              {cuartosDisponibles.map((cuarto: Cuarto) => (
                <option key={cuarto.id} value={cuarto.nombre}>
                  {cuarto.nombre}
                </option>
              ))}
              <option value="__OTRO__">-- Otro cuarto no listado (especificar) --</option>
            </select>

            {esOtroCuarto && (
              <input
                type="text"
                className="entrada-texto"
                style={{ marginTop: '8px' }}
                placeholder="Especifique el nombre o identificación del cuarto..."
                value={cuartoManual}
                onChange={(e) => {
                  setCuartoManual(e.target.value);
                  if (errorCuarto) setErrorCuarto(null);
                }}
                disabled={guardando}
              />
            )}
            {errorCuarto && <span className="texto-error">{errorCuarto}</span>}
          </div>

          {/* Ubicación física */}
          <div className="campo-formulario">
            <label htmlFor="campo-ubicacion" className="etiqueta-formulario">
              Ubicación Física o Referencia en Inmueble (Opcional)
            </label>
            <input
              id="campo-ubicacion"
              type="text"
              className="entrada-texto"
              placeholder="Ej. Sótano técnico, pasillo central, piso 2..."
              value={ubicacionDetallada}
              onChange={(e) => setUbicacionDetallada(e.target.value)}
              disabled={guardando}
            />
          </div>

          <div className="modal-acciones">
            <button
              type="button"
              className="boton-secundario"
              onClick={alCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="boton-primario"
              style={{ width: 'auto', minWidth: '220px' }}
              disabled={guardando}
            >
              {guardando ? 'Reservando ID...' : 'Iniciar y Reservar ID'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
