import { describe, it, expect } from 'vitest';
import {
  generarSal,
  derivarHashContrasena,
  verificarContrasena
} from '../../src/servicios/criptografia';

describe('Servicio de Criptografía (PBKDF2)', () => {
  it('debe generar una sal aleatoria válida en base64 de 16 bytes', () => {
    const sal1 = generarSal();
    const sal2 = generarSal();

    expect(typeof sal1).toBe('string');
    expect(sal1.length).toBeGreaterThan(15);
    expect(sal1).not.toBe(sal2);
  });

  it('debe derivar un hash idéntico con la misma contraseña y la misma sal', async () => {
    const contrasena = 'MiClaveSegura123!';
    const sal = generarSal();

    const hash1 = await derivarHashContrasena(contrasena, sal);
    const hash2 = await derivarHashContrasena(contrasena, sal);

    expect(typeof hash1).toBe('string');
    expect(hash1.length).toBeGreaterThan(20);
    expect(hash1).toBe(hash2);
  });

  it('debe derivar hashes distintos ante contraseñas diferentes con la misma sal', async () => {
    const sal = generarSal();

    const hash1 = await derivarHashContrasena('ClaveA123', sal);
    const hash2 = await derivarHashContrasena('ClaveB123', sal);

    expect(hash1).not.toBe(hash2);
  });

  it('debe derivar hashes distintos ante la misma contraseña con sales distintas', async () => {
    const contrasena = 'MismaClave123';
    const sal1 = generarSal();
    const sal2 = generarSal();

    const hash1 = await derivarHashContrasena(contrasena, sal1);
    const hash2 = await derivarHashContrasena(contrasena, sal2);

    expect(hash1).not.toBe(hash2);
  });

  it('debe verificar exitosamente una contraseña correcta', async () => {
    const contrasena = 'Telecom#2026';
    const sal = generarSal();
    const hashGuardado = await derivarHashContrasena(contrasena, sal);

    const esValida = await verificarContrasena(contrasena, hashGuardado, sal);
    expect(esValida).toBe(true);
  });

  it('debe rechazar una contraseña incorrecta', async () => {
    const contrasenaCorrecta = 'Telecom#2026';
    const contrasenaIncorrecta = 'Telecom#2025';
    const sal = generarSal();
    const hashGuardado = await derivarHashContrasena(contrasenaCorrecta, sal);

    const esValida = await verificarContrasena(contrasenaIncorrecta, hashGuardado, sal);
    expect(esValida).toBe(false);
  });
});
