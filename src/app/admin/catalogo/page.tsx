import { useState } from 'react';
import { useCatalogo } from '@/hooks/useConsultas';
import { Button } from '@/components/atoms/ui/button';
import { PageHeader } from '@/components/molecules/PageHeader';
import { SearchBar } from '@/components/molecules/SearchBar';
import { ProductTable } from '@/components/organisms/ProductTable';
import { ProductFormDialog } from '@/components/organisms/ProductFormDialog';
import {
  Settings, Plus, Stethoscope, Syringe, Pill, ShoppingBag, FlaskConical, Package2
} from 'lucide-react';
import type { Producto } from '@/types';

const categoriaConfig = [
  { value: 'servicio',    label: 'Servicios',    icon: Stethoscope, gradient: 'from-blue-500 to-azure-blue',     bg: 'bg-blue-500' },
  { value: 'vacuna',      label: 'Vacunas',      icon: Syringe,     gradient: 'from-purpura-500 to-violet-600',  bg: 'bg-purpura-500' },
  { value: 'medicamento', label: 'Medicamentos', icon: Pill,        gradient: 'from-amber-500 to-orange-500',    bg: 'bg-amber-500' },
  { value: 'petshop',     label: 'PetShop',      icon: ShoppingBag, gradient: 'from-pink-500 to-rose-500',       bg: 'bg-pink-500' },
  { value: 'laboratorio', label: 'Laboratorio',  icon: FlaskConical,gradient: 'from-violet-500 to-purple-600',  bg: 'bg-violet-500' },
];

const filtrosCategoria = [
  { label: 'Todos',       value: 'todos',       activeClass: 'bg-blue-violet' },
  { label: 'Servicios',   value: 'servicio',    activeClass: 'bg-blue-500' },
  { label: 'Vacunas',     value: 'vacuna',      activeClass: 'bg-purpura-500' },
  { label: 'Medicamentos',value: 'medicamento', activeClass: 'bg-amber-500' },
  { label: 'PetShop',     value: 'petshop',     activeClass: 'bg-pink-500' },
  { label: 'Laboratorio', value: 'laboratorio', activeClass: 'bg-violet-500' },
];

export default function CatalogoPage() {
  const { productos, actualizarProducto, crearProducto, eliminarProducto } = useCatalogo();
  const [searchQuery,       setSearchQuery]       = useState('');
  const [filtroCategoria,   setFiltroCategoria]   = useState<string>('todos');
  const [showEditDialog,    setShowEditDialog]    = useState(false);
  const [showCreateDialog,  setShowCreateDialog]  = useState(false);
  const [selectedProducto,  setSelectedProducto]  = useState<Producto | null>(null);
  const [formKey,           setFormKey]           = useState(0);

  const productosFiltrados = productos.filter(p => {
    const matchCategoria = filtroCategoria === 'todos' || p.categoria === filtroCategoria;
    const matchSearch = !searchQuery ||
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategoria && matchSearch;
  });

  const handleEdit = (producto: Producto) => {
    setSelectedProducto(producto);
    setShowEditDialog(true);
    setFormKey(k => k + 1);
  };

  const handleCreate = () => {
    setShowCreateDialog(true);
    setFormKey(k => k + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Gestión de Catálogo"
        description="Administre servicios, productos y precios del sistema"
        icon={Settings}
        actions={
          <Button onClick={handleCreate} className="bg-gradient-to-r from-blue-violet to-azure-blue">
            <Plus className="w-4 h-4 mr-2" />Nuevo Producto
          </Button>
        }
      />

      {/* ── Cards de stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 p-4 text-white shadow-md">
          <Package2 className="absolute -right-3 -bottom-3 w-16 h-16 opacity-10" />
          <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Total</p>
          <p className="text-3xl font-black leading-none">{productos.length}</p>
          <p className="text-[10px] text-white/50 mt-1">productos</p>
        </div>

        {/* Por categoría */}
        {categoriaConfig.map(cat => {
          const count = productos.filter(p => p.categoria === cat.value && p.activo).length;
          const Icon = cat.icon;
          return (
            <div
              key={cat.value}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cat.gradient} p-4 text-white shadow-md cursor-pointer transition-transform hover:scale-[1.02]`}
              onClick={() => setFiltroCategoria(filtroCategoria === cat.value ? 'todos' : cat.value)}
            >
              <Icon className="absolute -right-3 -bottom-3 w-14 h-14 opacity-10" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1 truncate">{cat.label}</p>
              <p className="text-3xl font-black leading-none">{count}</p>
              <p className="text-[10px] text-white/50 mt-1">disponibles</p>
              {filtroCategoria === cat.value && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          );
        })}
      </div>

      <SearchBar
        placeholder="Buscar por nombre o código..."
        value={searchQuery}
        onChange={setSearchQuery}
        filters={filtrosCategoria}
        currentFilter={filtroCategoria}
        onFilterChange={setFiltroCategoria}
      />

      <ProductTable
        productos={productosFiltrados}
        onEdit={handleEdit}
        onDelete={eliminarProducto}
      />

      <ProductFormDialog
        key={`edit-${formKey}`}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={(data) => {
          if (selectedProducto) {
            void actualizarProducto(selectedProducto.id, data);
            setShowEditDialog(false);
          }
        }}
        initialData={selectedProducto || undefined}
        mode="edit"
      />

      <ProductFormDialog
        key={`create-${formKey}`}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSave={(data) => {
          void crearProducto(data);
          setShowCreateDialog(false);
        }}
        mode="create"
      />
    </div>
  );
}
