import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EstadoHospedaje, Hospedaje } from '@/types';
import { Card } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Badge } from '@/components/atoms/ui/badge';
import { PageHeader } from '@/components/molecules/PageHeader';
import { SearchBar } from '@/components/molecules/SearchBar';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { RegistrarSalidaHospedajeDialog } from '@/components/organisms/RegistrarSalidaHospedajeDialog';
import { VerHospedajeDialog } from '@/components/organisms/VerHospedajeDialog';
import { useHospedajes } from '@/hooks/useHospedajes';
import { diasFacturables, diffDias, formatDateLocal, todayLocal } from '@/lib/utils';
import { toast } from 'sonner';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atoms/ui/table';
import {
  PawPrint,
  Search,
  Plus,
  LogOut,
  Eye,
} from 'lucide-react';
import { TransportCageIcon } from '@/components/atoms/custom';

const estadoColors: Record<EstadoHospedaje, string> = {
  activo: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  finalizado: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
};

const filtrosEstado = [
  { label: 'Todos los estados', value: 'todos' },
  { label: 'Hospedados', value: 'activo' },
  { label: 'Finalizados', value: 'finalizado' },
];

/**
 * El paciente siempre viene del expediente, así que la relación es la única fuente.
 */
function datosPaciente(h: Hospedaje) {
  return {
    nombre: h.mascota?.nombre ?? 'Paciente',
    raza: h.mascota?.raza ?? '—',
    propietario: h.mascota?.propietario.nombre ?? '—',
    telefono: h.mascota?.propietario.telefono ?? '',
    foto: h.mascota?.foto,
  };
}

/**
 * Los días se muestran en vivo mientras la estancia está activa, y al finalizar
 * pasan a ser días facturables (mínimo 1), igual que los calcula el trigger.
 */
function diasDe(h: Hospedaje): number {
  const fin = h.fechaSalidaReal ?? todayLocal();
  return h.estado === 'finalizado'
    ? diasFacturables(h.fechaIngreso, fin)
    : diffDias(h.fechaIngreso, fin);
}

function totalDe(h: Hospedaje): number {
  return h.totalCargo ?? diasDe(h) * h.tarifaDiaria;
}

