import { useState } from 'react';

import { monitorSalida, consultasPendientes, mascotas } from '@/data/mockData';
import { useConsultas } from '@/hooks/useConsultas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ClipboardList,
  CheckCircle,
  Clock,
  User,
  PawPrint,
  Phone,
  Stethoscope
} from 'lucide-react';

export default function RecepcionPage() {
  const { finalizarConsulta } = useConsultas();
  const [selectedConsulta, setSelectedConsulta] = useState<string | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [consultaTerminada, setConsultaTerminada] = useState<string | null>(null);

  const consultaSeleccionada = consultasPendientes.find(c => c.id === selectedConsulta);

  const handleVerDetalle = (consultaId: string) => {
    setSelectedConsulta(consultaId);
    setShowDetailDialog(true);
  };

  const handleMarcarTerminado = (consultaId: string) => {
    setSelectedConsulta(consultaId);
    setShowConfirmDialog(true);
  };

  const confirmarTerminado = () => {
    if (selectedConsulta) {
      finalizarConsulta(selectedConsulta);
      setConsultaTerminada(selectedConsulta);
      setShowConfirmDialog(false);
      setTimeout(() => {
        setConsultaTerminada(null);
      }, 3000);
    }
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      listo: 'bg-esmerald-500',
      pagando: 'bg-amber-gold text-amber-900',
      entregado: 'bg-gray-400'
    };
    return colors[estado] || 'bg-gray-400';
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      listo: 'Listo para pago',
      pagando: 'En proceso de pago',
      entregado: 'Entregado'
    };
    return labels[estado] || estado;
  };

  const tiempoTranscurrido = (hora: string) => {
    const diff = Date.now() - new Date(hora).getTime();
    const minutos = Math.floor(diff / 60000);
    if (minutos < 1) return 'Justo ahora';
    if (minutos === 1) return 'Hace 1 minuto';
    if (minutos < 60) return `Hace ${minutos} minutos`;
    const horas = Math.floor(minutos / 60);
    return `Hace ${horas}h ${minutos % 60}m`;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-azure-blue" />
            Monitor de Salida
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestione los pacientes listos para facturación y salida
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1 text-esmerald-600 border-esmerald-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {monitorSalida.filter(m => m.estado === 'listo').length} listos
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-amber-600 border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            {monitorSalida.filter(m => m.estado === 'pagando').length} pagando
          </Badge>
        </div>
      </div>

      {/* Tabs */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monitorSalida.map((item, index) => (
              <Card 
                key={index} 
                className={`border-0 shadow-soft hover:shadow-lg transition-all ${
                  consultaTerminada === item.consultaId ? 'opacity-50' : ''
                }`}
              >
                <CardContent className="p-5">
                  {/* Header de la card */}
                  <div className="flex items-start justify-between mb-4">
                    <Badge className={getEstadoColor(item.estado)}>
                      {getEstadoLabel(item.estado)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {tiempoTranscurrido(item.horaTermino)}
                    </span>
                  </div>

                  {/* Info del paciente */}
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

                  {/* Info del propietario */}
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

                  {/* Total */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-muted-foreground">Total a pagar:</span>
                    <span className="text-2xl font-bold text-esmerald-600">${item.total.toFixed(2)}</span>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleVerDetalle(item.consultaId)}
                    >
                      Ver Detalle
                    </Button>
                    {item.estado !== 'entregado' && (
                      <Button 
                        className="flex-1 bg-gradient-to-r from-esmerald-500 to-esmerald-600 hover:from-esmerald-600 hover:to-esmerald-700"
                        onClick={() => handleMarcarTerminado(item.consultaId)}
                        disabled={consultaTerminada === item.consultaId}
                      >
                        {consultaTerminada === item.consultaId ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Terminado
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Terminado
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {monitorSalida.length === 0 && (
            <Card className="border-0 shadow-soft">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No hay pacientes activos</h3>
                <p className="text-muted-foreground">
                  Cuando la doctora termine una consulta, aparecerá aquí
                </p>
              </CardContent>
            </Card>
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
                  <div 
                    key={consulta.id} 
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-esmerald-100 to-esmerald-200 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-esmerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{consulta.motivo}</h4>
                        <Badge variant="secondary" className="bg-amber-gold text-amber-900">
                          Pendiente
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(consulta.fecha).toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} • {consulta.doctora}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${consulta.total.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {consulta.detalles.length} items
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de detalle */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-esmerald-500" />
              Detalle de Receta-Factura
            </DialogTitle>
          </DialogHeader>
          {consultaSeleccionada && (
            <div className="space-y-4">
              {/* Info paciente */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <PawPrint className="w-5 h-5 text-esmerald-500" />
                <div>
                  <p className="font-semibold">
                    {mascotas.find(m => m.id === consultaSeleccionada.mascotaId)?.nombre}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(consultaSeleccionada.fecha).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <p className="font-medium text-sm text-muted-foreground">Servicios y Productos:</p>
                {consultaSeleccionada.detalles.map((detalle) => (
                  <div key={detalle.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{detalle.producto.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        ${detalle.precioAplicado.toFixed(2)} x {detalle.cantidad}
                      </p>
                    </div>
                    <p className="font-semibold">${detalle.subtotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-lg font-medium">Total:</span>
                <span className="text-2xl font-bold text-esmerald-600">
                  ${consultaSeleccionada.total.toFixed(2)}
                </span>
              </div>

              {/* Nota */}
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Nota:</strong> El pago se procesa externamente. Este es solo un desglose de cargos.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">¿Confirmar salida?</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-esmerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-esmerald-600" />
            </div>
            <p className="text-muted-foreground">
              Esta acción marcará la consulta como finalizada y el paciente saldrá de la lista activa.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={confirmarTerminado}
              className="flex-1 bg-gradient-to-r from-esmerald-500 to-esmerald-600"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
