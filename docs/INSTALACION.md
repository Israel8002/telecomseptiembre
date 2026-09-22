# Guía de Instalación y Requisitos del Entorno

## 1. Requisitos Previos
Para compilar y ejecutar el proyecto se requiere:
- **Node.js**: Versión 18.0.0 o superior (recomendado LTS v20+).
- **npm**: Versión 9.0.0 o superior.
- **Git**: Para control de versiones.
- **Navegador Moderno**: Google Chrome, Mozilla Firefox, Microsoft Edge o Safari (con soporte para IndexedDB y Web Crypto API).
- Para empaquetado nativo (Etapas posteriores):
  - **Android Studio** (con SDK de Android 13+) para generar APKs de Android.
  - **Xcode** (en macOS) para compilar la aplicación para iOS.

## 2. Instalación Paso a Paso

### 2.1 Clonar o Acceder al Repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd "PROYECTO TELECOM SEPTIEMBRE"
```

### 2.2 Instalación de Dependencias
Ejecute el comando para instalar todas las dependencias del proyecto:
```bash
npm install
```

### 2.3 Ejecución en Modo Desarrollo
Para iniciar el servidor de desarrollo local con recarga rápida (HMR):
```bash
npm run dev
```
La aplicación estará disponible típicamente en `http://localhost:5173`.

### 2.4 Verificación de la Suite de Pruebas
Para ejecutar las pruebas automatizadas (TDD):
```bash
npm run test
```

### 2.5 Compilación para Producción (Web / PWA / Capacitor)
Para generar el paquete estático optimizado en la carpeta `/dist`:
```bash
npm run build
```
Para previsualizar la compilación de producción localmente:
```bash
npm run preview
```
