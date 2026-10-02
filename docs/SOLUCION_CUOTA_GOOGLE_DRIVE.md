# Solución al Error 403 de Cuota en Google Drive

## 1. ¿Por qué ocurre este error?

En la consola de sincronización o en la columna `urlDrive` de Google Sheets se muestra:
`SIN_CUOTA_DRIVE_REQUIERE_UNIDAD_COMPARTIDA`

El mensaje devuelto por la API de Google es:
> **Google Drive API Error (403):**  
> *"Service Accounts do not have storage quota. Leverage shared drives or use OAuth delegation instead."*

### Causa Técnica
La aplicación se autentica mediante una **Cuenta de Servicio de Google Cloud** (`sincronizador-telecom@...`). Google aplica una política estricta:
1. Las Cuentas de Servicio tienen **0 MB** de cuota de almacenamiento personal propia.
2. Si la carpeta configurada (`1Xn86EbqcekpFbwYFp6qqcWBF7YAetmLy`) reside en una cuenta personal gratuita `@gmail.com` (como `iaantigravity5@gmail.com`), Google asigna la propiedad de los archivos creados a la Cuenta de Servicio, y al tener 0 MB de cuota, **Google rechaza inmediatamente la subida de fotografías y PDFs**.
3. Las hojas de cálculo de **Google Sheets no tienen esta restricción**, por lo que todos los registros textuales y calificaciones sí se guardan perfectamente.

---

## 2. Opciones de Solución

Existen **dos soluciones definitivas**, dependiendo del tipo de cuenta de Google que poseas:

---

### Opción A (Para cuentas personales @gmail.com) — Puente Google Apps Script (2 Minutos)

Permite que las fotos y reportes PDF se suban utilizando los **15 GB gratuitos** de tu cuenta personal de Google sin pagar nada y sin cuentas empresariales.

#### Pasos:
1. Abre tu hoja de Google Sheets en el navegador:  
   👉 [Abrir Hoja de Cálculo IMSS Telecom](https://docs.google.com/spreadsheets/d/1IhqNzrvt69biXpSdmmCsRv9wwya14c6vX_YoE3psk_0)
2. En la barra superior, ve a: **Extensiones** ➔ **Apps Script**.
3. Borra el código por defecto (`myFunction`) y copia y pega el código del archivo [`google_apps_script_bridge.js`](file:///c:/Users/israel.diaz/Desktop/MOBILE%20APP%20IMSS/PROYECTO%20TELECOM%20SEPTIEMBRE/google_apps_script_bridge.js).
4. Arriba a la derecha, haz clic en el botón azul **Implementar** (Deploy) ➔ **Nueva implementación** (New deployment).
5. En el engranaje ⚙️ de la izquierda, selecciona **Aplicación web** (Web app).
6. Configura los siguientes campos:
   - **Descripción:** `Puente Subida Drive IMSS Telecom`
   - **Ejecutar como:** `Yo (tu correo de Gmail)` *(Muy importante: esto hace que use tus 15 GB)*
   - **Quién tiene acceso:** `Cualquier usuario` (Anyone)
7. Haz clic en **Implementar**. Google te pedirá autorizar los permisos (haz clic en *Avanzado* ➔ *Ir a proyecto (no seguro)* ➔ *Permitir*).
8. Copia la **URL de la aplicación web** generada (termina en `/exec`).
9. Abre el archivo [`.env.local`](file:///c:/Users/israel.diaz/Desktop/MOBILE%20APP%20IMSS/PROYECTO%20TELECOM%20SEPTIEMBRE/.env.local) y agrega o modifica la línea:
   ```env
   VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/TU_CODIGO_AQUI/exec
   ```
10. ¡Listo! La app subirá automáticamente todas las fotografías y reportes a Google Drive a través de este puente sin ningún error de cuota.

---

### Opción B (Para cuentas corporativas Google Workspace / IMSS) — Unidad Compartida (Shared Drive)

Si el IMSS o tu organización cuenta con Google Workspace, las **Unidades Compartidas** no tienen cuotas individuales por usuario.

#### Pasos:
1. Abre Google Drive con la cuenta de Workspace.
2. En el panel izquierdo, haz clic en **Unidades compartidas** (Shared drives) ➔ **Nueva**.
3. Nómbrala: `IMSS_SUPERVISION_TELECOM`.
4. Entra a la unidad, haz clic en **Administrar miembros** y añade el correo de la cuenta de servicio:
   ```
   sincronizador-telecom@imss-supervision-telecom.iam.gserviceaccount.com
   ```
   Con rol de **Administrador de contenido** o **Administrador**.
5. Copia el ID de esa Unidad Compartida desde la barra de direcciones del navegador:
   `https://drive.google.com/drive/u/0/folders/ESTE_ES_EL_ID`
6. En [`.env.local`](file:///c:/Users/israel.diaz/Desktop/MOBILE%20APP%20IMSS/PROYECTO%20TELECOM%20SEPTIEMBRE/.env.local) actualiza:
   ```env
   VITE_GOOGLE_DRIVE_FOLDER_ID=ESTE_ES_EL_ID
   ```
7. ¡Listo! La aplicación ya tiene integrados los parámetros `supportsAllDrives=true` e `includeItemsFromAllDrives=true`, por lo que las subidas directas funcionarán al instante.
