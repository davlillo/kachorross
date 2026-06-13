import { useMemo, useState } from 'react';
import { useConsultas } from '@/hooks/useConsultas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/atoms/ui/tabs';
import { PageHeader } from '@/components/molecules/PageHeader';
import { EmptyState } from '@/components/molecules/EmptyState';
import { MonitorCard } from '@/components/organisms/MonitorCard';
import { DetailRecepcionDialog } from '@/components/organisms/DetailRecepcionDialog';

import { fechaLocalClave, hoyLocalClave } from '@/lib/utils';
import { CheckCircle, ClipboardList, Clock, Stethoscope } from 'lucide-react';

export default function RecepcionPage() {
  const { consultas, monitorSalida, finalizarConsulta, isLoading } = useConsultas();
  const [selectedConsulta, setSelectedConsulta] = useState<string | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [consultaTerminada, setConsultaTerminada] = useState<string | null>(null);

  const hoy = hoyLocalClave();

  const consultasDelDia = useMemo(
    () =>
      consultas
        .filter(c => c.estado === 'finalizado' && c.fecha && fechaLocalClave(c.fecha) === hoy)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
    [consultas, hoy],
  );

  const consultaSeleccionada = consultas.find(c => c.id === selectedConsulta);

  const handleVerDetalle = (consultaId: string) => {
    setSelectedConsulta(consultaId);
    setShowDetailDialog(true);
  };


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
            <Badge variant="outline" className="px-3 py-1 text-amber-600 border-amber-200">
              <Clock className="w-3 h-3 mr-1" />
              {monitorSalida.filter(m => m.estado === 'pagando').length} pagando
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
            Consultas del Día ({isLoading ? '...' : consultasDelDia.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activos" className="mt-4">
          {monitorSalida.length === 0 ? (
            <Card className="border-0 shadow-soft">
              <CardContent className="p-12">
                <EmptyState
                  icon={CheckCircle}
                  title="No hay pacientes activos"
                  message="Cuando la doctora termine una consulta, aparecerá aquí"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monitorSalida.map((item, index) => (
                <MonitorCard
                  key={index}
                  item={item}
                  onVerDetalle={handleVerDetalle}
                  consultaTerminada={consultaTerminada}
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
              {consultasDelDia.length === 0 ? (
                <EmptyState
                  icon={Stethoscope}
                  title="Sin consultas procesadas hoy"
                  message="Al marcar una prefactura como terminada, aparecerá aquí"
                />
              ) : (
                <div className="space-y-3">
                  {consultasDelDia.map((consulta) => (
                    <div key={consulta.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary/10 to-brand-primary/20 flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-brand-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{consulta.motivo}</h4>
                          <Badge className="bg-brand-primary text-white">
                            Procesada
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(consulta.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} • {consulta.doctora}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${consulta.total.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{consulta.detalles.length} items</p>
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
        mascota={monitorSalida.find(m => m.consultaId === selectedConsulta)?.mascota}
        onTerminado={(id) => {
          void finalizarConsulta(id);
          setConsultaTerminada(id);
          setShowDetailDialog(false);
          setTimeout(() => setConsultaTerminada(null), 3000);
        }}
      />
    </div>
  );
}
