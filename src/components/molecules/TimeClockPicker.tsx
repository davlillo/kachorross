import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, Clock } from 'lucide-react'
import { Button } from '@/components/atoms/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/atoms/ui/popover'
import { cn } from '@/lib/utils'
import { formatoHoraLegible } from '@/lib/horariosClinica'

/** Horas de la clínica (24h) */
const HORAS_CLINICA = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] as const
const MINUTOS = [0, 15, 30, 45] as const

/** Orden tradicional en el dial: 12 arriba, luego 1→11 en sentido horario */
function indicePosicionReloj(etiqueta: number): number {
  return etiqueta === 12 ? 0 : etiqueta
}

function etiquetaDesdeHour24(h: number): number {
  if (h >= 7 && h <= 11) return h
  if (h === 12) return 12
  return h - 12
}

function hour24DesdeEtiqueta(etiqueta: number): number {
  if (etiqueta >= 7 && etiqueta <= 11) return etiqueta
  if (etiqueta === 12) return 12
  return etiqueta + 12
}

function etiquetaDesdeAngulo(deg: number): number {
  const indice = Math.round(deg / 30) % 12
  return indice === 0 ? 12 : indice
}
const CX = 120
const CY = 120
const SIZE = 240
const RADIO_ETIQUETAS = 82
const RADIO_HORA_AGUJA = 58
const RADIO_MIN_AGUJA = 76

function parseHora(value: string): { h: number; m: number } {
  const [hRaw, mRaw] = value.split(':')
  const h = Number(hRaw)
  const m = Number(mRaw)
  if (Number.isNaN(h) || Number.isNaN(m)) return { h: 9, m: 0 }
  return { h, m }
}

/** Posición en el dial: índice 0 = 12 arriba, sentido horario */
function puntaAguja(indice: number, radio: number) {
  const rad = ((indice * 30 - 90) * Math.PI) / 180
  return {
    x: CX + radio * Math.cos(rad),
    y: CY + radio * Math.sin(rad),
  }
}

function indiceHora(h: number) {
  return indicePosicionReloj(etiquetaDesdeHour24(h))
}

function indiceMinuto(m: number) {
  const i = MINUTOS.indexOf(m as (typeof MINUTOS)[number])
  return i >= 0 ? i * 3 : 0
}

function anguloDesdeClick(clientX: number, clientY: number, rect: DOMRect) {
  const scaleX = SIZE / rect.width
  const scaleY = SIZE / rect.height
  const x = (clientX - rect.left) * scaleX - CX
  const y = (clientY - rect.top) * scaleY - CY
  let deg = (Math.atan2(y, x) * 180) / Math.PI + 90
  if (deg < 0) deg += 360
  return deg % 360
}

function horaDesdeAngulo(deg: number) {
  return hour24DesdeEtiqueta(etiquetaDesdeAngulo(deg))
}

function minutoDesdeAngulo(deg: number) {
  const indice = Math.round(deg / 90) % 4
  return MINUTOS[indice]
}

interface TimeClockPickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
  className?: string
  placeholder?: string
}

