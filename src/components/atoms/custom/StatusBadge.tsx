import { Badge } from '@/components/atoms/ui/badge'
import type { Consulta, MonitorSalida } from '@/types'

type ConsultaEstado = Consulta['estado']
type MonitorEstado = MonitorSalida['estado']

const consultaConfig: Record<ConsultaEstado, { label: string; className: string }> = {
  pendiente: { label: 'Pendiente', className: 'bg-amber-500 text-amber-900 hover:bg-amber-500' },
  finalizado: { label: 'Finalizado', className: 'bg-brand-primary hover:bg-brand-primary' },
}

const monitorConfig: Record<MonitorEstado, { label: string; className: string }> = {
  listo: { label: 'Listo para pago', className: 'bg-brand-primary hover:bg-brand-primary' },
  pagando: { label: 'En proceso de pago', className: 'bg-amber-500 text-amber-900 hover:bg-amber-500' },
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
