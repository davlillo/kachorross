import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/atoms/ui/dialog'
import { Input } from '@/components/atoms/ui/input'
import { Label } from '@/components/atoms/ui/label'
import { Switch } from '@/components/atoms/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/ui/select'
import { Button } from '@/components/atoms/ui/button'
import { Edit2, Plus, Save, X, Lock, AlertTriangle } from 'lucide-react'
import type { Producto } from '@/types'
import { CATEGORIAS_CATALOGO, categoriaFromCodigo } from '@/lib/catalogo-categorias'

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSave: (data: Omit<Producto, 'id'>) => void
  initialData?: Producto
  mode?: 'create' | 'edit'
}

export function ProductFormDialog({ open, onOpenChange, onSave, initialData, mode = 'create' }: ProductFormDialogProps) {
  const isEdit = mode === 'edit'

  const [form, setForm] = useState(() => ({
    codigo:     initialData?.codigo      || '',
    nombre:     initialData?.nombre      || '',
    descripcion:initialData?.descripcion || '',
    categoria:  (initialData?.categoria  || 'consulta') as Producto['categoria'],
    precio:     initialData?.precio?.toString() || '',
    activo:     initialData?.activo ?? true,
  }))
  const [confirming, setConfirming] = useState(false)

  /**
   * Edición y algo cambió. El aviso solo aparece si hay diferencias reales: abrir
   * el diálogo y guardar sin tocar nada no debe pedir confirmación.
   *
   * `codigo` queda fuera porque está bloqueado en edición, y `precio` se compara
   * como número porque "8.5" y "8.50" son el mismo precio.
   */
  const hayCambios = isEdit && !!initialData && (
    form.nombre.trim() !== (initialData.nombre || '').trim() ||
    form.descripcion.trim() !== (initialData.descripcion || '').trim() ||
    form.categoria !== initialData.categoria ||
    (parseFloat(form.precio) || 0) !== (initialData.precio || 0) ||
    form.activo !== initialData.activo
  )

  const update = (field: string, value: string | boolean) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'codigo' && typeof value === 'string' && value.includes('-')) {
        next.categoria = categoriaFromCodigo(value)
      }
      return next
    })
  }

  const guardar = () => {
    onSave({
      veterinariaId: '',
      codigo:      form.codigo,
      nombre:      form.nombre,
      descripcion: form.descripcion,
      categoria:   form.categoria,
      precio:      parseFloat(form.precio) || 0,
      activo:      form.activo,
    })
    cerrar()
  }

  const cerrar = () => {
    setConfirming(false)
    onOpenChange(false)
  }

  const handleSave = () => {
    if (hayCambios && !confirming) {
      setConfirming(true)
      return
    }
    guardar()
  }

  /**
   * Escape o click fuera del modal: si está en el paso de confirmación vuelve al
   * formulario en vez de cerrar y perder lo que el usuario estaba editando.
   */
  const handleOpenChange = (v: boolean) => {
    if (!v && confirming) {
      setConfirming(false)
      return
    }
    setConfirming(false)
    onOpenChange(v)
  }

  const canSave = form.codigo.trim() && form.nombre.trim() && form.precio

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {confirming
              ? <AlertTriangle className="w-5 h-5 text-amber-500" />
              : isEdit ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {confirming ? 'Confirmar cambios' : isEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
        </DialogHeader>

        {confirming ? (
          /* ── Paso de confirmación ──
             Cambia de panel dentro del mismo Dialog en vez de abrir un segundo
             dialog encima: Radix compite por el foco y el portal cuando hay dos. */
          <div className="py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-muted-foreground">
              ¿Está seguro de que desea modificar los datos de{' '}
              <span className="font-semibold text-foreground">{initialData?.nombre}</span>?
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Esta acción actualizará la información de este item en el catálogo.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codigo" className="mb-1">Código</Label>
                <div className="relative">
                  <Input
                    id="codigo"
                    value={form.codigo}
                    onChange={(e) => update('codigo', e.target.value.toUpperCase())}
                    placeholder="CON-0001"
                    disabled={isEdit}
                    className={isEdit ? 'pr-8' : ''}
                  />
                  {isEdit && <Lock className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
              <div>
                <Label htmlFor="categoria" className="mb-1">Categoría</Label>
                <Select value={form.categoria} onValueChange={(v) => update('categoria', v)}>
                  <SelectTrigger id="categoria"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_CATALOGO.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">Se infiere del prefijo del código</p>
              </div>
            </div>

            <div>
              <Label htmlFor="nombre" className="mb-1">Nombre</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => update('nombre', e.target.value)}
                placeholder="Nombre del producto o servicio"
              />
            </div>

            <div>
              <Label htmlFor="descripcion" className="mb-1">Descripción</Label>
              <Input
                id="descripcion"
                value={form.descripcion}
                onChange={(e) => update('descripcion', e.target.value)}
                placeholder="Descripción detallada (jerarquía del volante)"
              />
            </div>

            <div>
              <Label htmlFor="precio" className="mb-1">Precio ($)</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                min="0"
                value={form.precio}
                onChange={(e) => update('precio', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="activo">Activo en catálogo</Label>
              <Switch id="activo" checked={form.activo} onCheckedChange={(v) => update('activo', v)} />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {confirming ? (
            <>
              <Button variant="outline" onClick={() => setConfirming(false)}>
                <X className="w-4 h-4 mr-1" /> Volver
              </Button>
              <Button onClick={guardar}>
                <Save className="w-4 h-4 mr-1" /> Guardar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={cerrar}>
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!canSave}>
                <Save className="w-4 h-4 mr-1" /> Guardar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
