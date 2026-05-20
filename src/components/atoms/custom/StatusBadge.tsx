import { Badge } from '@/components/atoms/ui/badge'
import type { Consulta, MonitorSalida } from '@/types'

type ConsultaEstado = Consulta['estado']
type MonitorEstado = MonitorSalida['estado']

const consultaConfig: Record<ConsultaEstado, { label: string; className: string }> = {
  pendiente: { label: 'Pendiente', className: 'bg-amber-gold text-amber-900 hover:bg-amber-gold' },
  finalizado: { label: 'Finalizado', className: 'bg-purpura-500 hover:bg-purpura-500' },
}

const monitorConfig: Record<MonitorEstado, { label: string; className: string }> = {
  listo: { label: 'Listo para pago', className: 'bg-purpura-500 hover:bg-purpura-500' },
  pagando: { label: 'En proceso de pago', className: 'bg-amber-gold text-amber-900 hover:bg-amber-gold' },
  entregado: { label: 'Entregado', className: 'bg-gray-400 hover:bg-gray-400' },
}

interface StatusBadgeProps {
  status: ConsultaEstado | MonitorEstado
  type?: 'consulta' | 'monitor'
}

export function StatusBadge({ status, type = 'consulta' }: StatusBadgeProps) {
  const config = type === 'consulta'
    ? consultaConfig[status as ConsultaEstado] || consultaConfig.pendiente
    : monitorConfig[status as MonitorEstado] || monitorConfig.listo

  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  )
}
