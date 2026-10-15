import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/atoms/ui/card';
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
import {
  CalendarClock,
  PawPrint,
  Save,
  ArrowLeft,
  Stethoscope,
  Search,
  User,
  Phone,
  CheckCircle,
} from 'lucide-react';
import { TransportCageIcon } from '@/components/atoms/custom';
import type { Mascota } from '@/types';
import { formatPeso, formatTelefono } from '@/lib/input-validators';
import { cn, desplazarDia, diffDias, todayLocal } from '@/lib/utils';
import { MascotaController } from '@/controllers/mascota.controller';
import { useHospedajeMutations } from '@/hooks/useHospedajes';
import { toast } from 'sonner';

export default function NuevoHospedajePage() {
  const navigate = useNavigate();
  const mascotaCtrl = MascotaController.getInstance();
  const { registrarHospedaje } = useHospedajeMutations();
  const hoy = todayLocal();

  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [isLoadingMascotas, setIsLoadingMascotas] = useState(true);
  const [mascotaSearch, setMascotaSearch] = useState('');
  const [showMascotaDialog, setShowMascotaDialog] = useState(false);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState<Mascota | undefined>(undefined);

  const [tarifaDiaria, setTarifaDiaria] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState(hoy);
  const [fechaSalidaEstimada, setFechaSalidaEstimada] = useState(desplazarDia(3));
  const [observaciones, setObservaciones] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [touched, setTouched] = useState({
    paciente: false,
    tarifa: false,
    fechas: false,
  });

  useEffect(() => {
    let vigente = true;
    const load = async () => {
      try {
        const data = await mascotaCtrl.getAll();
        if (!vigente) return;
        setMascotas(data);
      } catch {
        if (vigente) setMascotas([]);
      } finally {
        if (vigente) setIsLoadingMascotas(false);
      }
    };
    void load();
    return () => {
      vigente = false;
    };
  }, [mascotaCtrl]);

  const mascotasFiltradas = useMemo(() => {
    const q = mascotaSearch.trim().toLowerCase();
    if (!q) return mascotas;
    return mascotas.filter(m =>
      m.nombre.toLowerCase().includes(q) ||
      m.raza.toLowerCase().includes(q) ||
      m.propietario.nombre.toLowerCase().includes(q) ||
      m.propietario.telefono.toLowerCase().includes(q)
    );
  }, [mascotas, mascotaSearch]);

  const tarifaNum = parseFloat(tarifaDiaria);
  const tarifaOk = Number.isFinite(tarifaNum) && tarifaNum > 0;
  const fechasOk =
    !!fechaIngreso &&
    !!fechaSalidaEstimada &&
    diffDias(fechaIngreso, fechaSalidaEstimada) >= 0;

  const pacienteOk = !!mascotaSeleccionada;

  const isValid = pacienteOk && tarifaOk && fechasOk;

  const pacienteError =
    touched.paciente && !pacienteOk ? 'Seleccione la mascota a hospedar' : null;
  const tarifaError = touched.tarifa && !tarifaOk
    ? 'Ingrese una tarifa mayor a $0.00'
    : null;
  const fechasError = touched.fechas && !fechasOk
    ? 'La salida estimada no puede ser anterior al ingreso'
    : null;

  const diasEstimados = useMemo(
    () => (fechaIngreso && fechaSalidaEstimada ? diffDias(fechaIngreso, fechaSalidaEstimada) : 0),
    [fechaIngreso, fechaSalidaEstimada],
  );
  const totalEstimado = diasEstimados * (tarifaOk ? tarifaNum : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ paciente: true, tarifa: true, fechas: true });
    if (!isValid || isSaving || !mascotaSeleccionada) return;

    try {
      setIsSaving(true);
      await registrarHospedaje({
        mascotaId: mascotaSeleccionada.id,
        fechaIngreso,
        fechaSalidaEstimada,
        tarifaDiaria: tarifaNum,
        observaciones: observaciones.trim() || undefined,
      });
      toast.success('Hospedaje registrado correctamente');
      navigate('/hospedaje');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo registrar el hospedaje');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Registrar Hospedaje"
        description="Registre el ingreso de una mascota al servicio de hospedaje"
            icon={TransportCageIcon}
        backHref="/hospedaje"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-brand-primary" />
                Datos del Hospedaje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Mascota *</Label>
                <div className="mt-1">
                  {mascotaSeleccionada ? (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                      {mascotaSeleccionada.foto ? (
                        <img
                          src={mascotaSeleccionada.foto}
                          alt={mascotaSeleccionada.nombre}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <span className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary/15 to-brand-secondary/15 text-brand-primary">
                          <PawPrint className="w-6 h-6" />
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{mascotaSeleccionada.nombre}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {mascotaSeleccionada.raza} · {mascotaSeleccionada.especie}
                        </p>
                        <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground truncate">
                          <User className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{mascotaSeleccionada.propietario.nombre}</span>
                          <span>·</span>
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span className="tabular-nums">
                            {formatTelefono(mascotaSeleccionada.propietario.telefono)}
                          </span>
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMascotaDialog(true)}
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowMascotaDialog(true)}
                      className="w-full h-20 rounded-lg border-2 border-dashed border-muted hover:border-brand-primary/30 hover:bg-brand-primary/5 hover:text-brand-primary transition-colors cursor-pointer text-muted-foreground"
                    >
                      {isLoadingMascotas ? 'Cargando pacientes...' : 'Seleccione una mascota del expediente'}
                    </button>
                  )}
                </div>

                {pacienteError && (
                  <p className="mt-1 text-xs text-red-600">{pacienteError}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hospedajeTarifa">Tarifa diaria *</Label>
                  <Input
                    id="hospedajeTarifa"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={tarifaDiaria}
                    onChange={(e) => setTarifaDiaria(formatPeso(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                    }}
                    onBlur={() => setTouched(t => ({ ...t, tarifa: true }))}
                    className={cn('mt-1', tarifaError && 'border-red-500 focus-visible:ring-red-500')}
                    aria-invalid={!!tarifaError}
                    required
                  />
                  {tarifaError && (
                    <p className="mt-1 text-xs text-red-600">{tarifaError}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="hospedajeIngreso">Fecha de ingreso *</Label>
                  <Input
                    id="hospedajeIngreso"
                    type="date"
                    value={fechaIngreso}
                    onChange={(e) => setFechaIngreso(e.target.value)}
                    max={hoy}
                    className={cn('mt-1', fechasError && 'border-red-500 focus-visible:ring-red-500')}
                    aria-invalid={!!fechasError}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="hospedajeSalida">Fecha de salida estimada *</Label>
                <Input
                  id="hospedajeSalida"
                  type="date"
                  value={fechaSalidaEstimada}
                  onChange={(e) => setFechaSalidaEstimada(e.target.value)}
                  min={fechaIngreso || hoy}
                  onBlur={() => setTouched(t => ({ ...t, fechas: true }))}
                  className={cn('mt-1', fechasError && 'border-red-500 focus-visible:ring-red-500')}
                  aria-invalid={!!fechasError}
                  required
                />
                {fechasError && (
                  <p className="mt-1 text-xs text-red-600">{fechasError}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-brand-secondary" />
                Resumen y Notas
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex-col gap-3 border-t pt-4">
              <div className="w-full flex items-center justify-between text-lg">
                <span className="font-medium">Días estimados:</span>
                <span className="font-semibold tabular-nums">{diasEstimados}</span>
              </div>
              <div className="w-full flex items-center justify-between text-lg">
                <span className="font-medium">Total estimado:</span>
                <span className="font-bold text-2xl text-brand-primary tabular-nums">
                  ${totalEstimado.toFixed(2)}
                </span>
              </div>
            </CardFooter>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hospedajeObservaciones">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Observaciones
                  </span>
                </Label>
                <Textarea
                  id="hospedajeObservaciones"
                  placeholder="Alimento especial, medicación, contacto de emergencia..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="mt-1 min-h-[150px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/hospedaje')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isSaving}
            className="bg-gradient-to-r from-brand-primary to-brand-primary hover:from-brand-primary hover:to-brand-primary min-w-[180px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Registrar Hospedaje'}
          </Button>
        </div>
      </form>

      <Dialog open={showMascotaDialog} onOpenChange={setShowMascotaDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Seleccionar Paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, raza, propietario o teléfono..."
                value={mascotaSearch}
                onChange={(e) => setMascotaSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="overflow-y-auto max-h-[400px] space-y-2">
              {isLoadingMascotas ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Cargando pacientes...
                </p>
              ) : mascotasFiltradas.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No se encontraron pacientes en el expediente
                </p>
              ) : (
                mascotasFiltradas.map((mascota) => (
                  <button
                    key={mascota.id}
                    type="button"
                    onClick={() => {
                      setMascotaSeleccionada(mascota);
                      setShowMascotaDialog(false);
                    }}
                    className="w-full flex items-center gap-4 p-3 rounded-lg border hover:bg-muted transition-colors text-left"
                  >
                    {mascota.foto ? (
                      <img
                        src={mascota.foto}
                        alt={mascota.nombre}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="inline-flex w-12 h-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary/15 to-brand-secondary/15 text-brand-primary">
                        <PawPrint className="w-5 h-5" />
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{mascota.nombre}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {mascota.raza} · {mascota.propietario.nombre}
                      </p>
                    </div>
                    {mascota.id === mascotaSeleccionada?.id ? (
                      <CheckCircle className="w-5 h-5 shrink-0 text-brand-primary" />
                    ) : (
                      <CheckCircle className="w-5 h-5 shrink-0 text-muted-foreground/30" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}