# Plan de Implementación: Etapa 1 - Arquitectura Base, Sistema Visual Oscuro, Persistencia Local y Autenticación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la base completa de la Etapa 1 para la App de Supervisión de Cuartos de Comunicaciones: arquitectura Vite/React/TS/Capacitor, persistencia local con Dexie (IndexedDB), criptografía PBKDF2-SHA256, sistema visual 100% oscuro responsive, flujo de pantallas (Inicio con Logo, Registro con primer usuario Administrador, Login, Panel Principal), cola de sincronización preparada, suite de pruebas automatizadas al 100% y documentación en `/docs`.

**Architecture:** Aplicación offline-first con una única interfaz adaptable. Persistencia de datos transaccional con Dexie.js sobre IndexedDB. Sesión local persistente y reactiva. Seguridad con Web Crypto API nativa sin guardar contraseñas en texto claro. Cola de sincronización local lista para futura replicación con Google Sheets/Drive.

**Tech Stack:** Node.js, React 18, TypeScript, Vite, Dexie.js (IndexedDB), Capacitor Core, CSS3 Nativo Puro con Tokens semánticos, Vitest, Testing Library, fake-indexeddb.

## Global Constraints
- Todo el código, comentarios, mensajes al usuario, nombres de variables/funciones y documentación deben estar en ESPAÑOL.
- Diseño 100% OSCURO: Fondo base `#0A0A0A` / `#121212`. Prohibido fondos blancos, interfaces claras, gradientes innecesarios, tarjetas anidadas ("cuadros dentro de cuadros") y dashboards genéricos.
- Pantalla inicial limpia: debe mostrar ÚNICAMENTE el LOGO interactivo que al presionarse inicia el flujo de supervisión/autenticación.
- Registro: Primer usuario registrado en la base de datos local es automáticamente `ADMINISTRADOR`. Usuarios posteriores son `USUARIO_NORMAL`.
- Manejo seguro de contraseñas: Ninguna contraseña en texto plano. Usar PBKDF2-SHA256 con sal aleatoria de 16 bytes y 100,000 iteraciones.
- Identificador único: Matrícula única como identificador laboral del usuario y UUID v4 como ID técnico de registro.
- Base preparada para sincronización: Cada inserción de usuario genera un registro en la tabla local `colaSincronizacion`.
- No implementar todavía: evaluaciones, formularios de supervisión, fotografías de evaluación, PDF, Excel, respaldos ni sincronización en vivo con Google.

---

### Task 1: Scaffolding del Proyecto y Configuración de Herramientas

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `capacitor.config.json`

**Interfaces:**
- Produces: Entorno de compilación (`npm run build`), ejecución de pruebas (`npm run test`), y configuración base para Web/PWA y Capacitor.

- [ ] **Step 1: Crear archivo `package.json` con dependencias exactas y scripts**

