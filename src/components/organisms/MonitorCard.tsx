import { Card, CardContent } from '@/components/atoms/ui/card'
import { Badge } from '@/components/atoms/ui/badge'
import { Button } from '@/components/atoms/ui/button'
import { User, Phone, CheckCircle } from 'lucide-react'

import type { MonitorSalida } from '@/types'

interface MonitorCardProps {
  item: MonitorSalida
  onVerDetalle: (consultaId: string) => void
  onMarcarTerminado?: (consultaId: string) => void
  consultaTerminada: string | null
}

const estadoConfig = {
  listo: { label: 'Listo para pago', className: 'bg-purpura-500' },
  pagando: { label: 'En proceso de pago', className: 'bg-amber-gold text-amber-900' },
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

export function MonitorCard({ item, onVerDetalle, onMarcarTerminado, consultaTerminada }: MonitorCardProps) {
  const config = estadoConfig[item.estado]

  return (
    <Card className={`border-0 shadow-soft hover:shadow-lg transition-all ${consultaTerminada === item.consultaId ? 'opacity-50' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <Badge className={config.className}>{config.label}</Badge>
          <span className="text-xs text-muted-foreground">{tiempoTranscurrido(item.horaTermino)}</span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <img
            src={item.mascota.foto}
            alt={item.mascota.nombre}
            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
          />
          <div>
            <h3 className="font-bold text-lg">{item.mascota.nombre}</h3>
            <p className="text-sm text-muted-foreground">{item.mascota.raza}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{item.mascota.propietario.nombre}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{item.mascota.propietario.telefono}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-muted-foreground">Total a pagar:</span>
          <span className="text-2xl font-bold text-purpura-600">${item.total.toFixed(2)}</span>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1 bg-gradient-to-r from-purpura-500 to-purpura-600 hover:from-purpura-600 hover:to-purpura-700"
            onClick={() => onVerDetalle(item.consultaId)}
            disabled={consultaTerminada === item.consultaId}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Ver Detalle
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
