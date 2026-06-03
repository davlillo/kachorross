/** Horarios de cita en intervalos de 15 min (07:00–18:00) */
export function horariosCitaClinica(): string[] {
  const slots: string[] = []
  for (let h = 7; h <= 18; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 18 && m > 0) break
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

/** Ej. "15:00" → "3:00 p. m." */
export function formatoHoraLegible(hhmm: string): string {
  const [hRaw, mRaw] = hhmm.split(':')
  const h = Number(hRaw)
  const m = Number(mRaw)
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
  const periodo = h < 12 ? 'a. m.' : 'p. m.'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${periodo}`
}
