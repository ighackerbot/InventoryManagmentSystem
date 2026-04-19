import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export const Sidebar = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();

    const navItems = [
        { path: '/dashboard', label: '📊 Dashboard', icon: '📊', adminOnly: false },
        { path: '/products', label: '📦 Products', icon: '📦', adminOnly: false },
        { path: '/sales', label: '💰 Sales', icon: '💰', adminOnly: false },
        { path: '/purchases', label: '🛒 Purchases', icon: '🛒', adminOnly: true },
    ];

    return (
        <aside className="sidebar">
            <ul className="sidebar-nav">
                {navItems.map((item) => {
                    if (!isGuest && item.adminOnly && !isAdmin()) return null;
                    const isActive = location.pathname === item.path;
                    return (
                        <li key={item.path}>
                            <Link to={item.path} className={`sidebar-link ${isActive ? 'active' : ''}`.trim()}>
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