export default function HospedajePage() {
  const { hospedajes, isLoading, error, registrarSalida, refresh } = useHospedajes();
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [salidaOpen, setSalidaOpen] = useState(false);
  const [hospedajeSalida, setHospedajeSalida] = useState<Hospedaje | null>(null);
  const [hospedajeDetalle, setHospedajeDetalle] = useState<Hospedaje | null>(null);

  const hospedajesFiltrados = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return hospedajes.filter(h => {
      if (filtroEstado !== 'todos' && h.estado !== filtroEstado) return false;
      if (!q) return true;
      const datos = datosPaciente(h);
      return (
        datos.nombre.toLowerCase().includes(q) ||
        datos.raza.toLowerCase().includes(q) ||
        datos.propietario.toLowerCase().includes(q) ||
        datos.telefono.toLowerCase().includes(q)
      );
    });
  }, [hospedajes, searchQuery, filtroEstado]);

  const activos = hospedajes.filter(h => h.estado === 'activo').length;

  const abrirSalida = (hospedaje: Hospedaje) => {
    setHospedajeSalida(hospedaje);
    setSalidaOpen(true);
  };

  const confirmarSalida = useCallback(
    async (fechaSalidaReal: string) => {
      if (!hospedajeSalida) return;
      const actualizado = await registrarSalida(hospedajeSalida.id, fechaSalidaReal);
      toast.success(`Salida registrada · $${actualizado.totalCargo?.toFixed(2) ?? '0.00'}`);
    },
    [hospedajeSalida, registrarSalida],
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Hospedaje"
        description="Mascotas actualmente hospedadas en la clínica"
        icon={TransportCageIcon}
        badge={
          <Badge variant="outline" className="px-3 py-1 ml-2">
            <PawPrint className="w-3 h-3 mr-1" />
            {isLoading ? '...' : `${activos} en hospedaje`}
          </Badge>
        }
        actions={
          <Link to="/hospedaje/nuevo">
            <Button className="bg-gradient-to-r from-brand-primary to-brand-primary hover:from-brand-primary hover:to-brand-primary">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Hospedaje
            </Button>
          </Link>
        }
      />

      <SearchBar
        placeholder="Buscar por nombre, raza, propietario o teléfono..."
        value={searchQuery}
        onChange={setSearchQuery}
        filters={filtrosEstado}
        currentFilter={filtroEstado}
        onFilterChange={setFiltroEstado}
        filterVariant="select"
      />

      <Card className="border-0 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/70 bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[90px] py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Foto
                </TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Paciente
                </TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ingreso
                </TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Salida estimada
                </TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Días
                </TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tarifa
                </TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Estado
                </TableHead>
                <TableHead className="py-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total
                </TableHead>
                <TableHead className="w-[210px] py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Acción
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    <TableCell>
                      <Skeleton className="mx-auto h-11 w-11 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5 py-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-8 w-28" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center">
                    <EmptyState
                      icon={Search}
                      message={error}
                      action={{ label: 'Reintentar', onClick: () => { void refresh(); } }}
                    />
                  </TableCell>
                </TableRow>
              ) : hospedajesFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center">
                    <EmptyState
                      icon={Search}
                      message={
                        hospedajes.length === 0
                          ? 'No hay mascotas en hospedaje'
                          : 'No se encontraron mascotas en hospedaje'
                      }
                      action={
                        hospedajes.length > 0
                          ? { label: 'Limpiar filtros', onClick: () => { setSearchQuery(''); setFiltroEstado('todos'); } }
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                hospedajesFiltrados.map((hospedaje) => {
                  const datos = datosPaciente(hospedaje);
                  return (
                    <TableRow
                      key={hospedaje.id}
                      className="group border-b border-border/50 transition-colors hover:bg-brand-primary/[0.04]"
                    >
                      <TableCell className="text-center">
                        {datos.foto ? (
                          <img
                            src={datos.foto}
                            alt={datos.nombre}
                            className="inline-block h-11 w-11 rounded-full object-cover shadow-sm ring-2 ring-border"
                          />
                        ) : (
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary/15 to-brand-secondary/15 text-brand-primary ring-2 ring-border">
                            <PawPrint className="w-5 h-5" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <button
                          type="button"
                          onClick={() => setHospedajeDetalle(hospedaje)}
                          className="block max-w-full text-left"
                        >
                          <p className="font-semibold transition-colors group-hover:text-brand-primary">
                            {datos.nombre}
                          </p>
                          <p className="text-xs text-muted-foreground">{datos.raza}</p>
                        </button>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {formatDateLocal(hospedaje.fechaIngreso)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {formatDateLocal(hospedaje.fechaSalidaEstimada)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary">
                          {diasDe(hospedaje)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          ${hospedaje.tarifaDiaria.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`rounded-full px-2.5 font-medium ${estadoColors[hospedaje.estado]}`}>
                          {hospedaje.estado === 'activo' ? 'Hospedado' : 'Finalizado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <span className="text-sm font-bold tabular-nums text-brand-primary">
                          ${totalDe(hospedaje).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setHospedajeDetalle(hospedaje)}
                            title="Ver detalle"
                            aria-label={`Ver detalle de ${datos.nombre}`}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-brand-primary"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {hospedaje.estado === 'activo' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirSalida(hospedaje)}
                              className="border-brand-primary/20 text-brand-primary hover:bg-brand-primary/5"
                            >
                              <LogOut className="w-3.5 h-3.5 mr-1" />
                              Registrar salida
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {hospedaje.fechaSalidaReal
                                ? formatDateLocal(hospedaje.fechaSalidaReal)
                                : '—'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <RegistrarSalidaHospedajeDialog
        open={salidaOpen}
        onOpenChange={setSalidaOpen}
        hospedaje={hospedajeSalida}
        onConfirm={confirmarSalida}
      />

      <VerHospedajeDialog
        open={!!hospedajeDetalle}
        onOpenChange={(v) => { if (!v) setHospedajeDetalle(null); }}
        hospedaje={hospedajeDetalle}
      />
    </div>
  );
}