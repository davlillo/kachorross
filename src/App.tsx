import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from '@/context/AuthContext';

import { getHomeRouteForRole } from '@/lib/auth-routes';

import Layout from '@/components/organisms/Layout';

import LoginPage from '@/app/login/page';

import DashboardPage from '@/app/dashboard/page';

import ExpedientesPage from '@/app/expedientes/page';

import NuevoExpedientePage from '@/app/expedientes/nuevo/page';

import ExpedienteDetailPage from '@/app/expedientes/[id]/page';

import NuevaConsultaPage from '@/app/consulta/nueva/page';

import RecepcionPage from '@/app/recepcion/page';

import CatalogoPage from '@/app/admin/catalogo/page';

import HistorialVentasPage from '@/app/historial-ventas/page';

import ConfiguracionPage from '@/app/configuracion/page';

import SeguridadUsuariosPage from '@/app/admin/seguridad/usuarios/page';

import EstablecerContrasenaPage from '@/app/establecer-contrasena/page';

import SuperAdminPage from '@/app/super-admin/page';

import PerfilPage from '@/app/perfil/page';

import { Toaster } from '@/components/atoms/ui/sonner';

import { Loader2 } from 'lucide-react';



function AuthGate({ children }: { children: React.ReactNode }) {

  const { isLoading } = useAuth();



  if (isLoading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-slate-50">

        <Loader2 className="h-8 w-8 animate-spin text-purpura-500" />

      </div>

    );

  }



  return <>{children}</>;

}



function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {

  const { user } = useAuth();



  if (!user) return <Navigate to="/login" replace />;



  if (allowedRoles && !allowedRoles.includes(user.rol)) {

    return <Navigate to={getHomeRouteForRole(user.rol)} replace />;

  }



  return <>{children}</>;

}



function PublicRoute({ children }: { children: React.ReactNode }) {

  const { user } = useAuth();

  if (user) {

    return <Navigate to={getHomeRouteForRole(user.rol)} replace />;

  }

  return <>{children}</>;

}



function AppRoutes() {

  const { user } = useAuth();



  return (

    <Routes>

      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />

      <Route path="/registro" element={<Navigate to="/login" replace />} />



      <Route path="/" element={

        <ProtectedRoute>

          <Layout>

            <Navigate to={user ? getHomeRouteForRole(user.rol) : '/login'} replace />

          </Layout>

        </ProtectedRoute>

      } />



      <Route path="/dashboard" element={

        <ProtectedRoute allowedRoles={['doctora', 'admin']}>

          <Layout><DashboardPage /></Layout>

        </ProtectedRoute>

      } />



      <Route path="/expedientes" element={

        <ProtectedRoute allowedRoles={['doctora', 'admin']}>

          <Layout><ExpedientesPage /></Layout>

        </ProtectedRoute>

      } />



      <Route path="/expedientes/nuevo" element={

        <ProtectedRoute allowedRoles={['doctora', 'admin']}>

          <Layout><NuevoExpedientePage /></Layout>

        </ProtectedRoute>

      } />



      <Route path="/expedientes/:id" element={

        <ProtectedRoute allowedRoles={['doctora', 'admin']}>

          <Layout><ExpedienteDetailPage /></Layout>

        </ProtectedRoute>

      } />



      <Route path="/consulta/nueva" element={

        <ProtectedRoute allowedRoles={['doctora', 'admin']}>

          <Layout><NuevaConsultaPage /></Layout>

        </ProtectedRoute>

      } />



      <Route path="/recepcion" element={

        <ProtectedRoute allowedRoles={['recepcion', 'admin']}>

          <Layout><RecepcionPage /></Layout>

        </ProtectedRoute>

      } />



      <Route path="/admin/catalogo" element={

        <ProtectedRoute allowedRoles={['doctora', 'admin']}>

          <Layout><CatalogoPage /></Layout>

        </ProtectedRoute>

      } />



      <Route path="/historial-ventas" element={

        <ProtectedRoute allowedRoles={['recepcion', 'admin', 'doctora']}>

          <Layout><HistorialVentasPage /></Layout>

        </ProtectedRoute>

      } />



      <Route path="/perfil" element={

        <ProtectedRoute allowedRoles={['recepcion', 'admin', 'doctora']}>

          <Layout><PerfilPage /></Layout>

        </ProtectedRoute>

      } />



      <Route path="/admin/usuarios" element={<Navigate to="/admin/seguridad/usuarios" replace />} />



      <Route path="/admin/seguridad/usuarios" element={

        <ProtectedRoute allowedRoles={['admin']}>

          <Layout><SeguridadUsuariosPage /></Layout>

        </ProtectedRoute>

      } />



      <Route path="/establecer-contrasena" element={<EstablecerContrasenaPage />} />

      <Route path="/configuracion" element={

        <ProtectedRoute allowedRoles={['admin']}>

          <Layout><ConfiguracionPage /></Layout>

        </ProtectedRoute>

      } />



      <Route path="/super-admin" element={

        <ProtectedRoute allowedRoles={['super_admin']}>

          <Layout><SuperAdminPage /></Layout>

        </ProtectedRoute>

      } />



      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>

  );

}



function App() {

  return (

    <AuthProvider>

      <Router>

        <AuthGate>

          <AppRoutes />

        </AuthGate>

        <Toaster position="top-right" />

      </Router>

    </AuthProvider>

  );

}



export default App;

