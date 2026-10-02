import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BaseDatosLocal } from '../../src/db/baseDatos';
import { RepositorioUsuarios } from '../../src/db/repositorios/repositorioUsuarios';
import { App } from '../../src/App';

describe('Flujo de Integración: Etapa 2 — Motor de Evaluaciones Oficial (8 Secciones, 42 Preguntas y Condicionales)', () => {
  let bdPrueba: BaseDatosLocal;

  beforeEach(async () => {
    const nombreBd = `test_eval_flow_${Date.now()}_${Math.random()}`;
    bdPrueba = new BaseDatosLocal(nombreBd);
    await bdPrueba.open();

    // Pre-poblamos con un usuario y dejamos la sesión activa
    const repoUsuarios = new RepositorioUsuarios(bdPrueba);
    const usuario = await repoUsuarios.registrarUsuario({
      matricula: '99012345',
      nombreCompleto: 'Ing. Evaluador Telecom',
      correoElectronico: 'evaluador@imss.gob.mx',
      numeroWhatsapp: '6861234567',
      contrasena: 'Admin#2026'
    });
    await repoUsuarios.guardarSesion(usuario);
  });

  it('debe iniciar nueva supervisión con catálogos oficiales, soportar condicionales y recomendaciones, guardar y continuar', async () => {
    render(<App bd={bdPrueba} />);

    // 1. Debe estar en la Pantalla Principal con sesión activa
    expect(await screen.findByText(/Ing. Evaluador Telecom/i)).toBeInTheDocument();

    // 2. Iniciar nueva supervisión
    const botonNuevaSupervision = await screen.findByRole('button', { name: /Nueva Supervisión/i });
    fireEvent.click(botonNuevaSupervision);

    // 3. Modal de nueva evaluación debe abrirse
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Nueva Supervisión de Cuarto Telecom/i)).toBeInTheDocument();

    // Seleccionar unidad oficial
    const campoUnidad = screen.getByLabelText(/Unidad Médica o Administrativa/i);
    fireEvent.change(campoUnidad, { target: { value: 'HGE 30 MXL' } });

    const botonIniciarYReservar = screen.getByRole('button', { name: /Iniciar y Reservar ID/i });
    fireEvent.click(botonIniciarYReservar);

    // 4. Debe entrar a PantallaEvaluacion mostrando el IDEVALUACION reservado
    expect(await screen.findByRole('main', { name: /Cuestionario de Supervisión/i })).toBeInTheDocument();
    expect(screen.getByText(/HGE 30 MXL/i)).toBeInTheDocument();

    const badgeId = screen.getByTitle(/Identificador único reservado/i);
    expect(badgeId.textContent).toMatch(/^EVAL-/);
    const idEvaluacionGenerado = badgeId.textContent!;

    // 5. Verificar que se encuentra en la sección inicial oficial: Física
    expect(screen.getByText(/Mantenimiento y Acabados Físicos/i)).toBeInTheDocument();

    // 6. Responder reactivo Q002 ("Cuarto delimitado") como "Cumple"
    const grupoQ002 = screen.getByRole('group', { name: /Respuesta para Q002/i });
    const botonCumpleQ002 = within(grupoQ002).getByRole('button', { name: /^Cumple$/i });
    fireEvent.click(botonCumpleQ002);

    // Escribir evidencia u observación técnica en Q002
    const campoObsQ002 = await screen.findByLabelText(/Observaciones \/ Evidencia técnica para Q002/i);
    fireEvent.change(campoObsQ002, { target: { value: 'Puerta con cerradura y delimitación perimetral correcta' } });
    fireEvent.blur(campoObsQ002);

    // 7. Responder reactivo Q003 ("Estado de pisos") como "Sucios"
    const grupoQ003 = screen.getByRole('group', { name: /Respuesta para Q003/i });
    const botonSuciosQ003 = grupoQ003.querySelector('button:nth-child(2)')!;
    fireEvent.click(botonSuciosQ003);

    // Verificar que se activa la recomendación institucional técnica para Q003
    expect(await screen.findByText(/Pisos requiere mantenimiento/i)).toBeInTheDocument();

    // Verificar progreso
    expect(await screen.findByText(/Progreso: 2 de/i)).toBeInTheDocument();

    // 8. Flujo de Resistencia: Guardar y salir
    const botonGuardarYSalir = screen.getByRole('button', { name: /Guardar y volver al panel principal/i });
    fireEvent.click(botonGuardarYSalir);

    // 9. Vuelve al Panel Principal y se observa la tarjeta en "Evaluaciones en Proceso"
    expect(await screen.findByText(/Evaluaciones en Proceso \(Incompletas\)/i)).toBeInTheDocument();
    expect(screen.getByText(/HGE 30 MXL/i)).toBeInTheDocument();
    expect(screen.getByText(idEvaluacionGenerado)).toBeInTheDocument();

    // 10. Flujo: Continuar evaluación incompleta
    const botonContinuar = screen.getByRole('button', { name: /Continuar Evaluación →/i });
    fireEvent.click(botonContinuar);

    // 11. Se restaura el cuestionario con los datos y respuestas exactamente como se dejaron
    expect(await screen.findByRole('main', { name: /Cuestionario de Supervisión/i })).toBeInTheDocument();
    expect(screen.getByText(idEvaluacionGenerado)).toBeInTheDocument();
    expect(await screen.findByDisplayValue(/Puerta con cerradura y delimitación perimetral correcta/i)).toBeInTheDocument();

    // 12. Navegar a la sección: Seguridad para probar pregunta condicional
    const pestanaSeguridad = screen.getByRole('button', { name: /Seguridad/i });
    fireEvent.click(pestanaSeguridad);
    expect(await screen.findByText(/Seguridad Básica y Control Físico/i)).toBeInTheDocument();

    // Por defecto, Q014 ("Tipo de extintor") NO debe estar visible porque Q013 no es "Existe"
    expect(screen.queryByText(/Tipo de extintor/i)).not.toBeInTheDocument();

    // Responder Q013 como "Existe"
    const grupoQ013 = screen.getByRole('group', { name: /Respuesta para Q013/i });
    const botonExisteQ013 = within(grupoQ013).getByRole('button', { name: /^Existe$/i });
    fireEvent.click(botonExisteQ013);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Tipo de extintor/i })).toBeInTheDocument();
    });

    // 13. Ir a la última pestaña (Observaciones) y concluir supervisión
    const pestanaObservaciones = screen.getByRole('button', { name: /Observaciones/i });
    fireEvent.click(pestanaObservaciones);
    expect(await screen.findByText(/Observaciones y Recomendaciones Técnicas/i)).toBeInTheDocument();

    const botonConcluir = screen.getByRole('button', { name: /Revisar y Concluir Supervisión/i });
    fireEvent.click(botonConcluir);

    // Debe mostrar modal de confirmación con el resumen institucional
    expect(await screen.findByText(/Resumen de Supervisión/i)).toBeInTheDocument();

    // Confirmar y Finalizar
    const botonConfirmar = screen.getByRole('button', { name: /Confirmar y Finalizar/i });
    fireEvent.click(botonConfirmar);

    // 14. Regresa al Panel Principal: La evaluación aparece en Historial de Concluidas
    await waitFor(() => {
      expect(screen.queryByText(/Evaluaciones en Proceso \(Incompletas\)/i)).not.toBeInTheDocument();
    });

    expect(await screen.findByText(/Historial de Evaluaciones Concluidas/i)).toBeInTheDocument();
    expect(screen.getAllByText(idEvaluacionGenerado).length).toBeGreaterThanOrEqual(1);
  });
});
