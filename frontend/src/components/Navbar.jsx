import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = () => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <Link to="/" className="navbar-brand">
                    📦 Inventory Management System
                </Link>

                {user && (
                    <div className="flex items-center gap-lg">
                        <span className="text-white opacity-90 font-medium">
                            Welcome, {profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </span>
                        <span className="badge badge-info">
                            {profile?.role?.toUpperCase() || 'USER'}
                        </span>
                        <button onClick={handleSignOut} className="btn btn-sm btn-secondary">
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};
