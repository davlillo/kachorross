import { useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card'
import { Badge } from '@/components/atoms/ui/badge'
import { Separator } from '@/components/atoms/ui/separator'
import { PawPrint, Camera, Weight, Calendar, Clock, User, Phone, MapPin, AlertCircle, FileText, Loader2 } from 'lucide-react'
import type { Mascota } from '@/types'

function getAge(birthDate: string) {
  const birth = new Date(birthDate)
  const today = new Date()
  const years = today.getFullYear() - birth.getFullYear()
  const months = today.getMonth() - birth.getMonth()
  if (years > 0) return `${years} año${years > 1 ? 's' : ''}`
  return `${months} mes${months > 1 ? 'es' : ''}`
}

interface PatientInfoCardProps {
  mascota: Mascota
  onSubirFotoPerfil?: (file: File) => void
  subiendoFotoPerfil?: boolean
}

export function PatientInfoCard({ mascota, onSubirFotoPerfil, subiendoFotoPerfil }: PatientInfoCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onSubirFotoPerfil) {
      onSubirFotoPerfil(file)
    }
    e.target.value = ''
  }

  return (
    <Card className="border-0 shadow-soft lg:col-span-1">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <PawPrint className="w-5 h-5 text-purpura-500" />
          Información del Paciente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <img
              src={mascota.foto || undefined}
              alt={mascota.nombre}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-muted"
            />
            {onSubirFotoPerfil && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  disabled={subiendoFotoPerfil}
                  onClick={() => fileInputRef.current?.click()}
                  title="Actualizar foto de perfil"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-purpura-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-purpura-600 transition-colors disabled:opacity-60"
                >
                  {subiendoFotoPerfil ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <InfoRow icon={Weight} label="Peso" value={`${mascota.peso} kg`} />
          <InfoRow icon={Calendar} label="Nacimiento" value={new Date(mascota.fechaNacimiento).toLocaleDateString('es-ES')} />
          <InfoRow icon={Clock} label="Edad" value={getAge(mascota.fechaNacimiento)} />
          <InfoRow icon={Calendar} label="Registro" value={new Date(mascota.fechaRegistro).toLocaleDateString('es-ES')} />
          <InfoRow icon={User} label="Sexo" value={mascota.sexo === 'macho' ? 'Macho' : 'Hembra'} />
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-azure-blue" />
            Propietario
          </h4>
          <div className="space-y-2">
            <p className="font-medium">{mascota.propietario.nombre}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              {mascota.propietario.telefono}
            </div>
            {mascota.propietario.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-4 h-4">@</span>
                {mascota.propietario.email}
              </div>
            )}
            {mascota.propietario.direccion && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {mascota.propietario.direccion}
              </div>
            )}
          </div>
        </div>

        {mascota.alergias && mascota.alergias.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                Alergias
              </h4>
              <div className="flex flex-wrap gap-2">
                {mascota.alergias.map((alergia, idx) => (
                  <Badge key={idx} variant="destructive" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    {alergia}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {mascota.notasEspeciales && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-violet">
                <FileText className="w-4 h-4" />
                Notas Especiales
              </h4>
              <p className="text-sm text-muted-foreground bg-violet-50 p-3 rounded-lg">
                {mascota.notasEspeciales}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
