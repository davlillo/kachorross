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

/**
 * Día calendario de un instante en `America/El_Salvador`, como 'yyyy-MM-dd'.
 *
 * Para valores que son un instante real (por ejemplo `hospedajes.facturado_at`) y no
 * un `timestamptz` de una cita. `fechaLocalClave` usa la zona del navegador, así que
 * si el equipo no está en El Salvador devuelve el día equivocado: un cobro de las
 * 8 de la mañana cae del día anterior.
 */
export function claveDiaLocal(fecha: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(typeof fecha === 'string' ? new Date(fecha) : fecha)
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

/** Devuelve la fecha de hoy desplazada N días, en formato 'yyyy-MM-dd'. */
export function desplazarDia(offsetDias: number): string {
  const fecha = parseDateLocal(todayLocal());
  fecha.setDate(fecha.getDate() + offsetDias);
  return fechaLocalClave(fecha);
}

/**
 * Rango UTC [inicio, fin) que corresponde a un día calendario 'yyyy-MM-dd' en
 * `America/El_Salvador`.
 *
 * Necesario para filtrar columnas `timestamptz` por día. Si el filtro se hiciera en
 * la zona del servidor (UTC) el corte se correría seis horas: el cobro de las 8 de la
 * mañana entraría en el día anterior.
 *
 * El desfase se mide con el propio `Intl` en vez de escribir `-06:00` a mano, para
 * que siga siendo correcto si la zona cambia de reglas.
 */
export function rangoUtcDeDiaLocal(diaClave: string): { desdeUtc: string; hastaUtc: string } {
  const [y, m, d] = diaClave.split('-').map(Number);

  // Intl formatea en la zona pedida pero no expone el desfase, así que se mide:
  // se parte de un instante conocido, se lee su hora local y la diferencia es el
  // offset de la zona para ese día.
  const instante = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(instante);

  const pieza = (tipo: string) => Number(partes.find(p => p.type === tipo)?.value ?? 0);
  const desplazamientoMs = Date.UTC(
    pieza('year'),
    pieza('month') - 1,
    pieza('day'),
    pieza('hour') % 24,
    pieza('minute'),
    pieza('second'),
  ) - instante.getTime();

  const inicioUtc = new Date(Date.UTC(y, m - 1, d) - desplazamientoMs);
  const finUtc = new Date(inicioUtc.getTime() + 86_400_000);

  return { desdeUtc: inicioUtc.toISOString(), hastaUtc: finUtc.toISOString() };
}

/** Días calendario entre dos fechas 'yyyy-MM-dd' (nunca negativo). */
export function diffDias(desde: string, hasta: string): number {
  const ms = parseDateLocal(hasta).getTime() - parseDateLocal(desde).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

/**
 * Días a facturar entre dos fechas. El mismo día de ingreso y salida cuenta como
 * una jornada, en espejo del GREATEST(..., 1) del trigger update_hospedaje_cargo().
 */
export function diasFacturables(desde: string, hasta: string): number {
  return Math.max(1, diffDias(desde, hasta));
}
