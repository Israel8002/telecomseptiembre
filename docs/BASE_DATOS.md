# Especificación de la Base de Datos Local (IndexedDB / Dexie.js)

## 1. Nombre de la Base de Datos
- **Identificador:** `SupervisionCuartosTelecomBD`
- **Motor:** IndexedDB del dispositivo gestionado mediante **Dexie.js** v4.

## 2. Definición de Esquemas e Índices

```typescript
this.version(1).stores({
  usuarios: 'id, &matricula, &correoElectronico, rol, creadoEn, sincronizado',
  colaSincronizacion: 'id, tipoEntidad, idEntidad, estado, creadoEn',
  sesiones: 'id, idUsuario, matricula'
});
```

### 2.1 Tabla: `usuarios`
Almacena las cuentas de usuarios en el dispositivo.

| Campo | Tipo | Clave / Índice | Descripción |
|---|---|---|---|
| `id` | `string` | Primaria (UUID v4) | Identificador técnico global |
| `matricula` | `string` | Único (`&matricula`) | Matrícula laboral IMSS |
| `nombreCompleto` | `string` | No indexado | Nombre del usuario |
| `correoElectronico` | `string` | Único (`&correoElectronico`) | Correo de contacto/institucional |
| `numeroWhatsapp` | `string` | No indexado | Teléfono móvil (10 dígitos) |
| `hashContrasena` | `string` | No indexado | Hash PBKDF2-SHA256 (Base64) |
| `salContrasena` | `string` | No indexado | Sal aleatoria de 16 bytes (Base64) |
| `rol` | `'ADMINISTRADOR' \| 'USUARIO_NORMAL'` | Indexado (`rol`) | Rol de permisos en la aplicación |
| `fotografiaBase64` | `string \| null` | No indexado | Fotografía comprimida en JPEG |
| `creadoEn` | `string` (ISO) | Indexado (`creadoEn`) | Fecha de creación del registro |
| `actualizadoEn` | `string` (ISO) | No indexado | Fecha de última modificación |
| `sincronizado` | `boolean` | Indexado (`sincronizado`) | Estado de sincronización |
| `version` | `number` | No indexado | Versión para control de concurrencia |

### 2.2 Tabla: `colaSincronizacion`
Almacena transacciones locales pendientes de envío a Google Sheets/Drive.

| Campo | Tipo | Clave / Índice | Descripción |
|---|---|---|---|
| `id` | `string` | Primaria (UUID v4) | ID de la transacción |
| `tipoEntidad` | `'USUARIO' \| 'EVALUACION' \| 'FOTOGRAFIA' \| 'REPORTE'` | Indexado | Tipo de recurso |
| `idEntidad` | `string` | Indexado | ID del recurso local |
| `operacion` | `'CREAR' \| 'ACTUALIZAR' \| 'ELIMINAR'` | No indexado | Tipo de mutación |
| `datos` | `string` (JSON) | No indexado | Payload serializado |
| `creadoEn` | `string` (ISO) | Indexado | Momento de la operación |
| `intentos` | `number` | No indexado | Contador de reintentos |
| `ultimoError` | `string \| null` | No indexado | Detalle del último error |
| `estado` | `'PENDIENTE' \| 'PROCESANDO' \| 'SINCRONIZADO' \| 'FALLIDO'` | Indexado | Estado del elemento |

### 2.3 Tabla: `sesiones`
Almacena la sesión activa del usuario para garantizar la persistencia local ante recargas o navegación.

| Campo | Tipo | Clave / Índice | Descripción |
|---|---|---|---|
| `id` | `string` | Primaria (`'sesion_activa'`) | Clave única de la sesión actual |
| `idUsuario` | `string` | Indexado | ID del usuario autenticado |
| `matricula` | `string` | Indexado | Matrícula del usuario |
| `nombreCompleto` | `string` | No indexado | Nombre para visualización |
| `rol` | `RolUsuario` | No indexado | Rol activo |
| `iniciadoEn` | `string` (ISO) | No indexado | Fecha y hora de inicio de sesión |
