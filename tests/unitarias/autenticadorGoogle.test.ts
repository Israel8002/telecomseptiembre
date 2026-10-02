import { describe, it, expect } from 'vitest';
import { generarAssertionJwt } from '../../src/servicios/google/autenticadorGoogle';

describe('Servicio: Autenticador Google (Etapa 5)', () => {
  it('debe generar un JWT firmado en formato header.claims.signature con RS256', async () => {
    const jwt = await generarAssertionJwt();
    expect(jwt).toBeDefined();
    expect(typeof jwt).toBe('string');

    const partes = jwt.split('.');
    expect(partes).toHaveLength(3);

    // Decodificar encabezado
    const headerJson = JSON.parse(atob(partes[0].replace(/-/g, '+').replace(/_/g, '/')));
    expect(headerJson.alg).toBe('RS256');
    expect(headerJson.typ).toBe('JWT');

    // Decodificar claims
    const claimsJson = JSON.parse(atob(partes[1].replace(/-/g, '+').replace(/_/g, '/')));
    expect(claimsJson.iss).toBe('sincronizador-telecom@imss-supervision-telecom.iam.gserviceaccount.com');
    expect(claimsJson.aud).toBe('https://oauth2.googleapis.com/token');
    expect(claimsJson.scope).toContain('spreadsheets');
    expect(claimsJson.scope).toContain('drive');
    expect(claimsJson.exp).toBeGreaterThan(claimsJson.iat);
  });
});
