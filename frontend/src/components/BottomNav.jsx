import { BarChart3, Boxes, LayoutDashboard, ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export const BottomNav = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/products', label: 'Inventory', icon: Boxes },
    { path: '/sales', label: 'Sales', icon: BarChart3 },
    ...(isAdmin() ? [{ path: '/purchases', label: 'Buy', icon: ShoppingCart }] : []),
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/60 bg-white/90 px-2 py-2 backdrop-blur-xl lg:hidden">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition',
                active ? 'bg-brand-50 text-brand-700' : 'text-neutral-500 hover:bg-neutral-50'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