```json
{
  "name": "supervision-cuartos-telecom",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@capacitor/cli": "^6.0.0",
    "@capacitor/core": "^6.0.0",
    "dexie": "^4.0.8",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^15.0.0",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.1",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^24.0.0",
    "typescript": "^5.4.5",
    "vite": "^5.2.11",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Crear `tsconfig.json` y `tsconfig.node.json`**
- [ ] **Step 3: Crear `vite.config.ts` con configuración para React y Vitest con entorno jsdom**
- [ ] **Step 4: Crear `index.html` con meta tags de viewport responsive y título en español**
- [ ] **Step 5: Crear `capacitor.config.json` configurando appId `org.imss.supervisioncuartos`**
- [ ] **Step 6: Instalar dependencias con `npm install`**
- [ ] **Step 7: Verificar compilación y entorno de test**
- [ ] **Step 8: Commit de la tarea 1**

---

### Task 2: Servicios de Criptografía y Validaciones de Entrada (TDD)

**Files:**
- Create: `src/servicios/criptografia.ts`
- Create: `src/servicios/validaciones.ts`
- Test: `tests/unitarias/criptografia.test.ts`
- Test: `tests/unitarias/validaciones.test.ts`

**Interfaces:**
- Produces:
  - `generarSal(): string`
  - `derivarHashContrasena(contrasena: string, sal: string): Promise<string>`
  - `verificarContrasena(contrasena: string, hashGuardado: string, sal: string): Promise<boolean>`
  - `validarMatricula(matricula: string): { esValido: boolean; error?: string }`
  - `validarCorreoElectronico(correo: string): { esValido: boolean; error?: string }`
  - `validarNumeroWhatsapp(whatsapp: string): { esValido: boolean; error?: string }`
  - `validarNombreCompleto(nombre: string): { esValido: boolean; error?: string }`
  - `validarContrasena(contrasena: string): { esValido: boolean; error?: string }`

- [ ] **Step 1: Escribir pruebas unitarias que fallen para criptografía**
- [ ] **Step 2: Ejecutar `npm run test tests/unitarias/criptografia.test.ts` y verificar que falla**
- [ ] **Step 3: Implementar `src/servicios/criptografia.ts` usando `crypto.subtle` (PBKDF2-SHA256, 100k iteraciones)**
- [ ] **Step 4: Ejecutar `npm run test tests/unitarias/criptografia.test.ts` y verificar que pasa al 100%**
- [ ] **Step 5: Escribir pruebas unitarias que fallen para validaciones**
- [ ] **Step 6: Implementar `src/servicios/validaciones.ts`**
- [ ] **Step 7: Ejecutar `npm run test tests/unitarias/validaciones.test.ts` y verificar que pasa al 100%**
- [ ] **Step 8: Commit de la tarea 2**

---

### Task 3: Capa de Persistencia Local y Repositorio de Usuarios (TDD)

**Files:**
- Create: `src/modelos/usuario.ts`
- Create: `src/modelos/sesion.ts`
- Create: `src/modelos/sincronizacion.ts`
- Create: `src/db/baseDatos.ts`
- Create: `src/db/repositorios/repositorioUsuarios.ts`
- Test: `tests/unitarias/repositorioUsuarios.test.ts`

**Interfaces:**
- Consumes: `criptografia.ts`, `validaciones.ts`
- Produces:
  - Clase `BaseDatosLocal` extendiendo `Dexie`
  - `repositorioUsuarios.registrarUsuario(datos): Promise<Usuario>` (Primer usuario = ADMINISTRADOR)
  - `repositorioUsuarios.autenticarUsuario(matricula, contrasena): Promise<Usuario>`
  - `repositorioUsuarios.obtenerSesionActiva(): Promise<SesionLocal | null>`
  - `repositorioUsuarios.guardarSesion(usuario): Promise<void>`
  - `repositorioUsuarios.cerrarSesion(): Promise<void>`
  - `repositorioUsuarios.contarUsuarios(): Promise<number>`

- [ ] **Step 1: Escribir modelos TypeScript (`usuario.ts`, `sesion.ts`, `sincronizacion.ts`)**
- [ ] **Step 2: Escribir pruebas que fallen para el repositorio de usuarios con `fake-indexeddb`**
- [ ] **Step 3: Implementar `src/db/baseDatos.ts` con tablas `usuarios`, `colaSincronizacion` y `sesiones`**
- [ ] **Step 4: Implementar `src/db/repositorios/repositorioUsuarios.ts` con lógica transaccional de primer usuario = ADMINISTRADOR y encolado en `colaSincronizacion`**
- [ ] **Step 5: Ejecutar pruebas y verificar aprobación al 100%**
- [ ] **Step 6: Commit de la tarea 3**

---

### Task 4: Servicios de Compresión de Imágenes y Detector de Conectividad (TDD)

**Files:**
- Create: `src/servicios/compresionImagen.ts`
- Create: `src/servicios/detectorRed.ts`
- Test: `tests/unitarias/serviciosAdicionales.test.ts`

**Interfaces:**
- Produces:
  - `comprimirImagenPerfil(archivoODataUrl: File | string, maxDimension?: number, calidad?: number): Promise<string>`
  - `suscribirEstadoRed(callback: (estaEnLinea: boolean) => void): () => void`
  - `obtenerEstadoRedActual(): boolean`

- [ ] **Step 1: Escribir pruebas unitarias para compresión y detector de red**
- [ ] **Step 2: Implementar compresión de imagen en Canvas (formato JPEG, máx 800x800, calidad 0.8)**
- [ ] **Step 3: Implementar detector de red usando eventos de ventana `online`/`offline`**
- [ ] **Step 4: Ejecutar pruebas y verificar éxito**
- [ ] **Step 5: Commit de la tarea 4**

---

### Task 5: Sistema Visual 100% Oscuro y Componentes Adaptables

**Files:**
- Create: `src/estilos/variables.css`
- Create: `src/estilos/global.css`
- Create: `src/componentes/LogoInteractivo/LogoInteractivo.tsx`
- Create: `src/componentes/LogoInteractivo/LogoInteractivo.css`
- Create: `src/componentes/Navegacion/BarraSuperior.tsx`
- Create: `src/componentes/Navegacion/BarraSuperior.css`

**Interfaces:**
- Produces:
  - Tokens CSS para paleta 100% oscura, sin cuadros dentro de cuadros, responsive adaptable.
  - Componente `<LogoInteractivo onIniciar={() => void} />`
  - Componente `<BarraSuperior usuario={usuario} estaEnLinea={estaEnLinea} onCerrarSesion={() => void} />`

- [ ] **Step 1: Definir variables CSS oscuras (`#0A0A0A`, `#141414`, `#242424`, `#F3F4F6`, `#10B981`, etc.)**
- [ ] **Step 2: Definir estilos globales de pantalla completa (`100dvh`), sin scroll horizontal, tipografía moderna**
- [ ] **Step 3: Implementar `LogoInteractivo` con gráficos SVG estilizados de antena/red/telecomunicaciones y pulsación táctil**
- [ ] **Step 4: Implementar `BarraSuperior` adaptable (PC y Celular)**
- [ ] **Step 5: Commit de la tarea 5**

