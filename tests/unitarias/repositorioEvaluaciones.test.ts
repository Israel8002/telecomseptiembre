import { describe, it, expect, beforeEach } from 'vitest';
import { BaseDatosLocal } from '../../src/db/baseDatos';
import { RepositorioEvaluaciones } from '../../src/db/repositorios/repositorioEvaluaciones';
import { DatosNuevaEvaluacion } from '../../src/modelos/evaluacion';

describe('RepositorioEvaluaciones', () => {
  let bd: BaseDatosLocal;
  let repo: RepositorioEvaluaciones;

  beforeEach(async () => {
    const nombreBd = `test_eval_${Date.now()}_${Math.random()}`;
    bd = new BaseDatosLocal(nombreBd);
    await bd.open();
    repo = new RepositorioEvaluaciones(bd);
  });

  const datosPrueba: DatosNuevaEvaluacion = {
    idUsuario: 'usr_123',
    matriculaEvaluador: '99012345',
    nombreEvaluador: 'Ing. Telecom',
    ooad: 'OOAD Baja California',
    unidad: 'HGZ No. 30 Mexicali',
    tipoCuarto: 'MDF',
    ubicacionDetallada: 'Planta Baja, Edificio A'
  };

  it('debe crear y reservar inmediatamente una evaluación con IDEVALUACION único en IndexedDB', async () => {
    const evaluacion = await repo.crearEvaluacion(datosPrueba);

    expect(evaluacion.id).toMatch(/^EVAL-/);
    expect(evaluacion.estado).toBe('EN_PROCESO');
    expect(evaluacion.matriculaEvaluador).toBe('99012345');
    expect(evaluacion.unidad).toBe('HGZ No. 30 Mexicali');
    expect(evaluacion.tipoCuarto).toBe('MDF');
    expect(evaluacion.porcentajeAvance).toBe(0);

    // Verificar en base de datos
    const recuperada = await repo.obtenerPorId(evaluacion.id);
    expect(recuperada).not.toBeNull();
    expect(recuperada?.id).toBe(evaluacion.id);

    // Verificar que se haya registrado en la cola de sincronización
    const cola = await bd.colaSincronizacion.toArray();
    expect(cola.length).toBe(1);
    expect(cola[0].tipoEntidad).toBe('EVALUACION');
    expect(cola[0].idEntidad).toBe(evaluacion.id);
    expect(cola[0].operacion).toBe('CREAR');
  });

  it('debe autoguardar respuestas individuales y recalcular métricas', async () => {
    const evaluacion = await repo.crearEvaluacion(datosPrueba);

    // Guardar respuesta Q002 como Cumple
    const actualizada1 = await repo.guardarRespuesta(evaluacion.id, 'Q002', {
      valor: 'Cumple',
      observaciones: 'Cuarto delimitado perfectamente'
    });

    expect(actualizada1.respuestas['Q002'].valor).toBe('Cumple');
    expect(actualizada1.respuestas['Q002'].observaciones).toBe('Cuarto delimitado perfectamente');
    expect(actualizada1.totalRespondidos).toBe(1);
    expect(actualizada1.totalCumple).toBe(1);
    expect(actualizada1.version).toBe(2);

    // Guardar respuesta Q003 como Sucios (no conforme)
    const actualizada2 = await repo.guardarRespuesta(evaluacion.id, 'Q003', {
      valor: 'Sucios',
      observaciones: 'Pisos requieren mantenimiento'
    });

    expect(actualizada2.totalRespondidos).toBe(2);
    expect(actualizada2.totalNoCumple).toBe(1);

    // Verificar persistencia directa en IndexedDB
    const desdeBD = await repo.obtenerPorId(evaluacion.id);
    expect(desdeBD?.totalRespondidos).toBe(2);
    expect(desdeBD?.respuestas['Q003'].valor).toBe('Sucios');
  });

  it('debe filtrar evaluaciones incompletas del usuario para continuar evaluación', async () => {
    const eval1 = await repo.crearEvaluacion(datosPrueba);
    const eval2 = await repo.crearEvaluacion({
      ...datosPrueba,
      tipoCuarto: 'IDF_TELECOM',
      unidad: 'UMF No. 28'
    });

    // Ambas están EN_PROCESO
    let incompletas = await repo.obtenerIncompletasPorUsuario('99012345');
    expect(incompletas.length).toBe(2);

    // Finalizar eval1
    await repo.finalizarEvaluacion(eval1.id);

    // Ahora sólo eval2 debe estar incompleta
    incompletas = await repo.obtenerIncompletasPorUsuario('99012345');
    expect(incompletas.length).toBe(1);
    expect(incompletas[0].id).toBe(eval2.id);

    const todas = await repo.obtenerTodasPorUsuario('99012345');
    expect(todas.length).toBe(2);
  });

  it('debe eliminar una evaluación correctamente', async () => {
    const evaluacion = await repo.crearEvaluacion(datosPrueba);
    await repo.eliminarEvaluacion(evaluacion.id);

    const recuperada = await repo.obtenerPorId(evaluacion.id);
    expect(recuperada).toBeNull();
  });
});
