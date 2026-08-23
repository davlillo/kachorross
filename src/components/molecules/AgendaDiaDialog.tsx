import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/atoms/ui/button'
import { colorEvento, type TipoEvento } from '@/data/eventosData'
import type { EventoAgenda } from '@/controllers/agenda.controller'
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PawPrint,
  Syringe,
  Trash2,
  X,
} from 'lucide-react'

interface GrupoMascotaAgenda {
  mascotaId: string
  mascota: string
  mascotaFoto?: string
  eventos: EventoAgenda[]
}

interface AgendaDiaPanelProps {
  open: boolean
  onClose: () => void
  fecha: Date | null
  eventos: EventoAgenda[]
  isLoading?: boolean
  onEliminar?: (id: string, origen: string) => void
  onMarcarVacuna?: (evento: EventoAgenda) => void
  idEnProceso?: string | null
}

function claveMascota(ev: EventoAgenda): string {
  return ev.mascota.trim().toLowerCase()
}

function agruparPorMascota(eventos: EventoAgenda[]): GrupoMascotaAgenda[] {
  const map = new Map<string, GrupoMascotaAgenda>()
  for (const ev of eventos) {
    const key = claveMascota(ev)
    const existing = map.get(key)
    if (existing) {
      existing.eventos.push(ev)
      if (!existing.mascotaFoto && ev.mascotaFoto) existing.mascotaFoto = ev.mascotaFoto
    } else {
      map.set(key, {
        mascotaId: ev.mascotaId,
        mascota: ev.mascota,
        mascotaFoto: ev.mascotaFoto,
        eventos: [ev],
      })
    }
  }
  return [...map.values()]
}

/** Un badge por tipo de cita (vacuna + desparas = 2 badges, no 2× desparas) */
function tiposUnicos(eventos: EventoAgenda[]): TipoEvento[] {
  const vistos = new Set<TipoEvento>()
  const tipos: TipoEvento[] = []
  for (const ev of eventos) {
    if (!vistos.has(ev.tipo)) {
      vistos.add(ev.tipo)
      tipos.push(ev.tipo)
    }
  }
  return tipos
}

