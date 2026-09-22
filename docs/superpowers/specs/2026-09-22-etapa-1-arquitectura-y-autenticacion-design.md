# Especificación de Diseño: Etapa 1 - Arquitectura Base, Sistema Visual Oscuro, Persistencia Local y Autenticación

**Fecha:** 2026-09-22  
**Proyecto:** App de Supervisión de Cuartos de Comunicaciones (IMSS)  
**Estado:** Propuesta de Diseño para Aprobación  
**Etapa:** 1 de N (Exclusivamente Arquitectura Inicial y Gestión de Usuarios)

---

## 1. Resumen Ejecutivo y Alcance de la Etapa 1

El objetivo de la **Etapa 1** es establecer los cimientos arquitectónicos, de seguridad, de persistencia de datos local (*offline-first*) y el sistema visual 100% oscuro adaptable para la aplicación de supervisión de cuartos de telecomunicaciones.

### 1.1 Incluido en esta Etapa
1. **Scaffolding y Arquitectura Base:** Proyecto Vite + React 18 + TypeScript + Capacitor + Dexie.js + CSS Puro con soporte de empaquetado Web/PWA, Android APK e iOS.
2. **Sistema Visual 100% Oscuro y Adaptable:** Diseño responsive real para celular, tablet y PC, sin fondos blancos, sin "cuadros dentro de cuadros", sin marcos anidados y sin dashboards innecesarios.
3. **Pantalla de Inicio Minimalista:** Vista centrada que muestra exclusivamente el **LOGO** interactivo, el cual conduce al inicio de supervisión o flujo de autenticación.
4. **Registro de Usuarios y Regla de Administrador:**
   - Campos: Matrícula (única), Nombre Completo, Correo Electrónico (único), WhatsApp (10 dígitos), Contraseña (segura) y Fotografía de perfil (con compresión y redimensionamiento en canvas).
   - **Regla Crítica:** El primer usuario registrado en la base de datos se asigna automáticamente como `ADMINISTRADOR`. Todo usuario posterior es `USUARIO_NORMAL`.
5. **Seguridad Criptográfica:** Hashing PBKDF2-SHA256 con sal criptográfica única de 16 bytes por usuario y 100,000 iteraciones mediante la API nativa `crypto.subtle`. Cero contraseñas en texto claro.
6. **Inicio de Sesión y Persistencia de Sesión:** Autenticación local offline y persistencia de sesión activa en IndexedDB ante recargas accidentales, navegación o pérdida de conectividad.
7. **Base Preparada para Sincronización Remota:** Tabla local de `colaSincronizacion` con registro automático de transacciones para futura integración con Google Sheets y Google Drive.
8. **Pruebas Automatizadas (TDD):** Pruebas unitarias y de integración exhaustivas con Vitest y `fake-indexeddb`.
9. **Documentación Técnica Inicial:** Generación de la suite de documentación en `/docs`.

### 1.2 Excluido de esta Etapa (Estrictamente postergado a etapas siguientes)
- Formularios de evaluación de cuartos de comunicaciones.
- Captura de fotografías de evaluación.
- Generación de reportes PDF y hojas de cálculo Excel.
- Respaldos ZIP.
- Llamadas y sincronización en vivo con Google Sheets API o Google Drive API.

---

## 2. Arquitectura del Sistema

### 2.1 Pila Tecnológica
- **Entorno de Ejecución y Herramientas:** Node.js v18+, npm.
- **Bundler y Servidor de Desarrollo:** Vite con soporte TypeScript estricto.
- **Capa de Presentación:** React 18 (SPA) con diseño modular basado en componentes limpios y CSS nativo con variables semánticas (Design Tokens).
- **Capa de Persistencia Local:** IndexedDB mediante el motor transaccional **Dexie.js**.
- **Contenedor Móvil:** Capacitor Core / Android / iOS (estructura lista para compilar APK/iOS).
- **Criptografía:** Web Crypto API (`window.crypto.subtle`) nativa en navegadores modernos y WebViews móviles.
- **Suite de Pruebas:** Vitest + @testing-library/react + fake-indexeddb.

