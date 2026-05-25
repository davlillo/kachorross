import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { VeterinariaController } from '@/controllers/veterinaria.controller';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Settings, Upload, Building, Mail, Phone, MapPin, Loader2, PawPrint } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfiguracionPage() {
  const { veterinaria, refreshVeterinaria } = useAuth();
  const vetCtrl = VeterinariaController.getInstance();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: veterinaria?.nombre || '',
    email: veterinaria?.email || '',
    telefono: veterinaria?.telefono || '',
    direccion: veterinaria?.direccion || '',
  });

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
      toast.success('Configuración actualizada correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !veterinaria) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona una imagen válida');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 2MB');
      return;
    }

    setIsUploading(true);
    try {
      await vetCtrl.subirLogo(veterinaria.id, file);
      await refreshVeterinaria();
      toast.success('Logo actualizado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al subir el logo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    <div className="space-y-6 animate-fade-in-up max-w-4xl mx-auto">
      <PageHeader
        title="Configuración de la Clínica"
        description="Gestiona la información pública y el branding de tu veterinaria"
        icon={Settings}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna Izquierda: Logo */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Logo de la Clínica</CardTitle>
              <CardDescription>Aparecerá en el menú lateral y en los documentos impresos.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-white overflow-hidden mb-4 relative group shadow-sm">
                {veterinaria.logoUrl ? (
                  <img 
                    src={veterinaria.logoUrl} 
                    alt="Logo" 
                    className="w-full h-full object-contain p-2" 
                  />
                ) : (
                  <PawPrint className="w-12 h-12 text-purpura-300" />
                )}
                
                <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={isUploading}
              />
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Subiendo...' : 'Cambiar Logo'}
              </Button>
              <p className="text-[10px] text-muted-foreground mt-2">
                Recomendado: PNG o JPG cuadrado, máx 2MB.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Formulario */}
        <div className="md:col-span-2">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Información General</CardTitle>
              <CardDescription>Actualiza los datos de contacto de tu clínica.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Clínica</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="nombre"
                      name="nombre"
                      className="pl-9"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        className="pl-9"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="telefono"
                        name="telefono"
                        className="pl-9"
                        value={formData.telefono}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección Física</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="direccion"
                      name="direccion"
                      className="pl-9"
                      value={formData.direccion}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={isLoading} className="bg-purpura-600 hover:bg-purpura-700">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
