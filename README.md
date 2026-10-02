# Telecom CDI - Sistema de Supervisión de Cuartos de Comunicaciones

Aplicación web progresiva (PWA) y multiplataforma (iOS/Android/Web) diseñada para la supervisión técnica, evaluación normativa, registro de evidencias fotográficas y generación de reportes ejecutivos en cuartos de telecomunicaciones del **Instituto Mexicano del Seguro Social (IMSS)**.

🌐 **Producción en vivo**: [https://cditelecom.netlify.app](https://cditelecom.netlify.app)  
📦 **Repositorio GitHub**: [https://github.com/Israel8002/telecomseptiembre](https://github.com/Israel8002/telecomseptiembre)

---

## 🚀 Características Principales

1. **Arquitectura Offline-First**:
   - Funciona al 100% sin conexión a Internet en sótanos o zonas blindadas.
   - Base de datos transaccional local en el dispositivo con **Dexie.js / IndexedDB**.
   - Sincronización automática en segundo plano al recuperar conectividad con reintentos exponenciales.

2. **Evaluación Normativa Institucional Completa**:
   - 8 secciones institucionales oficiales con 42 reactivos (Q001 a Q042).
   - Generación de `IDEVALUACION` único e irrepetible.
   - Preguntas condicionantes (`visibleIf`), autoguardado en tiempo real y flujo para continuar evaluaciones interrumpidas.

3. **Módulo Fotográfico y Evidencias Técnicas**:
   - Captura directa desde cámara trasera o galería de fotos.
   - Redimensionamiento y compresión en canvas antes de guardar (optimización de memoria y almacenamiento).
   - Visor modal con notas técnicas por fotografía y clasificación por cuarto y sección.

4. **Motor de Exportación Local**:
   - **Reporte Ejecutivo PDF**: Formato carta oficial con membrete institucional, métricas de cumplimiento, recomendaciones técnicas, anexo fotográfico y recuadros formales de firma.
   - **Hojas de Cálculo Excel (`.xlsx`)**: Libro con 3 pestañas (Ficha técnica, 42 reactivos evaluados y metadatos de fotografías).
   - **Paquete de Respaldo Comprimido (`.zip`)**: Archivo unificado con JSON, PDF, Excel y carpeta de fotos en JPEG.

5. **Sincronización con la Nube (Google Cloud & Google Drive)**:
   - Sincronización atómica con **Google Sheets** (4 pestañas: Usuarios, Evaluaciones, Fotografias_Metadatos, Log_Sincronizacion).
   - Organización jerárquica automática de carpetas en **Google Drive** por Unidad y Tipo de Cuarto.
   - Puente con Google Apps Script (`google_apps_script_bridge.js`) para subida ilimitada de evidencias fotográficas en cuentas institucionales/personales.

6. **Panel de Administración y Auditoría Multi-Unidad**:
   - KPIs estatales en tiempo real (promedio de cumplimiento, cuartos conformes vs. críticos, desglose por tipo de cuarto).
   - Filtros avanzados por unidad médica, tipo de cuarto, evaluador técnico, estatus y rango de fechas.
   - Diagnóstico en vivo del estado de los servicios en la nube y cola de sincronización.

---

## 🛠️ Tecnologías Empleadas

- **Frontend**: React 18, TypeScript, Vite
- **Estilos**: CSS nativo con diseño oscuro institucional y tokens responsivos
- **Base de Datos Local**: Dexie.js (IndexedDB)
- **Seguridad**: Web Crypto API (PBKDF2-SHA256, sal criptográfica única)
- **Generación de Documentos**: `jspdf`, `jspdf-autotable`, `xlsx`, `jszip`
- **Multiplataforma**: Capacitor 6 (Android & iOS) + PWA (Service Worker, Manifest)
- **Hosting & CI/CD**: Netlify con despliegue continuo desde GitHub

---

## 💻 Desarrollo Local

### Requisitos
- Node.js 18+ (recomendado LTS 20+)
- npm 9+

### Instalación y Ejecución
```bash
# Instalar dependencias
npm install

# Servidor de desarrollo local
npm run dev

# Ejecutar suite de pruebas unitarias y de integración
npm run test

# Compilar para producción (carpeta dist/)
npm run build

# Sincronizar activos web con plataformas nativas Capacitor
npx cap copy
```

---

## 📱 Instalación como App (PWA)

1. Ingresa a [https://cditelecom.netlify.app](https://cditelecom.netlify.app) desde tu navegador móvil (Chrome en Android, Safari en iOS).
2. Toca en el menú del navegador:
   - **Android**: "Instalar aplicación" o "Agregar a la pantalla principal".
   - **iOS**: Compartir ➔ "Agregar al inicio".
3. La aplicación se instalará con el nombre **"Telecom CDI"** y sus íconos institucionales de alta definición, funcionando como una app nativa a pantalla completa y sin barra de direcciones.

---

## 📄 Licencia y Uso Institucional
Desarrollado para la supervisión y control de telecomunicaciones en instalaciones del Instituto Mexicano del Seguro Social (IMSS).
