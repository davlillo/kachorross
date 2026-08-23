import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MascotaController } from '@/controllers/mascota.controller';
import type { ExpedienteResumen } from '@/types';
import { Card } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Badge } from '@/components/atoms/ui/badge';
import { PageHeader } from '@/components/molecules/PageHeader';
import { SearchBar } from '@/components/molecules/SearchBar';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { formatTelefono } from '@/lib/input-validators';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atoms/ui/table';
import {
  PawPrint,
  Phone,
  User,
  ArrowRight,
  FileText,
  Stethoscope,
  Search,
  Plus
} from 'lucide-react';

const especieIcons: Record<string, string> = {
  perro: '🐕', gato: '🐱', ave: '🦜', conejo: '🐰', otro: '🐾'
};

const especieColors: Record<string, string> = {
  perro: 'bg-blue-100 text-blue-700',
  gato: 'bg-pink-100 text-pink-700',
  ave: 'bg-amber-100 text-amber-700',
  conejo: 'bg-brand-primary/10 text-brand-primary',
  otro: 'bg-gray-100 text-gray-700'
};

const filtrosEspecie = [
  { label: 'Todos', value: 'todos', activeClass: 'bg-brand-primary' },
  { label: '🐕 Perros', value: 'perro', activeClass: 'bg-blue-500' },
  { label: '🐱 Gatos', value: 'gato', activeClass: 'bg-pink-500' },
];

export default function ExpedientesPage() {
  const ctrl = MascotaController.getInstance();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filtroEspecie, setFiltroEspecie] = useState<string>('todos');
  const [expedientes, setExpedientes] = useState<ExpedienteResumen[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await ctrl.listarExpedientesResumen(debouncedQuery);
      setExpedientes(data);
      setIsLoading(false);
    };
    void load();
  }, [ctrl, debouncedQuery]);

  const expedientesPorEspecie = useMemo(() => {
    if (filtroEspecie === 'todos') return expedientes;
    return expedientes.filter(exp => exp.mascota.especie === filtroEspecie);
  }, [expedientes, filtroEspecie]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Expedientes Clínicos"
        description="Busque y gestione los historiales médicos de los pacientes"
        icon={FileText}
        badge={
          <Badge variant="outline" className="px-3 py-1 ml-2">
            <PawPrint className="w-3 h-3 mr-1" />
            {isLoading ? '...' : `${expedientes.length} pacientes registrados`}
          </Badge>
        }
        actions={
          <Link to="/expedientes/nuevo">
            <Button className="bg-gradient-to-r from-brand-primary to-brand-primary hover:from-brand-primary hover:to-brand-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Expediente
            </Button>
          </Link>
        }
      />

      <SearchBar
        placeholder="Buscar por nombre, raza, propietario o teléfono..."
        value={searchQuery}
        onChange={setSearchQuery}
        filters={filtrosEspecie}
        currentFilter={filtroEspecie}
        onFilterChange={setFiltroEspecie}
      />

      <Card className="border-0 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/70 bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[90px] py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Foto
                </TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Paciente
                </TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Especie
                </TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Propietario
                </TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contacto
                </TableHead>
                <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Consultas
                </TableHead>
                <TableHead className="py-3 pl-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    <TableCell>
                      <Skeleton className="mx-auto h-11 w-11 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5 py-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-28 rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : expedientesPorEspecie.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <EmptyState
                      icon={Search}
                      message="No se encontraron expedientes"
                      action={{ label: 'Limpiar filtros', onClick: () => { setSearchQuery(''); setFiltroEspecie('todos'); } }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                expedientesPorEspecie.map((expediente) => (
                  <TableRow
                    key={expediente.id}
                    className="group border-b border-border/50 transition-colors hover:bg-brand-primary/[0.04]"
                  >
                    <TableCell className="text-center">
                      {expediente.mascota.foto ? (
                        <img
                          src={expediente.mascota.foto}
                          alt={expediente.mascota.nombre}
                          className="inline-block h-11 w-11 rounded-full object-cover shadow-sm ring-2 ring-border"
                        />
                      ) : (
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary/15 to-brand-secondary/15 text-brand-primary ring-2 ring-border">
                          <PawPrint className="w-5 h-5" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="font-semibold transition-colors group-hover:text-brand-primary">
                        {expediente.mascota.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">{expediente.mascota.raza}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={`rounded-full px-2.5 font-medium ${especieColors[expediente.mascota.especie] || especieColors.otro}`}>
                        {especieIcons[expediente.mascota.especie] || '🐾'} {expediente.mascota.especie.charAt(0).toUpperCase() + expediente.mascota.especie.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm">{expediente.mascota.propietario.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4 shrink-0" />
                        <span className="text-sm tabular-nums">{formatTelefono(expediente.mascota.propietario.telefono)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-semibold text-brand-primary">
                        <Stethoscope className="w-3.5 h-3.5" />
                        {expediente.consultasCount}
                      </span>
                    </TableCell>
                    <TableCell className="pl-4">
                      <Link to={`/expedientes/${expediente.mascotaId}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-md border-border/70 text-brand-primary hover:bg-brand-primary hover:text-white"
                        >
                          Ver expediente
                          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
