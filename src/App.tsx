import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import LoginPage from '@/app/login/page';
import DashboardPage from '@/app/dashboard/page';
import ExpedientesPage from '@/app/expedientes/page';
import ExpedienteDetailPage from '@/app/expedientes/[id]/page';
import NuevaConsultaPage from '@/app/consulta/nueva/page';
import RecepcionPage from '@/app/recepcion/page';
import CatalogoPage from '@/app/admin/catalogo/page';
import { Toaster } from '@/components/ui/sonner';

// Componente para proteger rutas
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Componente para redirigir si ya está autenticado
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />

      {/* Rutas protegidas con Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Navigate to="/dashboard" replace />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/expedientes"
        element={
          <ProtectedRoute allowedRoles={['doctora', 'admin']}>
            <Layout>
              <ExpedientesPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/expedientes/:id"
        element={
          <ProtectedRoute allowedRoles={['doctora', 'admin']}>
            <Layout>
              <ExpedienteDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/consulta/nueva"
        element={
          <ProtectedRoute allowedRoles={['doctora']}>
            <Layout>
              <NuevaConsultaPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/recepcion"
        element={
          <ProtectedRoute allowedRoles={['recepcion', 'admin']}>
            <Layout>
              <RecepcionPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/catalogo"
        element={
          <ProtectedRoute allowedRoles={['doctora', 'admin']}>
            <Layout>
              <CatalogoPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Ruta por defecto */}
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
