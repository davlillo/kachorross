import { useParams, Link } from 'react-router-dom';
import { getExpedienteById, getMascotaById } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Calendar,
  User,
  Phone,
  MapPin,
  Weight,
  AlertCircle,
  Stethoscope,
  Syringe,
  Camera,
  FileText,
  Plus,
  Clock,
  PawPrint
} from 'lucide-react';

export default function ExpedienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const expediente = id ? getExpedienteById(id) : undefined;
  const mascota = id ? getMascotaById(id) : undefined;

  if (!expediente || !mascota) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Expediente no encontrado</h2>
        <p className="text-muted-foreground mb-4">El paciente que buscas no existe en el sistema</p>
        <Link to="/expedientes">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a expedientes
          </Button>
        </Link>
      </div>
    );
  }

  const getEspecieIcon = (especie: string) => {
    const icons: Record<string, string> = {
      perro: '🐕',
      gato: '🐱',
      ave: '🦜',
      conejo: '🐰',
      otro: '🐾'
    };
    return icons[especie] || '🐾';
  };

  const getAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (years > 0) {
      return `${years} año${years > 1 ? 's' : ''}`;
    }
    return `${months} mes${months > 1 ? 'es' : ''}`;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/expedientes">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
              {getEspecieIcon(mascota.especie)}
              {mascota.nombre}
            </h1>
            <p className="text-muted-foreground">
              {mascota.raza} • {getAge(mascota.fechaNacimiento)} • {mascota.sexo === 'macho' ? 'Macho' : 'Hembra'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/consulta/nueva?mascota=${mascota.id}`}>
            <Button className="bg-gradient-to-r from-esmerald-500 to-esmerald-600">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Consulta
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <Card className="border-0 shadow-soft lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-esmerald-500" />
              Información del Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Foto */}
            <div className="flex justify-center">
              <div className="relative">
                <img 
                  src={mascota.foto} 
                  alt={mascota.nombre}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-esmerald-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-esmerald-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Datos básicos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Weight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Peso</span>
                </div>
                <span className="font-semibold">{mascota.peso} kg</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Nacimiento</span>
                </div>
                <span className="font-semibold">
                  {new Date(mascota.fechaNacimiento).toLocaleDateString('es-ES')}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Registro</span>
                </div>
                <span className="font-semibold">
                  {new Date(mascota.fechaRegistro).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>

            <Separator />

            {/* Propietario */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-azure-blue" />
                Propietario
              </h4>
              <div className="space-y-2">
                <p className="font-medium">{mascota.propietario.nombre}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {mascota.propietario.telefono}
                </div>
                {mascota.propietario.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-4 h-4">@</span>
                    {mascota.propietario.email}
                  </div>
                )}
                {mascota.propietario.direccion && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {mascota.propietario.direccion}
                  </div>
                )}
              </div>
            </div>

            {/* Alergias */}
            {mascota.alergias && mascota.alergias.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    Alergias
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {mascota.alergias.map((alergia, idx) => (
                      <Badge key={idx} variant="destructive" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        {alergia}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Notas especiales */}
            {mascota.notasEspeciales && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-violet">
                    <FileText className="w-4 h-4" />
                    Notas Especiales
                  </h4>
                  <p className="text-sm text-muted-foreground bg-violet-50 p-3 rounded-lg">
                    {mascota.notasEspeciales}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tabs Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="historial" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="historial" className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Historial Médico
              </TabsTrigger>
              <TabsTrigger value="vacunas" className="flex items-center gap-2">
                <Syringe className="w-4 h-4" />
                Vacunas
              </TabsTrigger>
              <TabsTrigger value="fotos" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Evolución
              </TabsTrigger>
            </TabsList>

            {/* Historial Médico */}
            <TabsContent value="historial" className="mt-4">
              <Card className="border-0 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Consultas Realizadas</CardTitle>
                </CardHeader>
                <CardContent>
                  {expediente.consultas.length === 0 ? (
                    <div className="text-center py-8">
                      <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No hay consultas registradas</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {expediente.consultas
                        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                        .map((consulta) => (
                        <div 
                          key={consulta.id} 
                          className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{consulta.motivo}</h4>
                                <Badge 
                                  variant={consulta.estado === 'finalizado' ? 'default' : 'secondary'}
                                  className={consulta.estado === 'finalizado' ? 'bg-esmerald-500' : 'bg-amber-gold text-amber-900'}
                                >
                                  {consulta.estado === 'finalizado' ? 'Finalizado' : 'Pendiente'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(consulta.fecha).toLocaleDateString('es-ES', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">${consulta.total.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">{consulta.doctora}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Síntomas</p>
                              <p className="text-sm">{consulta.sintomas}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Diagnóstico</p>
                              <p className="text-sm">{consulta.diagnostico}</p>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Tratamiento</p>
                            <p className="text-sm">{consulta.tratamiento}</p>
                          </div>

                          {consulta.detalles.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Servicios/Productos</p>
                              <div className="flex flex-wrap gap-2">
                                {consulta.detalles.map((detalle) => (
                                  <Badge key={detalle.id} variant="outline" className="text-xs">
                                    {detalle.producto.nombre} x{detalle.cantidad}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vacunas */}
            <TabsContent value="vacunas" className="mt-4">
              <Card className="border-0 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Cartilla de Vacunación</CardTitle>
                </CardHeader>
                <CardContent>
                  {expediente.vacunas.length === 0 ? (
                    <div className="text-center py-8">
                      <Syringe className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No hay vacunas registradas</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {expediente.vacunas.map((vacuna) => (
                        <div 
                          key={vacuna.id} 
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-esmerald-100 flex items-center justify-center">
                              <Syringe className="w-5 h-5 text-esmerald-600" />
                            </div>
                            <div>
                              <p className="font-semibold">{vacuna.nombre}</p>
                              <p className="text-sm text-muted-foreground">Lote: {vacuna.lote}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Aplicada:</span>{' '}
                              {new Date(vacuna.fechaAplicacion).toLocaleDateString('es-ES')}
                            </p>
                            {vacuna.proximaDosis && (
                              <p className="text-sm text-esmerald-600">
                                <span className="text-muted-foreground">Próxima:</span>{' '}
                                {new Date(vacuna.proximaDosis).toLocaleDateString('es-ES')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fotos */}
            <TabsContent value="fotos" className="mt-4">
              <Card className="border-0 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Evolución del Paciente</CardTitle>
                </CardHeader>
                <CardContent>
                  {expediente.fotosEvolucion.length === 0 ? (
                    <div className="text-center py-8">
                      <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No hay fotos de evolución</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {expediente.fotosEvolucion.map((foto) => (
                        <div key={foto.id} className="group relative">
                          <img 
                            src={foto.url} 
                            alt={foto.descripcion}
                            className="w-full aspect-square object-cover rounded-xl"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end p-3">
                            <div className="text-white">
                              <p className="text-sm font-medium">{foto.descripcion}</p>
                              <p className="text-xs opacity-75">
                                {new Date(foto.fecha).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
