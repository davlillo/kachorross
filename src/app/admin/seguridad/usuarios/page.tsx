import { useState, useEffect } from 'react';
import { AuthController } from '@/controllers/auth.controller';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Badge } from '@/components/atoms/ui/badge';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/atoms/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/atoms/ui/dialog';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Alert, AlertDescription } from '@/components/atoms/ui/alert';
import { toast } from 'sonner';
import {
  Users, Plus, Pencil, Trash2, Shield, Stethoscope,
  ClipboardList, AlertTriangle, Mail, UserCircle, Send,
} from 'lucide-react';
import type { Perfil } from '@/types';

const authCtrl = AuthController.getInstance();

const rolConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  admin:     { label: 'Administrador', icon: Shield,       color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  doctora:   { label: 'Doctora',       icon: Stethoscope,  color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  recepcion: { label: 'Recepcionista', icon: ClipboardList,color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
};

const EMPTY_FORM = { nombre: '', email: '', rol: 'recepcion' as Perfil['rol'] };

export default function SeguridadUsuariosPage() {
  const { user: currentUser, refreshUser, veterinaria } = useAuth();
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Perfil | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Perfil | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [enviandoInvitacion, setEnviandoInvitacion] = useState<string | null>(null);

  const cargar = async () => setUsuarios(await authCtrl.listarUsuarios());
  useEffect(() => { void cargar(); }, []);

  const usuariosFiltrados = usuarios.filter(u => {
    const q = busqueda.toLowerCase();
    return !q || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const abrirCrear = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const abrirEditar = (u: Perfil) => {
    setEditTarget(u);
    setForm({ nombre: u.nombre, email: u.email, rol: u.rol });
    setError('');
    setShowForm(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.email.trim()) {
      setError('El nombre y el correo son obligatorios.');
      return;
    }
    const emailDuplicado = usuarios.some(
      u => u.email === form.email.trim() && u.id !== editTarget?.id
    );
    if (emailDuplicado) { setError('Ese correo ya está en uso.'); return; }

    try {
      setIsSaving(true);
      setError('');

      if (editTarget) {
        await authCtrl.actualizarUsuario(editTarget.id, form);
        if (editTarget.id === currentUser?.id) {
          await refreshUser();
        }
      } else {
        await authCtrl.crearUsuario(form);
      }

      await cargar();
      setShowForm(false);
      toast.success(editTarget ? 'Usuario actualizado' : 'Cuenta creada. Se envió un correo de invitación.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la cuenta.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!deleteTarget) return;
    await authCtrl.eliminarUsuario(deleteTarget.id);
    await cargar();
    setDeleteTarget(null);
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const reenviarInvitacion = async (userId: string) => {
    setEnviandoInvitacion(userId);
    try {
      await authCtrl.reenviarInvitacion(userId);
      toast.success('Invitación reenviada correctamente');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al reenviar invitación');
    } finally {
      setEnviandoInvitacion(null);
    }
  };

  const tieneEmailConfig = !!veterinaria?.email;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Gestión de Usuarios"
        description="Administra las cuentas de acceso al sistema"
        icon={Users}
        badge={
          <Badge variant="outline" className="px-3 py-1 text-amber-600 border-amber-200">
            <Shield className="w-3 h-3 mr-1" />
            {usuarios.length} cuentas
          </Badge>
        }
      />

      {!tieneEmailConfig && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-800">
            Antes de crear cuentas, configura el correo SMTP en{' '}
            <strong>Seguridad → Configuración de Correo</strong> para que los nuevos usuarios reciban su invitación.
          </AlertDescription>
        </Alert>
      )}

      {/* Acciones superiores */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <Button
          className="bg-gradient-to-r from-purpura-500 to-purpura-600 hover:from-purpura-600 hover:to-purpura-700 shrink-0"
          onClick={abrirCrear}
        >
          <Plus className="w-4 h-4 mr-2" />Nueva cuenta
        </Button>
      </div>

      {/* Grid de usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {usuariosFiltrados.map(u => {
          const cfg = rolConfig[u.rol];
          const RolIcon = cfg.icon;
          const esTuCuenta = u.id === currentUser?.id;

          return (
            <Card key={u.id} className={`border-0 shadow-soft hover:shadow-lg transition-all ${esTuCuenta ? 'ring-2 ring-purpura-400' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-14 h-14 border-2 border-white shadow-md">
                    <AvatarImage src={u.avatar} alt={u.nombre} />
                    <AvatarFallback className="bg-gradient-to-br from-purpura-400 to-purpura-600 text-white font-bold">
                      {getInitials(u.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-sm truncate">{u.nombre}</p>
                      {esTuCuenta && (
                        <Badge className="text-[9px] px-1.5 py-0 bg-purpura-100 text-purpura-700 border-0">
                          Tú
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{u.email}</span>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${cfg.bg} ${cfg.border} border mb-4`}>
                  <RolIcon className={`w-4 h-4 ${cfg.color}`} />
                  <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  {u.rol === 'admin' && (
                    <span className="ml-auto text-[10px] text-amber-600 font-medium">Acceso total</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => abrirEditar(u)}
                  >
                    <Pencil className="w-3 h-3 mr-1" />Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs text-purpura-600 hover:bg-purpura-50 hover:border-purpura-300"
                    disabled={enviandoInvitacion === u.id}
                    onClick={() => reenviarInvitacion(u.id)}
                    title="Reenviar invitación"
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:border-destructive"
                    disabled={esTuCuenta}
                    onClick={() => setDeleteTarget(u)}
                    title={esTuCuenta ? 'No puedes eliminar tu propia cuenta' : 'Eliminar cuenta'}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {usuariosFiltrados.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {/* ── Modal crear/editar ── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editTarget
                ? <><Pencil className="w-4 h-4 text-purpura-500" />Editar cuenta</>
                : <><Plus className="w-4 h-4 text-purpura-500" />Nueva cuenta</>}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="u-nombre">Nombre completo</Label>
              <Input
                id="u-nombre"
                placeholder="Ej: Dra. María López"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="u-email"
                  type="email"
                  className="pl-9"
                  placeholder="usuario@kachorros.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select
                value={form.rol}
                onValueChange={v => setForm(f => ({ ...f, rol: v as Perfil['rol'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(rolConfig).map(([key, cfg]) => {
                    const RolIcon = cfg.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <RolIcon className={`w-4 h-4 ${cfg.color}`} />
                          <span>{cfg.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground pl-1">
                {form.rol === 'admin' && '⚠ El administrador tiene acceso completo al sistema.'}
                {form.rol === 'doctora' && 'Acceso a expedientes, consultas y catálogo.'}
                {form.rol === 'recepcion' && 'Acceso únicamente al monitor de recepción.'}
              </p>
            </div>

            {!editTarget && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Send className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-800">
                  Se enviará un correo de invitación para que el usuario establezca su propia contraseña.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button
              className="bg-gradient-to-r from-purpura-500 to-purpura-600 hover:from-purpura-600 hover:to-purpura-700"
              onClick={guardar}
              disabled={isSaving}
            >
              {isSaving
                ? (editTarget ? 'Guardando...' : 'Creando...')
                : (editTarget ? 'Guardar cambios' : 'Crear cuenta')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal confirmar eliminar ── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">¿Eliminar cuenta?</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4 space-y-3">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            {deleteTarget && (
              <div>
                <p className="font-semibold">{deleteTarget.nombre}</p>
                <p className="text-sm text-muted-foreground">{deleteTarget.email}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Esta acción eliminará la cuenta permanentemente. El usuario ya no podrá acceder al sistema.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={confirmarEliminar}
            >
              <Trash2 className="w-4 h-4 mr-1" />Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
