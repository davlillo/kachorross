import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/atoms/ui/dialog'
import { Input } from '@/components/atoms/ui/input'
import { Label } from '@/components/atoms/ui/label'
import { Switch } from '@/components/atoms/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/ui/select'
import { Button } from '@/components/atoms/ui/button'
import { Edit2, Plus, Save, X, Lock } from 'lucide-react'
import type { Producto } from '@/types'

const categorias = [
  { value: 'servicio',    label: 'Servicio' },
  { value: 'vacuna',      label: 'Vacuna' },
  { value: 'medicamento', label: 'Medicamento' },
  { value: 'petshop',     label: 'PetShop' },
  { value: 'laboratorio', label: 'Laboratorio' },
]

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
    categoria:  (initialData?.categoria  || 'servicio') as Producto['categoria'],
    precio:     initialData?.precio?.toString() || '',
    activo:     initialData?.activo ?? true,
  }))

  const update = (key: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSave = () => {
    onSave({
      veterinariaId: '',
      codigo:      form.codigo,
      nombre:      form.nombre,
      descripcion: form.descripcion,
      categoria:   form.categoria,
      precio:      parseFloat(form.precio) || 0,
      activo:      form.activo,
    })
  }

  const canSave = form.codigo.trim() && form.nombre.trim() && form.precio

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit
              ? <Edit2 className="w-5 h-5 text-azure-blue" />
              : <Plus className="w-5 h-5 text-purpura-500" />}
            {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Código — deshabilitado en edición */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Código
                {isEdit && <Lock className="w-3 h-3 text-muted-foreground" />}
              </Label>
              <Input
                value={form.codigo}
                onChange={(e) => update('codigo', e.target.value)}
                placeholder="Ej: SERV-001"
                disabled={isEdit}
                className={isEdit ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}
              />
              {isEdit && (
                <p className="text-[10px] text-muted-foreground">El código no se puede modificar</p>
              )}
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={form.categoria} onValueChange={(v) => update('categoria', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              value={form.nombre}
              onChange={(e) => update('nombre', e.target.value)}
              placeholder="Nombre del producto o servicio"
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input
              value={form.descripcion}
              onChange={(e) => update('descripcion', e.target.value)}
              placeholder="Descripción breve"
            />
          </div>

          <div className="space-y-2">
            <Label>Precio ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.precio}
              onChange={(e) => update('precio', e.target.value)}
              placeholder="0.00"
              className="max-w-[160px]"
            />
          </div>

          {/* Disponibilidad */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
            <div>
              <p className="text-sm font-medium">Disponibilidad</p>
              <p className="text-xs text-muted-foreground">
                {form.activo ? 'Visible y disponible para consultas' : 'Oculto en el sistema'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${form.activo ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {form.activo ? 'Disponible' : 'No disponible'}
              </span>
              <Switch checked={form.activo} onCheckedChange={(v) => update('activo', v)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-1" />Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className={isEdit
              ? 'bg-gradient-to-r from-azure-blue to-blue-violet hover:opacity-90'
              : 'bg-gradient-to-r from-purpura-500 to-purpura-600 hover:from-purpura-600 hover:to-purpura-700'}
          >
            <Save className="w-4 h-4 mr-1" />
            {isEdit ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
