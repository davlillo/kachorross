import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Layout from '@/components/organisms/Layout';
import LoginPage from '@/app/login/page';
import RegistroPage from '@/app/registro/page';
import DashboardPage from '@/app/dashboard/page';
import ExpedientesPage from '@/app/expedientes/page';
import NuevoExpedientePage from '@/app/expedientes/nuevo/page';
import ExpedienteDetailPage from '@/app/expedientes/[id]/page';
import NuevaConsultaPage from '@/app/consulta/nueva/page';
import RecepcionPage from '@/app/recepcion/page';
import CatalogoPage from '@/app/admin/catalogo/page';
import ConfiguracionPage from '@/app/configuracion/page';
import UsuariosPage from '@/app/admin/usuarios/page';
import { Toaster } from '@/components/atoms/ui/sonner';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    // Recepcionista va a su pantalla principal
    if (user.rol === 'recepcion') return <Navigate to="/recepcion" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) {
    // Cada rol aterriza en su pantalla principal
    if (user.rol === 'recepcion') return <Navigate to="/recepcion" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/registro" element={<PublicRoute><RegistroPage /></PublicRoute>} />

      {/* Raíz → redirige según rol */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            {user?.rol === 'recepcion'
              ? <Navigate to="/recepcion" replace />
              : <Navigate to="/dashboard" replace />}
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

      <Route path="/configuracion" element={
        <ProtectedRoute allowedRoles={['recepcion', 'admin', 'doctora']}>
          <Layout><ConfiguracionPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/usuarios" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><UsuariosPage /></Layout>
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
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </Router>
    </AuthProvider>
  );
}

export default App;
