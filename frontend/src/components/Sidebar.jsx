import { BarChart3, Boxes, ClipboardList, LayoutDashboard, ReceiptText, ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export const Sidebar = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'coadmin', 'staff'] },
    { path: '/products', label: 'Inventory', icon: Boxes, roles: ['admin', 'coadmin', 'staff'] },
    { path: '/sales', label: 'Sales', icon: BarChart3, roles: ['admin', 'coadmin', 'staff'] },
    { path: '/purchases', label: 'Purchases', icon: ShoppingCart, roles: ['admin', 'coadmin'] },
    { path: '/reports', label: 'Reports', icon: ClipboardList, roles: ['admin', 'coadmin'] },
    { path: '/bills', label: 'Bills', icon: ReceiptText, roles: ['admin', 'coadmin'] },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 border-r border-white/60 bg-neutral-950 px-5 py-6 text-white lg:flex lg:flex-col">
      <nav className="space-y-2">
        {navItems
          .filter((item) => item.roles.includes('staff') || isAdmin())
          .map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'group flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-medium transition-all',
                  active
                    ? 'bg-white text-neutral-950 shadow-[0_20px_40px_-28px_rgba(255,255,255,0.8)]'
                    : 'text-white/68 hover:bg-white/8 hover:text-white'
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-2xl transition',
                    active ? 'bg-brand-50 text-brand-700' : 'bg-white/8 text-white/70 group-hover:bg-white/12'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>
    </aside>
  );
};