---

### Task 6: Contexto de Autenticación y Pantallas (Inicio, Registro, Login, Panel Principal)

**Files:**
- Create: `src/contextos/ContextoAutenticacion.tsx`
- Create: `src/paginas/Inicio/PantallaInicio.tsx`
- Create: `src/paginas/Registro/PantallaRegistro.tsx`
- Create: `src/paginas/Login/PantallaLogin.tsx`
- Create: `src/paginas/PanelPrincipal/PantallaPrincipal.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`

**Interfaces:**
- Produces:
  - `useAutenticacion()`: expone `usuario`, `sesion`, `estaAutenticado`, `cargando`, `iniciarSesion`, `registrar`, `cerrarSesion`.
  - Navegación fluida entre pantallas sin iframes ni cuadros innecesarios.

- [ ] **Step 1: Implementar `ContextoAutenticacion.tsx` que recupera la sesión activa de Dexie al montar**
- [ ] **Step 2: Implementar `PantallaInicio.tsx` con el Logo único y centrado**
- [ ] **Step 3: Implementar `PantallaRegistro.tsx` con campos completos, captura de foto, badge de ADMINISTRADOR si es primer usuario**
- [ ] **Step 4: Implementar `PantallaLogin.tsx` con validación de credenciales locales**
- [ ] **Step 5: Implementar `PantallaPrincipal.tsx` mostrando el perfil autenticado, estado local y botón para iniciar evaluación**
- [ ] **Step 6: Implementar `App.tsx` integrando el router/navegador simple adaptable**
- [ ] **Step 7: Implementar `main.tsx` conectando React al DOM**
- [ ] **Step 8: Commit de la tarea 6**

---

### Task 7: Pruebas de Integración Completas del Flujo de Autenticación (TDD)

**Files:**
- Create: `tests/integracion/flujoAutenticacion.test.tsx`

- [ ] **Step 1: Escribir prueba de integración completa simulando:**
  - Renderizado inicial en pantalla con solo Logo.
  - Clic en Logo redirige a Registro si no hay usuarios.
  - Registro exitoso del primer usuario como `ADMINISTRADOR`.
  - Verificación de sesión iniciada automáticamente.
  - Cierre de sesión y nuevo inicio de sesión con contraseña.
  - Intento de registro de usuario con la misma matrícula es rechazado.
- [ ] **Step 2: Ejecutar `npm run test` y verificar que el 100% de las pruebas pasan**
- [ ] **Step 3: Commit de la tarea 7**

---

### Task 8: Documentación Completa en `/docs`

**Files:**
- Create: `docs/ARQUITECTURA.md`
- Create: `docs/INSTALACION.md`
- Create: `docs/DESARROLLO.md`
- Create: `docs/GOOGLE_SHEETS_DRIVE.md`
- Create: `docs/SINCRONIZACION.md`
- Create: `docs/BASE_DATOS.md`
- Create: `docs/SEGURIDAD.md`
- Create: `docs/ESTRUCTURA_PROYECTO.md`
- Create: `docs/ROADMAP.md`

- [ ] **Step 1: Redactar cada uno de los 9 documentos en `/docs` en español profesional y detallado**
- [ ] **Step 2: Commit de la documentación**

---

### Task 9: Verificación Final, Build y Auditoría de Criterios

- [ ] **Step 1: Ejecutar suite de pruebas: `npm run test`**
- [ ] **Step 2: Ejecutar compilación de producción: `npm run build`**
- [ ] **Step 3: Verificar que el diseño es 100% oscuro y responsive**
- [ ] **Step 4: Comprobar que no existen características de Etapas 2+ implementadas a destiempo**
- [ ] **Step 5: Commit final y reporte detallado de entrega**
