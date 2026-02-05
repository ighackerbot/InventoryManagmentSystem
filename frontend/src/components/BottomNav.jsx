import { Link, useLocation } from 'react-router-dom';

export const BottomNav = () => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/dashboard', label: 'Home', icon: '🏠' },
        { path: '/products', label: 'Products', icon: '📦' },
        { path: '/sales', label: 'Sales', icon: '💰' },
        { path: '/purchases', label: 'Buy', icon: '🛒' },
    ];

    return (
        <div className="bottom-nav">
            {navItems.map((item) => (
                <Link
                    key={item.path}
                    to={item.path}
                    className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
                >
                    <span className="bottom-nav-icon">{item.icon}</span>
                    <span className="bottom-nav-label">{item.label}</span>
                </Link>
            ))}
        </div>
    );
};
