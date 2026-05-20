import { useState } from 'react';

import { monitorSalida, consultasPendientes } from '@/data/mockData';
import { useConsultas } from '@/hooks/useConsultas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/atoms/ui/tabs';
import { PageHeader } from '@/components/molecules/PageHeader';
import { EmptyState } from '@/components/molecules/EmptyState';
import { MonitorCard } from '@/components/organisms/MonitorCard';
import { DetailRecepcionDialog } from '@/components/organisms/DetailRecepcionDialog';

import {
  ClipboardList,
  CheckCircle,
  Clock,
  Stethoscope,
} from 'lucide-react';

export default function RecepcionPage() {
  const { finalizarConsulta } = useConsultas();
  const [selectedConsulta, setSelectedConsulta] = useState<string | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [consultaTerminada, setConsultaTerminada] = useState<string | null>(null);

  const consultaSeleccionada = consultasPendientes.find(c => c.id === selectedConsulta);

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
            <Badge variant="outline" className="px-3 py-1 text-purpura-600 border-purpura-200">
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
            Consultas del Día ({consultasPendientes.length})
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
              <CardTitle>Consultas Pendientes de Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {consultasPendientes.map((consulta) => (
                  <div key={consulta.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purpura-100 to-purpura-200 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-purpura-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{consulta.motivo}</h4>
                        <Badge variant="secondary" className="bg-amber-gold text-amber-900">
                          Pendiente
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DetailRecepcionDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        consulta={consultaSeleccionada}
        onTerminado={(id) => {
          finalizarConsulta(id);
          setConsultaTerminada(id);
          setShowDetailDialog(false);
          setTimeout(() => setConsultaTerminada(null), 3000);
        }}
      />
    </div>
  );
}
