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

## Etapa 2: Motor de Evaluaciones y Formularios de Supervisión (Futura)
- [ ] Generador de `IDEVALUACION` único y reserva inmediata asociada al usuario evaluador.
- [ ] Formularios de supervisión estructurados por secciones de cuarto de comunicaciones (energía, cableado estructurado, racks, climatización, seguridad física, etiquetado).
- [ ] Autoguardado continuo en base local ante cada respuesta (resistencia a navegación, botón back, cierre accidental o pérdida de energía).
- [ ] Flujo de "Continuar evaluación incompleta".

---

## Etapa 3: Módulo Fotográfico de Supervisión y Evidencias (Futura)
- [ ] Captura de fotografías asociadas a puntos específicos de evaluación.
- [ ] Redimensionamiento y compresión en cliente antes de persistencia local.
- [ ] Almacenamiento local estructurado por unidad y cuarto de comunicaciones.
- [ ] Cola de carga asíncrona hacia Google Drive.

---

## Etapa 4: Generación de Reportes PDF y Exportación a Excel (Futura)
- [ ] Motor de generación de reportes ejecutivos en PDF en el dispositivo con diseño sobrio y firmas.
- [ ] Exportación de datos de evaluación a hojas de cálculo Excel (`.xlsx`).
- [ ] Generación de respaldos en archivos `.zip` comprimidos.

---

## Etapa 5: Sincronización Completa con Google Sheets y Google Drive (Futura)
- [ ] Conector con Google Sheets API (v4) y Google Drive API (v3).
- [ ] Procesador automático en segundo plano para vaciar la `colaSincronizacion` al detectar conexión a Internet.
- [ ] Creación automática de carpetas jerárquicas en Drive por OOAD/Unidad.
- [ ] Reintentos inteligentes con retroceso exponencial.

---

## Etapa 6: Módulo de Administración y Auditoría Multi-Unidad (Futura)
- [ ] Vista del Administrador para consultar evaluaciones de todos los usuarios.
- [ ] Filtrado por unidad, tipo de cuarto, fecha y evaluador.
- [ ] Auditoría de sincronización y estado de respaldos.
