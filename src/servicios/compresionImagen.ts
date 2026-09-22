/**
 * Servicio de Compresión y Redimensionamiento de Imágenes en Cliente
 * Optimiza las fotografías antes de guardarlas en IndexedDB para no saturar memoria.
 */

export async function comprimirImagenPerfil(
  archivoODataUrl: File | string,
  maxDimension: number = 800,
  calidad: number = 0.8
): Promise<string> {
  let dataUrlOriginal: string;

  if (typeof archivoODataUrl === 'string') {
    dataUrlOriginal = archivoODataUrl;
  } else {
    dataUrlOriginal = await new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(lector.result as string);
      lector.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
      lector.readAsDataURL(archivoODataUrl);
    });
  }

  return new Promise((resolve, reject) => {
    const imagen = new Image();
    imagen.onload = () => {
      let ancho = imagen.width;
      let alto = imagen.height;

      if (ancho > maxDimension || alto > maxDimension) {
        if (ancho > alto) {
          alto = Math.round((alto * maxDimension) / ancho);
          ancho = maxDimension;
        } else {
          ancho = Math.round((ancho * maxDimension) / alto);
          alto = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = ancho;
      canvas.height = alto;

      const contexto = canvas.getContext('2d');
      if (!contexto) {
        resolve(dataUrlOriginal);
        return;
      }

      contexto.drawImage(imagen, 0, 0, ancho, alto);
      const resultadoComprimido = canvas.toDataURL('image/jpeg', calidad);
      resolve(resultadoComprimido);
    };

    imagen.onerror = () => {
      reject(new Error('Formato de imagen inválido o no compatible.'));
    };

    imagen.src = dataUrlOriginal;
  });
}
