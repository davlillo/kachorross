import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/atoms/ui/dialog'
import { Button } from '@/components/atoms/ui/button'
import { CheckCircle } from 'lucide-react'

interface ConfirmSalidaDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: () => void
}

export function ConfirmSalidaDialog({ open, onOpenChange, onConfirm }: ConfirmSalidaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">¿Confirmar salida?</DialogTitle>
        </DialogHeader>
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-purpura-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-purpura-600" />
          </div>
          <p className="text-muted-foreground">
            Esta acción marcará la consulta como finalizada y el paciente saldrá de la lista activa.
          </p>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="flex-1 bg-gradient-to-r from-purpura-500 to-purpura-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
