import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Sales } from './pages/Sales';
import { Purchases } from './pages/Purchases';
import { Reports } from './pages/Reports';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (!user) return <Navigate to="/login" />;

  if (adminOnly && profile?.role !== 'admin' && profile?.role !== 'coadmin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Layout Component
const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <Navbar />
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

// Public Route (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (user) return <Navigate to="/dashboard" />;

  return children;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
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

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Layout>
                <Products />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <Layout>
                <Sales />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchases"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <Purchases />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