export function AgendaDiaPanel({
  open,
  onClose,
  fecha,
  eventos,
  isLoading,
  onEliminar,
  onMarcarVacuna,
  idEnProceso,
}: AgendaDiaPanelProps) {
  const [indice, setIndice] = useState(0)

  const grupos = useMemo(() => agruparPorMascota(eventos), [eventos])
  const totalCitas = eventos.length
  const totalGrupos = grupos.length

  useEffect(() => {
    if (open) setIndice(0)
  }, [open, fecha, totalGrupos])

  if (!open || !fecha) return null

  const grupo = totalGrupos > 0 ? grupos[indice] : null
  const tiposGrupo = grupo ? tiposUnicos(grupo.eventos) : []
  const tituloFecha = format(fecha, 'EEE d MMM', { locale: es })

  const irAnterior = () => setIndice(i => (i - 1 + totalGrupos) % totalGrupos)
  const irSiguiente = () => setIndice(i => (i + 1) % totalGrupos)

  const eventosManuales = grupo?.eventos.filter(ev => ev.origen === 'evento') ?? []
  const vacunasGrupo = grupo?.eventos.filter(ev => ev.origen === 'vacuna') ?? []
  const hayTodos = Boolean(onMarcarVacuna && vacunasGrupo.length > 0)

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center p-3 bg-background/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className={`relative w-[min(88%,230px)] ${hayTodos ? 'max-h-[96%]' : 'aspect-square'} rounded-2xl border border-border/80 bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 shrink-0">
          <div className="min-w-0">
            <p className="text-[11px] font-bold capitalize truncate">{tituloFecha}</p>
            {totalCitas > 0 && (
              <p className="text-[9px] text-muted-foreground">
                {totalGrupos} {totalGrupos === 1 ? 'mascota' : 'mascotas'}
                {totalGrupos > 1 && ` · ${totalCitas} citas`}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-3 min-h-0 relative overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Calendar className="w-6 h-6 animate-pulse" />
              <p className="text-xs">Cargando...</p>
            </div>
          ) : !grupo ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
              <Calendar className="w-8 h-8" />
              <p className="text-xs font-medium">Sin eventos</p>
            </div>
          ) : (
            <>
              {totalGrupos > 1 && (
                <button
                  type="button"
                  onClick={irAnterior}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border bg-background/90 shadow-sm flex items-center justify-center hover:bg-muted z-10"
                  aria-label="Mascota anterior"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
              )}

              <div className="flex flex-col items-center text-center px-5 w-full">
                <div className={`relative ${hayTodos ? 'mb-1.5' : 'mb-2.5'}`}>
                  {grupo.mascotaFoto ? (
                    <img
                      src={grupo.mascotaFoto}
                      alt={grupo.mascota}
                      className={`${hayTodos ? 'w-12 h-12' : 'w-[72px] h-[72px]'} rounded-full object-cover ring-2 ring-white shadow-md`}
                    />
                  ) : (
                    <div className={`${hayTodos ? 'w-12 h-12' : 'w-[72px] h-[72px]'} rounded-full bg-brand-primary/10 ring-2 ring-white shadow-md flex items-center justify-center`}>
                      <PawPrint className={hayTodos ? 'w-6 h-6 text-brand-primary/60' : 'w-8 h-8 text-brand-primary/60'} />
                    </div>
                  )}
                </div>

                <p className="text-sm font-bold truncate max-w-[160px]">{grupo.mascota}</p>

                <div className="flex flex-wrap justify-center gap-1 mt-2 max-w-[170px]">
                  {tiposGrupo.map(tipo => {
                    const col = colorEvento[tipo]
                    return (
                      <span
                        key={tipo}
                        className={`px-2 py-0.5 rounded-full text-[8px] font-bold text-white whitespace-nowrap ${col.dot}`}
                      >
                        {col.label}
                      </span>
                    )
                  })}
                </div>
              </div>

              {totalGrupos > 1 && (
                <button
                  type="button"
                  onClick={irSiguiente}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border bg-background/90 shadow-sm flex items-center justify-center hover:bg-muted z-10"
                  aria-label="Siguiente mascota"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>

        {grupo && hayTodos && (
          <div className="shrink-0 border-t border-border/40 px-3 py-2">
            <p className="text-[8px] font-bold uppercase tracking-wide text-muted-foreground text-center mb-1">
              Vacunas por aplicar · toca ✓
            </p>
            <div className="space-y-1 max-h-[76px] overflow-y-auto">
              {vacunasGrupo.map(ev => {
                const enProceso = idEnProceso === ev.id
                return (
                  <button
                    key={ev.id}
                    type="button"
                    disabled={enProceso || idEnProceso != null}
                    onClick={() => onMarcarVacuna!(ev)}
                    title="Marcar como aplicada"
                    className="group w-full flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-1.5 py-1 text-left hover:bg-muted transition-colors disabled:opacity-60"
                  >
                    <span className="w-3 h-3 rounded-[4px] border border-muted-foreground/50 bg-background shrink-0 flex items-center justify-center">
                      {enProceso ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin text-brand-primary" />
                      ) : (
                        <Check className="w-2.5 h-2.5 text-muted-foreground/40 group-hover:text-brand-primary transition-colors" />
                      )}
                    </span>
                    <Syringe className="w-2.5 h-2.5 shrink-0 text-emerald-500" />
                    <span className="truncate text-[9px] font-medium">
                      {ev.titulo.replace(/^Vacuna:\s*/, '')}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {grupo && (
          <div className="shrink-0 px-3 pb-3 pt-2 flex items-center justify-center gap-2 border-t border-border/40">
            <Button asChild variant="outline" size="sm" className="h-7 text-[10px] px-3 flex-1 max-w-[160px]">
              <Link to={`/expedientes/${grupo.mascotaId}`} onClick={onClose}>
                Ver expediente
              </Link>
            </Button>
            {onEliminar && eventosManuales.length === 1 && (
              <button
                type="button"
                onClick={() => onEliminar(eventosManuales[0].id, eventosManuales[0].origen)}
                className="text-muted-foreground hover:text-destructive p-1"
                aria-label="Eliminar evento"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** @deprecated Usar AgendaDiaPanel */
export const AgendaDiaDialog = AgendaDiaPanel
