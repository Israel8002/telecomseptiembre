# Protocolo de Seguridad y Gestión de Identidad

## 1. Principios de Seguridad
La aplicación implementa los estándares de seguridad recomendados por OWASP para aplicaciones web y móviles:
- **Cero Texto Claro:** Ninguna contraseña, credencial o secreto se almacena en texto plano en IndexedDB ni en memoria desprotegida.
- **Defensa en Profundidad:** Validación estricta tanto en la interfaz de usuario como en la capa de repositorios.
- **Resistencia a Ataques de Temporización (*Timing Attacks*):** Comparación de hashes en tiempo constante.

## 2. Derivación Criptográfica de Contraseñas (PBKDF2)
- **Algoritmo:** Password-Based Key Derivation Function 2 (**PBKDF2**).
- **Función Pseudoaleatoria:** HMAC con **SHA-256**.
- **Iteraciones:** **100,000 iteraciones** forzadas mediante `window.crypto.subtle`.
- **Sal Criptográfica:** Sal única de **16 bytes aleatorios** generados por usuario con `crypto.getRandomValues(new Uint8Array(16))`.
- **Codificación:** Hashes y sales se codifican en Base64 para almacenamiento.

## 3. Modelo de Control de Acceso Basado en Roles (RBAC)
- `ADMINISTRADOR`:
  - Asignado automáticamente al **primer usuario registrado** en la base de datos local.
  - Privilegios: En etapas posteriores, acceso a todas las evaluaciones de todas las unidades, gestión de usuarios, auditoría de sincronización y exportación total de respaldos.
- `USUARIO_NORMAL` (Técnico Evaluador):
  - Todo usuario registrado con posterioridad.
  - Privilegios: Creación y gestión exclusiva de sus propias evaluaciones locales.
