import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

const TZ = 'America/El_Salvador'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Retorna la fecha actual en zona 'America/El_Salvador' como 'yyyy-MM-dd'. */
export function todayLocal(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Fecha calendario en zona horaria local (evita desfase UTC en gráficas). */
export function fechaLocalClave(fecha: string | Date): string {
  return format(typeof fecha === 'string' ? new Date(fecha) : fecha, 'yyyy-MM-dd')
}

/** @deprecated Usar todayLocal() */
export function hoyLocalClave(): string {
  return todayLocal()
}

/** Parsea un string ISO 'yyyy-MM-dd' como Date en hora local (evita desfase UTC). */
export function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Formatea un string ISO 'yyyy-MM-dd' a 'dd/MM/yyyy' en hora local. */
export function formatDateLocal(dateStr: string): string {
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}
