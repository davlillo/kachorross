import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MascotaController } from '@/controllers/mascota.controller';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Badge } from '@/components/atoms/ui/badge';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Textarea } from '@/components/atoms/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/atoms/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/atoms/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/atoms/ui/select';
import { PatientInfoCard } from '@/components/organisms/PatientInfoCard';
import { EmptyState } from '@/components/molecules/EmptyState';
import {
  Stethoscope, Syringe, Camera, FileText, Plus, ArrowLeft,
  Pencil, Trash2, AlertTriangle, Filter, X, CalendarDays,
} from 'lucide-react';
import type { Mascota } from '@/types';

const especies: { value: Mascota['especie']; label: string }[] = [
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'ave', label: 'Ave' },
  { value: 'conejo', label: 'Conejo' },
  { value: 'otro', label: 'Otro' },
];

export default function ExpedienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const ctrl = MascotaController.getInstance();
  const evolucionInputRef = useRef<HTMLInputElement>(null);

  // ── Datos reactivos desde el controller ─────────────────────────────────────
  const [refresh, setRefresh] = useState(0);
  const [expediente, setExpediente] = useState<any | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const mascota    = expediente?.mascota;

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await ctrl.getExpedienteById(id);
        setExpediente(data);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'No se pudo cargar el expediente');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [id, ctrl, refresh]);

  // ── Filtros de fecha ─────────────────────────────────────────────────────────
  const [consultaDesde, setConsultaDesde] = useState('');
  const [consultaHasta, setConsultaHasta] = useState('');
  const [vacunaDesde,   setVacunaDesde]   = useState('');
  const [vacunaHasta,   setVacunaHasta]   = useState('');

  // ── Diálogos ─────────────────────────────────────────────────────────────────
  const [editOpen,   setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [fotoOpen, setFotoOpen] = useState(false);
  const [fotoModo, setFotoModo] = useState<'perfil' | 'evolucion'>('evolucion');

  // ── Subida de fotos ────────────────────────────────────────────────────────────
  const [fotoPendiente, setFotoPendiente] = useState<File | null>(null);
  const [fotoDescripcion, setFotoDescripcion] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoError, setFotoError] = useState<string | null>(null);

  const puedeSubirEvolucion = user?.rol === 'doctora' || user?.rol === 'admin';

  // ── Estado form edición ──────────────────────────────────────────────────────
  const [editNombre,    setEditNombre]    = useState('');
  const [editEspecie,   setEditEspecie]   = useState<Mascota['especie']>('perro');
  const [editRaza,      setEditRaza]      = useState('');
  const [editFechaNac,  setEditFechaNac]  = useState('');
  const [editSexo,      setEditSexo]      = useState<Mascota['sexo']>('macho');
  const [editColor,     setEditColor]     = useState('');
  const [editPeso,      setEditPeso]      = useState('');
  const [editAlergias,  setEditAlergias]  = useState('');
  const [editNotas,     setEditNotas]     = useState('');
  const [editPropNom,   setEditPropNom]   = useState('');
  const [editPropTel,   setEditPropTel]   = useState('');
  const [editPropEmail, setEditPropEmail] = useState('');
  const [editPropDir,   setEditPropDir]   = useState('');

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getEspecieIcon = (especie: string) =>
    ({ perro: '🐕', gato: '🐱', ave: '🦜', conejo: '🐰', otro: '🐾' }[especie] ?? '🐾');

  const getAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    if (years > 0) return `${years} año${years > 1 ? 's' : ''}`;
    return `${months} mes${months > 1 ? 'es' : ''}`;
  };

  // ── Consultas filtradas ───────────────────────────────────────────────────────
  const consultasFiltradas = useMemo(() => {
    if (!expediente) return [];
    return expediente.consultas
      .filter(c => {
        const fecha = new Date(c.fecha);
        if (consultaDesde && fecha < new Date(consultaDesde)) return false;
        if (consultaHasta && fecha > new Date(consultaHasta + 'T23:59:59')) return false;
        return true;
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [expediente, consultaDesde, consultaHasta, refresh]);

  // ── Vacunas filtradas ─────────────────────────────────────────────────────────
  const vacunasFiltradas = useMemo(() => {
    if (!expediente) return [];
    return expediente.vacunas.filter(v => {
      const fecha = new Date(v.fechaAplicacion);
      if (vacunaDesde && fecha < new Date(vacunaDesde)) return false;
      if (vacunaHasta && fecha > new Date(vacunaHasta + 'T23:59:59')) return false;
      return true;
    });
  }, [expediente, vacunaDesde, vacunaHasta, refresh]);

  // ── Abrir diálogo edición con datos actuales ──────────────────────────────────
  const abrirEdicion = () => {
    if (!mascota) return;
    setEditNombre(mascota.nombre);
    setEditEspecie(mascota.especie);
    setEditRaza(mascota.raza);
    setEditFechaNac(mascota.fechaNacimiento);
    setEditSexo(mascota.sexo);
    setEditColor(mascota.color ?? '');
    setEditPeso(mascota.peso ? String(mascota.peso) : '');
    setEditAlergias((mascota.alergias ?? []).join(', '));
    setEditNotas(mascota.notasEspeciales ?? '');
    setEditPropNom(mascota.propietario.nombre);
    setEditPropTel(mascota.propietario.telefono);
    setEditPropEmail(mascota.propietario.email ?? '');
    setEditPropDir(mascota.propietario.direccion ?? '');
    setEditOpen(true);
  };

  // ── Guardar edición ──────────────────────────────────────────────────────────
  const guardarEdicion = async () => {
    if (!id) return;
    await ctrl.actualizar(id, {
      mascota: {
        nombre: editNombre.trim(),
        especie: editEspecie,
        raza: editRaza.trim(),
        fechaNacimiento: editFechaNac,
        sexo: editSexo,
        color: editColor.trim(),
        peso: editPeso ? parseFloat(editPeso) : undefined,
        alergias: editAlergias ? editAlergias.split(',').map(a => a.trim()).filter(Boolean) : [],
        notasEspeciales: editNotas.trim() || undefined,
      },
      propietario: {
        nombre: editPropNom.trim(),
        telefono: editPropTel.trim(),
        email: editPropEmail.trim() || undefined,
        direccion: editPropDir.trim() || undefined,
      },
    });
    setEditOpen(false);
    setRefresh(r => r + 1);
  };

  // ── Confirmar eliminación ────────────────────────────────────────────────────
  const confirmarEliminar = async () => {
    if (!id) return;
    await ctrl.eliminar(id);
    setDeleteOpen(false);
    navigate('/expedientes');
  };

  const abrirDialogoFoto = (file: File, modo: 'perfil' | 'evolucion') => {
    setFotoModo(modo);
    setFotoPendiente(file);
    setFotoDescripcion('');
    setFotoError(null);
    setFotoOpen(true);
  };

  const seleccionarFotoPerfil = (file: File) => abrirDialogoFoto(file, 'perfil');
  const seleccionarFotoEvolucion = (file: File) => abrirDialogoFoto(file, 'evolucion');

  const confirmarSubirFoto = async () => {
    if (!mascota?.id || !fotoPendiente) return;
    try {
      setSubiendoFoto(true);
      setFotoError(null);
      if (fotoModo === 'perfil') {
        await ctrl.subirFotoPerfil(mascota.id, fotoPendiente);
      } else {
        await ctrl.subirFotoEvolucion(mascota.id, fotoPendiente, fotoDescripcion.trim() || undefined);
      }
      setFotoOpen(false);
      setFotoPendiente(null);
      setFotoDescripcion('');
      setRefresh(r => r + 1);
    } catch (error) {
      setFotoError(error instanceof Error ? error.message : 'No se pudo subir la foto');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleEvolucionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) seleccionarFotoEvolucion(file);
    e.target.value = '';
  };

  // ── Not found ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando expediente...</p>
      </div>
    );
  }

  if (loadError || !expediente || !mascota) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Expediente no encontrado</h2>
        <p className="text-muted-foreground mb-4">El paciente que buscas no existe en el sistema</p>
        <Link to="/expedientes">
          <Button><ArrowLeft className="w-4 h-4 mr-2" />Volver a expedientes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/expedientes">
            <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
              {getEspecieIcon(mascota.especie)} {mascota.nombre}
            </h1>
            <p className="text-muted-foreground">
              {mascota.raza} • {getAge(mascota.fechaNacimiento)} • {mascota.sexo === 'macho' ? 'Macho' : 'Hembra'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={abrirEdicion} className="border-purpura-200 text-purpura-600 hover:bg-purpura-50">
            <Pencil className="w-4 h-4 mr-2" />Editar
          </Button>
          <Button variant="outline" onClick={() => setDeleteOpen(true)} className="border-red-200 text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4 mr-2" />Eliminar
          </Button>
          <Link to={`/consulta/nueva?mascota=${mascota.id}`}>
            <Button className="bg-gradient-to-r from-purpura-500 to-purpura-600 hover:from-purpura-600 hover:to-purpura-700">
              <Plus className="w-4 h-4 mr-2" />Nueva Consulta
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PatientInfoCard
          mascota={mascota}
          key={refresh}
          onSubirFotoPerfil={seleccionarFotoPerfil}
          subiendoFotoPerfil={subiendoFoto && fotoModo === 'perfil'}
        />

        <div className="lg:col-span-2">
          <Tabs defaultValue="historial" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="historial" className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />Historial Médico
              </TabsTrigger>
              <TabsTrigger value="vacunas" className="flex items-center gap-2">
                <Syringe className="w-4 h-4" />Vacunas
              </TabsTrigger>
              <TabsTrigger value="fotos" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />Evolución
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Historial ── */}
            <TabsContent value="historial" className="mt-4">
              <Card className="border-0 shadow-soft">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="text-lg">
                      Consultas Realizadas
                      <Badge variant="outline" className="ml-2 text-xs font-normal">{consultasFiltradas.length}</Badge>
                    </CardTitle>
                    {/* Filtro fechas */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                      <Input type="date" value={consultaDesde} onChange={e => setConsultaDesde(e.target.value)}
                        className="h-8 text-xs w-36" />
                      <span className="text-xs text-muted-foreground">–</span>
                      <Input type="date" value={consultaHasta} onChange={e => setConsultaHasta(e.target.value)}
                        className="h-8 text-xs w-36" />
                      {(consultaDesde || consultaHasta) && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
                          onClick={() => { setConsultaDesde(''); setConsultaHasta(''); }}>
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {consultasFiltradas.length === 0 ? (
                    <EmptyState icon={consultaDesde || consultaHasta ? Filter : Stethoscope}
                      message={consultaDesde || consultaHasta ? 'Sin consultas en ese rango de fechas' : 'No hay consultas registradas'} />
                  ) : (
                    <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                      {consultasFiltradas.map(consulta => (
                        <div key={consulta.id} className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold">{consulta.motivo}</h4>
                                <Badge
                                  variant={consulta.estado === 'finalizado' ? 'default' : 'secondary'}
                                  className={consulta.estado === 'finalizado' ? 'bg-purpura-500' : 'bg-amber-gold text-amber-900'}
                                >
                                  {consulta.estado === 'finalizado' ? 'Finalizado' : 'Pendiente'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(consulta.fecha).toLocaleDateString('es-ES', {
                                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
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
                                {consulta.detalles.map(d => (
                                  <Badge key={d.id} variant="outline" className="text-xs">
                                    {d.producto.nombre} x{d.cantidad}
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

            {/* ── Tab: Vacunas ── */}
            <TabsContent value="vacunas" className="mt-4">
              <Card className="border-0 shadow-soft">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="text-lg">
                      Cartilla de Vacunación
                      <Badge variant="outline" className="ml-2 text-xs font-normal">{vacunasFiltradas.length}</Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                      <Input type="date" value={vacunaDesde} onChange={e => setVacunaDesde(e.target.value)}
                        className="h-8 text-xs w-36" />
                      <span className="text-xs text-muted-foreground">–</span>
                      <Input type="date" value={vacunaHasta} onChange={e => setVacunaHasta(e.target.value)}
                        className="h-8 text-xs w-36" />
                      {(vacunaDesde || vacunaHasta) && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
                          onClick={() => { setVacunaDesde(''); setVacunaHasta(''); }}>
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {vacunasFiltradas.length === 0 ? (
                    <EmptyState icon={vacunaDesde || vacunaHasta ? Filter : Syringe}
                      message={vacunaDesde || vacunaHasta ? 'Sin vacunas en ese rango de fechas' : 'No hay vacunas registradas'} />
                  ) : (
                    <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                      {vacunasFiltradas.map(vacuna => (
                        <div key={vacuna.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-purpura-100 flex items-center justify-center shrink-0">
                              <Syringe className="w-5 h-5 text-purpura-600" />
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
                              <p className="text-sm text-purpura-600">
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

            {/* ── Tab: Fotos ── */}
            <TabsContent value="fotos" className="mt-4">
              <Card className="border-0 shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-lg">Evolución del Paciente</CardTitle>
                    {puedeSubirEvolucion && (
                      <>
                        <input
                          ref={evolucionInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleEvolucionFileChange}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-purpura-200 text-purpura-600 hover:bg-purpura-50"
                          disabled={subiendoFoto}
                          onClick={() => evolucionInputRef.current?.click()}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar foto
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {expediente.fotosEvolucion.length === 0 ? (
                    <EmptyState icon={Camera} message="No hay fotos de evolución" />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[440px] overflow-y-auto pr-1">
                      {expediente.fotosEvolucion.map(foto => (
                        <div key={foto.id} className="group relative">
                          <img src={foto.url} alt={foto.descripcion} className="w-full aspect-square object-cover rounded-xl" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end p-3">
                            <div className="text-white">
                              <p className="text-sm font-medium">{foto.descripcion}</p>
                              <p className="text-xs opacity-75">{new Date(foto.fecha).toLocaleDateString('es-ES')}</p>
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

      {/* ── Dialog: Editar Paciente ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-purpura-500" />
              Editar Paciente — {mascota.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            {/* Sección propietario */}
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <span className="w-5 h-px bg-muted-foreground/30" />Datos del Propietario
              </p>
            </div>
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input value={editPropNom} onChange={e => setEditPropNom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Teléfono *</Label>
              <Input value={editPropTel} onChange={e => setEditPropTel(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Correo</Label>
              <Input type="email" value={editPropEmail} onChange={e => setEditPropEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Dirección</Label>
              <Input value={editPropDir} onChange={e => setEditPropDir(e.target.value)} />
            </div>

            {/* Sección mascota */}
            <div className="sm:col-span-2 pt-2">
              <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <span className="w-5 h-px bg-muted-foreground/30" />Datos de la Mascota
              </p>
            </div>
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input value={editNombre} onChange={e => setEditNombre(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Especie</Label>
              <Select value={editEspecie} onValueChange={v => setEditEspecie(v as Mascota['especie'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {especies.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Raza *</Label>
              <Input value={editRaza} onChange={e => setEditRaza(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Fecha de Nacimiento</Label>
              <Input type="date" value={editFechaNac} onChange={e => setEditFechaNac(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Sexo</Label>
              <Select value={editSexo} onValueChange={v => setEditSexo(v as Mascota['sexo'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="hembra">Hembra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <Input value={editColor} onChange={e => setEditColor(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Peso (kg)</Label>
              <Input type="number" step="0.1" value={editPeso} onChange={e => setEditPeso(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Alergias (separadas por coma)</Label>
              <Input value={editAlergias} onChange={e => setEditAlergias(e.target.value)} placeholder="Pollo, Gluten" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label>Notas Especiales</Label>
              <Textarea value={editNotas} onChange={e => setEditNotas(e.target.value)} className="min-h-[70px]" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button
              onClick={guardarEdicion}
              disabled={!editNombre.trim() || !editRaza.trim() || !editPropNom.trim() || !editPropTel.trim()}
              className="bg-gradient-to-r from-purpura-500 to-purpura-600 hover:from-purpura-600 hover:to-purpura-700"
            >
              <Pencil className="w-4 h-4 mr-2" />Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Subir foto (perfil o evolución) ── */}
      <Dialog open={fotoOpen} onOpenChange={open => {
        if (!subiendoFoto) {
          setFotoOpen(open);
          if (!open) {
            setFotoPendiente(null);
            setFotoDescripcion('');
            setFotoError(null);
          }
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-purpura-500" />
              {fotoModo === 'perfil' ? 'Actualizar foto de perfil' : 'Nueva foto de evolución'}
            </DialogTitle>
            <DialogDescription>
              {fotoModo === 'perfil'
                ? 'Esta foto se mostrará en la ficha del paciente y en los listados.'
                : 'Registra el estado actual del paciente para el seguimiento clínico.'}
            </DialogDescription>
          </DialogHeader>
          {fotoPendiente && (
            <img
              src={URL.createObjectURL(fotoPendiente)}
              alt="Vista previa"
              className={`w-full max-h-48 object-cover rounded-xl ${fotoModo === 'perfil' ? 'aspect-square max-w-48 mx-auto' : ''}`}
            />
          )}
          {fotoModo === 'evolucion' && (
            <div className="space-y-1">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={fotoDescripcion}
                onChange={e => setFotoDescripcion(e.target.value)}
                placeholder="Ej. Herida en pata trasera, día 3 de tratamiento"
                className="min-h-[70px]"
              />
            </div>
          )}
          {fotoError && (
            <p className="text-sm text-red-600">{fotoError}</p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFotoOpen(false)} disabled={subiendoFoto}>
              Cancelar
            </Button>
            <Button
              onClick={confirmarSubirFoto}
              disabled={!fotoPendiente || subiendoFoto}
              className="bg-gradient-to-r from-purpura-500 to-purpura-600 hover:from-purpura-600 hover:to-purpura-700"
            >
              {subiendoFoto
                ? 'Subiendo...'
                : fotoModo === 'perfil'
                  ? 'Guardar foto de perfil'
                  : 'Guardar en evolución'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Eliminar Paciente ── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Eliminar Paciente
            </DialogTitle>
            <DialogDescription className="pt-2">
              ¿Está seguro de que desea eliminar el expediente de{' '}
              <span className="font-semibold text-foreground">{mascota.nombre}</span>?
              Esta acción eliminará todo el historial médico, vacunas y datos del paciente.
              <span className="block mt-2 text-red-600 font-medium">Esta acción no se puede deshacer.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarEliminar}>
              <Trash2 className="w-4 h-4 mr-2" />Sí, eliminar paciente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
