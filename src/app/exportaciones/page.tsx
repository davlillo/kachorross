import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plane, Search } from 'lucide-react'
import { ExportacionController } from '@/controllers/exportacion.controller'
import type { ExportacionResumen } from '@/controllers/exportacion.controller'
import { Button } from '@/components/atoms/ui/button'
import { Card, CardContent } from '@/components/atoms/ui/card'
import { Input } from '@/components/atoms/ui/input'
import { Badge } from '@/components/atoms/ui/badge'
import { PageHeader } from '@/components/molecules/PageHeader'
import { formatDateLocal } from '@/lib/utils'

const controller = ExportacionController.getInstance()

export default function ExportacionesPage() {
  const [tramites, setTramites] = useState<ExportacionResumen[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    void controller.listar()
      .then(rows => { if (activo) setTramites(rows) })
      .catch(err => { if (activo) setError(err instanceof Error ? err.message : 'No se pudieron cargar los trámites') })
      .finally(() => { if (activo) setLoading(false) })
    return () => { activo = false }
  }, [])

  const filtrados = useMemo(() => {
    const termino = query.trim().toLowerCase()
    return tramites.filter(item => [item.mascotaNombre, item.propietarioNombre, item.paisDestino]
      .some(valor => valor.toLowerCase().includes(termino)))
  }, [tramites, query])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader title="Exportación de mascotas" description="Trámites de viaje y documentación de pacientes" icon={Plane}
        actions={<Link to="/expedientes"><Button variant="outline">Iniciar desde un expediente</Button></Link>} />
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input aria-label="Buscar trámites" value={query} onChange={event => setQuery(event.target.value)}
          placeholder="Buscar mascota, propietario o destino" className="pl-10" />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {loading ? <p className="text-muted-foreground">Cargando trámites...</p> : filtrados.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {tramites.length ? 'No se encontraron trámites' : 'Aún no hay trámites. Inicie uno desde el expediente de una mascota.'}
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map(item => (
            <Card key={item.id} className="border-border/70">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div><h2 className="font-semibold">{item.mascotaNombre}</h2>
                    <p className="text-sm text-muted-foreground">{item.propietarioNombre}</p></div>
                  <Badge variant="outline">{item.estado.replace('_', ' ')}</Badge>
                </div>
                <p className="text-sm">Destino: <span className="font-medium">{item.destinoDetalle || item.paisDestino}</span></p>
                <p className="text-sm text-muted-foreground">Trámite: {formatDateLocal(item.fechaTramiteProgramada)}</p>
                <Link to={`/expedientes/${item.mascotaId}?exportacion=${item.id}`} className="inline-flex">
                  <Button size="sm" variant="outline">Ver trámite <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
