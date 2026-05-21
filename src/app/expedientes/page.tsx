import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MascotaController } from '@/controllers/mascota.controller';
import { Card } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Badge } from '@/components/atoms/ui/badge';
import { PageHeader } from '@/components/molecules/PageHeader';
import { SearchBar } from '@/components/molecules/SearchBar';
import { EmptyState } from '@/components/molecules/EmptyState';

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
  conejo: 'bg-purpura-100 text-purpura-700',
  otro: 'bg-gray-100 text-gray-700'
};

const filtrosEspecie = [
  { label: 'Todos', value: 'todos', activeClass: 'bg-purpura-500' },
  { label: '🐕 Perros', value: 'perro', activeClass: 'bg-blue-500' },
  { label: '🐱 Gatos', value: 'gato', activeClass: 'bg-pink-500' },
];

export default function ExpedientesPage() {
  const ctrl = MascotaController.getInstance();
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroEspecie, setFiltroEspecie] = useState<string>('todos');
  const [expedientes, setExpedientes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = searchQuery
        ? await ctrl.buscarExpedientes(searchQuery)
        : await ctrl.buscarExpedientes('');
      setExpedientes(data);
      setIsLoading(false);
    };
    void load();
  }, [ctrl, searchQuery]);

  const expedientesFiltrados = useMemo(
    () => expedientes,
    [expedientes]
  );

  const expedientesPorEspecie = filtroEspecie === 'todos'
    ? expedientesFiltrados
    : expedientesFiltrados.filter(exp => exp.mascota.especie === filtroEspecie);

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
            <Button className="bg-gradient-to-r from-purpura-500 to-purpura-600 hover:from-purpura-600 hover:to-purpura-700">
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
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[80px]">Foto</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Especie</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Consultas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expedientesPorEspecie.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <EmptyState
                      icon={Search}
                      message="No se encontraron expedientes"
                      action={{ label: 'Limpiar filtros', onClick: () => { setSearchQuery(''); setFiltroEspecie('todos'); } }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                expedientesPorEspecie.map((expediente) => (
                  <TableRow key={expediente.id} className="hover:bg-muted/50">
                    <TableCell>
                      <img
                        src={expediente.mascota.foto}
                        alt={expediente.mascota.nombre}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{expediente.mascota.nombre}</p>
                        <p className="text-xs text-muted-foreground">{expediente.mascota.raza}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={especieColors[expediente.mascota.especie] || especieColors.otro}>
                        {especieIcons[expediente.mascota.especie] || '🐾'} {expediente.mascota.especie.charAt(0).toUpperCase() + expediente.mascota.especie.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{expediente.mascota.propietario.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{expediente.mascota.propietario.telefono}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-purpura-500" />
                        <span className="font-medium">{expediente.consultas.length}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/expedientes/${expediente.mascotaId}`}>
                        <Button variant="ghost" size="sm" className="text-purpura-600 hover:text-purpura-700">
                          Ver expediente
                          <ArrowRight className="w-4 h-4 ml-1" />
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
