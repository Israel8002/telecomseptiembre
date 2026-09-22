# Protocolo de Sincronización y Resiliencia Offline

## 1. Arquitectura de Sincronización
La aplicación utiliza un patrón **Store-and-Forward** mediante la tabla local `colaSincronizacion`.

### 1.1 Ciclo de Vida de una Operación Local
1. **Acción del Usuario:** Se ejecuta una operación (ej. registro de usuario, modificación, creación de evaluación en etapas posteriores).
2. **Transacción Local:** Se inserta el registro en su tabla local correspondiente (ej. `usuarios`) y simultáneamente se crea un elemento en `colaSincronizacion` con:
   - `id`: UUID v4 único.
   - `tipoEntidad`: `'USUARIO' | 'EVALUACION' | 'FOTOGRAFIA' | 'REPORTE'`.
   - `idEntidad`: Identificador del registro local.
   - `operacion`: `'CREAR' | 'ACTUALIZAR' | 'ELIMINAR'`.
   - `datos`: Payload serializado en JSON.
   - `estado`: `'PENDIENTE'`.
   - `intentos`: `0`.
3. **Persistencia Garantizada:** Si no hay Internet, el elemento permanece en `colaSincronizacion` sin perderse.

## 2. Detección y Procesamiento Automático
- El servicio `src/servicios/detectorRed.ts` escucha eventos nativos del sistema (`online` / `offline`).
- Al recuperar conectividad a Internet:
  1. El despachador de sincronización consulta los elementos con `estado = 'PENDIENTE'`.
  2. Los procesa en orden secuencial según `creadoEn`.
  3. Cambia el estado a `'PROCESANDO'`.
  4. Al recibir confirmación remota, marca el registro local como `sincronizado: true` y el elemento de la cola como `'SINCRONIZADO'`.
  5. En caso de fallo de red durante el envío:
     - Incrementa el contador de `intentos`.
     - Registra el `ultimoError`.
     - Aplica retroceso exponencial (*exponential backoff*) antes del próximo reintento.
     - **Regla Estricta:** Nunca se eliminan datos locales ante fallos de sincronización.
