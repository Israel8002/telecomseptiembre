/**
 * PUENTE GOOGLE APPS SCRIPT PARA SUBIDA DE FOTOS Y REPORTES A GOOGLE DRIVE
 * 
 * Permite subir fotografías y reportes PDF directamente a Google Drive utilizando
 * el almacenamiento de una cuenta personal de Gmail (15 GB gratuitos),
 * evitando el error 403 "Service Accounts do not have storage quota".
 * 
 * INSTRUCCIONES DE INSTALACIÓN (2 MINUTOS):
 * 1. Abra su hoja de Google Sheets en el navegador.
 * 2. En el menú superior haga clic en: Extensiones -> Apps Script.
 * 3. Borre el contenido que aparezca y pegue este código.
 * 4. Haga clic en el botón azul superior "Implementar" (Deploy) -> "Nueva implementación" (New deployment).
 * 5. En el engranaje tipo seleccione "Aplicación web" (Web app).
 * 6. Configuración obligatoria:
 *    - Ejecutar como: "Yo" (su cuenta de Google)
 *    - Quién tiene acceso: "Cualquier usuario" (Anyone)
 * 7. Haga clic en "Implementar" y autorice los permisos de Google Drive.
 * 8. Copie la "URL de la aplicación web" (termina en /exec) y péguela en su archivo .env.local:
 *    VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var folderId = data.idCarpetaPadre || '1Xn86EbqcekpFbwYFp6qqcWBF7YAetmLy';
    var folder;
    
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (fErr) {
      folder = DriveApp.getRootFolder();
    }
    
    var decoded = Utilities.base64Decode(data.contenidoBase64);
    var blob = Utilities.newBlob(decoded, data.tipoMime, data.nombreArchivo);
    var file = folder.createFile(blob);
    
    if (data.descripcion) {
      file.setDescription(data.descripcion);
    }
    
    // Habilitar acceso de lectura con enlace
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      id: file.getId(),
      urlDrive: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    estado: 'ACTIVO',
    servicio: 'Puente Google Drive IMSS Telecom',
    fecha: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
