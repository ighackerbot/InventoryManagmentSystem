import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import StoreSwitcher from './StoreSwitcher';

export const Navbar = () => {
    const { user, currentStore, signOut } = useAuth();
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
                    📦 Inventory Management
                </Link>

                {user && (
                    <div className="flex items-center gap-lg">
                        <StoreSwitcher />

                        <span className="text-white opacity-90 font-medium">
                            {user.name || user.email?.split('@')[0]}
                        </span>

                        {currentStore && (
                            <span className="badge badge-info">
                                {currentStore.role?.toUpperCase()}
                            </span>
                        )}

                        <button onClick={handleSignOut} className="btn btn-sm btn-secondary">
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};
