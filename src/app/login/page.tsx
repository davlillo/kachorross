import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import logo from '@/media/logo.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, user } = useAuth();
  const navigate = useNavigate();

  // Redirigir si ya está autenticado
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6 relative overflow-hidden">
      {/* Fondo elegante y sutil */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 bg-purpura-400/12 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 w-96 h-96 bg-azure-blue/12 rounded-full blur-3xl" />
      {/* Capas de fondo adicionales: blobs y vignette para mejorar el espacio alrededor */}
      <div className="pointer-events-none absolute -top-40 left-10 w-80 h-80 rounded-full" style={{background: 'radial-gradient(circle at 30% 30%, rgba(124,58,237,0.06), transparent 30%)', filter: 'blur(48px)'}} />
      <div className="pointer-events-none absolute -bottom-40 right-8 w-96 h-96 rounded-full" style={{background: 'radial-gradient(circle at 70% 70%, rgba(58,134,255,0.04), transparent 25%)', filter: 'blur(56px)'}} />
      <div className="pointer-events-none absolute inset-0" aria-hidden style={{background: 'radial-gradient(circle at 50% 10%, rgba(2,6,23,0.02), transparent 25%), radial-gradient(ellipse at center, rgba(255,255,255,0.0), transparent 60%)'}} />
      <div className="w-full max-w-5xl rounded-2xl shadow-glow overflow-hidden flex flex-col md:flex-row bg-white md:min-h-[520px]">
        {/* Left panel: ilustración / branding */}
        <div className="hidden md:flex w-full md:w-1/2 bg-gradient-to-br from-purpura-700 to-purpura-500 p-12 md:p-12 flex-col justify-center items-start gap-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-white/0 pointer-events-none" aria-hidden="true" />
          {/* Decoración SVG sutil */}
          <svg className="absolute -right-24 -bottom-24 opacity-20" width="420" height="420" viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.06" />
              </linearGradient>
            </defs>
            <circle cx="210" cy="210" r="200" fill="url(#g1)" />
          </svg>

          <div className="flex items-center gap-6">
            <div className="w-44 h-44 flex items-center justify-center">
              <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
            <div>
              <h2 className="text-4xl font-extrabold leading-tight">Veterinaria<br/>Kachorros</h2>
              <p className="text-sm opacity-90 mt-2">Sistema de Gestión Clínica</p>
            </div>
          </div>

          
        </div>

        {/* Right panel: formulario */}
        <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-6" />

            <h1 className="text-2xl font-bold text-center mb-1">Iniciar sesión</h1>
            <p className="text-sm text-center text-muted-foreground mb-6">Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@kachorros.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 h-11"
                />
              </div>

              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 h-11"
                />
              </div>

              <div className="flex justify-center pt-1">
                <Button
                  type="submit"
                  className="h-11 min-w-[240px] px-6 text-sm bg-gradient-to-r from-purpura-500 to-purpura-600 text-white font-semibold shadow-md"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" />
                      Ingresando...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </div>
            </form>

            

            <p className="text-center text-sm text-muted-foreground mt-6">© 2026 Veterinaria Kachorro's</p>
          </div>
        </div>
      </div>
    </div>
  );
}
