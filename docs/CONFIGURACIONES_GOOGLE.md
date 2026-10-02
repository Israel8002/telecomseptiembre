# Guía Oficial de Configuración en Google Cloud, Sheets y Drive (Etapa 5)

Este documento detalla **paso a paso, con ligas directas y especificaciones exactas**, todo lo que debes tener configurado en tu cuenta de Google para poner en marcha la **Etapa 5: Sincronización Completa con Google Sheets y Google Drive** del sistema de Supervisión de Cuartos de Telecomunicaciones del IMSS.

---

## Índice de Contenidos
1. [Requisitos Previos](#1-requisitos-previos)
2. [Paso 1: Crear el Proyecto en Google Cloud Platform](#paso-1-crear-el-proyecto-en-google-cloud-platform)
3. [Paso 2: Habilitar las APIs de Google Requeridas](#paso-2-habilitar-las-apis-de-google-requeridas)
4. [Paso 3: Configurar la Pantalla de Consentimiento OAuth](#paso-3-configurar-la-pantalla-de-consentimiento-oauth)
5. [Paso 4: Crear las Credenciales de Acceso](#paso-4-crear-las-credenciales-de-acceso)
   - [Opción A (Recomendada): Cuenta de Servicio (Service Account)](#opción-a-recomendada-cuenta-de-servicio-service-account)
   - [Opción B: ID de Cliente OAuth 2.0 (Aplicación Web / Móvil)](#opción-b-id-de-cliente-oauth-20-aplicación-web--móvil)
6. [Paso 5: Crear y Estructurar la Hoja de Cálculo Central (Google Sheets)](#paso-5-crear-y-estructurar-la-hoja-de-cálculo-central-google-sheets)
7. [Paso 6: Crear y Estructurar la Carpeta Raíz en Google Drive](#paso-6-crear-y-estructurar-la-carpeta-raíz-en-google-drive)
8. [Paso 7: Compartir la Hoja y Carpeta con la Cuenta de Servicio](#paso-7-compartir-la-hoja-y-carpeta-con-la-cuenta-de-servicio)
9. [Resumen: Lista de Datos que Deberás Guardar para el Código](#resumen-lista-de-datos-que-deberás-guardar-para-el-código)

---

## 1. Requisitos Previos

1. **Una cuenta de Google** (cuenta de Gmail personal o cuenta institucional Google Workspace).
2. Navegador web moderno (Chrome, Edge o Firefox).
3. No se requiere tarjeta de crédito ni facturación de pago: tanto Google Sheets API como Google Drive API cuentan con una capa gratuita mensual (*Free Tier*) de millones de solicitudes, más que suficiente para la operación de supervisión.

---

## 2. Paso 1: Crear el Proyecto en Google Cloud Platform

Para gestionar los permisos y accesos de las APIs, Google agrupa todo en "Proyectos".

1. Entra a la consola de creación de proyectos de Google Cloud:  
   👉 [https://console.cloud.google.com/projectcreate](https://console.cloud.google.com/projectcreate)
2. Si te pide aceptar los términos y condiciones de Google Cloud, acéptalos.
3. En el campo **Nombre del proyecto**, escribe:  
   `IMSS-Supervision-Telecom`
4. En **Organización** / **Ubicación**: deja seleccionado "Sin organización" (o selecciona tu dominio si usas Google Workspace institucional).
5. Haz clic en el botón azul **Crear**.
6. Espera unos 10 a 15 segundos mientras se aprovisiona el proyecto.
7. En la barra superior de la consola, asegúrate de que el proyecto activo seleccionado sea `IMSS-Supervision-Telecom`.  
   Liga directa al panel de tu proyecto: 👉 [https://console.cloud.google.com/home/dashboard](https://console.cloud.google.com/home/dashboard)

---

## 3. Paso 2: Habilitar las APIs de Google Requeridas

El proyecto necesita dos APIs activadas: **Google Sheets API v4** y **Google Drive API v3**.

### 2.1 Habilitar Google Sheets API
1. Entra directamente a la ficha de la API de Google Sheets en la biblioteca de Google Cloud:  
   👉 [https://console.cloud.google.com/apis/library/sheets.googleapis.com](https://console.cloud.google.com/apis/library/sheets.googleapis.com)
2. Verifica que arriba esté seleccionado tu proyecto `IMSS-Supervision-Telecom`.
3. Haz clic en el botón azul **Habilitar** (*Enable*).

### 2.2 Habilitar Google Drive API
1. Entra directamente a la ficha de la API de Google Drive en la biblioteca:  
   👉 [https://console.cloud.google.com/apis/library/drive.googleapis.com](https://console.cloud.google.com/apis/library/drive.googleapis.com)
2. Haz clic en el botón azul **Habilitar** (*Enable*).

---

## 4. Paso 3: Configurar la Pantalla de Consentimiento OAuth

Google exige configurar la pantalla de consentimiento antes de generar credenciales OAuth o Cuentas de Servicio.

1. Entra a la pantalla de consentimiento:  
   👉 [https://console.cloud.google.com/apis/credentials/consent](https://console.cloud.google.com/apis/credentials/consent)
2. En **Tipo de usuario (User Type)**:
   - Si tu cuenta es de Google Workspace institucional: selecciona **Interno** (*Internal*).
   - Si tu cuenta es `@gmail.com`: selecciona **Externo** (*External*).
3. Haz clic en **Crear**.
4. Llena los datos básicos solicitados:
   - **Nombre de la aplicación**: `Supervisión Telecom IMSS`
   - **Correo de asistencia del usuario**: selecciona tu correo.
   - **Logotipo de la aplicación**: opcional (se puede dejar vacío).
   - **Datos de contacto del desarrollador**: ingresa tu correo electrónico.
5. Haz clic en **Guardar y continuar**.
6. En la pestaña **Permisos (Scopes)**:
   - Haz clic en **Agregar o quitar permisos** (*Add or Remove Scopes*).
   - En el buscador de permisos o filtros busca:
     - `.../auth/spreadsheets` (Ver, editar, crear y borrar hojas de cálculo de Google).
     - `.../auth/drive.file` (Ver y administrar los archivos de Google Drive creados o abiertos por esta app).
   - Marca ambas casillas y haz clic en **Actualizar**.
   - Haz clic en **Guardar y continuar**.
7. En la pestaña **Usuarios de prueba (Test users)** (si elegiste modo Externo):
   - Haz clic en **+ Add Users**.
   - Agrega tu correo electrónico y los correos de los evaluadores que probarán el aplicativo.
   - Haz clic en **Guardar y continuar**.
8. Revisa el resumen y haz clic en **Volver al panel**.

---

## 5. Paso 4: Crear las Credenciales de Acceso

Para la sincronización en campo existen dos métodos. El método **más eficiente y autónomo para campo** es la **Cuenta de Servicio** (Service Account), porque no requiere que el evaluador inicie sesión interactiva en Google cada vez que sincroniza desde el celular o tablet en un sótano.

### Opción A (Recomendada): Cuenta de Servicio (Service Account)

Una Cuenta de Servicio es una cuenta bot o técnica perteneciente a tu proyecto de Google Cloud que tiene su propia dirección de correo (ej. `sincronizador-imss@imss-supervision-telecom.iam.gserviceaccount.com`).

1. Entra a la sección de Cuentas de Servicio:  
   👉 [https://console.cloud.google.com/iam-admin/serviceaccounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Haz clic en **+ Crear cuenta de servicio** (*Create Service Account*) en la barra superior:  
   👉 [https://console.cloud.google.com/iam-admin/serviceaccounts/create](https://console.cloud.google.com/iam-admin/serviceaccounts/create)
3. Llena los datos:
   - **Nombre de la cuenta de servicio**: `sincronizador-telecom`
   - **ID de la cuenta de servicio**: se autocompletará como `sincronizador-telecom`.
   - **Descripción**: `Servicio de sincronización automática offline para cuartos telecom IMSS`.
4. Haz clic en **Crear y continuar**.
5. En el rol (opcional): puedes seleccionar `Editor` o dejarlo sin rol del proyecto, ya que le daremos permisos directos a la Hoja y a la Carpeta de Drive en el Paso 7.
6. Haz clic en **Continuar** y luego en **Listo**.
7. Ahora verás la cuenta de servicio en la lista. **Copia y anota la dirección de correo generada**, se verá parecida a:  
   `sincronizador-telecom@imss-supervision-telecom.iam.gserviceaccount.com`
8. Haz clic sobre el correo de la cuenta de servicio para entrar a su detalle.
9. Ve a la pestaña **Claves** (*Keys*):
   - Haz clic en **Agregar clave** (*Add key*) ➜ **Crear clave nueva** (*Create new key*).
   - Tipo de clave: Selecciona **JSON**.
   - Haz clic en **Crear**.
   - Se descargará automáticamente a tu computadora un archivo `.json` (ejemplo: `imss-supervision-telecom-xxxx.json`).
   - ⚠️ **IMPORTANTE:** Guarda este archivo en un lugar seguro. Contiene la llave privada (`private_key`) que se usará para firmar las peticiones a Sheets y Drive.

---

### Opción B: ID de Cliente OAuth 2.0 (Para Flujo Interactivo con Login Google)

Si además deseas permitir que el usuario inicie sesión con el botón "Iniciar con Google":

1. Entra a la sección de Credenciales:  
   👉 [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. Haz clic en **+ Crear credenciales** (*Create Credentials*) ➜ **ID de cliente de OAuth** (*OAuth client ID*):  
   👉 [https://console.cloud.google.com/apis/credentials/oauthclient](https://console.cloud.google.com/apis/credentials/oauthclient)
3. En **Tipo de aplicación**: Selecciona **Aplicación web** (*Web application*).
4. Nombre: `Cliente Web y Móvil Telecom`.
5. En **Orígenes de JavaScript autorizados** (*Authorized JavaScript origins*), agrega:
   - `http://localhost:5173`
   - `http://localhost:4173`
   - Si tienes un dominio de hosting o Firebase Hosting, agrégalo aquí (ej. `https://tu-app.web.app`).
6. En **URIs de redireccionamiento autorizados**:
   - `http://localhost:5173`
   - `http://localhost:5173/oauth2callback`
7. Haz clic en **Crear**.
8. Aparecerá una ventana con tu **ID de cliente** (ejemplo: `123456789-abcdef.apps.googleusercontent.com`) y tu **Secreto de cliente**. Copia el **ID de cliente**.

---

## 6. Paso 5: Crear y Estructurar la Hoja de Cálculo Central (Google Sheets)

La hoja de cálculo actuará como base de datos relacional y de auditoría remota.

1. Abre Google Sheets creando una nueva hoja en blanco:  
   👉 [https://sheets.new](https://sheets.new)
2. Asigna como título de la hoja (en la esquina superior izquierda):  
   `BD_SUPERVISION_CUARTOS_TELECOM_IMSS`
3. Observa la URL en tu navegador:
   ```text
   https://docs.google.com/spreadsheets/d/1a2B3c4D5e6F7g8H9i0J_kLmNoPqRsTuVwXyZ/edit
   ```
   El fragmento entre `/d/` y `/edit` es el **SPREADSHEET_ID**.  
   👉 **Copia y anota tu SPREADSHEET_ID**.

4. Ahora, renombra la pestaña predeterminada `Hoja 1` y crea las **4 pestañas oficiales** con las columnas exactas que se detallan a continuación:

---

### Pestaña 1: `Usuarios`
*Renombra la pestaña a:* `Usuarios`  
En la fila 1 (encabezados de columnas A a G):

| Columna | Nombre de Columna | Descripción |
| :--- | :--- | :--- |
| **A** | `id` | UUID único del usuario |
| **B** | `matricula` | Matrícula IMSS (8-10 dígitos) |
| **C** | `nombreCompleto` | Nombre completo del técnico |
| **D** | `correoElectronico` | Correo institucional |
| **E** | `telefonoWhatsApp` | Número telefónico de contacto |
| **F** | `rol` | ADMINISTRADOR o EVALUADOR |
| **G** | `fechaRegistro` | Fecha ISO de creación |

> 🔒 **Seguridad estricta:** La contraseña ni el hash criptográfico se suben a Google Sheets.

---

### Pestaña 2: `Evaluaciones`
*Crea una nueva pestaña con el botón `+` abajo a la izquierda y nómbrala:* `Evaluaciones`  
En la fila 1 (encabezados de columnas A a P):

| Columna | Nombre de Columna | Descripción |
| :--- | :--- | :--- |
| **A** | `id` | IDEVALUACION (ej. `EVAL-20261001-120000-99012345-ABCD`) |
| **B** | `matriculaEvaluador` | Matrícula del técnico |
| **C** | `nombreEvaluador` | Nombre del técnico |
| **D** | `ooad` | Órgano Desconcentrado (ej. OOAD Baja California) |
| **E** | `unidad` | Inmueble / Unidad médica (ej. HGZ-MF 8 ENS) |
| **F** | `tipoCuarto` | Tipo de cuarto (MDF, IDF, RACK, GABINETE, etc.) |
| **G** | `ubicacionDetallada` | Ubicación física en el inmueble |
| **H** | `estado` | EN_PROCESO o COMPLETADA |
| **I** | `calificacionCumplimiento` | Puntuación porcentual (0 a 100) |
| **J** | `totalCriterios` | Total de criterios aplicables (42) |
| **K** | `totalRespondidos` | Reactivos respondidos |
| **L** | `totalCumple` | Reactivos conformes |
| **M** | `totalNoCumple` | Reactivos no conformes |
| **N** | `fechaCreacion` | Fecha ISO de inicio |
| **O** | `fechaCierre` | Fecha ISO de finalización |
| **P** | `urlReporteDrive` | Enlace directo al archivo PDF subido a Drive |

---

### Pestaña 3: `Fotografias_Metadatos`
*Crea una nueva pestaña con el botón `+` y nómbrala:* `Fotografias_Metadatos`  
En la fila 1 (encabezados de columnas A a I):

| Columna | Nombre de Columna | Descripción |
| :--- | :--- | :--- |
| **A** | `id` | ID único de la fotografía (ej. `FOTO-20261001-100500-11AA`) |
| **B** | `idEvaluacion` | IDEVALUACION vinculada |
| **C** | `idCriterio` | Reactivo evaluado (ej. `Q008`, `Q013`, o `General`) |
| **D** | `seccion` | Sección técnica (ej. `fisica`, `seguridad`, etc.) |
| **E** | `unidad` | Inmueble / Unidad |
| **F** | `tipoCuarto` | Tipo de cuarto |
| **G** | `descripcion` | Observaciones técnicas / pie de foto |
| **H** | `fechaCaptura` | Fecha y hora ISO |
| **I** | `urlDrive` | Enlace permanente al archivo JPG alojado en Google Drive |

---

### Pestaña 4: `Log_Sincronizacion`
*Crea una nueva pestaña con el botón `+` y nómbrala:* `Log_Sincronizacion`  
En la fila 1 (encabezados de columnas A a F):

| Columna | Nombre de Columna | Descripción |
| :--- | :--- | :--- |
| **A** | `idOperacion` | UUID de la transacción en `colaSincronizacion` |
| **B** | `timestamp` | Marca de tiempo ISO del intento de sincronización |
| **C** | `tipoEntidad` | USUARIO, EVALUACION o EVIDENCIA_FOTOGRAFICA |
| **D** | `accion` | CREAR o ACTUALIZAR |
| **E** | `matriculaUsuario` | Matrícula del dispositivo que sincronizó |
| **F** | `resultado` | EXITOSO o ERROR (con detalle de error si falló) |

---

## 7. Paso 6: Crear y Estructurar la Carpeta Raíz en Google Drive

Las fotografías de evidencias, los reportes en PDF y los respaldos en ZIP se alojarán de manera jerárquica en Google Drive.

1. Abre Google Drive:  
   👉 [https://drive.google.com/drive/my-drive](https://drive.google.com/drive/my-drive)
2. Haz clic en **+ Nuevo** ➜ **Nueva carpeta**.
3. Nombra la carpeta:  
   `IMSS_SUPERVISION_TELECOM_DRIVE`
4. Haz doble clic para entrar en la carpeta creada.
5. Observa la URL en la barra de tu navegador:
   ```text
   https://drive.google.com/drive/folders/1XyZ987654321_AbCdEfGhIjKlMnOpQrS
   ```
   El código alfanumérico que aparece después de `/folders/` es el **DRIVE_ROOT_FOLDER_ID**.  
   👉 **Copia y anota tu DRIVE_ROOT_FOLDER_ID**.

---

## 8. Paso 7: Compartir la Hoja y Carpeta con la Cuenta de Servicio

Para que la cuenta de servicio creada en el **Paso 4 (Opción A)** pueda escribir filas en Google Sheets y subir archivos a Google Drive, debes darle permiso de **Editor**.

### 7.1 Compartir la Hoja de Cálculo
1. Abre tu hoja de cálculo `BD_SUPERVISION_CUARTOS_TELECOM_IMSS`.
2. Haz clic en el botón verde **Compartir** (*Share*) en la esquina superior derecha.
3. En el campo "Agregar personas y grupos", pega la dirección de correo de tu Cuenta de Servicio:  
   `sincronizador-telecom@imss-supervision-telecom.iam.gserviceaccount.com`
4. Asegúrate de que el rol seleccionado sea **Editor**.
5. Desmarca la casilla "Notificar a los usuarios" (las cuentas de servicio no tienen buzón de correo).
6. Haz clic en **Compartir**.

### 7.2 Compartir la Carpeta Raíz de Drive
1. En Google Drive, haz clic secundario (clic derecho) sobre la carpeta `IMSS_SUPERVISION_TELECOM_DRIVE`.
2. Selecciona **Compartir** ➜ **Compartir**.
3. Pega nuevamente el correo de la Cuenta de Servicio:  
   `sincronizador-telecom@imss-supervision-telecom.iam.gserviceaccount.com`
4. Asegúrate de que el rol sea **Editor**.
5. Haz clic en **Compartir**.

---

## 8. Solución al Error 403: "Service Accounts do not have storage quota"

Si al sincronizar evidencias fotográficas o reportes PDF en Google Drive recibes el error:
> `Google Drive API Error (403): Service Accounts do not have storage quota. Leverage shared drives, or use OAuth delegation instead.`

### ¿Por qué ocurre?
A partir de las políticas recientes de Google, **las Cuentas de Servicio (Service Accounts) tienen 0 MB de almacenamiento personal**. Cuando una Cuenta de Servicio sube un archivo nuevo dentro de una carpeta ubicada en "Mi Unidad" (*My Drive*) tradicional, Google asigna la propiedad del archivo a la Cuenta de Servicio, y al no tener cuota propia, Google rechaza la subida con error 403.

### ¿Cómo solucionarlo?
Tienes dos alternativas oficiales:

#### Opción 1 (Recomendada para Google Workspace / Institucional): Usar una Unidad Compartida (*Shared Drive*)
1. En Google Drive, en el menú lateral izquierdo ve a **Unidades compartidas** (*Shared Drives*):  
   👉 [https://drive.google.com/drive/shared-drives](https://drive.google.com/drive/shared-drives)
2. Haz clic en **+ Nueva unidad compartida** y nómbrala `IMSS_TELECOM_COMPARTIDA`.
3. Haz clic en **Administrar miembros** y añade el correo de tu Cuenta de Servicio:  
   `sincronizador-telecom@imss-supervision-telecom.iam.gserviceaccount.com`
4. Asígnale el rol de **Administrador de contenido** (*Content Manager*) o **Administrador** (*Manager*).
5. Crea dentro tu carpeta `IMSS_SUPERVISION_TELECOM_DRIVE` y copia su ID en `VITE_GOOGLE_DRIVE_FOLDER_ID`.
6. En las Unidades Compartidas, los archivos pertenecen al almacenamiento de la organización, no a la cuenta de servicio, por lo que la subida de fotografías y PDFs funciona inmediatamente al 100%.

#### Opción 2 (Cuentas Personales @gmail.com): Tolerancia Automática y Registro en Sheets
* Si utilizas una cuenta gratuita `@gmail.com` (que no dispone de Unidades Compartidas), **el aplicativo ya cuenta con tolerancia inteligente de cuota**:
  - Al detectar el límite de cuota de Drive, el aplicativo **continúa la sincronización** registrando todos los datos, respuestas y metadatos de las fotografías de forma completa y atómica en **Google Sheets** (`Evaluaciones` y `Fotografias_Metadatos`).
  - La transacción de la cola local se marca como completada y se retira de la cola, evitando que el botón de sincronización se quede bloqueado o con reintentos fallidos infinitos.


---

## 9. Resumen: Lista de Datos que Deberás Guardar para el Código

Una vez completados los pasos anteriores, habrás obtenido los siguientes valores. Guárdalos en un bloc de notas para cuando programemos la **Etapa 5**:

| Parámetro | Ejemplo de Valor | Dónde se obtuvo |
| :--- | :--- | :--- |
| **`GOOGLE_PROJECT_ID`** | `imss-supervision-telecom` | Paso 1 (Google Cloud Console) |
| **`GOOGLE_SPREADSHEET_ID`** | `1a2B3c4D5e6F7g8H9i0J_kLmNo...` | Paso 5 (URL de la hoja de Sheets) |
| **`GOOGLE_DRIVE_FOLDER_ID`**| `1XyZ987654321_AbCdEfGhIjKl...` | Paso 6 (URL de la carpeta de Drive) |
| **`SERVICE_ACCOUNT_EMAIL`** | `sincronizador-telecom@...` | Paso 4 (IAM / Cuentas de servicio) |
| **`SERVICE_ACCOUNT_KEY_JSON`** | Archivo `.json` descargado | Paso 4 (Claves de la cuenta de servicio) |
| **`OAUTH_CLIENT_ID`** (Opcional) | `123456789-abc.apps.google...` | Paso 4 - Opción B (Credenciales OAuth) |

---

## 10. ¿Cómo funcionará la sincronización en la Etapa 5?

Con esta configuración lista, el motor de la Etapa 5 realizará lo siguiente:
1. Al detectar conexión a Internet (`detectorRed.ts`), se disparará en segundo plano el procesador de `colaSincronizacion`.
2. Para cada registro pendiente en IndexedDB:
   - Si es un **Usuario**: Se insertará o actualizará en la pestaña `Usuarios`.
   - Si es una **Evaluación**: Se agregará a la pestaña `Evaluaciones`.
   - Si es una **Evidencia Fotográfica**: Subirá la imagen optimizada a Google Drive dentro de la estructura `[Unidad]/[TipoCuarto]/`, obtendrá la URL de Drive y registrará la fila en la pestaña `Fotografias_Metadatos`.
   - Si incluye el **Reporte PDF**: Subirá el archivo `.pdf` y registrará el enlace en la columna `urlReporteDrive`.
3. Cada transacción completada actualizará la pestaña `Log_Sincronizacion` y marcará el registro como `sincronizado: true` en la base de datos local Dexie/IndexedDB.
