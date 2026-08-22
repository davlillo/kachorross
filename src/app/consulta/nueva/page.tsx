import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MascotaController } from '@/controllers/mascota.controller';
import { useConsultasMutations } from '@/hooks/useConsultas';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Textarea } from '@/components/atoms/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/ui/dialog';
import { PageHeader } from '@/components/molecules/PageHeader';
import { TratamientoHoja } from '@/components/molecules';
import { ProductSelectorDialog } from '@/components/organisms/ProductSelectorDialog';
import { Badge } from '@/components/atoms/ui/badge';
import { TIPOS_SEGUIMIENTO } from '@/lib/tipoSeguimiento';

import { todayLocal } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Stethoscope,
  Search,
  Calendar,
  PawPrint,
  User,
  Save,
  Plus,
  CheckCircle,
  X,
  Loader2,
} from 'lucide-react';
import type { DetalleConsulta, Producto, TipoSeguimiento } from '@/types';

export default function NuevaConsultaPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mascotaCtrl = MascotaController.getInstance();
  const { crearConsulta, calcularTotal } = useConsultasMutations();
  const [mascotas, setMascotas] = useState<any[]>([]);
  
  const mascotaId = searchParams.get('mascota');
  const mascotaSeleccionada = useMemo(
    () => (mascotaId ? mascotas.find(m => m.id === mascotaId) : undefined),
    [mascotas, mascotaId]
  );

  const [mascotaSearch, setMascotaSearch] = useState('');
  const [selectedMascota, setSelectedMascota] = useState(mascotaSeleccionada);
  const [showMascotaDialog, setShowMascotaDialog] = useState(!mascotaSeleccionada);

  const [motivo, setMotivo] = useState('');
  const [sintomas, setSintomas] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [notas, setNotas] = useState('');
  const [proximaCita, setProximaCita] = useState('');
  const [tipoSeguimiento, setTipoSeguimiento] = useState<TipoSeguimiento>('control');
  const [detalles, setDetalles] = useState<DetalleConsulta[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await mascotaCtrl.getAll();
      setMascotas(data);
    };
    void load();
  }, [mascotaCtrl]);

  useEffect(() => {
    if (mascotaSeleccionada) setSelectedMascota(mascotaSeleccionada);
  }, [mascotaSeleccionada]);

  const mascotasFiltradas = mascotaSearch 
    ? mascotas.filter(m => 
        m.nombre.toLowerCase().includes(mascotaSearch.toLowerCase()) ||
        m.propietario.nombre.toLowerCase().includes(mascotaSearch.toLowerCase())
      )
    : mascotas;

  const addProducto = (producto: Producto) => {
    const existingIndex = detalles.findIndex(d => d.productoId === producto.id);
    
    if (existingIndex >= 0) {
      const updated = [...detalles];
      updated[existingIndex].cantidad += 1;
      updated[existingIndex].subtotal = updated[existingIndex].cantidad * updated[existingIndex].precioAplicado;
      setDetalles(updated);
    } else {
      const nuevoDetalle: DetalleConsulta = {
        id: `d${Date.now()}`,
        consultaId: '',
        productoId: producto.id,
        producto: producto,
        cantidad: 1,
        precioAplicado: producto.precio,
        subtotal: producto.precio
      };
      setDetalles([...detalles, nuevoDetalle]);
    }
  };

  const removeDetalle = (id: string) => {
    setDetalles(detalles.filter(d => d.id !== id));
  };

  const updateCantidad = (id: string, cantidad: number) => {
    if (cantidad < 1) return;
    setDetalles(detalles.map(d => 
      d.id === id ? { ...d, cantidad, subtotal: cantidad * d.precioAplicado } : d
    ));
  };

  const total = calcularTotal(detalles);

  const handleSubmit = async () => {
    if (isSaving) return;
    if (!selectedMascota || !motivo || !diagnostico) return;

    setIsSaving(true);
    try {
      await crearConsulta({
        mascotaId: selectedMascota.id,
        motivo,
        sintomas,
        diagnostico,
        tratamiento,
        notas,
        proximaCita: proximaCita || undefined,
        tipoSeguimiento: proximaCita ? tipoSeguimiento : undefined,
        detalles,
        total,
      });
      navigate('/recepcion');
    } catch (err) {
      setIsSaving(false);
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la consulta');
    }
  };

  const isValid = selectedMascota && motivo && diagnostico;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Nueva Consulta"
        description="Registre la atención médica del paciente"
        icon={Stethoscope}
        backHref="/dashboard"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-brand-primary" />
                Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMascota ? (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <img 
                    src={selectedMascota.foto} 
                    alt={selectedMascota.nombre}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{selectedMascota.nombre}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedMascota.raza} • {selectedMascota.especie} • {selectedMascota.peso}kg
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedMascota.propietario.nombre}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{selectedMascota.propietario.telefono}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowMascotaDialog(true)}
                  >
                    Cambiar
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => setShowMascotaDialog(true)}
                  className="w-full h-20 border-dashed border-2 border-muted hover:border-brand-primary/30 hover:bg-brand-primary/5"
                  variant="outline"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Seleccionar Paciente
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-brand-primary" />
                Información Clínica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="motivo">Motivo de Consulta *</Label>
                <Input
                  id="motivo"
                  placeholder="Ej: Vacunación anual, vómitos, control..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sintomas">Síntomas Observados</Label>
                <Textarea
                  id="sintomas"
                  placeholder="Describa los síntomas que presenta el paciente..."
                  value={sintomas}
                  onChange={(e) => setSintomas(e.target.value)}
                  className="mt-1 min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="diagnostico">Diagnóstico *</Label>
                <Textarea
                  id="diagnostico"
                  placeholder="Ingrese el diagnóstico médico..."
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  className="mt-1 min-h-[80px]"
                />
              </div>

              <TratamientoHoja value={tratamiento} onChange={setTratamiento} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-stretch">
                <div className="flex flex-col">
                  <Label htmlFor="notas" className="min-h-5 flex items-center">
                    Notas Adicionales
                  </Label>
                  <Textarea
                    id="notas"
                    placeholder="Notas internas, recomendaciones, etc..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="mt-1 min-h-[120px] flex-1 resize-none md:min-h-0"
                  />
                </div>

                <div className="flex flex-col">
                  <Label className="min-h-5 flex items-center gap-2 text-brand-primary">
                    <Calendar className="w-4 h-4 shrink-0 text-brand-primary" />
                    Próximo seguimiento
                    <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                  </Label>
                  <div className="mt-1 flex min-h-[120px] flex-1 flex-col rounded-xl border border-brand-primary/10 bg-brand-primary/5 p-4 md:min-h-0">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="proximaCita" className="text-[11px] text-muted-foreground">
                          Fecha
                        </Label>
                        <Input
                          id="proximaCita"
                          type="date"
                          value={proximaCita}
                          onChange={(e) => setProximaCita(e.target.value)}
                          className="mt-0.5 h-10 bg-white"
                          min={todayLocal()}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tipoSeguimiento" className="text-[11px] text-muted-foreground">
                          Tipo de seguimiento
                        </Label>
                        <select
                          id="tipoSeguimiento"
                          className="mt-0.5 flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm disabled:opacity-50"
                          value={tipoSeguimiento}
                          onChange={(e) => setTipoSeguimiento(e.target.value as TipoSeguimiento)}
                          disabled={!proximaCita}
                        >
                          {TIPOS_SEGUIMIENTO.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                      {proximaCita && (
                        <p className="text-[11px] text-muted-foreground">
                          El paciente puede acudir en cualquier horario del día.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Servicios y Productos</span>
                <Button
                  size="sm"
                  className="bg-brand-primary hover:bg-brand-primary"
                  onClick={() => setShowProductDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detalles.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setShowProductDialog(true)}
                  className="w-full text-center py-8 text-muted-foreground rounded-lg border-2 border-dashed border-muted hover:border-brand-primary/30 hover:bg-brand-primary/5 hover:text-brand-primary transition-colors cursor-pointer"
                >
                  <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Agregue servicios o productos</p>
                </button>
              ) : (
                <div className="space-y-3">
                  {detalles.map((detalle) => (
                    <div key={detalle.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] font-mono font-bold shrink-0">
                            {detalle.producto.codigo}
                          </Badge>
                          <p className="font-medium text-sm truncate">{detalle.producto.nombre}</p>
                        </div>
                        {detalle.producto.descripcion && detalle.producto.descripcion !== detalle.producto.nombre && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{detalle.producto.descripcion}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">${detalle.precioAplicado.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateCantidad(detalle.id, detalle.cantidad - 1)}
                          className="w-6 h-6 rounded-full bg-background border flex items-center justify-center hover:bg-muted"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{detalle.cantidad}</span>
                        <button 
                          onClick={() => updateCantidad(detalle.id, detalle.cantidad + 1)}
                          className="w-6 h-6 rounded-full bg-background border flex items-center justify-center hover:bg-muted"
                        >
                          +
                        </button>
                      </div>
                      <p className="font-semibold w-16 text-right">${detalle.subtotal.toFixed(2)}</p>
                      <button 
                        onClick={() => removeDetalle(detalle.id)}
                        className="text-destructive hover:bg-destructive/10 p-1 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-4 border-t pt-4">
              <div className="w-full flex items-center justify-between text-lg">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-2xl text-brand-primary">${total.toFixed(2)}</span>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || isSaving}
                className="w-full h-12 bg-gradient-to-r from-brand-primary to-brand-primary hover:from-brand-primary hover:to-brand-primary text-white font-semibold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Guardar Consulta
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <ProductSelectorDialog
        open={showProductDialog}
        onOpenChange={setShowProductDialog}
        onSelect={addProducto}
      />

      <Dialog open={showMascotaDialog} onOpenChange={setShowMascotaDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Seleccionar Paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o propietario..."
                value={mascotaSearch}
                onChange={(e) => setMascotaSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="overflow-y-auto max-h-[400px] space-y-2">
              {mascotasFiltradas.map((mascota) => (
                <button
                  key={mascota.id}
                  onClick={() => {
                    setSelectedMascota(mascota);
                    setShowMascotaDialog(false);
                  }}
                  className="w-full flex items-center gap-4 p-3 rounded-lg border hover:bg-muted transition-colors text-left"
                >
                  <img 
                    src={mascota.foto} 
                    alt={mascota.nombre}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{mascota.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {mascota.raza} • {mascota.propietario.nombre}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
