/**
 * Reglas de los archivos que se adjuntan al expediente de una mascota.
 *
 * El criterio de la HU es: JPG, PNG o PDF, hasta 5 MB por archivo. El bucket
 * `fotos_evolucion` aplica el mismo limite del lado del servidor; esto es para
 * fallar temprano y con un mensaje entendible.
 */

export const TIPOS_ARCHIVO_EVOLUCION = [
  'image/jpeg',
  'image/png',
  'application/pdf',
] as const

/** Valor para el atributo `accept` de un <input type="file">. */
export const ACCEPT_ARCHIVO_EVOLUCION = TIPOS_ARCHIVO_EVOLUCION.join(',')

export const TAMANO_MAX_EVOLUCION_MB = 5
export const TAMANO_MAX_EVOLUCION_BYTES = TAMANO_MAX_EVOLUCION_MB * 1024 * 1024

/** true si el archivo es un PDF (no se puede mostrar con <img>). */
export function esPdf(tipoArchivo?: string): boolean {
  return tipoArchivo === 'application/pdf'
}

/**
 * Lanza un Error con mensaje para el usuario si el archivo no cumple.
 * Devuelve void: se usa como guarda antes de subir.
 */
export function validarArchivoEvolucion(file: File): void {
  const tipo = file.type
  if (!TIPOS_ARCHIVO_EVOLUCION.includes(tipo as typeof TIPOS_ARCHIVO_EVOLUCION[number])) {
    throw new Error('Formato no permitido. Solo se aceptan archivos JPG, PNG o PDF.')
  }

  if (file.size > TAMANO_MAX_EVOLUCION_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1)
    throw new Error(
      `El archivo pesa ${mb} MB y el maximo son ${TAMANO_MAX_EVOLUCION_MB} MB.`
    )
  }
}
