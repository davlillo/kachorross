import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { mascotas, catalogo } from '@/data/mockData';
import { useConsultas } from '@/hooks/useConsultas';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Stethoscope,
  Search,
  Calendar,
  PawPrint,
  User,
  Save,
  CheckCircle,
  X
} from 'lucide-react';
import type { DetalleConsulta, Producto } from '@/types';

export default function NuevaConsultaPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { crearConsulta, calcularTotal } = useConsultas();
  
  const mascotaId = searchParams.get('mascota');
  const mascotaSeleccionada = mascotaId ? mascotas.find(m => m.id === mascotaId) : undefined;

  const [mascotaSearch, setMascotaSearch] = useState('');
  const [selectedMascota, setSelectedMascota] = useState(mascotaSeleccionada);
  const [showMascotaDialog, setShowMascotaDialog] = useState(!mascotaSeleccionada);

  const [motivo, setMotivo] = useState('');
  const [sintomas, setSintomas] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [notas, setNotas] = useState('');
  const [proximaCita, setProximaCita] = useState('');
  const [detalles, setDetalles] = useState<DetalleConsulta[]>([]);
  
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todos');

  const mascotasFiltradas = mascotaSearch 
    ? mascotas.filter(m => 
        m.nombre.toLowerCase().includes(mascotaSearch.toLowerCase()) ||
        m.propietario.nombre.toLowerCase().includes(mascotaSearch.toLowerCase())
      )
    : mascotas;

  const productosFiltrados = catalogo.filter(p => {
    const matchCategoria = selectedCategoria === 'todos' || p.categoria === selectedCategoria;
    const matchSearch = !productSearch || 
      p.nombre.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.codigo.toLowerCase().includes(productSearch.toLowerCase());
    return matchCategoria && matchSearch && p.activo;
  });

  const categorias = [
    { value: 'todos', label: 'Todos' },
    { value: 'servicio', label: 'Servicios' },
    { value: 'vacuna', label: 'Vacunas' },
    { value: 'medicamento', label: 'Medicamentos' },
    { value: 'petshop', label: 'PetShop' },
    { value: 'laboratorio', label: 'Laboratorio' },
  ];

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      servicio: 'bg-blue-100 text-blue-700',
      vacuna: 'bg-purpura-100 text-purpura-700',
      medicamento: 'bg-amber-100 text-amber-700',
      petshop: 'bg-pink-100 text-pink-700',
      laboratorio: 'bg-violet-100 text-violet-700',
    };
    return colors[categoria] || 'bg-gray-100 text-gray-700';
  };

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
    setShowProductDialog(false);
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

  const handleSubmit = () => {
    if (!selectedMascota || !motivo || !diagnostico) return;

    crearConsulta({
      mascotaId: selectedMascota.id,
      motivo,
      sintomas,
      diagnostico,
      tratamiento,
      notas,
      proximaCita: proximaCita || undefined,
      detalles,
      total
    });

    navigate('/recepcion');
  };

  const isValid = selectedMascota && motivo && diagnostico;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
              <Stethoscope className="w-7 h-7 text-purpura-500" />
              Nueva Consulta
            </h1>
            <p className="text-muted-foreground">
              Registre la atención médica del paciente
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selección de Paciente */}
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-purpura-500" />
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
                  className="w-full h-20 border-dashed border-2 border-muted hover:border-purpura-300 hover:bg-purpura-50"
                  variant="outline"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Seleccionar Paciente
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Datos de la Consulta */}
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-purpura-500" />
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

              <div>
                <Label htmlFor="tratamiento">Tratamiento</Label>
                <Textarea
                  id="tratamiento"
                  placeholder="Describa el tratamiento indicado..."
                  value={tratamiento}
                  onChange={(e) => setTratamiento(e.target.value)}
                  className="mt-1 min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="notas">Notas Adicionales</Label>
                <Textarea
                  id="notas"
                  placeholder="Notas internas, recomendaciones, etc..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="mt-1 min-h-[60px]"
                />
              </div>

              <div>
                <Label htmlFor="proximaCita" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Próxima Cita (opcional)
                </Label>
                <Input
                  id="proximaCita"
                  type="date"
                  value={proximaCita}
                  onChange={(e) => setProximaCita(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de Servicios y Total */}
        <div className="space-y-6">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Servicios y Productos</span>
                <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-purpura-500 hover:bg-purpura-600">
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Agregar Servicio o Producto</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar producto..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="overflow-y-auto max-h-[400px] space-y-2">
                        {productosFiltrados.map((producto) => (
                          <button
                            key={producto.id}
                            onClick={() => addProducto(producto)}
                            className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors text-left"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{producto.nombre}</span>
                                <Badge className={getCategoriaColor(producto.categoria)}>
                                  {producto.categoria}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{producto.descripcion}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">${producto.precio.toFixed(2)}</p>
                              <Plus className="w-4 h-4 text-purpura-500 ml-auto" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detalles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Agregue servicios o productos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {detalles.map((detalle) => (
                    <div key={detalle.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{detalle.producto.nombre}</p>
                        <p className="text-xs text-muted-foreground">${detalle.precioAplicado.toFixed(2)} c/u</p>
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
                <span className="font-bold text-2xl text-purpura-600">${total.toFixed(2)}</span>
              </div>
              <Button 
                onClick={handleSubmit}
                disabled={!isValid}
                className="w-full h-12 bg-gradient-to-r from-purpura-500 to-purpura-600 hover:from-purpura-600 hover:to-purpura-700 text-white font-semibold"
              >
                <Save className="w-5 h-5 mr-2" />
                Guardar Consulta
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Dialog de selección de mascota */}
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

