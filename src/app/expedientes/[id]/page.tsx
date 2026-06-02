import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MascotaController } from '@/controllers/mascota.controller';
import { VacunaController } from '@/controllers/vacuna.controller';
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
  Pencil, Trash2, AlertTriangle, Filter, CalendarDays,
  Pill, Stamp, ChevronDown,
} from 'lucide-react';
import type { Expediente, Mascota, Vacuna, Desparasitacion } from '@/types';

const especies: { value: Mascota['especie']; label: string }[] = [
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'ave', label: 'Ave' },
  { value: 'conejo', label: 'Conejo' },
  { value: 'otro', label: 'Otro' },
];

const TIPOS_DESPARASITACION = ['Interna', 'Externa', 'Interna + Externa'];
const VIAS_ADMINISTRACION = ['Oral', 'Tópica', 'Inyectable', 'Subcutánea'];
const SLOTS_POR_PAGINA = 12;
const SLOTS_DESPARASITACION = 6;

const formatDateShort = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

const now = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

interface CartillaPageData {
  pageIndex: number;
  vacunas: Vacuna[];
  desparasitaciones: Desparasitacion[];
}

function EmptySlot() {
  return (
    <div className="border-b border-dashed border-gray-300 py-2.5 px-3 min-h-[56px] flex items-center">
      <span className="text-xs text-gray-300 italic">—— Disponible ——</span>
    </div>
  );
}

function VacunaSlot({ vacuna }: { vacuna: Vacuna }) {
  return (
    <div className="border-b border-gray-200 py-2.5 px-3 flex items-center gap-3 hover:bg-purpura-50/40 transition-colors">
      <div className="w-6 h-6 rounded-full bg-purpura-100 flex items-center justify-center shrink-0">
        <Syringe className="w-3 h-3 text-purpura-600" />
      </div>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-800">{vacuna.nombre}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 flex-wrap text-[9px] font-mono text-gray-500">
          <span className="bg-gray-100 px-1.5 py-0.5 rounded">Lote: {vacuna.lote ?? 'N/A'}</span>
          <span className="bg-gray-100 px-1.5 py-0.5 rounded">Dosis: {vacuna.dosis ?? 'N/A'}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span>{formatDateShort(vacuna.fechaAplicacion)}</span>
          {vacuna.proximaDosis && <span className="text-amber-600">→ {formatDateShort(vacuna.proximaDosis)}</span>}
        </div>
      </div>
    </div>
  );
}

