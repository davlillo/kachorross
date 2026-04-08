import { useAuth } from '@/context/AuthContext';
import { dashboardStats, monitorSalida, mascotas } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  Users,
  Clock,
  DollarSign,
  Calendar,
  Stethoscope,
  PawPrint,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getRoleLabel = (rol: string) => {
    const labels: Record<string, string> = {
      doctora: 'Doctora Veterinaria',
      recepcion: 'Recepcionista',
      admin: 'Administrador'
    };
    return labels[rol] || rol;
  };

  // Stats cards data
  const stats = [
    {
      title: 'Pacientes Hoy',
      value: dashboardStats.pacientesHoy,
      icon: Users,
      color: 'from-esmerald-400 to-esmerald-600',
      bgColor: 'bg-esmerald-50',
      textColor: 'text-esmerald-600',
      trend: '+2 vs ayer'
    },
    {
      title: 'En Espera',
      value: dashboardStats.pacientesEspera,
      icon: Clock,
      color: 'from-amber-gold to-blaze-orange',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      trend: 'Por atender'
    },
   
    {
      title: 'Consultas Pend.',
      value: dashboardStats.consultasPendientes,
      icon: Calendar,
      color: 'from-neon-pink to-rose-500',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
      trend: 'Por finalizar'
    }
  ];

  // Próximas citas simuladas
  const proximasCitas = [
    {
      id: 1,
      mascota: 'Max',
      propietario: 'Carlos Mendoza',
      hora: '10:30 AM',
      motivo: 'Vacunación',
      tipo: 'control'
    },
    {
      id: 2,
      mascota: 'Luna',
      propietario: 'María Fernández',
      hora: '11:00 AM',
      motivo: 'Revisión post-operatoria',
      tipo: 'urgente'
    },
    {
      id: 3,
      mascota: 'Rocky',
      propietario: 'José Ramírez',
      hora: '02:00 PM',
      motivo: 'Control de piel',
      tipo: 'seguimiento'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {getGreeting()}, <span className="text-esmerald-600">{user?.nombre.split(' ')[0]}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {getRoleLabel(user?.rol || '')} • {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex gap-2">
          {user?.rol === 'doctora' && (
            <Link to="/consulta/nueva">
              <Button className="bg-gradient-to-r from-esmerald-500 to-esmerald-600 hover:from-esmerald-600 hover:to-esmerald-700">
                <Stethoscope className="w-4 h-4 mr-2" />
                Nueva Consulta
              </Button>
            </Link>
          )}
          {user?.rol === 'recepcion' && (
            <Link to="/recepcion">
              <Button className="bg-gradient-to-r from-azure-blue to-blue-violet">
                <Clock className="w-4 h-4 mr-2" />
                Ver Monitor
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-soft hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-3xl font-bold mt-2">{stat.value}</h3>
                  <p className={`text-xs mt-1 ${stat.textColor} font-medium`}>
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    {stat.trend}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monitor de Salida (para recepción) o Próximas Citas (para doctora) */}
        <Card className="lg:col-span-2 border-0 shadow-soft">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-esmerald-500" />
                {user?.rol === 'recepcion' ? 'Monitor de Salida' : 'Próximas Citas'}
              </CardTitle>
              <Link to={user?.rol === 'recepcion' ? '/recepcion' : '/expedientes'}>
                <Button variant="ghost" size="sm" className="text-esmerald-600">
                  Ver todo
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {user?.rol === 'recepcion' ? (
              // Monitor de salida para recepción
              <div className="space-y-3">
                {monitorSalida.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <img 
                      src={item.mascota.foto} 
                      alt={item.mascota.nombre}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{item.mascota.nombre}</h4>
                        <Badge 
                          variant={item.estado === 'listo' ? 'default' : item.estado === 'pagando' ? 'secondary' : 'outline'}
                          className={`
                            ${item.estado === 'listo' ? 'bg-esmerald-500' : ''}
                            ${item.estado === 'pagando' ? 'bg-amber-gold text-amber-900' : ''}
                          `}
                        >
                          {item.estado === 'listo' ? 'Listo' : item.estado === 'pagando' ? 'Pagando' : 'Entregado'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.mascota.propietario.nombre} • {item.mascota.raza}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${item.total.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.horaTermino).toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Próximas citas para doctora
              <div className="space-y-3">
                {proximasCitas.map((cita) => (
                  <div 
                    key={cita.id} 
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-esmerald-100 to-esmerald-200 flex items-center justify-center">
                      <PawPrint className="w-5 h-5 text-esmerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{cita.mascota}</h4>
                        <Badge 
                          variant="outline"
                          className={`
                            ${cita.tipo === 'urgente' ? 'border-neon-pink text-neon-pink' : ''}
                            ${cita.tipo === 'control' ? 'border-esmerald-500 text-esmerald-600' : ''}
                            ${cita.tipo === 'seguimiento' ? 'border-azure-blue text-azure-blue' : ''}
                          `}
                        >
                          {cita.motivo}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{cita.propietario}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-esmerald-600">{cita.hora}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Alertas */}
          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-gold" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-amber-900">Vacunas próximas</p>
                    <p className="text-xs text-amber-700">3 mascotas necesitan refuerzo este mes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <Activity className="w-5 h-5 text-azure-blue mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-blue-900">Seguimientos</p>
                    <p className="text-xs text-blue-700">2 pacientes pendientes de revisión</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mascotas recientes */}
          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-blue-violet" />
                Pacientes Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mascotas.slice(0, 4).map((mascota) => (
                  <Link 
                    key={mascota.id} 
                    to={`/expedientes/${mascota.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <img 
                      src={mascota.foto} 
                      alt={mascota.nombre}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{mascota.nombre}</p>
                      <p className="text-xs text-muted-foreground truncate">{mascota.raza}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
