import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Sidebar = () => {
    const location = useLocation();
    const { isAdmin, isGuest } = useAuth();

    const navItems = [
        { path: '/dashboard', label: '📊 Dashboard', icon: '📊', roles: ['admin', 'coadmin', 'staff'] },
        { path: '/products', label: '📦 Products', icon: '📦', roles: ['admin', 'coadmin', 'staff'] },
        { path: '/sales', label: '💰 Sales', icon: '💰', roles: ['admin', 'coadmin', 'staff'] },
        { path: '/purchases', label: '🛒 Purchases', icon: '🛒', roles: ['admin', 'coadmin'] },
    ];

    return (
        <aside className="sidebar">
            <ul className="sidebar-nav">
                {navItems.map((item) => {
                    // Check if user has access
                    if (!isGuest && item.roles.includes('admin') && item.roles.includes('coadmin') && !item.roles.includes('staff')) {
                        if (!isAdmin()) return null;
                    }

                    const isActive = location.pathname === item.path;

                    return (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`sidebar-link ${isActive ? 'active' : ''}`.trim()}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label.replace(/^.*\s/, '')}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
};

