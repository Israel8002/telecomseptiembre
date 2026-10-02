# Guía Completa de Instalación y Despliegue en Dispositivos

Este documento describe **paso a paso** los métodos oficiales para instalar y desplegar el aplicativo de **Supervisión de Cuartos de Telecomunicaciones del IMSS** en:
1. [Dispositivos Android (APK Nativo)](#1-instalación-en-dispositivos-android-apk-nativo)
2. [Dispositivos iOS (iPhone y iPad con Xcode)](#2-instalación-en-dispositivos-ios-iphone--ipad)
3. [Instalación Rápida como PWA (Progressive Web App)](#3-instalación-rápida-como-pwa-progressive-web-app)
4. [Despliegue en la Nube con Netlify](#4-despliegue-en-la-nube-con-netlify)

---

## 1. Instalación en Dispositivos Android (APK Nativo)

El proyecto cuenta con el entorno nativo de Android configurado en la carpeta `android/` mediante **Capacitor 6**.

### 1.1 Requisitos Previos
- **Java Development Kit (JDK 17 o 21)** instalado en la computadora.
- **Android Studio** (opcional pero recomendado si deseas firmar con llave propia o usar emulador):  
  👉 [https://developer.android.com/studio](https://developer.android.com/studio)
- O simplemente la terminal si tienes la variable de entorno `ANDROID_HOME` o Java configurado.

---

### 1.2 Compilación del APK Directa por Terminal

Si deseas generar el instalable `.apk` rápidamente sin abrir Android Studio:

1. Compila la versión web optimizada y sincroniza los assets con la carpeta nativa:
   ```bash
   npm run build
   npx cap sync android
   ```

2. Entra a la carpeta de Android y ejecuta Gradle:
   - **En Windows (PowerShell / CMD):**
     ```powershell
     cd android
     .\gradlew assembleDebug
     cd ..
     ```
   - **En Mac / Linux:**
     ```bash
     cd android
     ./gradlew assembleDebug
     cd ..
     ```

3. El archivo instalable generado se encontrará listo en:
   ```text
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

4. **Instalación en el Celular o Tablet:**
   - Envía el archivo `app-debug.apk` al dispositivo móvil (por WhatsApp, correo, Google Drive o conectando el cable USB).
   - En el teléfono, toca el archivo descargado.
   - Si Android solicita permiso para *"Instalar aplicaciones desconocidas"*, habilita la casilla para tu explorador o WhatsApp y pulsa **Instalar**.
   - ¡Listo! El icono de la aplicación aparecerá en el menú del teléfono y funcionará con aceleración de hardware nativa.

---

### 1.3 Compilación mediante Android Studio

1. Ejecuta en la raíz del proyecto:
   ```bash
   npm run build
   npx cap open android
   ```
2. Android Studio se abrirá cargando el proyecto `android/`.
3. Espera a que termine la sincronización inicial de Gradle (*Gradle Sync Finished*).
4. Para generar el instalable:
   - Ve al menú superior: **Build** ➜ **Build Bundle(s) / APK(s)** ➜ **Build APK(s)**.
   - O si vas a distribuirlo formalmente: **Build** ➜ **Generate Signed Bundle / APK** (para firmarlo con tu clave Keystore de producción).
5. Para probarlo en un celular conectado:
   - Conecta tu teléfono Android con cable USB y habilita la **Depuración por USB** (*USB Debugging*) en opciones de desarrollador.
   - Selecciona tu dispositivo en la barra superior de Android Studio y presiona el botón verde de **Play (Run 'app')**.

---

## 2. Instalación en Dispositivos iOS (iPhone / iPad)

Debido a las políticas oficiales y estándares de seguridad de Apple, la compilación de aplicaciones nativas para iOS (`.ipa`) requiere una computadora **Mac con macOS y Xcode**.

### 2.1 Requisitos Previos
- Computadora **Mac (macOS)** con procesador Apple Silicon (M1/M2/M3) o Intel.
- **Xcode** instalado desde la Mac App Store:  
  👉 [https://apps.apple.com/app/xcode/id497799835](https://apps.apple.com/app/xcode/id497799835)
- **CocoaPods** instalado en la Mac:
  ```bash
  sudo gem install cocoapods
  ```
- Cuenta de desarrollador de Apple (gratuita para pruebas en tus propios dispositivos, o Apple Developer Program para publicar en App Store / TestFlight).

---

### 2.2 Pasos para Compilar en Xcode

1. En la computadora Mac, clona o copia el proyecto.
2. Compila la aplicación y sincroniza con iOS:
   ```bash
   npm run build
   npx cap sync ios
   ```
3. Abre el proyecto nativo en Xcode:
   ```bash
   npx cap open ios
   ```
   *(Esto abrirá el archivo `ios/App/App.xcworkspace`).*

4. **Configuración de Firma (Signing & Capabilities):**
   - En el panel izquierdo de Xcode, haz clic sobre el proyecto raíz **App**.
   - Ve a la pestaña **Signing & Capabilities**.
   - En **Team**, selecciona tu cuenta de Apple (Apple ID).
   - En **Bundle Identifier**, verifica que tenga: `org.imss.supervisioncuartos`.

5. **Ejecución e Instalación:**
   - **En Simulador:** Selecciona cualquier modelo de iPhone en la barra superior (ej. *iPhone 15 Pro*) y haz clic en **Run (Cmd + R)**.
   - **En tu iPhone / iPad Físico:**
     - Conecta el iPhone con el cable Lightning / USB-C a la Mac.
     - En el iPhone, selecciona "Confiar en esta computadora".
     - Activa el **Modo Desarrollador** en el iPhone (*Ajustes ➜ Privacidad y seguridad ➜ Modo de desarrollador ➜ Activar*).
     - En Xcode, selecciona tu iPhone en la lista de dispositivos y pulsa **Run**.
     - La app se instalará directamente en tu iPhone.

---

## 3. Instalación Rápida como PWA (Progressive Web App)

La aplicación fue desarrollada con enfoque web moderno adaptable, lo que permite que cualquier técnico evaluador pueda instalarla **en segundos, sin cables y sin necesidad de tiendas de aplicaciones**.

### 3.1 Ventajas de la PWA
- Se instala con un toque desde el navegador web.
- Funciona **100% Offline** gracias a la persistencia local en IndexedDB.
- Se ejecuta a pantalla completa, eliminando la barra de navegación del navegador (aspecto de app nativa idéntico al APK).
- Ocupa menos de 3 MB de almacenamiento.

---

### 3.2 Pasos de Instalación en Android (Google Chrome / Edge)
1. Abre Google Chrome en tu celular o tablet Android.
2. Ingresa a la URL donde esté alojada la app (por ejemplo tu enlace de Netlify o servidor local).
3. Aparecerá un aviso en la parte inferior o menú de Chrome:
   - Toca los **tres puntos verticales (⋮)** arriba a la derecha.
   - Selecciona **"Instalar aplicación"** o **"Agregar a la pantalla principal"**.
4. Confirma pulsando **Instalar**.
5. La app se agregará a tu pantalla de inicio con su icono y nombre *"Supervisión Telecom"*.

---

### 3.3 Pasos de Instalación en iOS (Apple Safari en iPhone / iPad)
1. Abre el navegador **Safari** en tu iPhone o iPad.
2. Navega a la URL de la aplicación.
3. En la barra inferior de Safari, toca el botón de **Compartir** (el icono de un cuadro con una flecha hacia arriba `⎋`).
4. Desplázate hacia abajo y selecciona **"Agregar a inicio"** (*Add to Home Screen* ⊞).
5. Confirma el nombre y pulsa **Agregar** en la esquina superior derecha.
6. Se creará el acceso directo en la pantalla de tu iPhone; al tocarlo se abrirá de manera autónoma sin marco de navegador.

---

## 4. Despliegue en la Nube con Netlify

Netlify es una de las plataformas en la nube más rápidas y seguras para desplegar aplicaciones web y PWAs con HTTPS automático gratuito.

### 4.1 Preparación Incluida en el Proyecto
El proyecto ya cuenta con el archivo de redirección SPA listo:
- `public/_redirects`: Contiene `/* /index.html 200` para garantizar que la recarga de página y la navegación interna funcionen sin errores 404.

---

### 4.2 Método 1: Despliegue Manual Rápido (Arrastrar y Soltar)
No requiere cuenta de GitHub ni terminal conectada:

1. Entra a [https://app.netlify.com](https://app.netlify.com) e inicia sesión con tu cuenta de correo o GitHub.
2. En tu computadora, compila la versión de producción:
   ```bash
   npm run build
   ```
   *(Esto generará la carpeta optimizada `dist/`).*
3. En el panel de Netlify, ve a la sección **Sites** y busca el recuadro que dice:
   > *"Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"*.
4. **Arrastra la carpeta `dist`** de tu proyecto y suéltala en el recuadro de Netlify.
5. En menos de 10 segundos tu sitio estará en línea con una URL pública gratuita HTTPS (ejemplo: `https://imss-telecom.netlify.app`).

---

### 4.3 Método 2: Despliegue Continuo con Repositorio Git (Recomendado)
Para que cada cambio en el código se publique automáticamente:

1. Sube tu código a un repositorio en **GitHub**, **GitLab** o **Bitbucket** *(recuerda que `.gitignore` ya protege tus llaves privadas y credenciales)*.
2. En Netlify: Haz clic en **Add new site** ➜ **Import an existing project**.
3. Selecciona tu proveedor (ej. GitHub) y elige el repositorio `PROYECTO TELECOM SEPTIEMBRE`.
4. En la configuración de construcción (*Build settings*), verifica:
   - **Base directory:** (dejar vacío / raíz)
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. **Configuración de Variables de Entorno en Netlify:**
   - Haz clic en **Site configuration** ➜ **Environment variables** ➜ **Add a variable**.
   - Agrega las variables configuradas en tu `.env.local`:
     - `VITE_GOOGLE_PROJECT_ID`: `imss-supervision-telecom`
     - `VITE_GOOGLE_SPREADSHEET_ID`: `1IhqNzrvt69biXpSdmmCsRv9wwya14c6vX_YoE3psk_0`
     - `VITE_GOOGLE_DRIVE_FOLDER_ID`: `1Xn86EbqcekpFbwYFp6qqcWBF7YAetmLy`
     - `VITE_GOOGLE_CLIENT_EMAIL`: `sincronizador-telecom@imss-supervision-telecom.iam.gserviceaccount.com`
     - `VITE_GOOGLE_PRIVATE_KEY`: *(Tu llave privada completa con `-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----`)*.
6. Haz clic en **Deploy Site**.
7. Netlify compilará el código y te proporcionará tu dominio con certificado SSL/HTTPS listo para que todos los evaluadores del IMSS instalen la app en sus teléfonos y tablets.