function DesparasitacionSlot({ desparasitacion }: { desparasitacion: Desparasitacion }) {
  return (
    <div className="border-b border-gray-200 py-2.5 px-3 flex items-center gap-3 hover:bg-emerald-50/40 transition-colors">
      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
        <Pill className="w-3 h-3 text-emerald-600" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-800">{desparasitacion.tipo}</span>
          {desparasitacion.viaAdministracion && (
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{desparasitacion.viaAdministracion}</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span>{formatDateShort(desparasitacion.fechaAplicacion)}</span>
          {desparasitacion.fechaProximoTratamiento && <span className="text-amber-600">→ {formatDateShort(desparasitacion.fechaProximoTratamiento)}</span>}
        </div>
      </div>
    </div>
  );
}

function CartillaPageView({
  page,
  pageIndex,
  mascotaNombre,
  mascotaEspecie,
  mascotaRaza,
}: {
  page: CartillaPageData;
  pageIndex: number;
  mascotaNombre: string;
  mascotaEspecie: string;
  mascotaRaza: string;
}) {
  const colA: (Vacuna | null)[] = Array(6).fill(null);
  const colB: (Vacuna | null)[] = Array(6).fill(null);
  page.vacunas.forEach((v, i) => {
    if (i < 6) colA[i] = v;
    else if (i < 12) colB[i - 6] = v;
  });

  const colDesparasitaciones: (Desparasitacion | null)[] = Array(SLOTS_DESPARASITACION).fill(null);
  page.desparasitaciones.forEach((d, i) => {
    if (i < SLOTS_DESPARASITACION) colDesparasitaciones[i] = d;
  });

  return (
    <div className="bg-[#faf8f4] border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden w-full">
      <div className="border-b-2 border-gray-200 bg-white px-5 py-2 flex items-center justify-between text-xs text-gray-500">
        <div className="flex min-w-0 items-center gap-4">
          <span className="font-semibold text-gray-700 truncate">Paciente: <span className="font-normal">{mascotaNombre}</span></span>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-700">Especie: <span className="font-normal">{mascotaEspecie.charAt(0).toUpperCase() + mascotaEspecie.slice(1)}</span></span>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-700">Raza: <span className="font-normal">{mascotaRaza}</span></span>
        </div>
        <div className="text-[10px] text-gray-400 font-mono shrink-0">Emisión: {now}</div>
      </div>

      <div className="grid grid-cols-3 divide-x-2 divide-gray-200">
        <div className="col-span-2 bg-purpura-100/80 px-4 py-2 border-b border-purpura-200 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purpura-600" />
          <span className="font-bold text-sm uppercase tracking-wider text-purpura-800">Vacunas</span>
        </div>
        <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-200 flex items-center justify-start gap-2 pl-4">
          <div className="w-2 h-2 rounded-full bg-emerald-600" />
          <span className="font-bold text-sm uppercase tracking-wider text-emerald-800">Desparasitaciones</span>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x-2 divide-gray-200">
        <div>
          {colA.map((vacuna, i) =>
            vacuna ? (
              <VacunaSlot key={vacuna.id} vacuna={vacuna} />
            ) : (
              <EmptySlot key={`va-${pageIndex}-${i}`} />
            ),
          )}
        </div>
        <div>
          {colB.map((vacuna, i) =>
            vacuna ? (
              <VacunaSlot key={vacuna.id} vacuna={vacuna} />
            ) : (
              <EmptySlot key={`vb-${pageIndex}-${i}`} />
            ),
          )}
        </div>
        <div>
          {colDesparasitaciones.map((d, i) =>
            d ? (
              <DesparasitacionSlot key={d.id} desparasitacion={d} />
            ) : (
              <EmptySlot key={`dd-${pageIndex}-${i}`} />
            ),
          )}
        </div>
      </div>

      <div className="border-t-2 border-gray-200 bg-white px-5 py-1.5 flex items-center justify-between text-[9px] text-gray-400">
        <span>Kachorros Veterinaria · Cartilla de Vacunación</span>
        <span>Página {pageIndex + 1}</span>
      </div>
    </div>
  );
}

export default function ExpedienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const ctrl = MascotaController.getInstance();
  const evolucionInputRef = useRef<HTMLInputElement>(null);

  // ── Datos reactivos desde el controller ─────────────────────────────────────
  const [activeTab, setActiveTab] = useState('historial');
  const [refresh, setRefresh] = useState(0);
  const [expediente, setExpediente] = useState<Expediente | undefined>(undefined);
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

  // ── Cartilla / Vacunas ────────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState<number | null>(null);
  const [agregarOpen, setAgregarOpen] = useState(false);
  const [agregarTipo, setAgregarTipo] = useState<'vacuna' | 'desparasitacion'>('vacuna');
  const [agregarForm, setAgregarForm] = useState({
    nombre: '', fechaAplicacion: '', dosis: '', proximaDosis: '', lote: '',
    tipo: '', viaAdministracion: '', fechaProximoTratamiento: '',
  });

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

  // ── Cartilla paginación ──────────────────────────────────────────────────────
  const sortedCartillaVacunas = useMemo(
    () => [...(expediente?.vacunas ?? [])].sort((a, b) => new Date(a.fechaAplicacion).getTime() - new Date(b.fechaAplicacion).getTime()),
    [expediente],
  );

  const sortedCartillaDesparasitaciones = useMemo(
    () => [...(expediente?.desparasitaciones ?? [])].sort((a, b) => new Date(a.fechaAplicacion).getTime() - new Date(b.fechaAplicacion).getTime()),
    [expediente],
  );

  const cartillaPages = useMemo<CartillaPageData[]>(() => {
    const pages: CartillaPageData[] = [];
    sortedCartillaVacunas.forEach((v, i) => {
      const pageIdx = Math.floor(i / SLOTS_POR_PAGINA);
      if (!pages[pageIdx]) pages[pageIdx] = { pageIndex: pageIdx, vacunas: [], desparasitaciones: [] };
      pages[pageIdx].vacunas.push(v);
    });
    sortedCartillaDesparasitaciones.forEach((d, i) => {
      const pageIdx = Math.floor(i / SLOTS_DESPARASITACION);
      if (!pages[pageIdx]) pages[pageIdx] = { pageIndex: pageIdx, vacunas: [], desparasitaciones: [] };
      pages[pageIdx].desparasitaciones.push(d);
    });
    return pages.sort((a, b) => a.pageIndex - b.pageIndex);
  }, [sortedCartillaVacunas, sortedCartillaDesparasitaciones]);

  useEffect(() => {
    if (cartillaPages.length > 0 && activePage === null) {
      const incompleteIdx = cartillaPages.findIndex(p =>
        p.vacunas.length >= SLOTS_POR_PAGINA && p.desparasitaciones.length >= SLOTS_DESPARASITACION ? false : true,
      );
      setActivePage(incompleteIdx >= 0 ? incompleteIdx : 0);
    }
  }, [cartillaPages, activePage]);

  const isPageComplete = (p: CartillaPageData) =>
    p.vacunas.length >= SLOTS_POR_PAGINA && p.desparasitaciones.length >= SLOTS_DESPARASITACION;

  const handleAgregar = async () => {
    const vacunaCtrl = VacunaController.getInstance();
    try {
      if (agregarTipo === 'vacuna') {
        await vacunaCtrl.crearVacuna({
          mascotaId: mascota!.id,
          nombre: agregarForm.nombre,
          fechaAplicacion: agregarForm.fechaAplicacion,
          dosis: agregarForm.dosis || undefined,
          proximaDosis: agregarForm.proximaDosis || undefined,
          lote: agregarForm.lote || undefined,
        });
      } else {
        await vacunaCtrl.crearDesparasitacion({
          mascotaId: mascota!.id,
          tipo: agregarForm.tipo,
          viaAdministracion: agregarForm.viaAdministracion,
          fechaAplicacion: agregarForm.fechaAplicacion,
          fechaProximoTratamiento: agregarForm.fechaProximoTratamiento || undefined,
        });
      }
      setAgregarForm({ nombre: '', fechaAplicacion: '', dosis: '', proximaDosis: '', lote: '', tipo: '', viaAdministracion: '', fechaProximoTratamiento: '' });
      setAgregarOpen(false);
      setRefresh(r => r + 1);
      toast.success(`Se agregó ${agregarTipo === 'vacuna' ? 'vacuna' : 'desparasitación'} correctamente`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al agregar');
      console.error(error);
    }
  };

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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                          <span aria-hidden="true" className="text-xs leading-none">×</span>
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

            {/* ── Tab: Vacunas (Cartilla) ── */}
            <TabsContent value="vacunas" className="mt-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Stamp className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Cartilla de Vacunación</h2>
                  </div>
                </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Button
                    size="sm"
                    className="bg-gradient-to-r from-purpura-500 to-purpura-600 hover:from-purpura-600 hover:to-purpura-700 shadow-sm shadow-purpura-500/20"
                    onClick={() => setAgregarOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />Agregar
                  </Button>
                </div>
              </div>

              {cartillaPages.length === 0 ? (
                <div className="bg-[#faf8f4] border-2 border-dashed border-gray-200 rounded-xl py-16 flex flex-col items-center gap-3">
                  <Stamp className="w-10 h-10 text-gray-300" />
                  <p className="text-sm text-gray-400">No hay registros todavía</p>
                  <p className="text-xs text-gray-300">Agrega una vacuna o desparasitación para comenzar</p>
                </div>
              ) : cartillaPages.length === 1 ? (
                <div className="overflow-hidden">
                  <CartillaPageView
                    page={cartillaPages[0]}
                    pageIndex={0}
                    mascotaNombre={mascota.nombre}
                    mascotaEspecie={mascota.especie}
                    mascotaRaza={mascota.raza}
                  />
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex items-stretch gap-1 mb-4 overflow-x-auto">
                    {cartillaPages.map((page) => {
                      const complete = isPageComplete(page);
                      const isActive = activePage === page.pageIndex;
                      return (
                        <button
                          key={page.pageIndex}
                          type="button"
                          onClick={() => setActivePage(isActive ? null : page.pageIndex)}
                          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all shrink-0 whitespace-nowrap ${
                            isActive
                              ? 'bg-purpura-100 text-purpura-800 shadow-sm ring-1 ring-purpura-300'
                              : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                          }`}
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isActive ? '' : '-rotate-90'}`} />
                          <div className="flex flex-col items-start">
                            <span className="font-semibold">Cartilla {page.pageIndex + 1}</span>
                            <span className="text-[9px] text-gray-400">
                              {page.vacunas.length}/{SLOTS_POR_PAGINA} vac · {page.desparasitaciones.length}/{SLOTS_DESPARASITACION} des
                            </span>
                          </div>
                          {complete && (
                            <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full ml-1">Completa</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {activePage !== null && cartillaPages[activePage] && (
                    <div className="overflow-hidden">
                      <CartillaPageView
                        page={cartillaPages[activePage]}
                        pageIndex={activePage}
                        mascotaNombre={mascota.nombre}
                        mascotaEspecie={mascota.especie}
                        mascotaRaza={mascota.raza}
                      />
                    </div>
                  )}
                </div>
              )}
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

      {/* ── Dialog: Agregar Vacuna / Desparasitación ── */}
      <Dialog open={agregarOpen} onOpenChange={setAgregarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${agregarTipo === 'vacuna' ? 'bg-purpura-100' : 'bg-emerald-100'}`}>
                {agregarTipo === 'vacuna' ? <Syringe className="w-4 h-4 text-purpura-600" /> : <Pill className="w-4 h-4 text-emerald-600" />}
              </div>
              {agregarTipo === 'vacuna' ? 'Nueva Vacuna' : 'Nueva Desparasitación'}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <div className="flex items-center gap-2 mb-4 bg-gray-50 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setAgregarTipo('vacuna')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  agregarTipo === 'vacuna' ? 'bg-white text-purpura-700 shadow-sm ring-1 ring-purpura-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Syringe className="w-3.5 h-3.5" /> Vacuna
              </button>
              <button
                type="button"
                onClick={() => setAgregarTipo('desparasitacion')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  agregarTipo === 'desparasitacion' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Pill className="w-3.5 h-3.5" /> Desparasitación
              </button>
            </div>

            <div className="space-y-4">
              {agregarTipo === 'vacuna' ? (
                <>
                  <div className="space-y-1.5">
                    <Label>Nombre de la Vacuna *</Label>
                    <Input
                      placeholder="Ej. Pentavalente, Antirrábica..."
                      value={agregarForm.nombre}
                      onChange={e => setAgregarForm(prev => ({ ...prev, nombre: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dosis</Label>
                    <Input placeholder="Ej. 1 ml, 0.5 ml" value={agregarForm.dosis} onChange={e => setAgregarForm(prev => ({ ...prev, dosis: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fecha de Aplicación *</Label>
                    <Input type="date" value={agregarForm.fechaAplicacion} onChange={e => setAgregarForm(prev => ({ ...prev, fechaAplicacion: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Próxima Dosis</Label>
                    <Input type="date" min={agregarForm.fechaAplicacion || undefined} value={agregarForm.proximaDosis} onChange={e => setAgregarForm(prev => ({ ...prev, proximaDosis: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Lote</Label>
                    <Input placeholder="Número de lote" value={agregarForm.lote} onChange={e => setAgregarForm(prev => ({ ...prev, lote: e.target.value }))} />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label>Tipo *</Label>
                    <Select value={agregarForm.tipo} onValueChange={v => setAgregarForm(prev => ({ ...prev, tipo: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                      <SelectContent>
                        {TIPOS_DESPARASITACION.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Vía de Administración *</Label>
                    <Select value={agregarForm.viaAdministracion} onValueChange={v => setAgregarForm(prev => ({ ...prev, viaAdministracion: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar vía" /></SelectTrigger>
                      <SelectContent>
                        {VIAS_ADMINISTRACION.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fecha de Aplicación *</Label>
                    <Input type="date" value={agregarForm.fechaAplicacion} onChange={e => setAgregarForm(prev => ({ ...prev, fechaAplicacion: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Próximo Tratamiento</Label>
                    <Input type="date" min={agregarForm.fechaAplicacion || undefined} value={agregarForm.fechaProximoTratamiento} onChange={e => setAgregarForm(prev => ({ ...prev, fechaProximoTratamiento: e.target.value }))} />
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAgregarOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleAgregar}
              disabled={agregarTipo === 'vacuna' ? (!agregarForm.nombre || !agregarForm.fechaAplicacion) : (!agregarForm.tipo || !agregarForm.viaAdministracion || !agregarForm.fechaAplicacion)}
              className="bg-gradient-to-r from-purpura-500 to-purpura-600"
            >
              <Plus className="w-4 h-4 mr-2" />Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
