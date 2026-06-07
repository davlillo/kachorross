import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthController } from '@/controllers/auth.controller';
import { MascotaController } from '@/controllers/mascota.controller';
import { supabase } from '@/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Textarea } from '@/components/atoms/ui/textarea';
import { PageHeader } from '@/components/molecules/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/ui/select';
import { PawPrint, User, Save, ArrowLeft, Camera, X } from 'lucide-react';
import type { Mascota } from '@/types';
import {
  formatTelefono,
  formatPeso,
  isTelefonoValid,
  isEmailValid,
  isPesoValid,
  TELEFONO_MAX_LENGTH,
  TELEFONO_PLACEHOLDER,
} from '@/lib/input-validators';
import { cn, todayLocal } from '@/lib/utils';

const especies: { value: Mascota['especie']; label: string }[] = [
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'ave', label: 'Ave' },
  { value: 'conejo', label: 'Conejo' },
  { value: 'otro', label: 'Otro' },
];

export default function NuevoExpedientePage() {
  const navigate = useNavigate();
  const ctrl = MascotaController.getInstance();

  const hoy = todayLocal();
  const [hoyY, hoyM, hoyD] = hoy.split('-').map(Number);
  const hace30Anos = `${hoyY - 30}-${String(hoyM).padStart(2, '0')}-${String(hoyD).padStart(2, '0')}`;

  const [propNombre, setPropNombre] = useState('');
  const [propTelefono, setPropTelefono] = useState('');
  const [propEmail, setPropEmail] = useState('');
  const [propDireccion, setPropDireccion] = useState('');

  const [mascotaNombre, setMascotaNombre] = useState('');
  const [mascotaEspecie, setMascotaEspecie] = useState<Mascota['especie']>('perro');
  const [mascotaRaza, setMascotaRaza] = useState('');
  const [mascotaFechaNac, setMascotaFechaNac] = useState('');
  const [mascotaSexo, setMascotaSexo] = useState<Mascota['sexo']>('macho');
  const [mascotaColor, setMascotaColor] = useState('');
  const [mascotaPeso, setMascotaPeso] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [mascotaAlergias, setMascotaAlergias] = useState('');
  const [mascotaNotas, setMascotaNotas] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    telefono: false,
    email: false,
    peso: false,
  });

  const telefonoOk = isTelefonoValid(propTelefono);
  const emailOk = isEmailValid(propEmail);
  const pesoOk = isPesoValid(mascotaPeso);

  const isValid =
    propNombre.trim() &&
    telefonoOk &&
    emailOk &&
    pesoOk &&
    mascotaNombre.trim() &&
    mascotaRaza.trim() &&
    mascotaFechaNac.trim();

  const telefonoError = touched.telefono && !telefonoOk
    ? 'Ingrese 8 dígitos (ej: 7777-0000)'
    : null;
  const emailError = touched.email && !emailOk
    ? 'Ingrese un correo válido (ej: correo@ejemplo.com)'
    : null;
  const pesoError = touched.peso && !pesoOk
    ? 'El peso no puede ser negativo'
    : null;

  const subirFotoMascota = async (): Promise<string | undefined> => {
    if (!fotoFile) return undefined;

    const authCtrl = AuthController.getInstance();
    const currentUser = await authCtrl.resolveUser();
    const veterinariaId = currentUser?.veterinariaId;
    if (!veterinariaId) throw new Error('No se encontró veterinaria activa');

    const ext = (fotoFile.name.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `${veterinariaId}/${crypto.randomUUID()}.${ext}`;
    const contentType = fotoFile.type || `image/${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('mascotas')
      .upload(fileName, fotoFile, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      });

    if (uploadError) {
      throw new Error(`No se pudo subir la foto: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from('mascotas').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ telefono: true, email: true, peso: true });
    if (!isValid) return;
    setError(null);

    try {
      setIsSaving(true);
      const fotoPersistente = await subirFotoMascota();

      const expediente = await ctrl.registrar({
        propietario: {
          nombre: propNombre.trim(),
          telefono: propTelefono.trim(),
          email: propEmail.trim() || undefined,
          direccion: propDireccion.trim() || undefined,
        },
        mascota: {
          nombre: mascotaNombre.trim(),
          especie: mascotaEspecie,
          raza: mascotaRaza.trim(),
          fechaNacimiento: mascotaFechaNac,
          sexo: mascotaSexo,
          color: mascotaColor.trim() || undefined,
          peso: mascotaPeso ? parseFloat(mascotaPeso) : undefined,
          foto: fotoPersistente || undefined,
          alergias: mascotaAlergias
            ? mascotaAlergias.split(',').map(a => a.trim()).filter(Boolean)
            : undefined,
          notasEspeciales: mascotaNotas.trim() || undefined,
        },
      });

      navigate(`/expedientes/${expediente.mascotaId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el paciente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Nuevo Paciente"
        description="Registre un nuevo paciente y su propietario en el sistema"
        icon={PawPrint}
        backHref="/expedientes"
      />

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-azure-blue" />
                Datos del Propietario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="propNombre">Nombre completo *</Label>
                <Input
                  id="propNombre"
                  placeholder="Nombre y apellido"
                  value={propNombre}
                  onChange={(e) => setPropNombre(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="propTelefono">Teléfono *</Label>
                <Input
                  id="propTelefono"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder={TELEFONO_PLACEHOLDER}
                  maxLength={TELEFONO_MAX_LENGTH}
                  value={propTelefono}
                  onChange={(e) => setPropTelefono(formatTelefono(e.target.value))}
                  onBlur={() => setTouched(t => ({ ...t, telefono: true }))}
                  className={cn('mt-1', telefonoError && 'border-red-500 focus-visible:ring-red-500')}
                  aria-invalid={!!telefonoError}
                  required
                />
                {telefonoError && (
                  <p className="mt-1 text-xs text-red-600">{telefonoError}</p>
                )}
              </div>
              <div>
                <Label htmlFor="propEmail">Correo electrónico</Label>
                <Input
                  id="propEmail"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                  value={propEmail}
                  onChange={(e) => setPropEmail(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, email: true }))}
                  className={cn('mt-1', emailError && 'border-red-500 focus-visible:ring-red-500')}
                  aria-invalid={!!emailError}
                />
                {emailError && (
                  <p className="mt-1 text-xs text-red-600">{emailError}</p>
                )}
              </div>
              <div>
                <Label htmlFor="propDireccion">Dirección</Label>
                <Input
                  id="propDireccion"
                  placeholder="Colonia, ciudad, país"
                  value={propDireccion}
                  onChange={(e) => setPropDireccion(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-purpura-500" />
                Datos de la Mascota
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mascotaNombre">Nombre *</Label>
                  <Input
                    id="mascotaNombre"
                    placeholder="Nombre de la mascota"
                    value={mascotaNombre}
                    onChange={(e) => setMascotaNombre(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mascotaEspecie">Especie *</Label>
                  <Select value={mascotaEspecie} onValueChange={(v) => setMascotaEspecie(v as Mascota['especie'])}>
                    <SelectTrigger id="mascotaEspecie" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {especies.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mascotaRaza">Raza *</Label>
                  <Input
                    id="mascotaRaza"
                    placeholder="Ej: Golden Retriever"
                    value={mascotaRaza}
                    onChange={(e) => setMascotaRaza(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mascotaFechaNac">Fecha de Nacimiento *</Label>
                  <Input
                    id="mascotaFechaNac"
                    type="date"
                    value={mascotaFechaNac}
                    onChange={(e) => setMascotaFechaNac(e.target.value)}
                    className="mt-1"
                    min={hace30Anos}
                    max={hoy}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mascotaSexo">Sexo *</Label>
                  <Select value={mascotaSexo} onValueChange={(v) => setMascotaSexo(v as Mascota['sexo'])}>
                    <SelectTrigger id="mascotaSexo" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="macho">Macho</SelectItem>
                      <SelectItem value="hembra">Hembra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="mascotaColor">Color</Label>
                  <Input
                    id="mascotaColor"
                    placeholder="Ej: Dorado"
                    value={mascotaColor}
                    onChange={(e) => setMascotaColor(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mascotaPeso">Peso (kg)</Label>
                  <Input
                    id="mascotaPeso"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.0"
                    value={mascotaPeso}
                    onChange={(e) => setMascotaPeso(formatPeso(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                    }}
                    onBlur={() => setTouched(t => ({ ...t, peso: true }))}
                    className={cn('mt-1', pesoError && 'border-red-500 focus-visible:ring-red-500')}
                    aria-invalid={!!pesoError}
                  />
                  {pesoError && (
                    <p className="mt-1 text-xs text-red-600">{pesoError}</p>
                  )}
                </div>
                <div>
                  <Label>Foto</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <label
                      htmlFor="mascotaFoto"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-muted-foreground/30 hover:border-purpura-300 hover:bg-purpura-50 cursor-pointer transition-colors text-sm text-muted-foreground"
                    >
                      <Camera className="w-4 h-4" />
                      {fotoFile ? fotoFile.name : 'Subir foto'}
                    </label>
                    <Input
                      id="mascotaFoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFotoFile(file);
                          setFotoPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                    />
                    {fotoPreview && (
                      <div className="relative shrink-0">
                        <img
                          src={fotoPreview}
                          alt="Preview"
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => { setFotoFile(null); setFotoPreview(null); }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {!fotoPreview && (
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="mascotaAlergias">Alergias (separadas por coma)</Label>
                <Input
                  id="mascotaAlergias"
                  placeholder="Pollo, Gluten, Ácaros"
                  value={mascotaAlergias}
                  onChange={(e) => setMascotaAlergias(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="mascotaNotas">Notas Especiales</Label>
                <Textarea
                  id="mascotaNotas"
                  placeholder="Información relevante sobre la mascota..."
                  value={mascotaNotas}
                  onChange={(e) => setMascotaNotas(e.target.value)}
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/expedientes')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isSaving}
            className="bg-gradient-to-r from-purpura-500 to-purpura-600 hover:from-purpura-600 hover:to-purpura-700 min-w-[180px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Paciente'}
          </Button>
        </div>
      </form>
    </div>
  );
}
