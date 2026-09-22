import { describe, it, expect, beforeEach } from 'vitest';
import { BaseDatosLocal } from '../../src/db/baseDatos';
import { RepositorioUsuarios } from '../../src/db/repositorios/repositorioUsuarios';

describe('RepositorioUsuarios (Persistencia Local con Dexie)', () => {
  let bd: BaseDatosLocal;
  let repo: RepositorioUsuarios;

  beforeEach(async () => {
    // Usamos un nombre único de base de datos para cada test para aislamiento total
    const nombreBd = `test_telecom_${Date.now()}_${Math.random()}`;
    bd = new BaseDatosLocal(nombreBd);
    await bd.open();
    repo = new RepositorioUsuarios(bd);
  });

  it('debe asignar automáticamente el rol ADMINISTRADOR al primer usuario registrado', async () => {
    const usuarioAdmin = await repo.registrarUsuario({
      matricula: '99000001',
      nombreCompleto: 'Ingeniero Administrador',
      correoElectronico: 'admin@imss.gob.mx',
      numeroWhatsapp: '6861112233',
      contrasena: 'AdminClave#2026'
    });

    expect(usuarioAdmin.id).toBeDefined();
    expect(usuarioAdmin.matricula).toBe('99000001');
    expect(usuarioAdmin.rol).toBe('ADMINISTRADOR');
    expect(usuarioAdmin.hashContrasena).toBeDefined();
    expect(usuarioAdmin.hashContrasena).not.toBe('AdminClave#2026');
    expect(usuarioAdmin.salContrasena).toBeDefined();

    // Verificar encolado en colaSincronizacion
    const elementosCola = await bd.colaSincronizacion.toArray();
    expect(elementosCola.length).toBe(1);
    expect(elementosCola[0].tipoEntidad).toBe('USUARIO');
    expect(elementosCola[0].idEntidad).toBe(usuarioAdmin.id);
    expect(elementosCola[0].operacion).toBe('CREAR');
    expect(elementosCola[0].estado).toBe('PENDIENTE');
  });

  it('debe asignar el rol USUARIO_NORMAL a los usuarios registrados posteriormente', async () => {
    // Primer usuario: Admin
    await repo.registrarUsuario({
      matricula: '99000001',
      nombreCompleto: 'Primer Usuario',
      correoElectronico: 'admin@imss.gob.mx',
      numeroWhatsapp: '6861112233',
      contrasena: 'AdminClave#2026'
    });

    // Segundo usuario
    const segundoUsuario = await repo.registrarUsuario({
      matricula: '99000002',
      nombreCompleto: 'Segundo Usuario',
      correoElectronico: 'tecnico@imss.gob.mx',
      numeroWhatsapp: '6862223344',
      contrasena: 'Tecnico#2026'
    });

    expect(segundoUsuario.rol).toBe('USUARIO_NORMAL');
  });

  it('debe rechazar el registro con una matrícula duplicada', async () => {
    await repo.registrarUsuario({
      matricula: '99000001',
      nombreCompleto: 'Usuario Original',
      correoElectronico: 'original@imss.gob.mx',
      numeroWhatsapp: '6861112233',
      contrasena: 'Clave#2026'
    });

    await expect(
      repo.registrarUsuario({
        matricula: '99000001',
        nombreCompleto: 'Usuario Duplicado',
        correoElectronico: 'otro@imss.gob.mx',
        numeroWhatsapp: '6869998877',
        contrasena: 'Clave#2026'
      })
    ).rejects.toThrow('La matrícula ya se encuentra registrada.');
  });

  it('debe rechazar el registro con un correo electrónico duplicado', async () => {
    await repo.registrarUsuario({
      matricula: '99000001',
      nombreCompleto: 'Usuario A',
      correoElectronico: 'compartido@imss.gob.mx',
      numeroWhatsapp: '6861112233',
      contrasena: 'Clave#2026'
    });

    await expect(
      repo.registrarUsuario({
        matricula: '99000002',
        nombreCompleto: 'Usuario B',
        correoElectronico: 'compartido@imss.gob.mx',
        numeroWhatsapp: '6869998877',
        contrasena: 'Clave#2026'
      })
    ).rejects.toThrow('El correo electrónico ya se encuentra registrado.');
  });

  it('debe autenticar exitosamente con matrícula y contraseña correctas', async () => {
    await repo.registrarUsuario({
      matricula: '99000001',
      nombreCompleto: 'Usuario Login',
      correoElectronico: 'login@imss.gob.mx',
      numeroWhatsapp: '6861112233',
      contrasena: 'SuperClave#2026'
    });

    const autenticado = await repo.autenticarUsuario('99000001', 'SuperClave#2026');
    expect(autenticado).toBeDefined();
    expect(autenticado.matricula).toBe('99000001');
  });

  it('debe rechazar la autenticación si la contraseña es incorrecta o el usuario no existe', async () => {
    await repo.registrarUsuario({
      matricula: '99000001',
      nombreCompleto: 'Usuario Login',
      correoElectronico: 'login@imss.gob.mx',
      numeroWhatsapp: '6861112233',
      contrasena: 'SuperClave#2026'
    });

    await expect(
      repo.autenticarUsuario('99000001', 'ContrasenaErronea')
    ).rejects.toThrow('Credenciales incorrectas.');

    await expect(
      repo.autenticarUsuario('NO_EXISTE', 'SuperClave#2026')
    ).rejects.toThrow('Credenciales incorrectas.');
  });

  it('debe guardar, obtener y cerrar la sesión activa correctamente', async () => {
    const usuario = await repo.registrarUsuario({
      matricula: '99000001',
      nombreCompleto: 'Usuario Sesión',
      correoElectronico: 'sesion@imss.gob.mx',
      numeroWhatsapp: '6861112233',
      contrasena: 'SuperClave#2026'
    });

    expect(await repo.obtenerSesionActiva()).toBeNull();

    await repo.guardarSesion(usuario);
    const sesion = await repo.obtenerSesionActiva();
    expect(sesion).not.toBeNull();
    expect(sesion?.matricula).toBe('99000001');

    await repo.cerrarSesionLocal();
    expect(await repo.obtenerSesionActiva()).toBeNull();
  });
});
