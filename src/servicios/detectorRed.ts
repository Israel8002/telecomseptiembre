/**
 * Servicio para detección reactiva de conectividad (Online / Offline)
 */

export function obtenerEstadoRedActual(): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

export function suscribirEstadoRed(alCambiar: (estaEnLinea: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const manejadorOnline = () => alCambiar(true);
  const manejadorOffline = () => alCambiar(false);

  window.addEventListener('online', manejadorOnline);
  window.addEventListener('offline', manejadorOffline);

  return () => {
    window.removeEventListener('online', manejadorOnline);
    window.removeEventListener('offline', manejadorOffline);
  };
}
