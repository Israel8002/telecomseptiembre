import { BaseDatosLocal } from '../baseDatos';
import { Usuario, DatosRegistroUsuario, RolUsuario } from '../../modelos/usuario';
import { SesionLocal } from '../../modelos/sesion';
import { ElementoColaSincronizacion } from '../../modelos/sincronizacion';
import { generarSal, derivarHashContrasena, verificarContrasena } from '../../servicios/criptografia';

export class RepositorioUsuarios {
  constructor(private bd: BaseDatosLocal) {}

  /**
   * Registra un nuevo usuario en la base de datos local y encola su evento de sincronización.
   * Regla crítica: Si no existen usuarios en la base, se asigna ADMINISTRADOR automáticamente.
   */
  async registrarUsuario(datos: DatosRegistroUsuario): Promise<Usuario> {
    const matriculaLimpia = datos.matricula.trim();
    const correoLimpio = datos.correoElectronico.trim().toLowerCase();

    // 1. Verificar unicidad de matrícula
    const usuarioExistenteMatricula = await this.bd.usuarios
      .where('matricula')
      .equals(matriculaLimpia)
      .first();

    if (usuarioExistenteMatricula) {
      throw new Error('La matrícula ya se encuentra registrada.');
    }

    // 2. Verificar unicidad de correo
    const usuarioExistenteCorreo = await this.bd.usuarios
      .where('correoElectronico')
      .equals(correoLimpio)
      .first();

    if (usuarioExistenteCorreo) {
      throw new Error('El correo electrónico ya se encuentra registrado.');
    }

    // 3. Determinar el rol: el primer usuario registrado en la base siempre es ADMINISTRADOR
    const totalUsuarios = await this.bd.usuarios.count();
    const rolAsignado: RolUsuario = totalUsuarios === 0 ? 'ADMINISTRADOR' : 'USUARIO_NORMAL';

    // 4. Derivar hash criptográfico seguro PBKDF2 (ninguna contraseña en texto plano)
    const sal = generarSal();
    const hash = await derivarHashContrasena(datos.contrasena, sal);

    const ahora = new Date().toISOString();
    const nuevoUsuario: Usuario = {
      id: crypto.randomUUID(),
      matricula: matriculaLimpia,
      nombreCompleto: datos.nombreCompleto.trim(),
      correoElectronico: correoLimpio,
      numeroWhatsapp: datos.numeroWhatsapp.trim(),
      hashContrasena: hash,
      salContrasena: sal,
      rol: rolAsignado,
      fotografiaBase64: datos.fotografiaBase64 || null,
      creadoEn: ahora,
      actualizadoEn: ahora,
      sincronizado: false,
      version: 1
    };

    // 5. Preparar elemento de cola de sincronización para Google Sheets en etapas futuras
    const elementoCola: ElementoColaSincronizacion = {
      id: crypto.randomUUID(),
      tipoEntidad: 'USUARIO',
      idEntidad: nuevoUsuario.id,
      operacion: 'CREAR',
      datos: JSON.stringify({
        id: nuevoUsuario.id,
        matricula: nuevoUsuario.matricula,
        nombreCompleto: nuevoUsuario.nombreCompleto,
        correoElectronico: nuevoUsuario.correoElectronico,
        numeroWhatsapp: nuevoUsuario.numeroWhatsapp,
        rol: nuevoUsuario.rol,
        creadoEn: nuevoUsuario.creadoEn
      }),
      creadoEn: ahora,
      intentos: 0,
      ultimoError: null,
      estado: 'PENDIENTE'
    };

    // 6. Transacción atómica: usuario + cola de sincronización
    await this.bd.transaction('rw', this.bd.usuarios, this.bd.colaSincronizacion, async () => {
      await this.bd.usuarios.add(nuevoUsuario);
      await this.bd.colaSincronizacion.add(elementoCola);
    });

    return nuevoUsuario;
  }

  /**
   * Autentica un usuario con matrícula y contraseña contra el hash PBKDF2 almacenado
   */
  async autenticarUsuario(matricula: string, contrasena: string): Promise<Usuario> {
    const matriculaLimpia = matricula.trim();
    const usuario = await this.bd.usuarios
      .where('matricula')
      .equals(matriculaLimpia)
      .first();

    if (!usuario) {
      throw new Error('Credenciales incorrectas.');
    }

    const esValida = await verificarContrasena(contrasena, usuario.hashContrasena, usuario.salContrasena);
    if (!esValida) {
      throw new Error('Credenciales incorrectas.');
    }

    return usuario;
  }

  /**
   * Guarda o actualiza la sesión activa en el dispositivo
   */
  async guardarSesion(usuario: Usuario): Promise<void> {
    const sesion: SesionLocal = {
      id: 'sesion_activa',
      idUsuario: usuario.id,
      matricula: usuario.matricula,
      nombreCompleto: usuario.nombreCompleto,
      rol: usuario.rol,
      iniciadoEn: new Date().toISOString()
    };

    await this.bd.sesiones.put(sesion);
  }

  /**
   * Obtiene la sesión activa persistida si existe
   */
  async obtenerSesionActiva(): Promise<SesionLocal | null> {
    const sesion = await this.bd.sesiones.get('sesion_activa');
    return sesion || null;
  }

  /**
   * Cierra y elimina la sesión activa del dispositivo
   */
  async cerrarSesionLocal(): Promise<void> {
    await this.bd.sesiones.delete('sesion_activa');
  }

  /**
   * Retorna el número total de usuarios registrados
   */
  async contarUsuarios(): Promise<number> {
    return await this.bd.usuarios.count();
  }

  /**
   * Busca un usuario por su matrícula
   */
  async obtenerPorMatricula(matricula: string): Promise<Usuario | null> {
    const usuario = await this.bd.usuarios
      .where('matricula')
      .equals(matricula.trim())
      .first();
    return usuario || null;
  }
}
