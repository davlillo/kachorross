import { Card, CardContent } from '@/components/atoms/ui/card'
import { Badge } from '@/components/atoms/ui/badge'
import { Button } from '@/components/atoms/ui/button'
import { User, Phone, CheckCircle, Stethoscope } from 'lucide-react'
import { TransportCageIcon } from '@/components/atoms/custom'

import type { MonitorSalida } from '@/types'

interface MonitorCardProps {
  item: MonitorSalida
  onVerDetalle: (id: string, origen: MonitorSalida['origen']) => void
  /** Id del elemento recién cerrado, para atenuarlo mientras sale de la lista. */
  atendido: string | null
}

const estadoConfig = {
  listo: { label: 'Listo para pago', className: 'bg-brand-primary' },
  pagando: { label: 'En proceso de pago', className: 'bg-amber-500 text-amber-900' },
  entregado: { label: 'Entregado', className: 'bg-gray-400' },
}

function tiempoTranscurrido(hora: string) {
  const diff = Date.now() - new Date(hora).getTime()
  const minutos = Math.floor(diff / 60000)
  if (minutos < 1) return 'Justo ahora'
  if (minutos === 1) return 'Hace 1 minuto'
  if (minutos < 60) return `Hace ${minutos} minutos`
  const horas = Math.floor(minutos / 60)
  return `Hace ${horas}h ${minutos % 60}m`
}

export function MonitorCard({ item, onVerDetalle, atendido }: MonitorCardProps) {
  const config = estadoConfig[item.estado]

  const esConsulta = item.origen === 'consulta'
  const Icon = esConsulta ? Stethoscope : TransportCageIcon
  const origenLabel = esConsulta ? 'Consulta' : 'Hospedaje'

  return (
    <Card className={`border-0 shadow-soft hover:shadow-lg transition-all ${atendido === item.id ? 'opacity-50' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4 gap-2">
          <Badge className={config.className}>{config.label}</Badge>
          <span className="text-xs text-muted-foreground shrink-0">{tiempoTranscurrido(item.horaTermino)}</span>
        </div>

        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={item.mascota.foto}
              alt={item.mascota.nombre}
              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-bold text-lg truncate">{item.mascota.nombre}</h3>
              <p className="text-sm text-muted-foreground truncate">{item.mascota.raza}</p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 gap-1 text-muted-foreground">
            <Icon className="w-3 h-3" />
            {origenLabel}
          </Badge>
        </div>

        <div className="space-y-2 mb-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="truncate">{item.mascota.propietario.nombre}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{item.mascota.propietario.telefono}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-muted-foreground">Total a pagar:</span>
          <span className="text-2xl font-bold text-brand-primary">${item.total.toFixed(2)}</span>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1 bg-gradient-to-r from-brand-primary to-brand-primary hover:from-brand-primary hover:to-brand-primary"
            onClick={() => onVerDetalle(item.id, item.origen)}
            disabled={atendido === item.id}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Ver Detalle
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}