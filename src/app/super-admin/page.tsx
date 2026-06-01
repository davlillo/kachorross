import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { VeterinariaController } from '@/controllers/veterinaria.controller';
import { AuthController } from '@/controllers/auth.controller';
import type { Veterinaria, Perfil } from '@/types';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/atoms/ui/dialog';
import { Label } from '@/components/atoms/ui/label';
import { Badge } from '@/components/atoms/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/atoms/ui/tabs';
import { Building2, Plus, Power, PowerOff, ShieldAlert, UserCog, Copy, Check, Trash2, AlertTriangle } from 'lucide-react';

const vetCtrl = VeterinariaController.getInstance();
const authCtrl = AuthController.getInstance();

export default function SuperAdminPage() {
  const { user: currentUser } = useAuth();
  const [veterinarias, setVeterinarias] = useState<Veterinaria[]>([]);
  const [superAdmins, setSuperAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSuperAdminDialogOpen, setIsSuperAdminDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state para veterinaria
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    adminNombre: '',
    adminEmail: '',
  });

  // Form state para super admin
  const [saFormData, setSaFormData] = useState({
    nombre: '',
    email: '',
  });

  const [recoveryLink, setRecoveryLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Delete state
  const [deleteVetTarget, setDeleteVetTarget] = useState<Veterinaria | null>(null);
  const [deleteSaTarget, setDeleteSaTarget] = useState<Perfil | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [vetsData, usersData] = await Promise.all([
        vetCtrl.getAll(),
        authCtrl.listarUsuarios()
      ]);
      setVeterinarias(vetsData);
      setSuperAdmins(usersData.filter(u => u.rol === 'super_admin'));
    } catch (error: any) {
      toast.error('Error al cargar datos', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSaFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // 1. Crear la veterinaria
      const nuevaVet = await vetCtrl.crear({
        nombre: formData.nombre,
        direccion: formData.direccion,
        telefono: formData.telefono,
        email: formData.email,
      });

      // 2. Crear el usuario admin para esta veterinaria
      await authCtrl.crearUsuario({
        nombre: formData.adminNombre,
        email: formData.adminEmail,
        rol: 'admin',
        veterinariaId: nuevaVet.id
      });

      toast.success('Veterinaria creada exitosamente', {
        description: 'Se ha enviado un correo de invitación al administrador.'
      });
      
      setIsDialogOpen(false);
      setFormData({
        nombre: '', direccion: '', telefono: '', email: '', adminNombre: '', adminEmail: ''
      });
      loadData();
    } catch (error: any) {
      toast.error('Error al crear veterinaria', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const result = await authCtrl.crearUsuario({
        nombre: saFormData.nombre,
        email: saFormData.email,
        rol: 'super_admin',
      });

      toast.success('Super Admin creado exitosamente');

      if (result.recoveryLink) {
        setRecoveryLink(result.recoveryLink);
        setLinkCopied(false);
      }

      setIsSuperAdminDialogOpen(false);
      setSaFormData({ nombre: '', email: '' });
      loadData();
    } catch (error: any) {
      toast.error('Error al crear Super Admin', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = () => {
    if (recoveryLink) {
      navigator.clipboard.writeText(recoveryLink);
      setLinkCopied(true);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  const toggleEstado = async (vet: Veterinaria) => {
    try {
      if (vet.estado === 'activo') {
        await vetCtrl.suspender(vet.id);
        toast.success(`Veterinaria ${vet.nombre} suspendida`);
      } else {
        await vetCtrl.activar(vet.id);
        toast.success(`Veterinaria ${vet.nombre} activada`);
      }
      loadData();
    } catch (error: any) {
      toast.error('Error al cambiar estado', { description: error.message });
    }
  };

  const confirmDeleteVet = async () => {
    if (!deleteVetTarget) return;
    setIsDeleting(true);
    try {
      await vetCtrl.eliminar(deleteVetTarget.id);
      toast.success(`Veterinaria ${deleteVetTarget.nombre} eliminada`);
      setDeleteVetTarget(null);
      loadData();
    } catch (error: any) {
      toast.error('Error al eliminar', { description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteSa = async () => {
    if (!deleteSaTarget) return;
    setIsDeleting(true);
    try {
      await authCtrl.eliminarUsuario(deleteSaTarget.id);
      toast.success(`${deleteSaTarget.nombre} eliminado`);
      setDeleteSaTarget(null);
      loadData();
    } catch (error: any) {
      toast.error('Error al eliminar', { description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-primary" />
            Panel Super Admin
          </h1>
          <p className="text-muted-foreground">Gestión global del sistema SaaS</p>
        </div>
      </div>

      <Tabs defaultValue="veterinarias" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="veterinarias">Clínicas (Tenants)</TabsTrigger>
          <TabsTrigger value="admins">Super Administradores</TabsTrigger>
        </TabsList>

        <TabsContent value="veterinarias" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Veterinaria
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Registrar Nueva Veterinaria</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium border-b pb-2">Datos de la Clínica</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="nombre">Nombre de la Veterinaria *</Label>
                        <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="direccion">Dirección</Label>
                        <Input id="direccion" name="direccion" value={formData.direccion} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email de Contacto</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                      </div>
                    </div>

                    <h3 className="text-sm font-medium border-b pb-2 pt-4">Cuenta de Administrador</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="adminNombre">Nombre del Administrador *</Label>
                        <Input id="adminNombre" name="adminNombre" value={formData.adminNombre} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="adminEmail">Email de Acceso (Usuario) *</Label>
                        <Input id="adminEmail" name="adminEmail" type="email" value={formData.adminEmail} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Guardando...' : 'Crear Veterinaria'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veterinaria</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Cargando veterinarias...
                    </TableCell>
                  </TableRow>
                ) : veterinarias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground flex flex-col items-center justify-center">
                      <Building2 className="h-12 w-12 mb-2 opacity-20" />
                      <p>No hay veterinarias registradas</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  veterinarias.map((vet) => (
                    <TableRow key={vet.id}>
                      <TableCell>
                        <div className="font-medium">{vet.nombre}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{vet.direccion || 'Sin dirección'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{vet.email || 'Sin email'}</div>
                        <div className="text-xs text-muted-foreground">{vet.telefono || 'Sin teléfono'}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(vet.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={vet.estado === 'activo' ? 'default' : 'destructive'} className="capitalize">
                          {vet.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant={vet.estado === 'activo' ? 'outline' : 'default'} 
                            size="sm"
                            onClick={() => toggleEstado(vet)}
                            className={vet.estado === 'activo' ? 'text-destructive hover:text-destructive' : ''}
                          >
                            {vet.estado === 'activo' ? (
                              <><PowerOff className="h-4 w-4 mr-1" /> Suspender</>
                            ) : (
                              <><Power className="h-4 w-4 mr-1" /> Activar</>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setDeleteVetTarget(vet)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="admins" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Dialog open={isSuperAdminDialogOpen} onOpenChange={setIsSuperAdminDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserCog className="mr-2 h-4 w-4" />
                  Nuevo Super Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Registrar Super Administrador</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSuperAdmin} className="space-y-4 py-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="saNombre">Nombre Completo *</Label>
                      <Input id="saNombre" name="nombre" value={saFormData.nombre} onChange={handleSaInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="saEmail">Email de Acceso *</Label>
                      <Input id="saEmail" name="email" type="email" value={saFormData.email} onChange={handleSaInputChange} required />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsSuperAdminDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Guardando...' : 'Crear Super Admin'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Cargando administradores...
                      </TableCell>
                    </TableRow>
                  ) : superAdmins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No hay super administradores registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  superAdmins.map((admin: Perfil) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.nombre}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Super Admin</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={admin.id === currentUser?.id}
                          onClick={() => setDeleteSaTarget(admin)}
                          className={admin.id === currentUser?.id ? 'opacity-50' : 'text-destructive hover:bg-destructive/10'}
                          title={admin.id === currentUser?.id ? 'No puedes eliminarte a ti mismo' : 'Eliminar'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal confirmar eliminar veterinaria */}
      <Dialog open={!!deleteVetTarget} onOpenChange={() => setDeleteVetTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">¿Eliminar veterinaria?</DialogTitle>
          </DialogHeader>
          {deleteVetTarget && (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <p className="font-semibold">{deleteVetTarget.nombre}</p>
              <p className="text-sm text-muted-foreground">
                Se eliminarán todos los datos asociados a esta clínica (mascotas, consultas, usuarios, etc.). Esta acción no se puede deshacer.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteVetTarget(null)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1" onClick={confirmDeleteVet} disabled={isDeleting}>
              <Trash2 className="w-4 h-4 mr-1" />{isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal confirmar eliminar super admin */}
      <Dialog open={!!deleteSaTarget} onOpenChange={() => setDeleteSaTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">¿Eliminar Super Admin?</DialogTitle>
          </DialogHeader>
          {deleteSaTarget && (
            <div className="text-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <p className="font-semibold">{deleteSaTarget.nombre}</p>
              <p className="text-sm text-muted-foreground">{deleteSaTarget.email}</p>
              <p className="text-sm text-muted-foreground">
                El usuario perderá el acceso al sistema de forma permanente.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteSaTarget(null)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1" onClick={confirmDeleteSa} disabled={isDeleting}>
              <Trash2 className="w-4 h-4 mr-1" />{isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal recovery link para Super Admin */}
      <Dialog open={!!recoveryLink} onOpenChange={() => setRecoveryLink(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              Super Admin creado exitosamente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Comparte este enlace con el nuevo Super Admin para que establezca su contraseña:
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={recoveryLink || ''}
                className="text-xs font-mono flex-1"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyLink}
                title="Copiar enlace"
              >
                {linkCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-amber-600 flex items-center gap-1">
              ⏰ Este enlace expira en 24 horas.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setRecoveryLink(null)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
