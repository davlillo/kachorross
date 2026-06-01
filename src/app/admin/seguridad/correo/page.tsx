import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EmailController } from '@/controllers/email.controller';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Alert, AlertDescription } from '@/components/atoms/ui/alert';
import {
  Mail, Key, Save, Send, Loader2,
  AlertTriangle, Info, Eye, EyeOff, Building,
} from 'lucide-react';
import { toast } from 'sonner';

const emailCtrl = EmailController.getInstance();

export default function SeguridadCorreoPage() {
  const { user, veterinaria } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    smtpUser: '',
    smtpPass: '',
    fromName: veterinaria?.nombre || 'Veterinaria Kachorros',
  });

  useEffect(() => {
    const loadConfig = async () => {
      if (!user?.veterinariaId) return;
      try {
        const config = await emailCtrl.getConfig(user.veterinariaId);
        if (config) {
          setForm({
            smtpUser: config.smtpUser,
            smtpPass: '',
            fromName: config.fromName || veterinaria?.nombre || 'Veterinaria Kachorros',
          });
        } else if (veterinaria?.email) {
          setForm(f => ({ ...f, smtpUser: veterinaria.email! }));
        }
      } catch (err) {
        toast.error('Error al cargar configuración');
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, [user?.veterinariaId, veterinaria]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.veterinariaId) return;

    if (!form.smtpUser || !form.smtpPass) {
      toast.error('Completa el correo y la contraseña de aplicación');
      return;
    }

    setIsSaving(true);
    try {
      await emailCtrl.saveConfig(user.veterinariaId, form);
      toast.success('Configuración guardada correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!user?.veterinariaId) return;
    setIsTesting(true);
    try {
      const result = await emailCtrl.probarConexion(user.veterinariaId);
      if (result.ok) {
        toast.success('Correo de prueba enviado correctamente');
      } else {
        toast.error(result.error || 'Error al enviar correo de prueba');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error de conexión');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purpura-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl mx-auto">
      <PageHeader
        title="Configuración de Correo"
        description="Configura el envío de correos usando la cuenta Gmail de la clínica"
        icon={Mail}
      />

      <Alert className="bg-amber-50 border-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <AlertDescription className="text-xs text-amber-800">
          <strong>¿Cómo obtener tu App Password de Google?</strong>
          <ol className="list-decimal ml-4 mt-1 space-y-1">
            <li>Activa verificación en 2 pasos en tu cuenta Gmail</li>
            <li>Ve a <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-medium">google.com/apppasswords</a></li>
            <li>Crea una contraseña para "Kachorros Sistema"</li>
            <li>Copia los 16 caracteres y pégala abajo</li>
          </ol>
        </AlertDescription>
      </Alert>

      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4 text-purpura-500" />
            Cuenta de Gmail
          </CardTitle>
          <CardDescription>La clínica usará esta cuenta para enviar correos a los usuarios</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="smtpUser">Correo electrónico *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="smtpUser"
                  name="smtpUser"
                  type="email"
                  className="pl-9"
                  placeholder="veterinariakachorros@gmail.com"
                  value={form.smtpUser}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="smtpPass">App Password *</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="smtpPass"
                  name="smtpPass"
                  type={showPassword ? 'text' : 'password'}
                  className="pl-9 pr-10"
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={form.smtpPass}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Contraseña de aplicación de Google de 16 caracteres
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fromName">Nombre del remitente</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="fromName"
                  name="fromName"
                  className="pl-9"
                  placeholder={veterinaria?.nombre || 'Veterinaria Kachorros'}
                  value={form.fromName}
                  onChange={handleChange}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Nombre con el que aparecerán los correos (ej: "Veterinaria Kachorros")
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-purpura-500 to-purpura-600 hover:from-purpura-600 hover:to-purpura-700"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar configuración
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isTesting}
                onClick={handleTest}
              >
                {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {isTesting ? 'Enviando...' : 'Enviar correo de prueba'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-purpura-500" />
            ¿Para qué se usa esta configuración?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-purpura-500 shrink-0 mt-0.5" />
              <span><strong>Invitación de usuarios</strong> — Al crear una cuenta nueva, se envía un correo para que el usuario establezca su contraseña.</span>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-purpura-500 shrink-0 mt-0.5" />
              <span><strong>Recetas y tratamientos</strong> — Envío de recetas médicas al propietario (próximamente).</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
