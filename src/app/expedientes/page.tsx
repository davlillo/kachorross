import { useState } from 'react';
import { Link } from 'react-router-dom';
import { expedientes, buscarExpedientes } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  PawPrint,
  Phone,
  User,
  ArrowRight,
  FileText,
  Stethoscope
} from 'lucide-react';

export default function ExpedientesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroEspecie, setFiltroEspecie] = useState<string>('todos');

  const expedientesFiltrados = searchQuery 
    ? buscarExpedientes(searchQuery)
    : expedientes;

  const expedientesPorEspecie = filtroEspecie === 'todos' 
    ? expedientesFiltrados 
    : expedientesFiltrados.filter(exp => exp.mascota.especie === filtroEspecie);

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

  const getEspecieColor = (especie: string) => {
    const colors: Record<string, string> = {
      perro: 'bg-blue-100 text-blue-700',
      gato: 'bg-pink-100 text-pink-700',
      ave: 'bg-amber-100 text-amber-700',
      conejo: 'bg-esmerald-100 text-esmerald-700',
      otro: 'bg-gray-100 text-gray-700'
    };
    return colors[especie] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-7 h-7 text-esmerald-500" />
            Expedientes Clínicos
          </h1>
          <p className="text-muted-foreground mt-1">
            Busque y gestione los historiales médicos de los pacientes
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <PawPrint className="w-3 h-3 mr-1" />
            {expedientes.length} pacientes registrados
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, raza, propietario o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filtroEspecie === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEspecie('todos')}
                className={filtroEspecie === 'todos' ? 'bg-esmerald-500' : ''}
              >
                Todos
              </Button>
              <Button 
                variant={filtroEspecie === 'perro' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEspecie('perro')}
                className={filtroEspecie === 'perro' ? 'bg-blue-500' : ''}
              >
                🐕 Perros
              </Button>
              <Button 
                variant={filtroEspecie === 'gato' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEspecie('gato')}
                className={filtroEspecie === 'gato' ? 'bg-pink-500' : ''}
              >
                🐱 Gatos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
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
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">No se encontraron expedientes</p>
                      <Button 
                        variant="outline" 
                        onClick={() => {setSearchQuery(''); setFiltroEspecie('todos');}}
                      >
                        Limpiar filtros
                      </Button>
                    </div>
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
                      <Badge className={getEspecieColor(expediente.mascota.especie)}>
                        {getEspecieIcon(expediente.mascota.especie)} {' '}
                        {expediente.mascota.especie.charAt(0).toUpperCase() + expediente.mascota.especie.slice(1)}
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
                        <Stethoscope className="w-4 h-4 text-esmerald-500" />
                        <span className="font-medium">{expediente.consultas.length}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/expedientes/${expediente.mascotaId}`}>
                        <Button variant="ghost" size="sm" className="text-esmerald-600 hover:text-esmerald-700">
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Perros', value: expedientes.filter(e => e.mascota.especie === 'perro').length, icon: '🐕', color: 'bg-blue-50' },
          { label: 'Gatos', value: expedientes.filter(e => e.mascota.especie === 'gato').length, icon: '🐱', color: 'bg-pink-50' },
          { label: 'Otros', value: expedientes.filter(e => !['perro', 'gato'].includes(e.mascota.especie)).length, icon: '🐾', color: 'bg-esmerald-50' },
          { label: 'Total', value: expedientes.length, icon: '📋', color: 'bg-violet-50' },
        ].map((stat, index) => (
          <Card key={index} className="border-0 shadow-soft">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center text-xl`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
