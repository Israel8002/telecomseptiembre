/**
 * Servicio de Compresión y Redimensionamiento de Imágenes en Cliente
 * Optimiza las fotografías antes de guardarlas en IndexedDB para no saturar memoria.
 */

export interface ResultadoCompresionEvidencia {
  dataUrl: string;
  ancho: number;
  alto: number;
  tamanoBytes: number;
}

export function generarIdFoto(): string {
  const ahora = new Date();
  const yyyy = ahora.getFullYear();
  const mm = String(ahora.getMonth() + 1).padStart(2, '0');
  const dd = String(ahora.getDate()).padStart(2, '0');
  const hh = String(ahora.getHours()).padStart(2, '0');
  const min = String(ahora.getMinutes()).padStart(2, '0');
  const ss = String(ahora.getSeconds()).padStart(2, '0');
  const aleatorioHex = Math.floor(Math.random() * 0x10000)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');

  return `FOTO-${yyyy}${mm}${dd}-${hh}${min}${ss}-${aleatorioHex}`;
}

export async function comprimirImagenPerfil(
  archivoODataUrl: File | string,
  maxDimension: number = 800,
  calidad: number = 0.8
): Promise<string> {
  const res = await comprimirEvidenciaFotografica(archivoODataUrl, maxDimension, calidad);
  return res.dataUrl;
}

export async function comprimirEvidenciaFotografica(
  archivoODataUrl: File | string,
  maxDimension: number = 1280,
  calidad: number = 0.82
): Promise<ResultadoCompresionEvidencia> {
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
        const bytes = Math.round((dataUrlOriginal.length * 3) / 4);
        resolve({
          dataUrl: dataUrlOriginal,
          ancho: imagen.width,
          alto: imagen.height,
          tamanoBytes: bytes
        });
        return;
      }

      contexto.drawImage(imagen, 0, 0, ancho, alto);
      const resultadoComprimido = canvas.toDataURL('image/jpeg', calidad);
      const tamanoBytes = Math.round((resultadoComprimido.length * 3) / 4);

      resolve({
        dataUrl: resultadoComprimido,
        ancho,
        alto,
        tamanoBytes
      });
    };

    imagen.onerror = () => {
      reject(new Error('Formato de imagen inválido o no compatible.'));
    };

    imagen.src = dataUrlOriginal;
  });
}