### 2.2 Estructura de Directorios del Código Fuente
```text
/
├── docs/                                # Documentación del sistema
│   ├── ARQUITECTURA.md
│   ├── INSTALACION.md
│   ├── DESARROLLO.md
│   ├── GOOGLE_SHEETS_DRIVE.md
│   ├── SINCRONIZACION.md
│   ├── BASE_DATOS.md
│   ├── SEGURIDAD.md
│   ├── ESTRUCTURA_PROYECTO.md
│   └── ROADMAP.md
├── src/
│   ├── assets/                          # Logotipos y recursos estáticos
│   ├── componentes/                     # Componentes de UI reutilizables
│   │   ├── Comunes/                     # Botones, entradas, selectores
│   │   ├── Navegacion/                  # Barra superior y navegación móvil/PC
│   │   └── LogoInteractivo/             # Logo principal de pantalla inicial
│   ├── contextos/                       # Contextos React (Autenticación, Tema, Conectividad)
│   ├── db/                              # Definición y esquemas de Dexie.js
│   │   ├── baseDatos.ts                 # Instancia de BaseDatosLocal
│   │   ├── esquemas.ts                  # Definición de tablas e índices
│   │   └── repositorios/                # Repositorios de datos
│   │       ├── repositorioUsuarios.ts
│   │       └── repositorioColaSync.ts
│   ├── modelos/                         # Tipos e interfaces TypeScript
│   │   ├── usuario.ts
│   │   ├── sesion.ts
│   │   └── sincronizacion.ts
│   ├── paginas/                         # Vistas de la aplicación
│   │   ├── Inicio/                      # Pantalla limpia con Logo
│   │   ├── Registro/                    # Registro de usuario / Administrador
│   │   ├── Login/                       # Inicio de sesión
│   │   └── PanelPrincipal/              # Vista post-autenticación Etapa 1
│   ├── servicios/                       # Lógica de negocio y utilidades
│   │   ├── criptografia.ts              # PBKDF2, salado, verificación
│   │   ├── validaciones.ts              # Validadores de formularios
│   │   ├── compresionImagen.ts          # Optimización de fotos en canvas
│   │   └── detectorRed.ts               # Estado en línea / fuera de línea
│   ├── estilos/                         # Sistema de diseño CSS oscuro
│   │   ├── variables.css                # Tokens de color, espaciado, tipografía
│   │   ├── global.css                   # Resets y layout fluido
│   │   └── utilidades.css               # Clases utilitarias directas
│   ├── App.tsx                          # Enrutamiento y árbol principal
│   └── main.tsx                         # Punto de entrada
├── tests/                               # Pruebas automatizadas (TDD)
│   ├── unitarias/
│   └── integracion/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Modelo de Datos Local (IndexedDB / Dexie.js)

La base de datos local llevará por nombre `SupervisionCuartosTelecomBD`.

### 3.1 Esquema de Tablas e Índices
```typescript
// db/esquemas.ts
export const ESQUEMA_BD = {
  usuarios: 'id, &matricula, &correoElectronico, rol, creadoEn, sincronizado',
  colaSincronizacion: 'id, tipoEntidad, idEntidad, estado, creadoEn',
  sesiones: 'id, idUsuario, matricula'
};
```

### 3.2 Definición de Entidades

#### Entidad: `Usuario`
- `id`: `string` (UUID v4 generado en cliente).
- `matricula`: `string` (Alfanumérico de 5 a 15 caracteres, sin espacios, **índice único**).
- `nombreCompleto`: `string` (Mínimo 3 caracteres).
- `correoElectronico`: `string` (Formato email válido, **índice único**).
- `numeroWhatsapp`: `string` (Exactamente 10 dígitos numéricos).
- `hashContrasena`: `string` (Derivación PBKDF2 en base64).
- `salContrasena`: `string` (Sal aleatoria de 16 bytes en base64).
- `rol`: `'ADMINISTRADOR' | 'USUARIO_NORMAL'`.
- `fotografiaBase64`: `string | null` (Data URI JPEG comprimido, máximo 800x800 px).
- `creadoEn`: `string` (ISO 8601).
- `actualizadoEn`: `string` (ISO 8601).
- `sincronizado`: `boolean` (Inicia en `false`).
- `version`: `number` (Control de concurrencia optimista, inicia en `1`).

#### Entidad: `ElementoColaSincronizacion`
- `id`: `string` (UUID v4).
- `tipoEntidad`: `'USUARIO' | 'EVALUACION' | 'FOTOGRAFIA' | 'REPORTE'`.
- `idEntidad`: `string` (ID de la entidad asociada).
- `operacion`: `'CREAR' | 'ACTUALIZAR' | 'ELIMINAR'`.
- `datos`: `string` (JSON con el payload completo de la entidad).
- `creadoEn`: `string` (ISO 8601).
- `intentos`: `number` (Contador de intentos, inicia en `0`).
- `ultimoError`: `string | null`.
- `estado`: `'PENDIENTE' | 'PROCESANDO' | 'SINCRONIZADO' | 'FALLIDO'`.

#### Entidad: `SesionLocal`
- `id`: `'sesion_activa'` (Clave primaria única de registro único).
- `idUsuario`: `string`.
- `matricula`: `string`.
- `nombreCompleto`: `string`.
- `rol`: `'ADMINISTRADOR' | 'USUARIO_NORMAL'`.
- `iniciadoEn`: `string` (ISO 8601).

---

## 4. Reglas de Negocio y Lógica Crítica

### 4.1 Registro del Primer Usuario como Administrador
1. Dentro de una transacción de lectura/escritura en Dexie:
   ```typescript
   const totalUsuarios = await bd.usuarios.count();
   const rolAsignado: RolUsuario = totalUsuarios === 0 ? 'ADMINISTRADOR' : 'USUARIO_NORMAL';
   ```
2. Si `totalUsuarios === 0`, la interfaz muestra claramente que este usuario tendrá privilegios de administrador.
3. Se verifica unicidad de matrícula y correo. Si ya existen, se arroja un error amigable en español.
4. Se genera la sal criptográfica y el hash de la contraseña.
5. Se inserta el usuario en `usuarios` y un registro en `colaSincronizacion` con `operacion: 'CREAR'`. Todo en la misma transacción atómica.

### 4.2 Seguridad de Contraseñas
- Se utiliza `crypto.getRandomValues(new Uint8Array(16))` para generar una sal única por usuario.
- Se utiliza `crypto.subtle.importKey` y `crypto.subtle.deriveBits` con:
  - Algoritmo: PBKDF2.
  - Hash: SHA-256.
  - Iteraciones: 100,000.
- La verificación compara el hash derivado con el almacenado byte por byte mediante un algoritmo de tiempo constante.

### 4.3 Persistencia y Prevención de Pérdida de Datos
- Al recargar la página o volver a la app, el proveedor `ProveedorAutenticacion` consulta `bd.sesiones.get('sesion_activa')`.
- Si existe una sesión activa válida, el usuario permanece autenticado sin necesidad de volver a introducir credenciales.
- Al cerrar sesión explícitamente, se remueve el registro `sesion_activa` de `sesiones`.

---

## 5. Diseño Visual y Experiencia de Usuario (UI/UX)

### 5.1 Especificaciones de Estilo (100% Oscuro)
- **Fondo Base (`--fondo-principal`):** `#0A0A0A`
- **Fondo de Superficies (`--fondo-superficie`):** `#141414`
- **Bordes Tenues (`--borde-suave`):** `#242424`
- **Texto Principal (`--texto-principal`):** `#F3F4F6`
- **Texto Secundario (`--texto-secundario`):** `#9CA3AF`
- **Acento Primario (`--acento-primario`):** `#2563EB` (azul sobrio) o `#059669` (verde esmeralda discreto para acciones positivas)
- **Estado Error (`--color-error`):** `#DC2626`
- **Distribución de Pantalla:** La interfaz se extiende a lo ancho y alto aprovechando el 100% del viewport (`100dvh`). Se prohíben anidaciones de tarjetas tipo tarjeta-dentro-de-tarjeta.

