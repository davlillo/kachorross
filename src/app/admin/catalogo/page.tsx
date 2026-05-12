import { useState } from 'react';
import { useCatalogo } from '@/hooks/useConsultas';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Stethoscope,
  Syringe,
  Pill,
  ShoppingBag,
  FlaskConical,
  Save,
  X
} from 'lucide-react';
import type { Producto } from '@/types';

const categorias = [
  { value: 'servicio', label: 'Servicios', icon: Stethoscope, color: 'bg-blue-100 text-blue-700' },
  { value: 'vacuna', label: 'Vacunas', icon: Syringe, color: 'bg-purpura-100 text-purpura-700' },
  { value: 'medicamento', label: 'Medicamentos', icon: Pill, color: 'bg-amber-100 text-amber-700' },
  { value: 'petshop', label: 'PetShop', icon: ShoppingBag, color: 'bg-pink-100 text-pink-700' },
  { value: 'laboratorio', label: 'Laboratorio', icon: FlaskConical, color: 'bg-violet-100 text-violet-700' },
];

export default function CatalogoPage() {
  const { productos, actualizarProducto, crearProducto, eliminarProducto } = useCatalogo();
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

  // Form states
  const [formNombre, setFormNombre] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formCategoria, setFormCategoria] = useState<Producto['categoria']>('servicio');
  const [formPrecio, setFormPrecio] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formActivo, setFormActivo] = useState(true);

  const productosFiltrados = productos.filter(p => {
    const matchCategoria = filtroCategoria === 'todos' || p.categoria === filtroCategoria;
    const matchSearch = !searchQuery || 
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategoria && matchSearch;
  });

  const getCategoriaInfo = (categoria: string) => {
    return categorias.find(c => c.value === categoria) || categorias[0];
  };

  const handleEdit = (producto: Producto) => {
    setSelectedProducto(producto);
    setFormNombre(producto.nombre);
    setFormCodigo(producto.codigo);
    setFormDescripcion(producto.descripcion);
    setFormCategoria(producto.categoria);
    setFormPrecio(producto.precio.toString());
    setFormStock(producto.stock?.toString() || '');
    setFormActivo(producto.activo);
    setShowEditDialog(true);
  };

  const handleCreate = () => {
    setFormNombre('');
    setFormCodigo('');
    setFormDescripcion('');
    setFormCategoria('servicio');
    setFormPrecio('');
    setFormStock('');
    setFormActivo(true);
    setShowCreateDialog(true);
  };

  const saveEdit = () => {
    if (selectedProducto) {
      actualizarProducto(selectedProducto.id, {
        nombre: formNombre,
        codigo: formCodigo,
        descripcion: formDescripcion,
        categoria: formCategoria,
        precio: parseFloat(formPrecio),
        stock: formStock ? parseInt(formStock) : undefined,
        activo: formActivo
      });
      setShowEditDialog(false);
    }
  };

  const saveCreate = () => {
    crearProducto({
      codigo: formCodigo,
      nombre: formNombre,
      descripcion: formDescripcion,
      categoria: formCategoria,
      precio: parseFloat(formPrecio),
      stock: formStock ? parseInt(formStock) : undefined,
      activo: formActivo
    });
    setShowCreateDialog(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      eliminarProducto(id);
    }
  };

  const stats = {
    total: productos.length,
    activos: productos.filter(p => p.activo).length,
    porCategoria: categorias.map(cat => ({
      ...cat,
      count: productos.filter(p => p.categoria === cat.value && p.activo).length
    }))
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-7 h-7 text-blue-violet" />
            Gestión de Catálogo
          </h1>
          <p className="text-muted-foreground mt-1">
            Administre servicios, productos y precios del sistema
          </p>
        </div>
        <Button 
          onClick={handleCreate}
          className="bg-gradient-to-r from-blue-violet to-azure-blue"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total productos</p>
          </CardContent>
        </Card>
        {stats.porCategoria.map((cat) => (
          <Card key={cat.value} className="border-0 shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <cat.icon className="w-4 h-4" />
                <p className="text-2xl font-bold">{cat.count}</p>
              </div>
              <p className="text-xs text-muted-foreground">{cat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={filtroCategoria === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroCategoria('todos')}
                className={filtroCategoria === 'todos' ? 'bg-blue-violet' : ''}
              >
                Todos
              </Button>
              {categorias.map(cat => (
                <Button 
                  key={cat.value}
                  variant={filtroCategoria === cat.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroCategoria(cat.value)}
                  className={filtroCategoria === cat.value ? 'bg-blue-violet' : ''}
                >
                  <cat.icon className="w-3 h-3 mr-1" />
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="border-0 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Package className="w-12 h-12 text-muted-foreground" />
                      <p className="text-muted-foreground">No se encontraron productos</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                productosFiltrados.map((producto) => {
                  const catInfo = getCategoriaInfo(producto.categoria);
                  return (
                    <TableRow key={producto.id} className="hover:bg-muted/50">
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{producto.codigo}</code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{producto.nombre}</p>
                          <p className="text-xs text-muted-foreground">{producto.descripcion}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={catInfo.color}>
                          <catInfo.icon className="w-3 h-3 mr-1" />
                          {catInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold">${producto.precio.toFixed(2)}</p>
                      </TableCell>
                      <TableCell>
                        {producto.stock !== undefined ? (
                          <span className={producto.stock < 10 ? 'text-destructive font-medium' : ''}>
                            {producto.stock} unidades
                          </span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={producto.activo ? 'default' : 'secondary'} className={producto.activo ? 'bg-purpura-500' : ''}>
                          {producto.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(producto)}
                          >
                            <Edit2 className="w-4 h-4 text-azure-blue" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(producto.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dialog de edición */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-azure-blue" />
              Editar Producto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={formCodigo} onChange={(e) => setFormCodigo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={formCategoria} onValueChange={(v) => setFormCategoria(v as Producto['categoria'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio ($)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={formPrecio} 
                  onChange={(e) => setFormPrecio(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Stock (opcional)</Label>
                <Input 
                  type="number" 
                  value={formStock} 
                  onChange={(e) => setFormStock(e.target.value)} 
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label>Activo</Label>
              <Switch checked={formActivo} onCheckedChange={setFormActivo} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button onClick={saveEdit} className="bg-blue-violet">
              <Save className="w-4 h-4 mr-1" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de creación */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-purpura-500" />
              Nuevo Producto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input 
                  value={formCodigo} 
                  onChange={(e) => setFormCodigo(e.target.value)}
                  placeholder="Ej: SERV-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={formCategoria} onValueChange={(v) => setFormCategoria(v as Producto['categoria'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input 
                value={formNombre} 
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Nombre del producto o servicio"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input 
                value={formDescripcion} 
                onChange={(e) => setFormDescripcion(e.target.value)}
                placeholder="Descripción breve"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio ($)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={formPrecio} 
                  onChange={(e) => setFormPrecio(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Stock (opcional)</Label>
                <Input 
                  type="number" 
                  value={formStock} 
                  onChange={(e) => setFormStock(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button onClick={saveCreate} className="bg-gradient-to-r from-purpura-500 to-purpura-600">
              <Save className="w-4 h-4 mr-1" />
              Crear Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
