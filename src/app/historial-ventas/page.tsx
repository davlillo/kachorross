import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Badge } from '@/components/atoms/ui/badge';
import { Input } from '@/components/atoms/ui/input';
import { PageHeader } from '@/components/molecules/PageHeader';
import { ConsultaController } from '@/controllers/consulta.controller';
import { MascotaController } from '@/controllers/mascota.controller';
import { getCategoriaConfig, getCategoriaLabel } from '@/lib/catalogo-categorias';

export default function HistorialVentasPage() {
  const consultaCtrl = ConsultaController.getInstance();
  const mascotaCtrl = MascotaController.getInstance();
  const [busqueda, setBusqueda] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [todasLasConsultas, setTodasLasConsultas] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [consultas, mascotasData] = await Promise.all([
        consultaCtrl.getAll(),
        mascotaCtrl.getAll(),
      ]);
      setMascotas(mascotasData);
      setTodasLasConsultas(consultas.filter(c => c.estado === 'finalizado'));
    };
    void load();
  }, [consultaCtrl, mascotaCtrl]);

  const consultasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    return todasLasConsultas.filter(c => {
      const mascota = mascotas.find(m => m.id === c.mascotaId);
      return (
        !q ||
        mascota?.nombre.toLowerCase().includes(q) ||
        mascota?.propietario.nombre.toLowerCase().includes(q) ||
        c.motivo.toLowerCase().includes(q) ||
        c.detalles.some(d => d.producto.codigo.toLowerCase().includes(q) || d.producto.nombre.toLowerCase().includes(q))
      );
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [busqueda]);

  const totalIngresos = consultasFiltradas.reduce((acc, c) => acc + c.total, 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Historial de Ventas"
        description="Registro completo de consultas facturadas"
        icon={History}
        badge={
          <Badge variant="outline" className="px-3 py-1 text-purpura-600 border-purpura-200">
            <Receipt className="w-3 h-3 mr-1" />
            {consultasFiltradas.length} registros
          </Badge>
        }
      />

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-soft bg-gradient-to-br from-purpura-500 to-violet-600 text-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-white/70 font-medium uppercase tracking-wide">Total Facturado</p>
              <p className="text-2xl font-black">${totalIngresos.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft bg-gradient-to-br from-azure-blue to-blue-600 text-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-white/70 font-medium uppercase tracking-wide">Consultas</p>
              <p className="text-2xl font-black">{consultasFiltradas.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft bg-gradient-to-br from-amber-400 to-amber-600 text-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-white/70 font-medium uppercase tracking-wide">Promedio</p>
              <p className="text-2xl font-black">
                ${consultasFiltradas.length > 0 ? (totalIngresos / consultasFiltradas.length).toFixed(2) : '0.00'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buscador */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por paciente, propietario, código de producto..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de ventas */}
      <Card className="border-0 shadow-soft">
        <CardHeader className="pb-0">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4 text-purpura-500" />
            Registros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {consultasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No se encontraron registros</p>
            </div>
          ) : (
            <div className="space-y-2">
              {consultasFiltradas.map(consulta => {
                const mascota = mascotas.find(m => m.id === consulta.mascotaId);
                const isOpen = expandido === consulta.id;
                return (
                  <div key={consulta.id} className="rounded-xl border border-border overflow-hidden">
                    {/* Fila resumen */}
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                      onClick={() => setExpandido(isOpen ? null : consulta.id)}
                    >
                      <div className="w-9 h-9 rounded-full bg-purpura-100 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4 h-4 text-purpura-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{mascota?.nombre ?? '—'}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground truncate">{mascota?.propietario.nombre}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{consulta.motivo}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-purpura-600">${consulta.total.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(consulta.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Detalle expandible */}
                    {isOpen && (
                      <div className="border-t border-border bg-muted/20 px-4 py-3">
                        <div className="rounded-lg overflow-hidden border border-border">
                          <div className="grid grid-cols-12 bg-muted px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <div className="col-span-3">Código</div>
                            <div className="col-span-5">Producto</div>
                            <div className="col-span-2 text-center">Cant.</div>
                            <div className="col-span-2 text-right">Total</div>
                          </div>
                          {consulta.detalles.map((d: any, i: number) => {
                            const cat = getCategoriaConfig(d.producto.categoria, d.producto.codigo)
                            const CatIcon = cat.icon
                            const colorClass = `${cat.bg} ${cat.color} ${cat.border} border`
                            return (
                              <div
                                key={d.id}
                                className={`grid grid-cols-12 items-center px-3 py-2 border-t border-border text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-muted/10'}`}
                              >
                                <div className="col-span-3">
                                  <span className={`inline-flex items-center gap-1 text-xs font-black font-mono px-2 py-0.5 rounded-md ${colorClass}`}>
                                    <CatIcon className="w-3 h-3" />{d.producto.codigo}
                                  </span>
                                </div>
                                <div className="col-span-5 text-xs font-medium truncate pr-2">{d.producto.nombre}</div>
                                <div className="col-span-2 text-center text-xs font-bold">{d.cantidad}</div>
                                <div className="col-span-2 text-right text-xs font-bold">${d.subtotal.toFixed(2)}</div>
                              </div>
                            );
                          })}
                          <div className="grid grid-cols-12 px-3 py-2 border-t border-border bg-purpura-50">
                            <div className="col-span-10 text-xs font-semibold text-purpura-700">Total</div>
                            <div className="col-span-2 text-right text-sm font-black text-purpura-700">${consulta.total.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
