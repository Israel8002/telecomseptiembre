# Estructura del Proyecto y Mapa de Módulos

```text
PROYECTO TELECOM SEPTIEMBRE/
├── docs/                                  # Documentación técnica completa
│   ├── ARQUITECTURA.md                   # Principios arquitectónicos y capas
│   ├── BASE_DATOS.md                     # Esquema de IndexedDB y tablas Dexie
│   ├── DESARROLLO.md                     # Convenciones de código y comandos
│   ├── ESTRUCTURA_PROYECTO.md            # Este mapa de módulos
│   ├── GOOGLE_SHEETS_DRIVE.md            # Especificación de integración remota
│   ├── INSTALACION.md                    # Guía de requisitos y arranque
│   ├── ROADMAP.md                        # Fases de desarrollo del proyecto
│   ├── SEGURIDAD.md                      # Hashing PBKDF2 y roles
│   └── SINCRONIZACION.md                 # Cola Store-and-Forward offline
├── src/
│   ├── componentes/                       # Componentes de presentación reutilizables
│   │   ├── LogoInteractivo/               # Logo vectorial presionable de telecomunicaciones
│   │   └── Navegacion/                    # Barra superior adaptable (PC y Celular)
│   ├── contextos/                         # Estado global
│   │   └── ContextoAutenticacion.tsx      # Proveedor de sesión y autenticación local
│   ├── db/                                # Persistencia con Dexie.js
│   │   ├── baseDatos.ts                   # Clase BaseDatosLocal singleton
│   │   └── repositorios/
│   │       └── repositorioUsuarios.ts     # Repositorio transaccional de usuarios
│   ├── estilos/                           # Sistema de diseño 100% oscuro
│   │   ├── global.css                     # Reset fluido sin anidación de tarjetas
│   │   └── variables.css                  # Tokens semánticos de diseño
│   ├── modelos/                           # Definiciones de tipo TypeScript
│   │   ├── sesion.ts                      # Interfaces de sesión
│   │   ├── sincronizacion.ts              # Tipos de la cola de sincronización
│   │   └── usuario.ts                     # Entidad de Usuario y roles
│   ├── paginas/                           # Vistas de la aplicación
│   │   ├── Inicio/                        # Pantalla minimalista con Logo interactivo
│   │   ├── Login/                         # Inicio de sesión con credenciales locales
│   │   ├── PanelPrincipal/                # Vista post-login lista para Etapa 2
│   │   └── Registro/                      # Formulario con foto y regla de Administrador
│   ├── servicios/                         # Lógica desacoplada
│   │   ├── compresionImagen.ts            # Optimización de imágenes en canvas
│   │   ├── criptografia.ts                # PBKDF2 con SubtleCrypto
│   │   ├── detectorRed.ts                 # Escucha reactiva de estado online/offline
│   │   └── validaciones.ts                # Validadores de entrada en español
│   ├── App.tsx                            # Enrutador y layout principal
│   └── main.tsx                           # Montaje en el DOM
├── tests/                                 # Suite de pruebas automatizadas (TDD)
│   ├── integracion/                       # Pruebas de integración E2E
│   │   └── flujoAutenticacion.test.tsx    # Flujo completo de autenticación y roles
│   ├── unitarias/                         # Pruebas unitarias
│   │   ├── criptografia.test.ts
│   │   ├── entorno.test.ts
│   │   ├── repositorioUsuarios.test.ts
│   │   ├── serviciosAdicionales.test.ts
│   │   └── validaciones.test.ts
│   └── setup.ts                           # Configuración de jsdom y fake-indexeddb
├── capacitor.config.json                  # Configuración para Android APK e iOS
├── index.html                             # Plantilla HTML con viewport responsive
├── package.json                           # Manifiesto de dependencias y scripts
├── tsconfig.json                          # Configuración estricta de TypeScript
└── vite.config.ts                         # Configuración de Vite y Vitest
```
