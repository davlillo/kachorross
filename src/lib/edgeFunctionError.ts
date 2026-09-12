import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js'

/**
 * `functions.invoke()` no lee el body cuando la respuesta no es 2xx: tira un
 * FunctionsHttpError con el mensaje generico "Edge Function returned a non-2xx
 * status code" y deja la respuesta real en `.context`. Todo el detalle que las
 * funciones devuelven ({ error: "Sin permisos de administrador" }, etc.) se
 * pierde salvo que se lea ese Response a mano.
 *
 * Devuelve el mensaje util, o el fallback si no hay nada mejor.
 */
export async function mensajeErrorEdgeFunction(
  error: unknown,
  fallback: string,
): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    // La funcion corrio y respondio con un status de error: el motivo esta en
    // el body. Que llegue hasta aca ya descarta que no este desplegada.
    try {
      const body = await error.context.json()
      if (typeof body?.error === 'string' && body.error) return body.error
    } catch {
      // Body vacio o no-JSON: seguimos con el status.
    }

    const status = error.context?.status
    if (status === 404) return 'La función no está desplegada en Supabase.'
    if (status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.'
    if (status === 403) return 'No tienes permisos para esta acción.'
    if (status) return `${fallback} (HTTP ${status})`
    return fallback
  }

  if (error instanceof FunctionsRelayError) {
    return `${fallback} (error de red en Supabase)`
  }

  if (error instanceof FunctionsFetchError) {
    // No se pudo alcanzar la funcion: no desplegada, sin conexion o CORS.
    return 'No se pudo contactar la función. Verifica que esté desplegada y que tengas conexión.'
  }

  if (error instanceof Error && error.message) return error.message

  return fallback
}
