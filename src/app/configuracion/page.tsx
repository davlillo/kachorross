import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { VeterinariaController } from '@/controllers/veterinaria.controller';
import { EmailController } from '@/controllers/email.controller';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Separator } from '@/components/atoms/ui/separator';
import {
  Settings, Upload, Building, Mail, Phone, MapPin, Loader2, PawPrint,
  Key, Save, Send, AlertTriangle, Info, Eye, EyeOff, HelpCircle, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

const vetCtrl = VeterinariaController.getInstance();
const emailCtrl = EmailController.getInstance();

export default function ConfiguracionPage() {
  const { veterinaria, refreshVeterinaria, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [emailLoading, setEmailLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailForm, setEmailForm] = useState({
    smtpUser: '',
    smtpPass: '',
    fromName: '',
  });

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
  });

  useEffect(() => {
    if (veterinaria) {
      setFormData({
        nombre: veterinaria.nombre || '',
        email: veterinaria.email || '',
        telefono: veterinaria.telefono || '',
        direccion: veterinaria.direccion || '',
      });
      setEmailForm(f => ({ ...f, fromName: veterinaria.nombre || '' }));
    }
  }, [veterinaria]);

  useEffect(() => {
    const loadEmailConfig = async () => {
      if (!user?.veterinariaId) return;
      try {
        const config = await emailCtrl.getConfig(user.veterinariaId);
        if (config) {
          setEmailForm({
            smtpUser: config.smtpUser,
            smtpPass: '',
            fromName: config.fromName || veterinaria?.nombre || '',
          });
        }
      } catch {
        // ignore
      } finally {
        setEmailLoading(false);
      }
    };
    loadEmailConfig();
  }, [user?.veterinariaId, veterinaria]);

  // Auto-fill SMTP email from clinic email
  useEffect(() => {
    if (veterinaria?.email && !emailForm.smtpUser) {
      setEmailForm(f => ({ ...f, smtpUser: veterinaria.email! }));
    }
  }, [veterinaria?.email, emailForm.smtpUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!veterinaria) return;
    setIsLoading(true);
    try {
      await vetCtrl.actualizar(veterinaria.id, formData);
      await refreshVeterinaria();
      toast.success('Datos de la clínica actualizados');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !veterinaria) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecciona una imagen válida'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('La imagen no debe superar los 2MB'); return; }
    setIsUploading(true);
    try {
      await vetCtrl.subirLogo(veterinaria.id, file);
      await refreshVeterinaria();
      toast.success('Logo actualizado');
    } catch (error: any) {
      toast.error(error.message || 'Error al subir logo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailForm(f => ({ ...f, [name]: value }));
  };

  const handleEmailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.veterinariaId) return;
    if (!emailForm.smtpUser || !emailForm.smtpPass) {
      toast.error('Completa el correo y la contraseña de aplicación');
      return;
    }
    setIsSaving(true);
    try {
      await emailCtrl.saveConfig(user.veterinariaId, emailForm);
      toast.success('Configuración de correo guardada');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
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

  if (!veterinaria) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se encontró información de la clínica.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-5xl mx-auto">
      <PageHeader
        title="Configuración"
        description="Administra los datos de tu clínica y el envío de correos"
        icon={Settings}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* ─── CARD 1: DATOS DE LA CLÍNICA ─── */}
        <Card className="border-0 shadow-soft gap-2 h-full grid grid-rows-[auto_1fr_auto]">
          <CardHeader className="pb-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="w-4 h-4 text-purpura-500" />
              Datos de la Clínica
            </CardTitle>
            <CardDescription>Información general y datos de contacto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0 min-h-0">
            {/* Logo */}
            <div className="flex flex-col items-center justify-center gap-3 py-1 min-h-[170px]">
              <div className="w-28 h-28 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-white overflow-hidden relative group">
                {veterinaria.logoUrl ? (
                  <img src={veterinaria.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <PawPrint className="w-10 h-10 text-purpura-300" />
                )}
                <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {isUploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Upload className="w-4 h-4 text-white" />}
                </div>
              </div>
              <div className="text-center">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? 'Subiendo...' : 'Cambiar logo'}
                </Button>
                <p className="text-[10px] text-muted-foreground mt-1">PNG o JPG, máx 2MB</p>
              </div>
            </div>

            <form id="clinic-form" onSubmit={handleSave} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input id="nombre" name="nombre" className="pl-8 h-9 text-sm" value={formData.nombre} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input id="email" name="email" type="email" className="pl-8 h-9 text-sm" value={formData.email} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefono">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input id="telefono" name="telefono" className="pl-8 h-9 text-sm" value={formData.telefono} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="direccion">Dirección</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input id="direccion" name="direccion" className="pl-8 h-9 text-sm" value={formData.direccion} onChange={handleInputChange} />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="border-t pt-4 w-full">
            <Button type="submit" form="clinic-form" disabled={isLoading} className="bg-purpura-600 hover:bg-purpura-700 h-9 w-full">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar cambios
            </Button>
          </CardFooter>
        </Card>

        {/* ─── CARD 2: CORREO SMTP ─── */}
        <Card className="border-0 shadow-soft gap-2 h-full grid grid-rows-[auto_1fr_auto]">
          <CardHeader className="pb-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4 text-purpura-500" />
              Correo SMTP (Gmail)
            </CardTitle>
            <CardDescription>Configuración para automatizar el envio de correos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0 min-h-0">
            {emailLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-purpura-500" />
              </div>
            ) : (
              <>
                <div className="min-h-[170px] flex flex-col items-center justify-center py-1">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 w-full text-left">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-amber-800 space-y-0.5">
                        <p className="font-semibold">App Password de Google</p>
                        <ol className="list-decimal ml-4 space-y-0.5">
                          <li>Activa verificación en 2 pasos en tu Gmail</li>
                          <li>Ve a <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-medium">google.com/apppasswords</a></li>
                          <li>Crea una para <strong>"Nombre de tu veterinaria"</strong></li>
                          <li>Copia los 16 caracteres y pégala abajo</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>

                <form id="email-form" onSubmit={handleEmailSave} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="smtpUser">Correo Gmail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        id="smtpUser"
                        name="smtpUser"
                        type="email"
                        className="pl-8 h-9 text-sm"
                        placeholder="veterinariakachorros@gmail.com"
                        value={emailForm.smtpUser}
                        onChange={handleEmailChange}
                        required
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Se carga automático desde los datos de la clínica</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="smtpPass">App Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        id="smtpPass"
                        name="smtpPass"
                        type={showPassword ? 'text' : 'password'}
                        className="pl-8 pr-10 h-9 text-sm"
                        placeholder="xxxx xxxx xxxx xxxx"
                        value={emailForm.smtpPass}
                        onChange={handleEmailChange}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">16 caracteres generados por Google</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fromName">Nombre del remitente</Label>
                    <Input
                      id="fromName"
                      name="fromName"
                      className="h-9 text-sm"
                      placeholder={veterinaria?.nombre || 'Veterinaria Kachorros'}
                      value={emailForm.fromName}
                      onChange={handleEmailChange}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-purpura-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground">
                      Se usa para enviar invitaciones a nuevos usuarios, recetas a propietarios y notificaciones de controles proximos.
                    </p>
                  </div>
                </form>
              </>
            )}
          </CardContent>
          {!emailLoading && (
            <CardFooter className="border-t pt-4 gap-2 w-full">
              <Button
                type="submit"
                form="email-form"
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-purpura-500 to-purpura-600 hover:from-purpura-600 hover:to-purpura-700 h-9"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Guardar
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isTesting}
                onClick={handleTest}
                className="h-9"
              >
                {isTesting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                Probar
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
