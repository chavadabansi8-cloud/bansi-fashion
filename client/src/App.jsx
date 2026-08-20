import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { APP_PANEL, isAdminPanel, isWorkerPanel, PANEL_HOME } from './config/panel';
import './index.css';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    const target = user.role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={target} replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const userHome = user?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={userHome} replace /> : <Login />}
      />

      {(APP_PANEL === 'all' || isWorkerPanel) && (
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="worker">
              <WorkerDashboard />
            </ProtectedRoute>
          }
        />
      )}

      {(APP_PANEL === 'all' || isAdminPanel) && (
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      )}

      <Route
        path="/"
        element={
          user
            ? <Navigate to={userHome} replace />
            : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
            },
            success: {
              iconTheme: { primary: '#43e97b', secondary: '#fff' }
            },
            error: {
              iconTheme: { primary: '#fc8181', secondary: '#fff' }
            }
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
