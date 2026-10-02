# Hoja de Ruta del Proyecto (Roadmap de Etapas)

## Etapa 1: Arquitectura Base, Persistencia Local, Sistema Visual y Autenticación (COMPLETADA)
- [x] Scaffolding de arquitectura modular (React 18 + TS + Vite + Dexie + Capacitor).
- [x] Sistema visual 100% oscuro adaptable (PC, tablet, celular) sin marcos anidados ni cuadros dentro de cuadros.
- [x] Pantalla inicial ultra limpia con Logo interactivo presionable.
- [x] Registro de usuarios con validaciones estrictas y compresión de fotografía en canvas.
- [x] Regla crítica de negocio: el primer usuario registrado se convierte en ADMINISTRADOR de manera automática.
- [x] Hashing seguro de contraseñas con Web Crypto API (PBKDF2-SHA256, 100k iteraciones, sal criptográfica única).
- [x] Inicio de sesión y persistencia de sesión local ante recargas o navegación.
- [x] Base de datos local transaccional (Dexie.js / IndexedDB) con cola de sincronización preparada.
- [x] Suite completa de pruebas automatizadas (TDD) al 100% con Vitest.
- [x] Documentación técnica en `/docs`.

---

## Etapa 2: Motor de Evaluaciones y Formularios de Supervisión (COMPLETADA)
- [x] Generador de `IDEVALUACION` único (`EVAL-YYYYMMDD-HHMMSS-MATRICULA-HEX4`) y reserva inmediata asociada al usuario evaluador en IndexedDB.
- [x] Formularios de supervisión estructurados por las 8 secciones oficiales institucionales (Física, Seguridad, Control, Infraestructura, Equipos, Telefonía, Sistema eléctrico y respaldo, Observaciones) con 42 reactivos (Q001 a Q042), preguntas condicionantes (`visibleIf`), tipos dinámicos (radio, number, textarea) y recomendaciones técnicas institucionales.
- [x] Autoguardado continuo en base local ante cada respuesta (resistencia a navegación, botón back, cierre accidental o pérdida de energía) con cola de sincronización.
- [x] Flujo de "Continuar evaluación incompleta" desde el panel principal con restauración íntegra de respuestas y notas.

---

## Etapa 3: Módulo Fotográfico de Supervisión y Evidencias (COMPLETADA)
- [x] Captura de fotografías asociadas a puntos específicos de evaluación (cámara nativa `capture="environment"` y selector de galería).
- [x] Redimensionamiento y compresión en cliente en canvas (máx 1280px, calidad 0.82) antes de persistencia local en base de datos.
- [x] Almacenamiento local estructurado por unidad, cuarto de comunicaciones, sección y reactivo en Dexie IndexedDB (tabla `evidenciasFotograficas`).
- [x] Visor modal con inspección técnica a pantalla completa, editor de notas técnicas/pie de foto y borrado seguro.
- [x] Galería completa de evidencias del cuarto con filtros por sección y contador dinámico.
- [x] Cola de carga asíncrona registrada (`colaSincronizacion` con `EVIDENCIA_FOTOGRAFICA`) lista para Drive.
- [x] Suite de pruebas automatizadas al 100% pasando sin errores.

---

## Etapa 4: Generación de Reportes PDF y Exportación a Excel (COMPLETADA)
- [x] Motor de generación de reportes ejecutivos en PDF en el dispositivo con diseño sobrio y firmas.
  - Membrete oficial institucional IMSS y OOAD Baja California.
  - Formato Carta oficial (Letter 612x792 pt, margen 40 pt).
  - Resumen ejecutivo de métricas, cumplimiento y desglose por secciones oficiales.
  - Listado de hallazgos y recomendaciones técnicas institucionales UEOD ante incumplimientos.
  - Anexo fotográfico de evidencias en sitio con notas técnicas y fechas.
  - Nota referente oficial obligatoria de la UEOD y Manual de Organización.
  - Recuadros formales para Evaluador Técnico, Recepción por la Unidad y Sello de la Unidad.
- [x] Exportación de datos de evaluación a hojas de cálculo Excel (`.xlsx`).
  - Hoja 1: Resumen Ejecutivo con ficha técnica y métricas globales.
  - Hoja 2: Detalle completo de los 42 reactivos institucionales con dictamen (Conforme, No Conforme, No Aplica) y recomendaciones.
  - Hoja 3: Registro de evidencias fotográficas asociadas.
- [x] Generación de respaldos en archivos `.zip` comprimidos.
  - Incluye `evaluacion_[ID].json` estructurado crudo.
  - Incluye `reporte_[ID].pdf` generado en alta fidelidad.
  - Incluye `datos_supervision_[ID].xlsx` con libro multi-hoja.
  - Incluye carpeta `evidencias/` con fotografías en JPEG y su `indice_fotografico.json`.
  - Incluye archivo informativo `LEEME_RESPALDO.txt`.
- [x] Componente modal interactivo `ModalExportacion` integrado en pantalla de evaluación y panel principal de historial.
- [x] Suite completa de pruebas automatizadas al 100% pasando sin errores (14 suites, 55 pruebas).

