import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/ui/dialog'
import { Input } from '@/components/atoms/ui/input'
import { Badge } from '@/components/atoms/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/ui/select'
import { Search, Plus } from 'lucide-react'
import { catalogo } from '@/data/mockData'
import type { Producto } from '@/types'

const categorias = [
  { value: 'todos', label: 'Todos' },
  { value: 'servicio', label: 'Servicios' },
  { value: 'vacuna', label: 'Vacunas' },
  { value: 'medicamento', label: 'Medicamentos' },
  { value: 'petshop', label: 'PetShop' },
  { value: 'laboratorio', label: 'Laboratorio' },
]

const categoriaColors: Record<string, string> = {
  servicio: 'bg-blue-100 text-blue-700',
  vacuna: 'bg-purpura-100 text-purpura-700',
  medicamento: 'bg-amber-100 text-amber-700',
  petshop: 'bg-pink-100 text-pink-700',
  laboratorio: 'bg-violet-100 text-violet-700',
}

interface ProductSelectorDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSelect: (producto: Producto) => void
  filterCategoria?: string
  onFilterCategoriaChange?: (v: string) => void
}

export function ProductSelectorDialog({ open, onOpenChange, onSelect }: ProductSelectorDialogProps) {
  const [productSearch, setProductSearch] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('todos')

  const productosFiltrados = catalogo.filter(p => {
    const matchCategoria = selectedCategoria === 'todos' || p.categoria === selectedCategoria
    const matchSearch = !productSearch ||
      p.nombre.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.codigo.toLowerCase().includes(productSearch.toLowerCase())
    return matchCategoria && matchSearch && p.activo
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Agregar Servicio o Producto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categorias.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-y-auto max-h-[400px] space-y-2">
            {productosFiltrados.map((producto) => (
              <button
                key={producto.id}
                onClick={() => { onSelect(producto); onOpenChange(false) }}
                className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{producto.nombre}</span>
                    <Badge className={categoriaColors[producto.categoria] || ''}>
                      {producto.categoria}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{producto.descripcion}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${producto.precio.toFixed(2)}</p>
                  <Plus className="w-4 h-4 text-purpura-500 ml-auto" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
