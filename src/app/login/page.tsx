import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getHomeRouteForRole } from '@/lib/auth-routes';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Alert, AlertDescription } from '@/components/atoms/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthBackground } from '@/components/molecules/AuthBackground';
import { BrandPanel } from '@/components/molecules/BrandPanel';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, user } = useAuth();

  // Force light mode on login page — this screen is always light
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  if (user) {
    return <Navigate to={getHomeRouteForRole(user.rol)} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6 relative overflow-hidden">
      <AuthBackground />
      <div className="w-full max-w-5xl rounded-2xl shadow-glow overflow-hidden flex flex-col md:flex-row bg-white md:min-h-[520px]">
        <BrandPanel />

        <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-6" />

            <h1 className="text-2xl font-bold text-center mb-1 text-gray-900">Iniciar sesión</h1>
            <p className="text-sm text-center text-gray-500 mb-6">Ingresa tus credenciales para continuar</p>

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
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-center pt-1">
                <Button
                  type="submit"
                  className="h-11 min-w-[240px] px-6 text-sm bg-gradient-to-r from-brand-primary to-brand-primary text-white font-semibold shadow-md"
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

            <p className="text-center text-sm text-gray-400 mt-6">© 2026 Veterinaria Kachorro's</p>
          </div>
        </div>
      </div>
    </div>
  );
}