export function TimeClockPicker({
  value,
  onChange,
  disabled,
  id,
  className,
  placeholder = 'Seleccionar hora',
}: TimeClockPickerProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [abierto, setAbierto] = useState(false)
  const [paso, setPaso] = useState<'hora' | 'minuto'>('hora')
  const parsed = useMemo(() => parseHora(value || '09:00'), [value])
  const [horaDraft, setHoraDraft] = useState(parsed.h)
  const [minutoDraft, setMinutoDraft] = useState(
    (MINUTOS as readonly number[]).includes(parsed.m) ? parsed.m : 0,
  )

  useEffect(() => {
    if (!abierto) return
    const p = parseHora(value || '09:00')
    setHoraDraft(p.h)
    setMinutoDraft((MINUTOS as readonly number[]).includes(p.m) ? p.m : 0)
    setPaso('hora')
  }, [abierto, value])

  const puntaHora = puntaAguja(indiceHora(horaDraft), RADIO_HORA_AGUJA)
  const puntaMin = puntaAguja(indiceMinuto(minutoDraft), RADIO_MIN_AGUJA)

  const confirmar = useCallback(() => {
    const hh = String(horaDraft).padStart(2, '0')
    const mm = String(minutoDraft).padStart(2, '0')
    onChange(`${hh}:${mm}`)
    setAbierto(false)
  }, [horaDraft, minutoDraft, onChange])

  const seleccionarHora = (h: number) => {
    setHoraDraft(h)
  }

  const seleccionarMinuto = (m: number) => {
    setMinutoDraft(m)
  }

  const onDialClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest('[data-marcador]')) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const deg = anguloDesdeClick(e.clientX, e.clientY, rect)
    if (paso === 'hora') {
      seleccionarHora(horaDesdeAngulo(deg))
    } else {
      seleccionarMinuto(minutoDesdeAngulo(deg))
    }
  }

  const estiloAguja = 'transition-[x2,y2] duration-300 ease-out'

  const marcasHoras = HORAS_CLINICA.map(h => {
    const etiqueta = etiquetaDesdeHour24(h)
    const { x, y } = puntaAguja(indicePosicionReloj(etiqueta), RADIO_ETIQUETAS)
    const activa = horaDraft === h
    return (
      <g
        key={h}
        data-marcador
        className="cursor-pointer"
        onClick={e => {
          e.stopPropagation()
          seleccionarHora(h)
        }}
      >
        <circle
          cx={x}
          cy={y}
          r={activa ? 18 : 14}
          className={cn(
            'transition-all duration-200',
            activa ? 'fill-brand-primary' : 'fill-white stroke-brand-primary/20',
          )}
          strokeWidth={activa ? 0 : 1.5}
        />
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          className={cn(
            'text-sm font-bold pointer-events-none select-none',
            activa ? 'fill-white' : 'fill-brand-primary',
          )}
        >
          {etiqueta}
        </text>
      </g>
    )
  })

  const marcasMinutos = MINUTOS.map((m, i) => {
    const indice = i * 3
    const { x, y } = puntaAguja(indice, RADIO_ETIQUETAS)
    const activa = minutoDraft === m
    return (
      <g
        key={m}
        data-marcador
        className="cursor-pointer"
        onClick={e => {
          e.stopPropagation()
          seleccionarMinuto(m)
        }}
      >
        <circle
          cx={x}
          cy={y}
          r={activa ? 20 : 16}
          className={cn(
            'transition-all duration-200',
            activa ? 'fill-brand-primary' : 'fill-white stroke-brand-primary/20',
          )}
          strokeWidth={activa ? 0 : 1.5}
        />
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          className={cn(
            'text-xs font-bold pointer-events-none select-none',
            activa ? 'fill-white' : 'fill-brand-primary',
          )}
        >
          {String(m).padStart(2, '0')}
        </text>
      </g>
    )
  })

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            'border-input flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-sm shadow-sm transition-all',
            'hover:border-brand-primary/30 focus-visible:border-brand-primary focus-visible:ring-[3px] focus-visible:ring-brand-primary/20 outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <span className="flex items-center gap-2 min-w-0 text-left">
            <Clock className="w-3.5 h-3.5 shrink-0 text-brand-primary" />
            <span className={cn(!value && 'text-muted-foreground')}>
              {value ? formatoHoraLegible(value) : placeholder}
            </span>
          </span>
          <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0 rounded-xl border-brand-primary/10 shadow-lg">
        <div className="px-4 pt-3 pb-2 border-b border-border/60 bg-brand-primary/5 rounded-t-xl">
          <p className="text-xs font-semibold text-brand-primary text-center">
            {paso === 'hora' ? 'Selecciona la hora' : 'Selecciona los minutos'}
          </p>
          <p className="text-lg font-bold text-center text-brand-primary tabular-nums mt-0.5">
            {formatoHoraLegible(
              `${String(horaDraft).padStart(2, '0')}:${String(minutoDraft).padStart(2, '0')}`,
            )}
          </p>
        </div>

        <div className="p-4">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="w-[240px] h-[240px] mx-auto cursor-pointer touch-none"
            onClick={onDialClick}
            role="img"
            aria-label={paso === 'hora' ? 'Selector de hora' : 'Selector de minutos'}
          >
            <circle
              cx={CX}
              cy={CY}
              r={98}
              className="fill-brand-primary/5 stroke-brand-primary/20"
              strokeWidth={2}
            />
            {Array.from({ length: 12 }).map((_, i) => {
              const inner = puntaAguja(i, 28)
              const outer = puntaAguja(i, 94)
              return (
                <line
                  key={i}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  className="stroke-brand-primary/20"
                  strokeWidth={i % 3 === 0 ? 2 : 1}
                />
              )
            })}

            {paso === 'hora' ? marcasHoras : marcasMinutos}

            {paso === 'minuto' && (
              <line
                x1={CX}
                y1={CY}
                x2={puntaHora.x}
                y2={puntaHora.y}
                className={cn('stroke-brand-primary/30', estiloAguja)}
                strokeWidth={2}
                strokeLinecap="round"
              />
            )}

            <line
              x1={CX}
              y1={CY}
              x2={paso === 'hora' ? puntaHora.x : puntaMin.x}
              y2={paso === 'hora' ? puntaHora.y : puntaMin.y}
              className={cn('stroke-brand-primary', estiloAguja)}
              strokeWidth={paso === 'hora' ? 3.5 : 3}
              strokeLinecap="round"
            />

            <circle cx={CX} cy={CY} r={6} className="fill-brand-primary" />
            <circle cx={CX} cy={CY} r={2.5} className="fill-white" />
          </svg>

          {paso === 'hora' ? (
            <Button
              type="button"
              className="w-full mt-3 bg-brand-primary hover:bg-brand-primary"
              onClick={() => setPaso('minuto')}
            >
              Elegir minutos
            </Button>
          ) : (
            <div className="flex gap-2 mt-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-brand-primary border-brand-primary/20"
                onClick={() => setPaso('hora')}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Hora
              </Button>
              <Button
                type="button"
                className="flex-1 bg-brand-primary hover:bg-brand-primary"
                onClick={confirmar}
              >
                Listo
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
