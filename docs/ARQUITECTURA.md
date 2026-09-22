# Arquitectura del Sistema — Supervisión de Cuartos de Comunicaciones

## 1. Visión General de la Arquitectura
El sistema de supervisión de cuartos de comunicaciones del IMSS está diseñado bajo el paradigma **Offline-First**, garantizando que el personal técnico en campo pueda operar sin interrupciones, independientemente de la conectividad en sótanos, cuartos de telecomunicaciones blindados o unidades remotas.

```
+-------------------------------------------------------------------------+
|                  Capa de Presentación (React 18 + TS)                   |
|  - Sistema Visual 100% Oscuro (CSS Puro con Tokens Semánticos)          |
|  - Layout Adaptable (PC / Tablet / Celular)                             |
|  - Pantalla de Inicio Minimalista (Logo Interactivo de Telecomunicaciones)
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|               Capa de Lógica de Negocio y Seguridad                     |
|  - Contexto de Autenticación Reactivo (Sesión Local Persistente)       |
|  - Criptografía Nativa Web Crypto (PBKDF2-SHA256, 100k iteraciones)    |
|  - Compresión y Optimización de Fotos en Canvas Local                  |
|  - Detector Reactivo de Red (Online / Offline)                         |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|              Capa de Persistencia Transaccional Local                   |
|  - IndexedDB gestionado por Dexie.js (CuartosComunicacionesBD)          |
|  - Tabla `usuarios` (Índices únicos: matricula, correoElectronico)      |
|  - Regla: Primer usuario registrado = ADMINISTRADOR                     |
|  - Tabla `sesiones` (Registro único 'sesion_activa' para offline)       |
|  - Tabla `colaSincronizacion` (Registro atómico de operaciones CRUD)    |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|           Capa de Despliegue Multiplataforma (Capacitor + Vite)         |
|  - Web / Progressive Web App (PWA)                                      |
|  - Android APK (Android Studio / Capacitor Android)                     |
|  - iOS Bundle (Xcode / Capacitor iOS)                                   |
+-------------------------------------------------------------------------+
```

## 2. Decisiones Arquitectónicas Fundamentales

### 2.1 Enfoque Offline-First Real
- La aplicación **no depende de llamadas de red bloqueantes** para ninguna operación de usuario o autenticación.
- Todos los datos se escriben inmediatamente en la base local (IndexedDB) a través de Dexie.js.
- Se asegura la atomicidad: el alta de un usuario y el registro de su correspondiente evento en `colaSincronizacion` ocurren dentro de la misma transacción de base de datos.

### 2.2 Sistema Visual 100% Oscuro
- Eliminación total de fondos claros o blancos.
- Uso de negros profundos (`#0A0A0A`) y superficies elevadas discretas (`#121212`, `#181818`).
- Prohibición de marcos anidados ("cuadros dentro de cuadros") y de tarjetas flotantes que saturen la pantalla. La información se distribuye de manera limpia aprovechando el 100% del viewport en cualquier factor de forma.

### 2.3 Seguridad de Identidad y Contraseñas
- No se transmiten ni almacenan contraseñas en texto claro.
- Uso de PBKDF2 con sal aleatoria criptográfica por usuario (16 bytes) y 100,000 iteraciones vía `crypto.subtle`.
- La verificación de credenciales utiliza comparación en tiempo constante contra ataques de temporización.

### 2.4 Control de Concurrencia y Sincronización Futura
- Cada entidad cuenta con un `id` único generado mediante UUID v4 (`crypto.randomUUID()`), un campo de marca de tiempo ISO `creadoEn`/`actualizadoEn`, y un contador de `version` para resolución optimista de conflictos al sincronizar con Google Sheets en etapas posteriores.
