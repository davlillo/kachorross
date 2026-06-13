import { Badge } from '@/components/atoms/ui/badge'
import type { Mascota } from '@/types'

const icons: Record<string, string> = {
  perro: '🐕',
  gato: '🐱',
  ave: '🦜',
  conejo: '🐰',
  otro: '🐾',
}

const colors: Record<string, string> = {
  perro: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  gato: 'bg-pink-100 text-pink-700 hover:bg-pink-100',
  ave: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  conejo: 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10',
  otro: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
}

interface EspecieBadgeProps {
  especie: Mascota['especie']
  showLabel?: boolean
}

export function EspecieBadge({ especie, showLabel = true }: EspecieBadgeProps) {
  return (
    <Badge className={colors[especie] || colors.otro}>
      {icons[especie] || icons.otro}
      {showLabel ? ` ${especie.charAt(0).toUpperCase() + especie.slice(1)}` : ''}
    </Badge>
  )
}
