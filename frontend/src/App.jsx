import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppShell } from './components/AppShell';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ToastProvider } from './components/ToastProvider';
import { Dashboard } from './pages/Dashboard';
import { Bills } from './pages/Bills';
import { Login } from './pages/Login';
import { Products } from './pages/Products';
import { Purchases } from './pages/Purchases';
import { Reports } from './pages/Reports';
import { Sales } from './pages/Sales';
import { Signup } from './pages/Signup';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, currentStore, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!currentStore) return <Navigate to="/login" replace />;
  if (adminOnly && currentStore.role !== 'admin' && currentStore.role !== 'coadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, currentStore, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (user && currentStore) return <Navigate to="/dashboard" replace />;

  return children;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route
            path="/purchases"
            element={
              <ProtectedRoute adminOnly>
                <Purchases />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute adminOnly>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bills"
            element={
              <ProtectedRoute adminOnly>
                <Bills />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
