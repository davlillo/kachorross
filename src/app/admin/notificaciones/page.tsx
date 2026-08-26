import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Input } from '@/components/atoms/ui/input';
import { Button } from '@/components/atoms/ui/button';
import { PageHeader } from '@/components/molecules/PageHeader';
import { EmptyState } from '@/components/molecules/EmptyState';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/atoms/ui/table';
import { NotificacionController } from '@/controllers/notificacion.controller';
import type { RegistroEnvio } from '@/types';
import {
  Bell, Search, Mail, CheckCircle2, XCircle, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ctrl = NotificacionController.getInstance();

const TIPO_LABELS: Record<RegistroEnvio['tipoNotificacion'], string> = {
  recordatorio: 'Recordatorio',
  receta: 'Receta',
  invitacion: 'Invitación',
  confirmacion: 'Confirmación',
  personalizado: 'General',
};

const TIPO_STYLES: Record<RegistroEnvio['tipoNotificacion'], string> = {
  recordatorio: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  receta: 'bg-sky-50 text-sky-700 border-sky-200',
  invitacion: 'bg-violet-50 text-violet-700 border-violet-200',
  confirmacion: 'bg-amber-50 text-amber-700 border-amber-200',
  personalizado: 'bg-muted text-muted-foreground border-border',
};

const FILTROS_ESTADO = [
  { label: 'Todos', value: 'todos' as const },
  { label: 'Enviados', value: 'enviado' as const },
  { label: 'Fallidos', value: 'fallido' as const },
];

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  watermark: React.ElementType;
  gradient: string;
  badge?: string;
}

function StatCard({ label, value, icon: Icon, watermark: Watermark, gradient, badge }: StatCardProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl p-6 shadow-lg text-white min-h-[140px]', gradient)}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
      <Watermark className="absolute -right-4 -bottom-4 w-28 h-28 opacity-[0.08]" strokeWidth={1.5} />
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/60">{label}</p>
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
            <Icon className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
        </div>
        <div>
          <p className="text-5xl font-black leading-none tabular-nums">{value}</p>
          {badge && (
            <div className="mt-3">
              <span className="inline-flex items-center text-[11px] font-semibold bg-white/20 rounded-full px-2.5 py-0.5">
                {badge}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistorialNotificacionesPage() {
  const [registros, setRegistros] = useState<RegistroEnvio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'enviado' | 'fallido'>('todos');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await ctrl.listar({
          estado: filtroEstado === 'todos' ? 'todos' : filtroEstado,
        });
        setRegistros(data);
      } catch {
        setRegistros([]);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [filtroEstado]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return registros;
    return registros.filter(r => r.destinatarioEmail.toLowerCase().includes(q));
  }, [registros, busqueda]);

  const enviados = filtrados.filter(r => r.estado === 'enviado').length;
  const fallidos = filtrados.filter(r => r.estado === 'fallido').length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Historial de Notificaciones"
        description="Correos enviados a clientes y usuarios"
        icon={Bell}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total correos"
          value={isLoading ? '—' : filtrados.length}
          icon={Mail}
          watermark={Mail}
          gradient="bg-gradient-to-br from-brand-primary via-brand-primary to-brand-secondary"
          badge="Registrados"
        />
        <StatCard
          label="Enviados"
          value={isLoading ? '—' : enviados}
          icon={CheckCircle2}
          watermark={CheckCircle2}
          gradient="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600"
          badge={filtrados.length > 0 ? `${Math.round((enviados / filtrados.length) * 100)}% del total` : 'Sin registros'}
        />
        <StatCard
          label="Fallidos"
          value={isLoading ? '—' : fallidos}
          icon={XCircle}
          watermark={XCircle}
          gradient="bg-gradient-to-br from-red-500 via-rose-500 to-red-600"
          badge={fallidos > 0 ? 'Requieren revisión' : 'Todo en orden'}
        />
      </div>

      <Card className="border-0 shadow-soft overflow-hidden">
        <CardContent className="p-0">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Registro de envíos</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLoading ? 'Cargando…' : `${filtrados.length} correo${filtrados.length === 1 ? '' : 's'}`}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-72">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <Input
                  type="search"
                  placeholder="Buscar por correo"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>

              <div className="flex gap-1.5 rounded-lg bg-muted/50 p-1">
                {FILTROS_ESTADO.map(f => (
                  <Button
                    key={f.value}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiltroEstado(f.value)}
                    className={cn(
                      'h-8 px-3 text-xs font-medium rounded-md',
                      filtroEstado === f.value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-16">Cargando historial…</p>
          ) : filtrados.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Mail}
                title="Sin notificaciones"
                message="Los correos enviados aparecerán aquí con su estado."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/70 bg-muted/30 hover:bg-muted/30">
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Fecha
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Destinatario
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Tipo
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Estado
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[180px]">
                      Error
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map(reg => (
                    <TableRow key={reg.id} className="hover:bg-muted/20">
                      <TableCell className="py-3 text-sm whitespace-nowrap tabular-nums text-muted-foreground">
                        {formatFecha(reg.fechaEnvio)}
                      </TableCell>
                      <TableCell className="py-3 text-sm font-medium">
                        {reg.destinatarioEmail}
                      </TableCell>
                      <TableCell className="py-3">
                        <span className={cn(
                          'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                          TIPO_STYLES[reg.tipoNotificacion],
                        )}>
                          {TIPO_LABELS[reg.tipoNotificacion]}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        {reg.estado === 'enviado' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Enviado
                          </span>
                        ) : reg.estado === 'fallido' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
                            <XCircle className="h-3 w-3" />
                            Fallido
                          </span>
                        ) : (
                          <Badge variant="secondary" className="text-[11px]">{reg.estado}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-xs max-w-[220px]">
                        {reg.estado === 'fallido' && reg.codigoError ? (
                          <span className="inline-flex items-start gap-1.5 text-red-600">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{reg.codigoError}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
