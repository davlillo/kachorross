const TZ = 'America/El_Salvador'

/** Fecha calendario YYYY-MM-DD en horario de El Salvador */
export function fechaEnElSalvador(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d)
}

export function hoyEnElSalvador(): string {
  return fechaEnElSalvador(new Date())
}

export function mananaEnElSalvador(): string {
  const [y, m, d] = hoyEnElSalvador().split('-').map(Number)
  const dt = new Date(y, m - 1, d + 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

/** La próxima cita cae mañana (recordatorio 1 día antes) */
export function proximaCitaEsManana(proximaCitaIso: string): boolean {
  return fechaEnElSalvador(proximaCitaIso) === mananaEnElSalvador()
}

export function horaDesdeIsoEnElSalvador(iso: string): string {
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

export function formatoFechaLegibleClave(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
