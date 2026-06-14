import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeContext';
import { Button } from '@/components/atoms/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/ui/avatar';
import { Badge } from '@/components/atoms/ui/badge';
import {
  PawPrint,
  LayoutDashboard,
  Search,
  Stethoscope,
  ClipboardList,
  Settings,
  LogOut,
  User,
  Bell,
  Menu,
  X,
  ChevronDown,
  Users,
  Shield,
  History,
  Sun,
  Moon,
  BookOpen,
} from 'lucide-react';
import { useState } from 'react';
import type { Perfil } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: ('doctora' | 'recepcion' | 'admin')[];
  badge?: number;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['doctora', 'admin'],
  },
  {
    label: 'Expedientes',
    href: '/expedientes',
    icon: Search,
    roles: ['doctora', 'admin'],
  },
  {
    label: 'Nueva Consulta',
    href: '/consulta/nueva',
    icon: Stethoscope,
    roles: ['doctora', 'admin'],
  },
  {
    label: 'Recepción',
    href: '/recepcion',
    icon: ClipboardList,
    roles: ['recepcion', 'admin'],
  },
  {
    label: 'Catálogo',
    href: '/admin/catalogo',
    icon: Settings,
    roles: ['doctora', 'admin'],
  },
  {
    label: 'Usuarios',
    href: '/admin/seguridad/usuarios',
    icon: Users,
    roles: ['admin'],
  },
  {
    label: 'Manual de Usuario',
    href: '/manual',
    icon: BookOpen,
    roles: ['doctora', 'recepcion', 'admin'],
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, veterinaria, logout } = useAuth();
  const { mode, toggleMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) {
    return <>{children}</>;
  }

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user.rol as 'doctora' | 'recepcion' | 'admin')
  );

  const handleLogout = () => {
    void logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleLabel = (rol: Perfil['rol']) => {
    const labels: Record<string, string> = {
      doctora: 'Doctora Veterinaria',
      recepcion: 'Recepción',
      admin: 'Administrador',
      super_admin: 'Super Administrador'
    };
    return labels[rol] || rol;
  };

  // Branding dinámico
  const brandName = user.rol === 'super_admin' 
    ? 'Panel Super Admin' 
    : (veterinaria?.nombre || "Vet. Kachorro's");
  
  // Usamos el logo de la veterinaria si existe, si no, usamos el ícono de PawPrint (huella) en el JSX
  const hasCustomLogo = user.rol !== 'super_admin' && !!veterinaria?.logoUrl;
  const customLogoUrl = veterinaria?.logoUrl;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to={user.rol === 'recepcion' ? '/recepcion' : (user.rol === 'super_admin' ? '/super-admin' : '/dashboard')} className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-lg mb-4 overflow-hidden shadow-sm border border-border/50">
              {hasCustomLogo ? (
                <img src={customLogoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <PawPrint className="w-7 h-7 text-brand-primary" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight text-brand-primary line-clamp-2">
                {brandName}
              </h1>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href || 
              location.pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-brand-primary to-brand-primary text-white shadow-md' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <Badge 
                    variant={isActive ? "secondary" : "default"}
                    className={`ml-auto text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-brand-accent text-white'}`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-border">
          <button
            onClick={toggleMode}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors mb-2"
            aria-label={mode === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
          >
            {mode === 'light' ? (
              <Moon className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Sun className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {mode === 'light' ? 'Modo oscuro' : 'Modo claro'}
            </span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                <Avatar className="w-10 h-10 border-2 border-brand-primary/20">
                  <AvatarImage src={user.avatar} alt={user.nombre} />
                  <AvatarFallback className="bg-gradient-to-br from-brand-primary to-brand-primary text-white">
                    {getInitials(user.nombre)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-sm truncate">{user.nombre}</p>
                    {user.rol === 'admin' && (
                      <Shield className="w-3 h-3 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{getRoleLabel(user.rol)}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/perfil')}>
                <User className="w-4 h-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              {user.rol !== 'recepcion' && user.rol !== 'super_admin' && (
                <DropdownMenuItem onClick={() => navigate('/historial-ventas')}>
                  <History className="w-4 h-4 mr-2" />
                  Historial de Ventas
                </DropdownMenuItem>
              )}
              {user.rol === 'admin' && (
                <>
                  <DropdownMenuItem onClick={() => navigate('/admin/usuarios')}>
                    <Users className="w-4 h-4 mr-2" />
                    Gestión de Usuarios
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/configuracion')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link to={user.rol === 'recepcion' ? '/recepcion' : (user.rol === 'super_admin' ? '/super-admin' : '/dashboard')} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-md overflow-hidden shadow-sm flex items-center justify-center border border-border/50">
              {hasCustomLogo ? (
                <img src={customLogoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
              ) : (
                <PawPrint className="w-5 h-5 text-brand-primary" />
              )}
            </div>
            <span className="font-bold text-sm text-brand-primary truncate max-w-[150px]">
              {brandName}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMode}
              aria-label={mode === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
            >
              {mode === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="border-t border-border p-4 space-y-1 bg-card">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-brand-primary text-white' 
                      : 'text-muted-foreground hover:bg-muted'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge className="ml-auto bg-brand-accent text-white">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
