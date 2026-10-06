import { useCallback, useMemo, useState } from 'react';
import { useConsultas } from '@/hooks/useConsultas';
import { useHospedajesPrefacturacion, useHospedajesFacturados } from '@/hooks/useHospedajes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/atoms/ui/tabs';
import { PageHeader } from '@/components/molecules/PageHeader';
import { EmptyState } from '@/components/molecules/EmptyState';
import { MonitorCard } from '@/components/organisms/MonitorCard';
import { DetailRecepcionDialog } from '@/components/organisms/DetailRecepcionDialog';
import { combinarMonitor, combinarProcesadosHoy } from '@/lib/monitorSalida';

import { rangoUtcDeDiaLocal, todayLocal } from '@/lib/utils';
import { CheckCircle, ClipboardList, Clock, Stethoscope } from 'lucide-react';
import { TransportCageIcon } from '@/components/atoms/custom';
import { toast } from 'sonner';
import type { MonitorSalida } from '@/types';

export default function RecepcionPage() {
  const { consultas, monitorSalida: consultasMonitor, finalizarConsulta, isLoading } = useConsultas();
  const { hospedajes: hospedajesMonitor, marcarFacturado } = useHospedajesPrefacturacion();

  const [seleccion, setSeleccion] = useState<{ id: string; origen: MonitorSalida['origen'] } | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [atendido, setAtendido] = useState<string | null>(null);

  const hoy = todayLocal();
  const rangoHoy = useMemo(() => rangoUtcDeDiaLocal(hoy), [hoy]);

  // Se piden también los ya facturados: al marcar uno como facturado sale del monitor,
  // pero tiene que aparecer en la pestaña del día sin esperar al próximo refresh.
  const { hospedajes: hospedajesFacturados, refresh: refrescarFacturados } =
    useHospedajesFacturados(rangoHoy.desdeUtc, rangoHoy.hastaUtc);

  // El corte va después de mezclar: si cada fuente limitara por su lado, el
  // hospedaje más reciente quedaría siempre fuera de la lista.
  const monitorSalida = useMemo(
    () => combinarMonitor(consultasMonitor, hospedajesMonitor),
    [consultasMonitor, hospedajesMonitor],
  );

  const procesadosHoy = useMemo(
    () => combinarProcesadosHoy(consultas, hospedajesFacturados, hoy),
    [consultas, hospedajesFacturados, hoy],
  );

  const itemSeleccionado = useMemo(
    () => monitorSalida.find(m => m.id === seleccion?.id && m.origen === seleccion.origen),
    [monitorSalida, seleccion],
  );

  const consultaSeleccionada = itemSeleccionado?.origen === 'consulta' ? itemSeleccionado.consulta : undefined;
  const hospedajeSeleccionado = itemSeleccionado?.origen === 'hospedaje' ? itemSeleccionado.hospedaje : undefined;

  const handleVerDetalle = (id: string, origen: MonitorSalida['origen']) => {
    setSeleccion({ id, origen });
    setShowDetailDialog(true);
  };

  const handleTerminado = useCallback((id: string) => {
    void finalizarConsulta(id);
    setAtendido(id);
    setShowDetailDialog(false);
    setTimeout(() => setAtendido(null), 3000);
  }, [finalizarConsulta]);

  const handleFacturado = useCallback(async (id: string) => {
    try {
      await marcarFacturado(id);
      // El hospedaje sale del monitor dentro del mismo marcado, así que la lista del
      // día hay que recargarla aparte: si no, el cobro recién hecho no se vería.
      await refrescarFacturados();
      setShowDetailDialog(false);
      setAtendido(id);
      setTimeout(() => setAtendido(null), 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo marcar el hospedaje como facturado');
    }
  }, [marcarFacturado, refrescarFacturados]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Monitor de Salida"
        description="Gestione los pacientes listos para facturación y salida"
        icon={ClipboardList}
        badge={
          <div className="flex gap-2">
            <Badge variant="outline" className="px-3 py-1 text-brand-primary border-brand-primary/20">
              <CheckCircle className="w-3 h-3 mr-1" />
              {monitorSalida.filter(m => m.estado === 'listo').length} listos
            </Badge>
          </div>
        }
      />

      <Tabs defaultValue="activos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activos" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pacientes Activos ({monitorSalida.length})
          </TabsTrigger>
          <TabsTrigger value="consultas" className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Consultas del Día ({isLoading ? '...' : procesadosHoy.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activos" className="mt-4">
          {monitorSalida.length === 0 ? (
            <Card className="border-0 shadow-soft">
              <CardContent className="p-12">
                <EmptyState
                  icon={CheckCircle}
                  title="No hay pacientes activos"
                  message="Cuando se guarde una consulta o se registre una salida de hospedaje, aparecerá aquí"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monitorSalida.map(item => (
                <MonitorCard
                  key={`${item.origen}-${item.id}`}
                  item={item}
                  onVerDetalle={handleVerDetalle}
                  atendido={atendido}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="consultas" className="mt-4">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle>Consultas Procesadas Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              {procesadosHoy.length === 0 ? (
                <EmptyState
                  icon={Stethoscope}
                  title="Sin consultas procesadas hoy"
                  message="Al marcar una prefactura como terminada o facturar un hospedaje, aparecerá aquí"
                />
              ) : (
                <div className="space-y-3">
                  {procesadosHoy.map((item) => (
                    <div key={`${item.origen}-${item.id}`} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.origen === 'hospedaje' ? 'bg-gradient-to-br from-cyan-100 to-cyan-200' : 'bg-gradient-to-br from-brand-primary/10 to-brand-primary/20'}`}>
                        {item.origen === 'hospedaje' ? (
                          <TransportCageIcon className="w-5 h-5 text-cyan-700" />
                        ) : (
                          <Stethoscope className="w-5 h-5 text-brand-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{item.motivo}</h4>
                          <Badge className={item.origen === 'hospedaje' ? 'bg-cyan-600 text-white' : 'bg-brand-primary text-white'}>
                            {item.origen === 'hospedaje' ? 'Facturado' : 'Procesada'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          {item.responsable && <> • {item.responsable}</>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${item.total.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.consulta ? `${item.consulta.detalles.length} items` : 'hospedaje'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DetailRecepcionDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        consulta={consultaSeleccionada}
        mascota={itemSeleccionado?.mascota}
        onTerminado={handleTerminado}
        hospedaje={hospedajeSeleccionado}
        onHospedajeFacturado={(id) => void handleFacturado(id)}
      />
    </div>
  );
}