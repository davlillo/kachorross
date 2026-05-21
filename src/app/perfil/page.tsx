import { useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, UserCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Label } from '@/components/atoms/ui/label';
import { Input } from '@/components/atoms/ui/input';
import { Button } from '@/components/atoms/ui/button';
import { Alert, AlertDescription } from '@/components/atoms/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { AuthController } from '@/controllers/auth.controller';

const authCtrl = AuthController.getInstance();

export default function PerfilPage() {
  const { user } = useAuth();
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [showNuevaContrasena, setShowNuevaContrasena] = useState(false);
  const [showConfirmarContrasena, setShowConfirmarContrasena] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const passwordValidation = useMemo(() => {
    if (!nuevaContrasena) return { ok: false, reason: 'Ingresa una nueva contraseña.' };
    if (nuevaContrasena.length < 6) return { ok: false, reason: 'La contraseña debe tener al menos 6 caracteres.' };
    if (nuevaContrasena !== confirmarContrasena) return { ok: false, reason: 'Las contraseñas no coinciden.' };
    return { ok: true, reason: null };
  }, [nuevaContrasena, confirmarContrasena]);

  const guardarContrasena = async () => {
    setMessage(null);
    setError(null);

    if (!passwordValidation.ok) {
      setError(passwordValidation.reason);
      return;
    }

    setIsSaving(true);
    const result = await authCtrl.actualizarContrasena(nuevaContrasena);
    setIsSaving(false);

    if (!result.ok) {
      setError(result.error ?? 'No se pudo actualizar la contraseña.');
      return;
    }

    setMessage('Contraseña actualizada correctamente.');
    setNuevaContrasena('');
    setConfirmarContrasena('');
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Perfil"
        description="Gestiona tus datos de cuenta y seguridad"
        icon={UserCircle2}
      />

      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Datos de la cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Nombre</Label>
            <Input value={user?.nombre ?? ''} disabled />
          </div>
          <div>
            <Label>Correo</Label>
            <Input value={user?.email ?? ''} disabled />
          </div>
          <div>
            <Label>Rol</Label>
            <Input value={user?.rol ?? ''} disabled />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-purpura-500" />
            Cambiar contraseña
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNuevaContrasena ? 'text' : 'password'}
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNuevaContrasena(v => !v)}
                className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground"
                aria-label={showNuevaContrasena ? 'Ocultar contraseña nueva' : 'Mostrar contraseña nueva'}
              >
                {showNuevaContrasena ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmarContrasena ? 'text' : 'password'}
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
                placeholder="Repite la nueva contraseña"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmarContrasena(v => !v)}
                className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground"
                aria-label={showConfirmarContrasena ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
              >
                {showConfirmarContrasena ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={guardarContrasena}
              disabled={isSaving}
              className="bg-gradient-to-r from-purpura-500 to-purpura-600 hover:from-purpura-600 hover:to-purpura-700"
            >
              {isSaving ? 'Guardando...' : 'Actualizar contraseña'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
