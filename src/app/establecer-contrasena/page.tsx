import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabase/client';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Alert, AlertDescription } from '@/components/atoms/ui/alert';
import { AuthBackground } from '@/components/molecules/AuthBackground';
import { BrandPanel } from '@/components/molecules/BrandPanel';
import { CheckCircle2, XCircle, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { validatePassword } from '@/lib/sanitize';

export default function EstablecerContrasenaPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verificando' | 'listo' | 'completado' | 'error'>('verificando');
  const [mensaje, setMensaje] = useState('');
  const [isError, setIsError] = useState(false);
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleRecovery = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setMensaje('Error al verificar el enlace. Es posible que haya expirado.');
          setIsError(true);
          setStatus('error');
          return;
        }

        if (session?.user?.email_confirmed_at) {
          setStatus('listo');
          return;
        }

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (accessToken && type === 'recovery') {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });

          if (setSessionError) {
            setMensaje('El enlace de recuperación no es válido o ha expirado.');
            setIsError(true);
            setStatus('error');
            return;
          }

          setStatus('listo');
        } else {
          setMensaje('Enlace inválido. Solicita un nuevo correo de invitación.');
          setIsError(true);
          setStatus('error');
        }
      } catch {
        setMensaje('Error inesperado al procesar el enlace.');
        setIsError(true);
        setStatus('error');
      }
    };

    handleRecovery();
  }, []);

  const contrasenasCoinciden = !confirmar || contrasena === confirmar;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordCheck = validatePassword(contrasena);
    if (!passwordCheck.ok) {
      setMensaje(passwordCheck.reason ?? 'La contraseña no cumple con la política de seguridad.');
      setIsError(true);
      return;
    }

    if (contrasena !== confirmar) {
      setMensaje('Las contraseñas no coinciden.');
      setIsError(true);
      return;
    }

    setIsSubmitting(true);
    setIsError(false);

    try {
      const { error } = await supabase.auth.updateUser({ password: contrasena });

      if (error) {
        setMensaje(error.message);
        setIsError(true);
        setIsSubmitting(false);
        return;
      }

      setStatus('completado');
      setMensaje('Contraseña establecida correctamente. Ahora puedes iniciar sesión.');
      setIsError(false);

      setTimeout(() => {
        supabase.auth.signOut();
        navigate('/login');
      }, 3000);
    } catch {
      setMensaje('Error al establecer la contraseña. Intenta de nuevo.');
      setIsError(true);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6 relative overflow-hidden">
      <AuthBackground />

      <div className="w-full max-w-5xl rounded-2xl shadow-glow overflow-hidden flex flex-col md:flex-row bg-white">
        <BrandPanel />

        <div className="w-full md:w-1/2 bg-white p-6 md:p-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-4">
              <h1 className="text-xl font-bold text-center mb-1">Establecer contraseña</h1>
              <p className="text-xs text-center text-muted-foreground">
                {status === 'verificando' && 'Verificando tu enlace...'}
                {status === 'listo' && 'Ingresa tu nueva contraseña'}
                {status === 'completado' && '¡Contraseña actualizada!'}
                {status === 'error' && 'Enlace inválido'}
              </p>
            </div>

            {status === 'verificando' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
                <p className="text-sm text-muted-foreground">Verificando enlace...</p>
              </div>
            )}

            {status === 'listo' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mensaje && (
                  <Alert variant={isError ? 'destructive' : undefined} className="flex items-center gap-3 rounded-lg px-4 py-3 shadow-sm">
                    {isError ? <XCircle className="h-5 w-5 text-red-500" /> : <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    <AlertDescription className="text-sm">{mensaje}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="contrasena">Nueva contraseña</Label>
                  <div className="relative mt-1">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="contrasena"
                      type={showPassword ? 'text' : 'password'}
                      className="pl-9 pr-10 h-11"
                      placeholder="Mínimo 8 caracteres con mayúscula, minúscula, número y especial"
                      value={contrasena}
                      onChange={e => setContrasena(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmar">Confirmar contraseña</Label>
                  <Input
                    id="confirmar"
                    type="password"
                    className={`mt-1 h-11 ${!contrasenasCoinciden ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    placeholder="Repite la contraseña"
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                    required
                  />
                  {!contrasenasCoinciden && (
                    <p className="mt-1 text-xs text-red-600">Las contraseñas deben coincidir.</p>
                  )}
                </div>

                <div className="flex justify-center pt-1">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 min-w-[240px] px-6 text-sm bg-gradient-to-r from-brand-primary to-brand-primary text-white font-semibold shadow-md"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Estableciendo...</>
                    ) : (
                      'Establecer contraseña'
                    )}
                  </Button>
                </div>
              </form>
            )}

            {status === 'completado' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">Redirigiendo al inicio de sesión...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-sm text-muted-foreground">{mensaje}</p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 text-left">
                  <strong>¿El enlace expiró?</strong>
                  <p className="mt-1">Los enlaces de invitación expiran en 24 horas. Pídele al administrador que cree la cuenta nuevamente para recibir un nuevo enlace.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="mt-2"
                >
                  Volver al inicio de sesión
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
