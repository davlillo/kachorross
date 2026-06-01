import {
  Stethoscope, Scissors, Pill, ShoppingBag,
  type LucideIcon,
} from 'lucide-react'
import type { Producto } from '@/types'

export type CategoriaCatalogo = Producto['categoria']

export const CATEGORIAS_CATALOGO = [
  { value: 'consulta' as const,   label: 'Consulta',   prefix: 'CON', icon: Stethoscope },
  { value: 'farmacia' as const,   label: 'Farmacia',   prefix: 'FAR', icon: Pill },
  { value: 'peluqueria' as const, label: 'Peluquería', prefix: 'PEL', icon: Scissors },
  { value: 'petshop' as const,    label: 'PetShop',    prefix: 'PTS', icon: ShoppingBag },
]

export const CATEGORIA_COLORS: Record<CategoriaCatalogo, string> = {
  consulta:   'bg-blue-100 text-blue-700 border-blue-300',
  farmacia:   'bg-amber-100 text-amber-700 border-amber-300',
  peluqueria: 'bg-teal-100 text-teal-700 border-teal-300',
  petshop:    'bg-pink-100 text-pink-700 border-pink-300',
}

/** Deriva categoría del prefijo del código (CON/FAR/PEL/PTS). */
export function categoriaFromCodigo(codigo: string): CategoriaCatalogo {
  const prefix = codigo.split('-')[0]?.toUpperCase()
  switch (prefix) {
    case 'PEL': return 'peluqueria'
    case 'FAR': return 'farmacia'
    case 'PTS': return 'petshop'
    default: return 'consulta'
  }
}

/** Normaliza categorías legacy de BD a las 4 del volante. */
export function normalizeCategoria(categoria: string, codigo?: string): CategoriaCatalogo {
  if (codigo) return categoriaFromCodigo(codigo)
  const legacy: Record<string, CategoriaCatalogo> = {
    consulta: 'consulta',
    farmacia: 'farmacia',
    peluqueria: 'peluqueria',
    petshop: 'petshop',
    servicio: 'consulta',
    vacuna: 'consulta',
    laboratorio: 'consulta',
    medicamento: 'farmacia',
  }
  return legacy[categoria] ?? 'consulta'
}

export function getCategoriaConfig(categoria: string, codigo?: string): {
  icon: LucideIcon
  label: string
  color: string
  bg: string
  border: string
} {
  const normalized = normalizeCategoria(categoria, codigo)
  const map: Record<CategoriaCatalogo, { icon: LucideIcon; color: string; bg: string; border: string }> = {
    consulta:   { icon: Stethoscope, color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-300' },
    farmacia:   { icon: Pill,        color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-300' },
    peluqueria: { icon: Scissors,    color: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-300' },
    petshop:    { icon: ShoppingBag, color: 'text-pink-700',   bg: 'bg-pink-50',   border: 'border-pink-300' },
  }
  const entry = CATEGORIAS_CATALOGO.find(c => c.value === normalized)!
  return { ...map[normalized], label: entry.label }
}

export function getCategoriaLabel(categoria: string, codigo?: string): string {
  return getCategoriaConfig(categoria, codigo).label
}

/** Orden CON-0001, CON-0002, … (prefijo + número) */
export function compareCodigo(a: string, b: string): number {
  const parse = (c: string) => {
    const m = c.match(/^([A-Z]+)-(\d+)$/i)
    if (!m) return { prefix: c, num: 0 }
    return { prefix: m[1].toUpperCase(), num: parseInt(m[2], 10) }
  }
  const pa = parse(a)
  const pb = parse(b)
  if (pa.prefix !== pb.prefix) return pa.prefix.localeCompare(pb.prefix)
  return pa.num - pb.num
}
