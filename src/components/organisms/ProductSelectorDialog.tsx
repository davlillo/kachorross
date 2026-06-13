import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/ui/dialog'
import { Input } from '@/components/atoms/ui/input'
import { Badge } from '@/components/atoms/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/ui/select'
import { Search, Plus } from 'lucide-react'
import { useCatalogo } from '@/hooks/useConsultas'
import type { Producto } from '@/types'
import { CATEGORIAS_CATALOGO, CATEGORIA_COLORS, getCategoriaLabel, categoriaFromCodigo, compareCodigo } from '@/lib/catalogo-categorias'

const categorias = [
  { value: 'todos', label: 'Todos' },
  ...CATEGORIAS_CATALOGO.map(c => ({ value: c.value, label: c.label })),
]

interface ProductSelectorDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSelect: (producto: Producto) => void
  filterCategoria?: string
  onFilterCategoriaChange?: (v: string) => void
}

export function ProductSelectorDialog({ open, onOpenChange, onSelect }: ProductSelectorDialogProps) {
  const { productos } = useCatalogo()
  const [productSearch, setProductSearch] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('todos')

  const productosFiltrados = useMemo(() => {
    const q = productSearch.toLowerCase()
    const filtered = productos.filter(p => {
      const matchCategoria = selectedCategoria === 'todos' || categoriaFromCodigo(p.codigo) === selectedCategoria
      const matchSearch = !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q)
      return matchCategoria && matchSearch && p.activo
    })
    return [...filtered].sort((a, b) => compareCodigo(a.codigo, b.codigo))
  }, [productos, productSearch, selectedCategoria])

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
                placeholder="Buscar por código o nombre..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger className="w-[150px]">
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
            {productosFiltrados.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No se encontraron productos</p>
            ) : productosFiltrados.map((producto) => {
              const catStyle = CATEGORIA_COLORS[producto.categoria] ?? CATEGORIA_COLORS.consulta
              const CatIcon = CATEGORIAS_CATALOGO.find(c => c.value === producto.categoria)?.icon
              const showDescripcion = producto.descripcion && producto.descripcion !== producto.nombre
              return (
                <button
                  key={producto.id}
                  onClick={() => { onSelect(producto); onOpenChange(false) }}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors text-left gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-black font-mono px-2 py-0.5 rounded-md border ${catStyle}`}>
                        {CatIcon && <CatIcon className="w-3 h-3" />}
                        {producto.codigo}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {getCategoriaLabel(producto.categoria, producto.codigo)}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm mt-1 truncate">{producto.nombre}</p>
                    {showDescripcion && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{producto.descripcion}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">${producto.precio.toFixed(2)}</p>
                    <Plus className="w-4 h-4 text-brand-primary ml-auto mt-1" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
