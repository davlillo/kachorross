import { Badge } from '@/components/atoms/ui/badge'
import { getCategoriaConfig, getCategoriaLabel } from '@/lib/catalogo-categorias'
import type { Producto } from '@/types'

export interface DetalleProductoCellProps {
  producto: Pick<Producto, 'nombre' | 'descripcion' | 'categoria' | 'codigo'>
}

export function DetalleProductoCell({ producto }: DetalleProductoCellProps) {
  const cat = getCategoriaConfig(producto.categoria, producto.codigo)
  const showDescripcion = producto.descripcion && producto.descripcion !== producto.nombre

  return (
    <div className="min-w-0 pr-1">
      <p className="text-xs font-semibold leading-tight">{producto.nombre}</p>
      {showDescripcion && (
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{producto.descripcion}</p>
      )}
      <Badge className={`text-[9px] px-1 py-0 ${cat.bg} ${cat.color} border-0 mt-0.5`}>
        {getCategoriaLabel(producto.categoria, producto.codigo)}
      </Badge>
    </div>
  )
}