### 5.2 Flujo de Pantallas
1. **Inicio (`/`):**
   - Centro absoluto de la pantalla: Logo interactivo con animación sutil de presencia.
   - Texto directo: *"Presione para iniciar supervisión"*.
   - Al pulsar el logo:
     - Si hay sesión: va a `/principal`.
     - Si no hay usuarios en el sistema: va a `/registro` con indicación de administrador.
     - Si hay usuarios pero no sesión: va a `/login`.
2. **Registro (`/registro`):**
   - Formulario directo con campos claros.
   - Vista previa de fotografía seleccionada con botón de captura/selección.
   - Mensaje destacado si es el primer usuario: *"Configuración inicial: Este registro será el ADMINISTRADOR del sistema"*.
3. **Login (`/login`):**
   - Campos: Matrícula y Contraseña.
   - Botón *"Iniciar Sesión"* y enlace a *"Registrar nuevo usuario"*.
4. **Vista Principal de la Etapa 1 (`/principal`):**
   - Barra superior con: Matrícula, Nombre, Rol (`ADMINISTRADOR`/`USUARIO`), Indicador de estado local/red, y botón *"Cerrar Sesión"*.
   - Cuerpo central con bienvenida, estado de la base local y botón de acción principal preparado para la Etapa 2.

---

