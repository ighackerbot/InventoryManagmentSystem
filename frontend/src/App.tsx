import React, { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { LoadingSpinner } from './components/LoadingSpinner';
import { GuestBanner } from './components/GuestBanner';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Sales } from './pages/Sales';
import { Purchases } from './pages/Purchases';
import { Reports } from './pages/Reports';

interface ProtectedRouteProps { children: ReactNode; adminOnly?: boolean; }

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
    const { user, currentStore, loading } = useAuth();
    if (loading) return <LoadingSpinner />;
    if (!user) return <Navigate to="/login" replace />;
    if (!currentStore) return <Navigate to="/login" replace />;
    if (adminOnly && currentStore.role !== 'admin' && currentStore.role !== 'coadmin') return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};

const Layout = ({ children }: { children: ReactNode }) => (
    <div className="app-layout">
        <GuestBanner />
        <Navbar />
        <Sidebar />
        <main className="main-content">{children}</main>
        <BottomNav />
    </div>
);

const PublicRoute = ({ children }: { children: ReactNode }) => {
    const { user, currentStore, loading } = useAuth();
    if (loading) return <LoadingSpinner />;
    if (user && currentStore) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};

function AppRoutes() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                <Route path="/products" element={<ProtectedRoute><Layout><Products /></Layout></ProtectedRoute>} />
                <Route path="/sales" element={<ProtectedRoute><Layout><Sales /></Layout></ProtectedRoute>} />
                <Route path="/purchases" element={<ProtectedRoute adminOnly><Layout><Purchases /></Layout></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute adminOnly><Layout><Reports /></Layout></ProtectedRoute>} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
}

function App() {
    return <AuthProvider><AppRoutes /></AuthProvider>;
}

export default App;
