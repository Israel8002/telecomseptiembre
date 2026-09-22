import { describe, it, expect } from 'vitest';
import {
  validarMatricula,
  validarCorreoElectronico,
  validarNumeroWhatsapp,
  validarNombreCompleto,
  validarContrasena
} from '../../src/servicios/validaciones';

describe('Servicio de Validaciones de Entrada', () => {
  describe('validarMatricula', () => {
    it('debe aceptar matrículas alfanuméricas válidas de 5 a 15 caracteres', () => {
      expect(validarMatricula('99012345').esValido).toBe(true);
      expect(validarMatricula('TEC01').esValido).toBe(true);
      expect(validarMatricula('ADM123456789012').esValido).toBe(true);
    });

    it('debe rechazar matrículas con espacios o caracteres especiales', () => {
      expect(validarMatricula('990 12345').esValido).toBe(false);
      expect(validarMatricula('990-12345').esValido).toBe(false);
      expect(validarMatricula('990_12345').esValido).toBe(false);
    });

    it('debe rechazar matrículas menores a 5 o mayores a 15 caracteres', () => {
      expect(validarMatricula('1234').esValido).toBe(false);
      expect(validarMatricula('1234567890123456').esValido).toBe(false);
    });
  });

  describe('validarCorreoElectronico', () => {
    it('debe aceptar correos electrónicos válidos', () => {
      expect(validarCorreoElectronico('usuario@imss.gob.mx').esValido).toBe(true);
      expect(validarCorreoElectronico('admin.telecom@dominio.com').esValido).toBe(true);
    });

    it('debe rechazar correos con formato inválido o vacíos', () => {
      expect(validarCorreoElectronico('').esValido).toBe(false);
      expect(validarCorreoElectronico('sinarroba.com').esValido).toBe(false);
      expect(validarCorreoElectronico('usuario@').esValido).toBe(false);
      expect(validarCorreoElectronico('usuario@dominio').esValido).toBe(false);
    });
  });

  describe('validarNumeroWhatsapp', () => {
    it('debe aceptar números de exactamente 10 dígitos numéricos', () => {
      expect(validarNumeroWhatsapp('6861234567').esValido).toBe(true);
      expect(validarNumeroWhatsapp('5512345678').esValido).toBe(true);
    });

    it('debe rechazar números con longitud diferente a 10 dígitos o con caracteres no numéricos', () => {
      expect(validarNumeroWhatsapp('123456789').esValido).toBe(false);
      expect(validarNumeroWhatsapp('12345678901').esValido).toBe(false);
      expect(validarNumeroWhatsapp('686-123456').esValido).toBe(false);
      expect(validarNumeroWhatsapp('686abc4567').esValido).toBe(false);
    });
  });

  describe('validarNombreCompleto', () => {
    it('debe aceptar nombres válidos con al menos 3 caracteres', () => {
      expect(validarNombreCompleto('Juan Pérez').esValido).toBe(true);
      expect(validarNombreCompleto('María de Jesús López').esValido).toBe(true);
    });

    it('debe rechazar nombres vacíos o menores a 3 caracteres', () => {
      expect(validarNombreCompleto('').esValido).toBe(false);
      expect(validarNombreCompleto('Al').esValido).toBe(false);
    });
  });

  describe('validarContrasena', () => {
    it('debe aceptar contraseñas con al menos 8 caracteres conteniendo letra y número', () => {
      expect(validarContrasena('Segura2026!').esValido).toBe(true);
      expect(validarContrasena('Admin123').esValido).toBe(true);
    });

    it('debe rechazar contraseñas menores a 8 caracteres, solo letras o solo números', () => {
      expect(validarContrasena('Abc1').esValido).toBe(false);
      expect(validarContrasena('sololetrasdemas').esValido).toBe(false);
      expect(validarContrasena('1234567890').esValido).toBe(false);
    });
  });
});
