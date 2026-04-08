import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PawPrint, Loader2, Stethoscope } from 'lucide-react';

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

  const fillDemoCredentials = (role: 'doctora' | 'recepcion') => {
    if (role === 'doctora') {
      setEmail('doctora@kachorros.com');
    } else {
      setEmail('recepcion@kachorros.com');
    }
    setPassword('123456');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-light/30 via-background to-esmerald-50 flex items-center justify-center p-4">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-amber-gold/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-esmerald-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-violet/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-gold to-blaze-orange rounded-3xl shadow-lg mb-4">
            <PawPrint className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            <span className="text-azure-blue">Veterinaria</span>{' '}
            <span className="text-blue-violet">Kachorro's</span>
          </h1>
          <p className="text-muted-foreground mt-2">Sistema de Gestión Clínica</p>
        </div>

        <Card className="border-0 shadow-soft">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Stethoscope className="w-5 h-5 text-esmerald-500" />
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-center">
              Ingrese sus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="animate-fade-in-up">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@kachorros.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-esmerald-500 to-esmerald-600 hover:from-esmerald-600 hover:to-esmerald-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  'Ingresar al Sistema'
                )}
              </Button>
            </form>

            {/* Botones de demo rápida */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Credenciales de demostración:
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-esmerald-200 hover:bg-esmerald-50"
                  onClick={() => fillDemoCredentials('doctora')}
                >
                  <Stethoscope className="w-3 h-3 mr-1" />
                  Doctora
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-azure-blue/30 hover:bg-azure-blue/10"
                  onClick={() => fillDemoCredentials('recepcion')}
                >
                  Recepción
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Contraseña: <span className="font-mono bg-muted px-1 rounded">123456</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2024 Veterinaria Kachorro's. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
