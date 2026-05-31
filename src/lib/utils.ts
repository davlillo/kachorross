import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Fecha calendario en zona horaria local (evita desfase UTC en gráficas). */
export function fechaLocalClave(fecha: string | Date): string {
  return format(typeof fecha === 'string' ? new Date(fecha) : fecha, 'yyyy-MM-dd')
}

export function hoyLocalClave(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
