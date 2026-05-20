import { useState } from 'react'
import { Card } from '@/components/atoms/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/ui/table'
import { Badge } from '@/components/atoms/ui/badge'
import { Button } from '@/components/atoms/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/atoms/ui/dialog'
import { Edit2, Trash2, Package, AlertTriangle, CheckCircle2, XCircle, Eye } from 'lucide-react'
import type { Producto } from '@/types'

const categoriaStyles: Record<string, { label: string; className: string; icon: string }> = {
  servicio:     { label: 'Servicio',     className: 'bg-blue-100 text-blue-700',     icon: '🩺' },
  vacuna:       { label: 'Vacuna',       className: 'bg-purpura-100 text-purpura-700',icon: '💉' },
  medicamento:  { label: 'Medicamento',  className: 'bg-amber-100 text-amber-700',   icon: '💊' },
  petshop:      { label: 'PetShop',      className: 'bg-pink-100 text-pink-700',     icon: '🐾' },
  laboratorio:  { label: 'Laboratorio',  className: 'bg-violet-100 text-violet-700', icon: '🔬' },
}

interface ProductTableProps {
  productos: Producto[]
  onEdit: (producto: Producto) => void
  onDelete: (id: string) => void
}

export function ProductTable({ productos, onEdit, onDelete }: ProductTableProps) {
  const [verProducto,    setVerProducto]    = useState<Producto | null>(null)
  const [eliminarTarget, setEliminarTarget] = useState<Producto | null>(null)

  const confirmarEliminar = () => {
    if (eliminarTarget) {
      onDelete(eliminarTarget.id)
      setEliminarTarget(null)
    }
  }

  return (
    <>
      <Card className="border-0 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Código</TableHead>
                <TableHead>Producto / Servicio</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Disponibilidad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Package className="w-12 h-12 opacity-30" />
                      <p className="text-sm">No se encontraron productos</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                productos.map((producto) => {
                  const cat = categoriaStyles[producto.categoria] ?? categoriaStyles.servicio
                  return (
                    <TableRow key={producto.id} className="hover:bg-muted/30 group">
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{producto.codigo}</code>
                      </TableCell>
                      <TableCell>
                        <button
                          className="text-left hover:underline decoration-purpura-400 underline-offset-2"
                          onClick={() => setVerProducto(producto)}
                        >
                          <p className="font-semibold text-sm group-hover:text-purpura-600 transition-colors">
                            {producto.nombre}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{producto.descripcion}</p>
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${cat.className} gap-1`}>
                          <span>{cat.icon}</span>{cat.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-purpura-600">${producto.precio.toFixed(2)}</p>
                      </TableCell>
                      <TableCell>
                        {producto.activo ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                            <XCircle className="w-3 h-3" />No disponible
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-60 hover:opacity-100"
                            onClick={() => setVerProducto(producto)} title="Ver detalle">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-60 hover:opacity-100"
                            onClick={() => onEdit(producto)} title="Editar">
                            <Edit2 className="w-4 h-4 text-azure-blue" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-60 hover:opacity-100"
                            onClick={() => setEliminarTarget(producto)} title="Eliminar">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Modal detalle ── */}
      <Dialog open={!!verProducto} onOpenChange={v => !v && setVerProducto(null)}>
        <DialogContent className="max-w-md">
          {verProducto && (() => {
            const cat = categoriaStyles[verProducto.categoria] ?? categoriaStyles.servicio
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="text-2xl">{cat.icon}</span>
                    {verProducto.nombre}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="flex items-center justify-between">
                    <Badge className={cat.className}>{cat.label}</Badge>
                    {verProducto.activo ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />Disponible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                        <XCircle className="w-3 h-3" />No disponible
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/50">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Código</p>
                      <code className="text-sm font-mono font-bold">{verProducto.codigo}</code>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Precio</p>
                      <p className="text-xl font-black text-purpura-600">${verProducto.precio.toFixed(2)}</p>
                    </div>
                  </div>
                  {verProducto.descripcion && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Descripción</p>
                      <p className="text-sm">{verProducto.descripcion}</p>
                    </div>
                  )}
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setVerProducto(null)}>Cerrar</Button>
                  <Button className="bg-azure-blue hover:bg-azure-blue/90"
                    onClick={() => { setVerProducto(null); onEdit(verProducto) }}>
                    <Edit2 className="w-4 h-4 mr-2" />Editar
                  </Button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Modal confirmar eliminar ── */}
      <Dialog open={!!eliminarTarget} onOpenChange={v => !v && setEliminarTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Eliminar producto
            </DialogTitle>
            <DialogDescription className="pt-2">
              ¿Está seguro de que desea eliminar{' '}
              <span className="font-semibold text-foreground">{eliminarTarget?.nombre}</span>?
              <span className="block mt-1.5 text-red-600 font-medium text-xs">Esta acción no se puede deshacer.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setEliminarTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarEliminar}>
              <Trash2 className="w-4 h-4 mr-2" />Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