---

## Etapa 5: Sincronización Completa con Google Sheets y Google Drive (COMPLETADA)
- [x] Conector con Google Sheets API (v4) y Google Drive API (v3).
  - Autenticación criptográfica nativa con Service Account mediante Web Crypto API (RS256 con llave privada PKCS#8).
  - Inserción y actualización atómica en las 4 pestañas oficiales: `Usuarios`, `Evaluaciones`, `Fotografias_Metadatos` y `Log_Sincronizacion`.
  - Sin exposición de credenciales sensibles (hashes o contraseñas excluidos de Sheets).
- [x] Creación automática de carpetas jerárquicas en Drive por OOAD/Unidad y Tipo de Cuarto:
  - Estructura: `IMSS_SUPERVISION_TELECOM_DRIVE / [Unidad u OOAD] / [Tipo de Cuarto] /`.
  - Subida multipart optimizada de evidencias fotográficas en JPEG y reportes ejecutivos en PDF.
  - Generación de enlaces permanentes de visualización en Drive vinculados a la hoja de cálculo.
- [x] Procesador automático en segundo plano para vaciar la `colaSincronizacion`:
  - Detección reactiva de red (`detectorRed.ts`) para sincronizar inmediatamente al recuperar conexión a Internet.
  - Reintentos inteligentes con retroceso exponencial (*exponential backoff*) y registro de fallos transitorios.
- [x] Componente visual interactivo `BotonSincronizacion` integrado en la barra de navegación superior con estado en tiempo real.
- [x] Suite completa de pruebas automatizadas al 100% pasando sin errores (18 suites, 62 pruebas).

---

## Etapa 6: Módulo de Administración y Auditoría Multi-Unidad (COMPLETADA)
- [x] Vista de Administrador Multi-Unidad integrada con navegación adaptativa (escritorio y barra móvil nativa).
- [x] Tarjetas de Métricas Ejecutivas y KPIs estatales en tiempo real:
  - Total de evaluaciones supervisadas.
  - Promedio de cumplimiento normativo global estatal con semaforización cromática.
  - Cuartos conformes vs. críticos con alertas institucionales.
  - Desglose por tipo de cuarto (Site Principal, IDF Distribución, Conmutador, etc.).
- [x] Filtros avanzados multi-criterio:
  - Búsqueda textual libre (ID, unidad, evaluador, cuarto).
  - Selector de unidad médica u operativa.
  - Selector de tipo de cuarto de comunicaciones.
  - Selector de evaluador técnico.
  - Estado de evaluación (Completada vs. En Proceso).
  - Rango de cumplimiento porcentual normativo.
  - Rango de fechas de supervisión.
- [x] Doble visualización responsiva:
  - Tabla de auditoría detallada de 9 columnas para pantallas de escritorio.
  - Vista de tarjetas táctiles compactas con botones de acción completos y legibles en dispositivos móviles.
- [x] Exportador de auditoría a CSV con delimitador compatible para Excel.
- [x] Panel de diagnóstico y estado de integración Google Cloud (Sheets, Drive, Cuenta de Servicio).
- [x] Monitor de cola de sincronización local con reintentos manuales y limpieza segura de elementos fallidos.
- [x] Modal de auditoría transaccional para inspección de respuestas, evidencias fotográficas vinculadas e historial de sincronización.
- [x] Suite de pruebas automatizadas al 100% pasando sin errores (19 suites, 69 pruebas).

---

## Etapa 7: PWA, Identidad Visual Institucional y Despliegue en Producción (COMPLETADA)
- [x] Configuración de Progressive Web App (PWA) instalable de nivel de producción (`manifest.json`, `index.html` meta tags, modo standalone).
- [x] Identidad de marca oficial **"Telecom CDI"**:
  - Nombre oficial en manifest web, barra de navegación, títulos móviles y `capacitor.config.json`.
  - Íconos institucionales personalizados en alta resolución (192x192 y 512x512).
  - Generación y distribución de recursos gráficos nativos Android (`mipmap-mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) e iOS (`AppIcon.appiconset`).
- [x] Solución de cuotas de almacenamiento de Google Drive vía puente Google Apps Script Web App (`google_apps_script_bridge.js`):
  - Subida directa con token o reenvío transparente para cuentas personales/institucionales sin límite por Service Account.
  - Conexión preconfigurada de respaldo en `googleConfig.ts`.
- [x] Despliegue en producción con CI/CD automatizado:
  - Repositorio oficial en GitHub: `https://github.com/Israel8002/telecomseptiembre`.
  - Despliegue en vivo en Netlify: `https://cditelecom.netlify.app`.
  - Configuración declarativa `netlify.toml` con cabeceras de seguridad y variables de entorno.
  - Supresión total del banner/botón flotante publicitario "Powered by Netlify" mediante configuración de compilación, inyección de estilos y `MutationObserver` defensivo.
- [x] Empaquetado de producción validado con `npm run build` y sincronizado en plataformas nativas con `npx cap copy`.

