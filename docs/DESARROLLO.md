# Guía de Desarrollo y Convenciones del Código

## 1. Convenciones Generales
- **Idioma del Código:** Todo el desarrollo (nombres de variables, funciones, clases, componentes, comentarios, pruebas y mensajes de error) debe redactarse en **ESPAÑOL**.
- **Tipado Estricto:** TypeScript en modo estricto (`"strict": true`). Prohibido el uso de `any` a menos que sea en capas de compatibilidad con librerías externas.
- **Enfoque TDD (Test-Driven Development):** Ninguna función o componente debe agregarse a producción sin antes haber escrito la prueba que falle y luego la implementación que la resuelva.

## 2. Estructura de Ramas y Commits
- `master` o `main`: Rama de código verificado y listo para producción.
- `feature/*`: Ramas de características específicas (ej. `feature/etapa-1-arquitectura-y-autenticacion`).
- Formato de Commits (Convencional en Español):
  - `feat: ...` para nuevas funcionalidades.
  - `test: ...` para pruebas unitarias o de integración.
  - `fix: ...` para corrección de incidencias.
  - `docs: ...` para documentación en `/docs`.

## 3. Guía de Ejecución de Pruebas
- Para ejecutar toda la suite de pruebas una sola vez:
  ```bash
  npm run test
  ```
- Para modo interactivo de desarrollo (observador continuo):
  ```bash
  npm run test:watch
  ```
- Para ejecutar una prueba individual:
  ```bash
  npx vitest run tests/unitarias/criptografia.test.ts
  ```

## 4. Reglas del Sistema Visual
- Prohibido el uso de TailwindCSS o frameworks de CSS invasivos a menos que sea explícitamente solicitado.
- Toda regla de estilo debe basarse en las variables de `src/estilos/variables.css`.
- Todo componente debe diseñarse para operar en modo oscuro total sin depender de clases `.dark` intermedias.
- No utilizar anidación de tarjetas dentro de tarjetas ni marcos contenedores innecesarios.
