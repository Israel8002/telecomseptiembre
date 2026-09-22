# Integración con Google Sheets y Google Drive (Especificación Técnica)

## 1. Rol de Google Workspace en el Sistema
En las siguientes etapas, el sistema integrará:
- **Google Sheets:** Como base de datos central remota y almacén de auditoría.
- **Google Drive:** Como repositorio jerárquico de archivos binarios (fotografías, reportes PDF generados y respaldos ZIP).

## 2. Configuración Requerida en Google Cloud Platform (GCP)
Para habilitar la conectividad en las etapas correspondientes, se debe configurar:
1. **Creación del Proyecto GCP:**
   - Nombre: `IMSS-Supervision-Telecom`.
2. **Habilitación de APIs:**
   - Google Sheets API (v4).
   - Google Drive API (v3).
3. **Credenciales de Acceso:**
   - Para sincronización automatizada desde backend o servicios de fondo: **Cuenta de Servicio** (Service Account) con descarga de clave en formato JSON.
   - Para acceso interactivo de usuario: **ID de Cliente OAuth 2.0** configurado para aplicaciones Web y móviles.

## 3. Jerarquía y Nomenclatura en Google Drive
Los archivos se organizarán de forma automatizada por unidad médica/administrativa:

```text
Google Drive/
└── [Unidad u OOAD]/
    └── [Tipo de Cuarto o Servicio]/
        ├── Fotografías: [tipo_cuarto]_[fotoNumero]_[ddmmaaaa].jpg
        │   Ejemplos:
        │   - OOADBC/MDF/mdf_foto001_11092026.jpg
        │   - OOADBC/IDF Informatica/idf_informatica_foto0001_11092026.jpg
        │   - Subdelegación MXL/MDF/mdf_foto001_11092026.jpg
        ├── Reportes: [tipo_cuarto]_reporte[numero]_[ddmmaaaa].pdf
        │   Ejemplos:
        │   - OOADBC/MDF/mdf_reporte001_11092026.pdf
        │   - Subdelegación MXL/MDF/mdf_reporte001_11092026.pdf
        └── Respaldos: [unidad]_respaldo_[ddmmaaaa].zip
```

## 4. Estructura de la Hoja de Cálculo (Google Sheets)
La hoja contendrá las siguientes pestañas:
1. `Usuarios`: Matrícula, Nombre, Correo, WhatsApp, Rol, FechaRegistro. (La contraseña nunca se sube a Sheets).
2. `Evaluaciones`: IDEVALUACION, MatrículaEvaluador, Unidad, TipoCuarto, FechaHora, Estado, Puntuación, URL_Reporte_Drive.
3. `Fotografias_Metadatos`: IDFoto, IDEVALUACION, CriterioEvaluado, URL_Drive, FechaToma.
4. `Log_Sincronizacion`: IDTransaccion, Timestamp, TipoOperacion, Resultado.
