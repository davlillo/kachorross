import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MascotaController } from '@/controllers/mascota.controller';
import { ConsultaController } from '@/controllers/consulta.controller';
import { compararEventosAgenda } from '@/controllers/agenda.controller';
import { useAgenda } from '@/hooks/useAgenda';
import {
  colorEvento,
  type TipoEvento
} from '@/data/eventosData';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Button } from '@/components/atoms/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/ui/dialog';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { TimeClockPicker } from '@/components/molecules/TimeClockPicker';
import { Textarea } from '@/components/atoms/ui/textarea';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import {
  Users, Calendar, Stethoscope, PawPrint,
  ArrowRight, Activity, ChevronLeft, ChevronRight,
  Plus, X, Syringe, Bug, AlertTriangle, DollarSign, FileText,
  TrendingUp, Banknote, HeartPulse, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, addMonths, subMonths, getDay, subDays, isWithinInterval
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { Consulta } from '@/types';
import { fechaLocalClave, hoyLocalClave } from '@/lib/utils';

// ── Leyenda colores calendario ────────────────────────────────────────────────
const tiposEvento: { tipo: TipoEvento; icon: React.ElementType }[] = [
  { tipo: 'control',        icon: Activity },
  { tipo: 'vacuna',         icon: Syringe },
  { tipo: 'desparasitante', icon: Bug },
  { tipo: 'urgencia',       icon: AlertTriangle },
];

// ── Formulario nuevo evento ────────────────────────────────────────────────────
interface FormEvento {
  titulo: string;
  hora: string;
  mascotaId: string;
  tipo: TipoEvento;
  notas: string;
}

const formVacio: FormEvento = {
  titulo: '', hora: '09:00', mascotaId: '', tipo: 'control', notas: ''
};

// ── Componente principal ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const mascotaCtrl = MascotaController.getInstance();
  const consultaCtrl = ConsultaController.getInstance();
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    pacientesHoy: 0,
    pacientesEspera: 0,
    ingresosHoy: 0,
    consultasPendientes: 0,
  });

  useEffect(() => {
    const load = async () => {
      const [mascotasData, consultasData] = await Promise.all([
        mascotaCtrl.getAll(),
        consultaCtrl.getAll(),
      ]);
      const hoy = hoyLocalClave();
      const consultasHoy = consultasData.filter(c => c.fecha && fechaLocalClave(c.fecha) === hoy);
      const pendientes = consultasData.filter(c => c.estado === 'pendiente');

      setMascotas(mascotasData);
      setConsultas(consultasData);
      setDashboardStats({
        pacientesHoy: consultasHoy.length,
        pacientesEspera: pendientes.length,
        ingresosHoy: consultasHoy.reduce((acc, c) => acc + c.total, 0),
        consultasPendientes: pendientes.length,
      });
    };
    void load();
  }, [mascotaCtrl, consultaCtrl]);

  // ── Calendario ──────────────────────────────────────────────────────────────
  const [mesActual, setMesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(new Date());
  const [mostrarForm, setMostrarForm] = useState(false);
  const [formEvento, setFormEvento] = useState<FormEvento>(formVacio);
  const [guardandoEvento, setGuardandoEvento] = useState(false);
  const { eventos, isLoading: agendaLoading, crearEvento, eliminarEvento } = useAgenda(mesActual);

  // ── Gráficas ────────────────────────────────────────────────────────────────
  const [periodoGrafica, setPeriodoGrafica] = useState<'semana' | 'mes'>('semana');

  const datosGrafica = useMemo(() => {
    if (periodoGrafica === 'semana') {
      const dias = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
      return dias.map((dia) => {
        const key = format(dia, 'yyyy-MM-dd');
        const consultasDia = consultas.filter(c => c.fecha && fechaLocalClave(c.fecha) === key);
        return {
          dia: format(dia, 'EEE', { locale: es }),
          consultas: consultasDia.length,
          ingresos: consultasDia.reduce((sum, c) => sum + c.total, 0),
        };
      });
    }

    const inicio = startOfMonth(mesActual);
    const fin = endOfMonth(mesActual);
    const diasMes = eachDayOfInterval({ start: inicio, end: fin });

    return diasMes.map((dia) => {
      const key = format(dia, 'yyyy-MM-dd');
      const consultasDia = consultas.filter(c => c.fecha && fechaLocalClave(c.fecha) === key);
      return {
        dia: format(dia, 'd'),
        consultas: consultasDia.length,
        ingresos: consultasDia.reduce((sum, c) => sum + c.total, 0),
      };
    });
  }, [consultas, periodoGrafica, mesActual]);

  const serviciosFrecuentes = useMemo(() => {
    const inicio = startOfMonth(mesActual);
    const fin = endOfMonth(mesActual);
    const agregados = new Map<string, { nombre: string; cantidad: number; ingresos: number }>();

    consultas
      .filter(c => isWithinInterval(new Date(c.fecha), { start: inicio, end: fin }))
      .flatMap(c => c.detalles)
      .filter(d =>
        ['consulta', 'peluqueria'].includes(d.producto.categoria)
      )
      .forEach(d => {
        const actual = agregados.get(d.producto.nombre) ?? { nombre: d.producto.nombre, cantidad: 0, ingresos: 0 };
        actual.cantidad += d.cantidad;
        actual.ingresos += d.subtotal;
        agregados.set(d.producto.nombre, actual);
      });

    return Array.from(agregados.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 6);
  }, [consultas, mesActual]);

  const medicamentosFrecuentes = useMemo(() => {
    const inicio = startOfMonth(mesActual);
    const fin = endOfMonth(mesActual);
    const agregados = new Map<string, { nombre: string; cantidad: number; ingresos: number }>();

    consultas
      .filter(c => isWithinInterval(new Date(c.fecha), { start: inicio, end: fin }))
      .flatMap(c => c.detalles)
      .filter(d => d.producto.categoria === 'farmacia')
      .forEach(d => {
        const actual = agregados.get(d.producto.nombre) ?? { nombre: d.producto.nombre, cantidad: 0, ingresos: 0 };
        actual.cantidad += d.cantidad;
        actual.ingresos += d.subtotal;
        agregados.set(d.producto.nombre, actual);
      });

    return Array.from(agregados.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 6);
  }, [consultas, mesActual]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';
  };

  const getRoleLabel = (rol: string) => ({
    doctora: 'Doctora Veterinaria',
    recepcion: 'Recepcionista',
    admin: 'Administrador'
  }[rol] ?? rol);

  // ── Tipos de animales ────────────────────────────────────────────────────────
  const animalStats = [
    { label: 'Perros',  value: mascotas.filter(m => m.especie === 'perro').length,  icon: '🐕', color: 'from-blue-400 to-blue-600',     bg: 'bg-blue-50 dark:bg-blue-950',   text: 'text-blue-700 dark:text-blue-300' },
    { label: 'Gatos',   value: mascotas.filter(m => m.especie === 'gato').length,   icon: '🐱', color: 'from-pink-400 to-pink-600',     bg: 'bg-pink-50 dark:bg-pink-950',   text: 'text-pink-700 dark:text-pink-300' },
    { label: 'Conejos', value: mascotas.filter(m => m.especie === 'conejo').length, icon: '🐰', color: 'from-amber-400 to-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300' },
    { label: 'Aves',    value: mascotas.filter(m => m.especie === 'ave').length,    icon: '🦜', color: 'from-emerald-400 to-emerald-600',bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300' },
    { label: 'Otros',   value: mascotas.filter(m => !['perro','gato','conejo','ave'].includes(m.especie)).length, icon: '🐾', color: 'from-violet-400 to-violet-600', bg: 'bg-violet-50 dark:bg-violet-950', text: 'text-violet-700 dark:text-violet-300' },
    { label: 'Total',   value: mascotas.length, icon: '📋', color: 'from-slate-400 to-slate-600', bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
  ];

  // ── Lógica calendario ────────────────────────────────────────────────────────
  const diasDelMes = useMemo(() => {
    const inicio = startOfMonth(mesActual);
    const fin = endOfMonth(mesActual);
    return eachDayOfInterval({ start: inicio, end: fin });
  }, [mesActual]);

  const eventosPorFecha = useMemo(() => {
    const mapa: Record<string, typeof eventos> = {};
    eventos.forEach(ev => {
      if (!mapa[ev.fecha]) mapa[ev.fecha] = [];
      mapa[ev.fecha].push(ev);
    });
    return mapa;
  }, [eventos]);

  const eventosDiaSeleccionado = useMemo(() => {
    if (!diaSeleccionado) return [];
    const key = format(diaSeleccionado, 'yyyy-MM-dd');
    return [...(eventosPorFecha[key] ?? [])].sort(compararEventosAgenda);
  }, [diaSeleccionado, eventosPorFecha]);

  const primerDiaSemana = useMemo(() => {
    const dia = getDay(startOfMonth(mesActual));
    return dia === 0 ? 6 : dia - 1;
  }, [mesActual]);

  const agregarEvento = async () => {
    if (!diaSeleccionado || !formEvento.titulo.trim() || !formEvento.mascotaId) {
      toast.error('Complete título y mascota');
      return;
    }
    setGuardandoEvento(true);
    try {
      await crearEvento({
        mascotaId: formEvento.mascotaId,
        titulo: formEvento.titulo.trim(),
        tipo: formEvento.tipo,
        fecha: format(diaSeleccionado, 'yyyy-MM-dd'),
        hora: formEvento.hora,
        notas: formEvento.notas || undefined,
      });
      setFormEvento(formVacio);
      setMostrarForm(false);
      toast.success('Evento registrado en la agenda');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar el evento');
    } finally {
      setGuardandoEvento(false);
    }
  };

  const handleEliminarEvento = async (id: string, origen: string) => {
    if (origen !== 'evento') {
      toast.info('Este evento proviene de una consulta, vacuna o desparasitación y no se puede eliminar aquí');
      return;
    }
    try {
      await eliminarEvento(id);
      toast.success('Evento eliminado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  };

  // ── Totales para el ingreso acumulado ────────────────────────────────────────
  const datosConAcumulado = useMemo(() => {
    let acum = 0;
    return datosGrafica.map(d => {
      acum += d.ingresos;
      return { ...d, acumulado: acum };
    });
  }, [datosGrafica]);

  const ingresosTotales = datosConAcumulado.at(-1)?.acumulado ?? 0;
  const totalConsultas = datosGrafica.reduce((s, d) => s + d.consultas, 0);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {getGreeting()}, <span className="text-brand-primary">{user?.nombre.split(' ')[0]}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {getRoleLabel(user?.rol || '')} • {new Date().toLocaleDateString('es-ES', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex gap-2">
          {user?.rol === 'doctora' && (
            <Link to="/consulta/nueva">
              <Button className="bg-gradient-to-r from-brand-primary to-brand-primary hover:from-brand-primary hover:to-brand-primary">
                <Stethoscope className="w-4 h-4 mr-2" />Nueva Consulta
              </Button>
            </Link>
          )}
          {user?.rol === 'recepcion' && (
            <Link to="/recepcion">
              <Button className="bg-gradient-to-r from-brand-secondary to-brand-primary">
                <Clock className="w-4 h-4 mr-2" />Ver Monitor
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Bloque principal: Stats + Carrusel animales | Calendario ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:items-stretch">

        {/* ── Columna izquierda (2/3): stats + carrusel ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* 2 stat cards grandes */}
          <div className="grid grid-cols-2 gap-4">

            {/* Pacientes Hoy */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary via-brand-primary to-brand-primary p-6 shadow-lg text-white min-h-[140px]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
              <Users className="absolute -right-4 -bottom-4 w-28 h-28 opacity-[0.08]" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/60">Pacientes Hoy</p>
                  <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                    <HeartPulse className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-6xl font-black leading-none tabular-nums">{dashboardStats.pacientesHoy}</p>
                  <div className="flex items-center gap-1.5 mt-3">
                    <span className="flex items-center gap-0.5 text-[11px] font-semibold bg-white/20 rounded-full px-2 py-0.5">
                      <TrendingUp className="w-3 h-3" /> +2 vs ayer
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingresos Hoy */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 shadow-lg text-white min-h-[140px]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
              <Banknote className="absolute -right-4 -bottom-4 w-28 h-28 opacity-[0.08]" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/60">Ingresos Hoy</p>
                  <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-5xl font-black leading-none tabular-nums">${dashboardStats.ingresosHoy.toFixed(0)}</p>
                  <div className="flex items-center gap-1.5 mt-3">
                    <span className="flex items-center gap-0.5 text-[11px] font-semibold bg-white/20 rounded-full px-2 py-0.5">
                      <TrendingUp className="w-3 h-3" /> Prefacturado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ticker horizontal de animales */}
          <div className="overflow-hidden rounded-2xl bg-card shadow-soft relative">
            <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />
            <div className="animal-ticker-h flex gap-3 py-4 px-2" style={{ width: 'max-content' }}>
              {[...animalStats, ...animalStats, ...animalStats].map((a, i) => (
                <div key={i} className={`${a.bg} rounded-2xl px-5 py-3 flex flex-col items-center gap-1 border border-white/50 shadow-sm shrink-0 min-w-[100px]`}>
                  <span className="text-3xl leading-none">{a.icon}</span>
                  <span className={`text-2xl font-black tabular-nums leading-none ${a.text}`}>{a.value}</span>
                  <span className={`text-[11px] font-semibold ${a.text} opacity-70`}>{a.label}</span>
                </div>
              ))}
            </div>
            <style>{`
              .animal-ticker-h { animation: tickerLeft 12s linear infinite; }
              .animal-ticker-h:hover { animation-play-state: paused; }
              @keyframes tickerLeft {
                0%   { transform: translateX(0); }
                100% { transform: translateX(calc(-100% / 3)); }
              }
            `}</style>
          </div>

          {!consultas.length && (
            <p className="text-xs text-muted-foreground px-2">Sin datos suficientes aún para calendario y gráficas.</p>
          )}

          {/* Pacientes Recientes */}
          <div className="bg-card rounded-2xl shadow-soft px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-brand-primary" />
                Pacientes Recientes
              </p>
              <Link to="/expedientes">
                <Button variant="ghost" size="sm" className="text-brand-primary text-xs h-6 px-2">
                  Ver todos <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {mascotas.slice(0, 4).map(m => (
                <Link key={m.id} to={`/expedientes/${m.id}`}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors text-center">
                  <img src={m.foto} alt={m.nombre} className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow" />
                  <p className="font-semibold text-xs truncate w-full text-center">{m.nombre}</p>
                  <p className="text-[10px] text-muted-foreground truncate w-full text-center">{m.raza}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Columna derecha (1/3): Calendario TALL ── */}
        <Card className="border-0 shadow-soft flex flex-col lg:row-span-1">
          {/* Header calendario */}
          <CardHeader className="pb-2 pt-4 px-4 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-primary" />
                Agenda
              </CardTitle>
              <Button
                size="sm"
                className="h-7 px-2 text-xs bg-gradient-to-r from-brand-primary to-brand-primary hover:from-brand-primary hover:to-brand-primary"
                onClick={() => setMostrarForm(true)}
                disabled={!diaSeleccionado}
              >
                <Plus className="w-3 h-3 mr-1" /> Nuevo
              </Button>
            </div>
            {/* Nav mes */}
            <div className="flex items-center justify-between mt-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMesActual(m => subMonths(m, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-bold capitalize">
                {format(mesActual, 'MMMM yyyy', { locale: es })}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMesActual(m => addMonths(m, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col gap-3 px-3 pb-4 overflow-hidden">
            {/* Grid días */}
            <div className="shrink-0">
              <div className="grid grid-cols-7">
                {['L','M','X','J','V','S','D'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: primerDiaSemana }).map((_, i) => <div key={`ep-${i}`} />)}
                {diasDelMes.map(dia => {
                  const key = format(dia, 'yyyy-MM-dd');
                  const evsDia = eventosPorFecha[key] ?? [];
                  const esHoy = isSameDay(dia, new Date());
                  const esSel = diaSeleccionado ? isSameDay(dia, diaSeleccionado) : false;
                  const tiposSet = Array.from(new Set(evsDia.map(e => e.tipo))).slice(0, 3);
                  return (
                    <button key={key} onClick={() => setDiaSeleccionado(dia)}
                      className={`flex flex-col items-center rounded-lg py-1 min-h-[36px] transition-all
                        ${esSel ? 'bg-brand-primary text-white shadow-md scale-105' : esHoy ? 'bg-brand-primary/10 text-brand-primary font-bold' : 'hover:bg-muted'}`}
                    >
                      <span className="text-xs leading-tight">{format(dia, 'd')}</span>
                      <div className="flex gap-0.5 flex-wrap justify-center mt-0.5">
                        {tiposSet.map(tipo => (
                          <span key={tipo} className={`w-1.5 h-1.5 rounded-full ${esSel ? 'bg-white/70' : colorEvento[tipo].dot}`} />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Leyenda */}
            <div className="shrink-0 flex flex-wrap gap-x-2 gap-y-1 px-1">
              {tiposEvento.map(({ tipo }) => (
                <span key={tipo} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className={`w-2 h-2 rounded-full ${colorEvento[tipo].dot}`} />
                  {colorEvento[tipo].label}
                </span>
              ))}
            </div>

            {/* Separador + eventos del día */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {diaSeleccionado && (
                <>
                  <p className="text-xs font-bold text-muted-foreground mb-2 capitalize sticky top-0 bg-background pt-0.5">
                    {format(diaSeleccionado, "EEEE d 'de' MMM", { locale: es })}
                  </p>
                  {eventosDiaSeleccionado.length === 0 ? (
                    <div className="flex flex-col items-center gap-1.5 py-4 text-muted-foreground/40">
                      <Calendar className="w-7 h-7" />
                      <p className="text-xs">{agendaLoading ? 'Cargando...' : 'Sin eventos programados'}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {eventosDiaSeleccionado.map(ev => {
                        const col = colorEvento[ev.tipo];
                        const prefijo = `${col.label}: `;
                        const nota = ev.titulo.startsWith(prefijo)
                          ? ev.titulo.slice(prefijo.length)
                          : ev.titulo;
                        const mostrarNota = nota && nota !== 'Control de seguimiento';
                        return (
                          <div
                            key={ev.id}
                            className={`flex items-center gap-3 rounded-lg border border-border/70 bg-card shadow-sm border-l-[3px] ${col.border} px-3 py-2 group`}
                          >
                            <div className="shrink-0 min-w-[3.25rem] text-center flex flex-col justify-center">
                              {ev.hora && (
                                <p className="text-sm font-bold tabular-nums text-foreground leading-none">{ev.hora}</p>
                              )}
                              <p className={`text-[9px] font-semibold ${ev.hora ? 'mt-0.5' : ''} ${col.text}`}>{col.label}</p>
                            </div>

                            <div className="flex-1 min-w-0 border-l border-border/50 pl-3">
                              <p className="text-sm font-semibold text-foreground truncate">{ev.mascota}</p>
                              <p className="text-xs text-muted-foreground truncate">{ev.propietario}</p>
                              {mostrarNota && (
                                <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">{nota}</p>
                              )}
                            </div>

                            {ev.origen === 'evento' && (
                              <button
                                onClick={() => void handleEliminarEvento(ev.id, ev.origen)}
                                className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 p-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={mostrarForm} onOpenChange={setMostrarForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input
                placeholder="Ej. Control general"
                value={formEvento.titulo}
                onChange={(e) => setFormEvento(f => ({ ...f, titulo: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Hora</Label>
                <TimeClockPicker
                  value={formEvento.hora}
                  onChange={hora => setFormEvento(f => ({ ...f, hora }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={formEvento.tipo}
                  onChange={(e) => setFormEvento(f => ({ ...f, tipo: e.target.value as TipoEvento }))}
                >
                  {tiposEvento.map(({ tipo }) => (
                    <option key={tipo} value={tipo}>
                      {colorEvento[tipo].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Mascota</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={formEvento.mascotaId}
                onChange={(e) => setFormEvento(f => ({ ...f, mascotaId: e.target.value }))}
              >
                <option value="">Seleccionar mascota...</option>
                {mascotas.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} — {m.propietario?.nombre}
                  </option>
                ))}
              </select>
            </div>
            {formEvento.mascotaId && (
              <p className="text-xs text-muted-foreground">
                Propietario: {mascotas.find(m => m.id === formEvento.mascotaId)?.propietario?.nombre}
              </p>
            )}
            <div>
              <Label>Notas</Label>
              <Textarea
                placeholder="Notas opcionales"
                value={formEvento.notas}
                onChange={(e) => setFormEvento(f => ({ ...f, notas: e.target.value }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              No se puede agendar otra cita el mismo día a la misma hora.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setMostrarForm(false);
                setFormEvento(formVacio);
              }}
            >
              Cancelar
            </Button>
            <Button className="bg-brand-primary hover:bg-brand-primary" onClick={() => void agregarEvento()} disabled={guardandoEvento}>
              {guardandoEvento ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Gráficas de actividad ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Consultas por día */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-brand-primary" />
                Consultas Realizadas
                <Badge variant="outline" className="text-xs font-normal">{totalConsultas} total</Badge>
              </CardTitle>
              <div className="flex gap-1">
                {(['semana','mes'] as const).map(p => (
                  <Button key={p} size="sm" variant={periodoGrafica === p ? 'default' : 'ghost'}
                    className={`h-6 px-2 text-xs ${periodoGrafica === p ? 'bg-brand-primary hover:bg-brand-primary' : ''}`}
                    onClick={() => setPeriodoGrafica(p)}>
                    {p === 'semana' ? 'Semana' : 'Mes'}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={datosGrafica} barSize={periodoGrafica === 'mes' ? 6 : 28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dia" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={24} />
                <Tooltip
                  formatter={(v: number) => [v, 'Consultas']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}
                />
                <Bar dataKey="consultas" radius={[4,4,0,0]}>
                  {datosGrafica.map((_, i) => (
                    <Cell key={i} fill={`hsl(${270 - i * (periodoGrafica === 'mes' ? 3 : 6)}, 65%, 60%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ingresos acumulados */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Ingresos por Prefacturas
                <Badge variant="outline" className="text-xs font-normal text-emerald-600">${ingresosTotales.toFixed(0)}</Badge>
              </CardTitle>
              <div className="flex gap-1">
                {(['semana','mes'] as const).map(p => (
                  <Button key={p} size="sm" variant={periodoGrafica === p ? 'default' : 'ghost'}
                    className={`h-6 px-2 text-xs ${periodoGrafica === p ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                    onClick={() => setPeriodoGrafica(p)}>
                    {p === 'semana' ? 'Semana' : 'Mes'}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={datosConAcumulado}>
                <defs>
                  <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dia" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={36} tickFormatter={v => `$${v}`} />
                <Tooltip
                  formatter={(v: number) => [`$${v.toFixed(2)}`, 'Acumulado']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}
                />
                <Area type="monotone" dataKey="acumulado" stroke="#10b981" strokeWidth={2} fill="url(#gradIngresos)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Servicios y medicamentos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Servicios más frecuentes */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-500" />
              Servicios Más Frecuentes
              <Badge variant="outline" className="text-xs font-normal text-blue-600">por prefactura</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={serviciosFrecuentes} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={120} />
                <Tooltip
                  formatter={(v: number, name: string) => [name === 'cantidad' ? `${v} veces` : `$${v}`, name === 'cantidad' ? 'Frecuencia' : 'Ingresos']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}
                />
                <Bar dataKey="cantidad" name="cantidad" radius={[0,4,4,0]}>
                  {serviciosFrecuentes.map((_, i) => (
                    <Cell key={i} fill={`hsl(${210 + i * 10}, 70%, ${55 + i * 3}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Medicamentos más prefacturados */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              Medicamentos Más Prefacturados
              <Badge variant="outline" className="text-xs font-normal text-orange-600">por prefactura</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={medicamentosFrecuentes} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={130} />
                <Tooltip
                  formatter={(v: number, name: string) => [name === 'cantidad' ? `${v} veces` : `$${v}`, name === 'cantidad' ? 'Frecuencia' : 'Ingresos']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}
                />
                <Bar dataKey="cantidad" name="cantidad" radius={[0,4,4,0]}>
                  {medicamentosFrecuentes.map((_, i) => (
                    <Cell key={i} fill={`hsl(${25 + i * 12}, 80%, ${55 + i * 3}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
