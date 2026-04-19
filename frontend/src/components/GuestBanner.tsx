import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const GuestBanner = () => {
    const { isGuest } = useAuth();
    const navigate = useNavigate();

    if (!isGuest) return null;

    return (
        <div id="guest-banner" style={{
            background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff',
            padding: '0.65rem 1.25rem', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
            fontSize: '0.9rem', fontWeight: 500, zIndex: 1000, position: 'sticky', top: 0,
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
        }}>
            <span>⚠️ You're in <strong>guest mode</strong> — all data is temporary and will be deleted in 24 hours.</span>
            <button
                onClick={() => navigate('/signup')}
                id="guest-signup-cta"
                style={{
                    background: '#fff', color: '#f97316', border: 'none', borderRadius: '6px',
                    padding: '0.4rem 1rem', fontWeight: 700, fontSize: '0.85rem',
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
                Sign up to save your data →
            </button>
        </div>
    );
};
