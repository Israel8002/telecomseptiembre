import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BaseDatosLocal } from '../../src/db/baseDatos';
import { ProveedorAutenticacion } from '../../src/contextos/ContextoAutenticacion';
import { App } from '../../src/App';

describe('Flujo de Integración: Inicio -> Registro de Administrador -> Sesión Persistente -> Login', () => {
  let bdPrueba: BaseDatosLocal;

  beforeEach(async () => {
    const nombreBd = `test_e2e_${Date.now()}_${Math.random()}`;
    bdPrueba = new BaseDatosLocal(nombreBd);
    await bdPrueba.open();
  });

  it('debe completar el flujo completo desde pantalla inicial hasta sesión de administrador', async () => {
    // Renderizamos la App inyectando la base de datos aislada
    render(<App bd={bdPrueba} />);

    // 1. Verificar que arranca en la pantalla de inicio limpia mostrando solo el logo
    const botonLogo = await screen.findByRole('button', { name: /Iniciar evaluación/i });
    expect(botonLogo).toBeInTheDocument();
    expect(screen.getByText(/Presione para iniciar supervisión/i)).toBeInTheDocument();

    // 2. Presionar el logo cuando la base de datos está vacía
    fireEvent.click(botonLogo);

    // 3. Debe navegar a la pantalla de Registro mostrando el aviso de ADMINISTRADOR
    expect(await screen.findByText(/Registro de Administrador/i)).toBeInTheDocument();
    expect(screen.getByText(/Primer usuario detectado/i)).toBeInTheDocument();

    // 4. Llenar los campos del formulario
    fireEvent.change(screen.getByLabelText(/Matrícula/i), { target: { value: '99012345' } });
    fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Ing. Carlos Mendoza' } });
    fireEvent.change(screen.getByLabelText(/Correo Institucional/i), { target: { value: 'carlos.mendoza@imss.gob.mx' } });
    fireEvent.change(screen.getByLabelText(/WhatsApp/i), { target: { value: '6861234567' } });
    fireEvent.change(screen.getByLabelText(/^Contraseña Segura/i), { target: { value: 'Admin#2026' } });
    fireEvent.change(screen.getByLabelText(/Confirmar Contraseña/i), { target: { value: 'Admin#2026' } });

    // 5. Enviar formulario
    const botonRegistro = screen.getByRole('button', { name: /Completar Registro/i });
    fireEvent.click(botonRegistro);

    // 6. Verificar que ingresa al Panel Principal con rol de Administrador
    expect(await screen.findByText(/Bienvenido, Ing. Carlos Mendoza/i)).toBeInTheDocument();
    expect(screen.getByText(/Administrador General/i)).toBeInTheDocument();
    expect(screen.getByText('99012345')).toBeInTheDocument();

    // 7. Cerrar sesión
    const botonSalir = screen.getByRole('button', { name: /Salir/i });
    fireEvent.click(botonSalir);

    // 8. Vuelve a la pantalla de Inicio
    await waitFor(() => {
      expect(screen.queryByText(/Bienvenido, Ing. Carlos Mendoza/i)).not.toBeInTheDocument();
    });

    const subtituloInicio = await screen.findByText(/Presione para iniciar supervisión/i);
    expect(subtituloInicio).toBeInTheDocument();

    // 9. Al presionar el logo ahora que ya hay un usuario registrado, debe llevar a Iniciar Sesión
    const botonLogoInicio = subtituloInicio.closest('button');
    expect(botonLogoInicio).not.toBeNull();
    fireEvent.click(botonLogoInicio!);
    expect(await screen.findByRole('heading', { name: /Iniciar Sesión/i })).toBeInTheDocument();

    // 10. Iniciar sesión con las credenciales creadas
    fireEvent.change(screen.getByLabelText(/^Matrícula/i), { target: { value: '99012345' } });
    fireEvent.change(screen.getByLabelText(/^Contraseña/i), { target: { value: 'Admin#2026' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    // 11. Verificar que vuelve a entrar correctamente
    expect(await screen.findByText(/Bienvenido, Ing. Carlos Mendoza/i)).toBeInTheDocument();
  });

  it('debe registrar al segundo usuario como Usuario Técnico (USUARIO_NORMAL)', async () => {
    // 1. Pre-poblamos con un primer usuario (Admin)
    const { RepositorioUsuarios } = await import('../../src/db/repositorios/repositorioUsuarios');
    const repo = new RepositorioUsuarios(bdPrueba);
    await repo.registrarUsuario({
      matricula: '99000001',
      nombreCompleto: 'Administrador Inicial',
      correoElectronico: 'admin.inicial@imss.gob.mx',
      numeroWhatsapp: '6860000001',
      contrasena: 'Admin123#'
    });

    render(<App bd={bdPrueba} />);

    // 2. Presionar el logo -> debe llevar a Login porque ya existe un usuario
    const subtituloInicio = await screen.findByText(/Presione para iniciar supervisión/i);
    const botonLogoInicio = subtituloInicio.closest('button');
    fireEvent.click(botonLogoInicio!);

    // 3. Desde Login, hacer clic en "Registrar nuevo usuario"
    const enlaceRegistro = await screen.findByRole('button', { name: /Registrar nuevo usuario/i });
    fireEvent.click(enlaceRegistro);

    // 4. Verificar que el título es "Registro de Usuario" (NO de Administrador) y no muestra aviso de Administrador
    expect(await screen.findByText(/^Registro de Usuario$/i)).toBeInTheDocument();
    expect(screen.queryByText(/Primer usuario detectado/i)).not.toBeInTheDocument();

    // 5. Llenar y enviar registro de segundo usuario
    fireEvent.change(screen.getByLabelText(/Matrícula/i), { target: { value: '99000002' } });
    fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Técnico Telecom' } });
    fireEvent.change(screen.getByLabelText(/Correo Institucional/i), { target: { value: 'tecnico@imss.gob.mx' } });
    fireEvent.change(screen.getByLabelText(/WhatsApp/i), { target: { value: '6860000002' } });
    fireEvent.change(screen.getByLabelText(/^Contraseña Segura/i), { target: { value: 'Tecnico123#' } });
    fireEvent.change(screen.getByLabelText(/Confirmar Contraseña/i), { target: { value: 'Tecnico123#' } });

    fireEvent.click(screen.getByRole('button', { name: /Completar Registro/i }));

    // 6. Verificar que ingresa con rol "Usuario Técnico"
    expect(await screen.findByText(/Bienvenido, Técnico Telecom/i)).toBeInTheDocument();
    expect(screen.getByText(/Usuario Técnico/i)).toBeInTheDocument();
  });
});
