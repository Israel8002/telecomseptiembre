import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PantallaAdministracion } from '../../src/paginas/Administracion/PantallaAdministracion';
import { ProveedorAutenticacion } from '../../src/contextos/ContextoAutenticacion';
import { BaseDatosLocal } from '../../src/db/baseDatos';
import { servicioGoogleSheets } from '../../src/servicios/google/servicioGoogleSheets';
import { procesadorSincronizacion } from '../../src/servicios/google/procesadorSincronizacion';
import { Usuario } from '../../src/modelos/usuario';
import { Evaluacion } from '../../src/modelos/evaluacion';

describe('PantallaAdministracion (Módulo de Control y Auditoría Multi-Unidad - Etapa 6)', () => {
  let bd: any;
  const mockUsuarioAdmin: Usuario = {
    id: 'admin-id-1',
    matricula: '12345678',
    nombreCompleto: 'Ing. Administrador Estatal',
    correoElectronico: 'admin.telecom@imss.gob.mx',
    numeroWhatsapp: '6861234567',
    rol: 'ADMINISTRADOR',
    hashContrasena: 'hash',
    salContrasena: 'sal',
    fotografiaBase64: null,
    creadoEn: '2026-10-02T08:00:00.000Z',
    actualizadoEn: '2026-10-02T08:00:00.000Z',
    sincronizado: true,
    version: 1
  };

  const mockEvalLocal1: Evaluacion = {
    id: 'EVAL-LOCAL-001',
    idUsuario: 'admin-id-1',
    matriculaEvaluador: '12345678',
    nombreEvaluador: 'Ing. Administrador Estatal',
    ooad: 'OOAD Baja California',
    unidad: 'HGZ 30 MEXICALI',
    tipoCuarto: 'MDF',
    ubicacionDetallada: 'Edificio Central',
    estado: 'COMPLETADA',
    respuestas: {},
    porcentajeAvance: 100,
    calificacionCumplimiento: 85,
    totalCriterios: 42,
    totalRespondidos: 42,
    totalCumple: 36,
    totalNoCumple: 6,
    totalNoAplica: 0,
    creadoEn: '2026-10-02T08:00:00.000Z',
    actualizadoEn: '2026-10-02T09:00:00.000Z',
    finalizadoEn: '2026-10-02T09:00:00.000Z',
    sincronizado: true,
    version: 1
  };

  const mockEvalLocal2: Evaluacion = {
    id: 'EVAL-LOCAL-002',
    idUsuario: 'admin-id-1',
    matriculaEvaluador: '12345678',
    nombreEvaluador: 'Ing. Administrador Estatal',
    ooad: 'OOAD Baja California',
    unidad: 'HGR 20 TIJ',
    tipoCuarto: 'IDF',
    ubicacionDetallada: 'Piso 2',
    estado: 'EN_PROCESO',
    respuestas: {},
    porcentajeAvance: 50,
    calificacionCumplimiento: 40,
    totalCriterios: 42,
    totalRespondidos: 21,
    totalCumple: 10,
    totalNoCumple: 11,
    totalNoAplica: 0,
    creadoEn: '2026-10-02T10:00:00.000Z',
    actualizadoEn: '2026-10-02T10:30:00.000Z',
    finalizadoEn: null,
    sincronizado: false,
    version: 1
  };

  beforeEach(async () => {
    // Mock para APIs del navegador no implementadas en JSDOM
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();

    const nombreBd = `test_admin_${Date.now()}_${Math.random()}`;
    bd = new BaseDatosLocal(nombreBd);
    await bd.open();

    await bd.usuarios.add(mockUsuarioAdmin);
    await bd.sesiones.put({
      id: 'sesion-activa',
      idUsuario: mockUsuarioAdmin.id,
      matricula: mockUsuarioAdmin.matricula,
      nombreCompleto: mockUsuarioAdmin.nombreCompleto,
      correoElectronico: mockUsuarioAdmin.correoElectronico,
      rol: mockUsuarioAdmin.rol,
      iniciadoEn: new Date().toISOString()
    });

    await bd.evaluaciones.add(mockEvalLocal1);
    await bd.evaluaciones.add(mockEvalLocal2);

    // Mock de Google Sheets remoto
    vi.spyOn(servicioGoogleSheets, 'obtenerEvaluacionesRemotas').mockResolvedValue([
      {
        id: 'EVAL-REMOTO-003',
        matriculaEvaluador: '99012345',
        nombreEvaluador: 'Téc. Marco Aurelio',
        ooad: 'OOAD Baja California',
        unidad: 'HGZ-MF 8 ENS',
        tipoCuarto: 'RACK',
        ubicacionDetallada: 'Urgencias',
        estado: 'COMPLETADA',
        calificacionCumplimiento: 92,
        totalCriterios: 42,
        totalRespondidos: 42,
        totalCumple: 39,
        totalNoCumple: 3,
        creadoEn: '2026-10-02T11:00:00.000Z',
        finalizadoEn: '2026-10-02T12:00:00.000Z',
        urlReporteDrive: 'https://drive.google.com/open?id=test-drive-link',
        origen: 'remoto'
      }
    ]);

    vi.spyOn(servicioGoogleSheets, 'obtenerLogsRemotos').mockResolvedValue([
      {
        idOperacion: 'OP-12345',
        fechaHora: '2026-10-02T12:00:00.000Z',
        tipoEntidad: 'EVALUACION',
        accion: 'CREAR',
        matriculaUsuario: '99012345',
        resultado: 'EXITO'
      }
    ]);
  });

  it('debe renderizar el título del módulo, métricas y evaluaciones consolidadas', async () => {
    render(
      <ProveedorAutenticacion bd={bd}>
        <PantallaAdministracion alVolver={() => {}} />
      </ProveedorAutenticacion>
    );

    expect(await screen.findByText(/MÓDULO DE CONTROL CENTRAL Y AUDITORÍA MULTI-UNIDAD/i)).toBeInTheDocument();
    expect(screen.getByText(/Supervisión Estatal de Telecomunicaciones/i)).toBeInTheDocument();

    // Esperar a que se carguen los datos unificados
    await waitFor(() => {
      expect(screen.getAllByText('EVAL-LOCAL-001').length).toBeGreaterThan(0);
      expect(screen.getAllByText('EVAL-REMOTO-003').length).toBeGreaterThan(0);
    });

    // Validar visualización de filas dentro de la tabla
    const tabla = screen.getByRole('table');
    expect(tabla).toBeInTheDocument();
    expect(screen.getAllByText('HGZ 30 MEXICALI').length).toBeGreaterThan(0);
    expect(screen.getAllByText('HGZ-MF 8 ENS').length).toBeGreaterThan(0);
  });

  it('permite filtrar evaluaciones por búsqueda de texto y tipo de cuarto', async () => {
    render(
      <ProveedorAutenticacion bd={bd}>
        <PantallaAdministracion alVolver={() => {}} />
      </ProveedorAutenticacion>
    );

    await waitFor(() => {
      expect(screen.getAllByText('EVAL-LOCAL-001').length).toBeGreaterThan(0);
    });

    // Filtrar por texto "MEXICALI"
    const inputBusqueda = screen.getByPlaceholderText(/Buscar por Folio, Unidad/i);
    fireEvent.change(inputBusqueda, { target: { value: 'MEXICALI' } });

    // La lista debe contener solo HGZ 30 MEXICALI y no EVAL-REMOTO-003
    expect(screen.getAllByText('EVAL-LOCAL-001').length).toBeGreaterThan(0);
    expect(screen.queryByText('EVAL-REMOTO-003')).not.toBeInTheDocument();

    // Limpiar búsqueda
    fireEvent.change(inputBusqueda, { target: { value: '' } });

    // Filtrar por Tipo de Cuarto "RACK"
    const selectTipo = screen.getByLabelText(/Tipo de Cuarto/i);
    fireEvent.change(selectTipo, { target: { value: 'RACK' } });

    // En la vista debe estar EVAL-REMOTO-003 (RACK) y no EVAL-LOCAL-001 (MDF)
    expect(screen.getAllByText('EVAL-REMOTO-003').length).toBeGreaterThan(0);
    expect(screen.queryByText('EVAL-LOCAL-001')).not.toBeInTheDocument();
  });

  it('permite cambiar a la pestaña de auditoría de nube y ver diagnósticos de Google Cloud', async () => {
    render(
      <ProveedorAutenticacion bd={bd}>
        <PantallaAdministracion alVolver={() => {}} />
      </ProveedorAutenticacion>
    );

    // Cambiar a la pestaña de auditoría
    const botonAuditoria = screen.getByRole('button', { name: /Auditoría de Nube y Respaldos/i });
    fireEvent.click(botonAuditoria);

    expect(await screen.findByText(/Google Sheets Database/i)).toBeInTheDocument();
    expect(screen.getByText(/Google Drive Storage/i)).toBeInTheDocument();
    expect(screen.getByText(/Bitácora Central de Sincronización/i)).toBeInTheDocument();

    // Debe mostrar la fila de logs de auditoría
    await waitFor(() => {
      expect(screen.getByText(/OP-12345/i)).toBeInTheDocument();
    });
  });

  it('permite forzar sincronización manual desde la pestaña de auditoría', async () => {
    const spySincronizar = vi.spyOn(procesadorSincronizacion, 'procesarCola').mockResolvedValue();

    render(
      <ProveedorAutenticacion bd={bd}>
        <PantallaAdministracion alVolver={() => {}} />
      </ProveedorAutenticacion>
    );

    const botonAuditoria = screen.getByRole('button', { name: /Auditoría de Nube y Respaldos/i });
    fireEvent.click(botonAuditoria);

    const botonForzar = screen.getByRole('button', { name: /Sincronizar Pendientes Ahora/i });
    fireEvent.click(botonForzar);

    await waitFor(() => {
      expect(spySincronizar).toHaveBeenCalled();
    });
  });

  it('permite descargar la tabla de auditoría filtrada en formato CSV', async () => {
    render(
      <ProveedorAutenticacion bd={bd}>
        <PantallaAdministracion alVolver={() => {}} />
      </ProveedorAutenticacion>
    );

    await waitFor(() => {
      expect(screen.getAllByText('EVAL-LOCAL-001').length).toBeGreaterThan(0);
    });

    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    const botonCsv = screen.getByRole('button', { name: /Exportar Tabla CSV/i });
    fireEvent.click(botonCsv);

    expect(clickSpy).toHaveBeenCalled();
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
  });

  it('permite abrir el modal de confirmación y eliminar una evaluación', async () => {
    render(
      <ProveedorAutenticacion bd={bd}>
        <PantallaAdministracion alVolver={() => {}} />
      </ProveedorAutenticacion>
    );

    await waitFor(() => {
      expect(screen.getAllByText('EVAL-LOCAL-001').length).toBeGreaterThan(0);
    });

    // Encontrar botones de borrar
    const botonesBorrar = screen.getAllByRole('button', { name: /🗑️ Borrar/i });
    expect(botonesBorrar.length).toBeGreaterThan(0);

    // Hacer clic en el primer botón de borrar
    fireEvent.click(botonesBorrar[0]);

    // Debe abrirse el modal de confirmación con advertencia de eliminación
    expect(await screen.findByText(/Confirmar Eliminación de Evaluación/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🗑️ Sí, Eliminar Permanentemente/i })).toBeInTheDocument();

    // Confirmar eliminación
    const botonConfirmar = screen.getByRole('button', { name: /🗑️ Sí, Eliminar Permanentemente/i });
    fireEvent.click(botonConfirmar);

    // Verificar notificación de éxito o eliminación de la vista
    await waitFor(() => {
      expect(screen.getByText(/eliminada con éxito/i)).toBeInTheDocument();
    });
  });
});