## 6. Plan de Pruebas Automatizadas (TDD)

1. **Pruebas de Criptografía (`tests/unitarias/criptografia.test.ts`):**
   - Generación de hashes consistentes con la misma sal y contraseña.
   - Generación de hashes diferentes ante sales diferentes.
   - Verificación exitosa de contraseña correcta.
   - Rechazo de contraseña incorrecta.
2. **Pruebas de Validaciones (`tests/unitarias/validaciones.test.ts`):**
   - Validación de matrículas válidas e inválidas (longitud, caracteres especiales).
   - Validación de formatos de correo electrónico.
   - Validación de números de WhatsApp (10 dígitos exactos).
   - Validación de fortaleza de contraseña.
3. **Pruebas del Repositorio de Usuarios (`tests/unitarias/repositorioUsuarios.test.ts`):**
   - Primer usuario registrado adquiere rol `ADMINISTRADOR`.
   - Segundo usuario registrado adquiere rol `USUARIO_NORMAL`.
   - Error al registrar matrícula existente.
   - Error al registrar correo electrónico existente.
   - Inserción correcta del evento correspondiente en `colaSincronizacion`.
4. **Pruebas de Integración y Componentes (`tests/integracion/flujoAutenticacion.test.tsx`):**
   - Renderizado limpio de la pantalla inicial con Logo.
   - Flujo completo: Clic en Logo -> Registro de Administrador -> Sesión iniciada automáticamente -> Persistencia tras recarga simulada.

---

## 7. Criterios de Aceptación para la Etapa 1

- [ ] La aplicación compila sin errores de TypeScript ni de empaquetado Vite (`npm run build`).
- [ ] Todas las pruebas de Vitest pasan al 100% (`npm run test`).
- [ ] La interfaz es 100% oscura en cualquier tamaño de pantalla (móvil, tablet, PC).
- [ ] La base de datos local funciona sin conexión a Internet (offline-first).
- [ ] El primer usuario registrado es indiscutiblemente `ADMINISTRADOR`.
- [ ] La contraseña no se almacena en texto plano en ningún lugar de IndexedDB.
- [ ] La documentación en `/docs` está completa, detallada y en español.
- [ ] No se implementaron funciones de evaluaciones, formularios ni fotos de supervisión antes de tiempo.
