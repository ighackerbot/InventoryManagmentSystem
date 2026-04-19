import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

type LoginTab = 'admin' | 'coadmin' | 'staff';

export const Login = () => {
    const [activeTab, setActiveTab] = useState<LoginTab>('admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [guestLoading, setGuestLoading] = useState(false);
    const { signIn, continueAsGuest } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            await signIn(email, password);
            navigate('/dashboard');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { error?: string } }; message?: string };
            setError(e.response?.data?.error || e.message || 'Failed to sign in');
        } finally { setLoading(false); }
    };

    const handleGuest = async () => {
        setError(''); setGuestLoading(true);
        try { await continueAsGuest(); navigate('/dashboard'); }
        catch (err: unknown) {
            const e = err as { response?: { data?: { error?: string } }; message?: string };
            setError(e.response?.data?.error || e.message || 'Failed to start guest session');
        } finally { setGuestLoading(false); }
    };

    return (
        <div className="flex justify-center items-center" style={{ minHeight: '100vh', background: 'var(--gradient-primary)' }}>
            <Card className="animate-slide-in" style={{ maxWidth: '450px', width: '100%', margin: '2rem' }}>
                <div className="text-center mb-xl">
                    <img src="/logo.png" alt="Inventory APK" style={{ width: '120px', height: '120px', objectFit: 'contain', margin: '0 auto 1rem', display: 'block', borderRadius: '12px' }} />
                    <h2>Welcome Back</h2>
                    <p>Sign in to your Inventory APK account</p>
                </div>
                <div className="tab-container">
                    {(['admin', 'coadmin', 'staff'] as LoginTab[]).map(tab => (
                        <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)} type="button">
                            {tab === 'admin' ? 'Admin' : tab === 'coadmin' ? 'Co-Admin' : 'Staff'}
                        </button>
                    ))}
                </div>
                {error && <div className="badge badge-error" style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                    <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                    <Button type="submit" variant="primary" loading={loading} style={{ width: '100%', marginTop: '1rem' }}>
                        Sign In as {activeTab === 'admin' ? 'Admin' : activeTab === 'coadmin' ? 'Co-Admin' : 'Staff'}
                    </Button>
                </form>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0', color: 'var(--text-secondary, #888)' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #333)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap' }}>or</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #333)' }} />
                </div>
                <Button type="button" variant="secondary" loading={guestLoading} onClick={handleGuest} id="continue-as-guest-btn"
                    style={{ width: '100%', background: 'linear-gradient(135deg, #f59e0b22, #f9731622)', border: '1px solid #f59e0b55', color: '#f59e0b' }}>
                    👤 Continue as Guest
                </Button>
                <div className="text-center mt-lg">
                    <p>Don't have an account? <Link to="/signup" style={{ fontWeight: 600 }}>Sign Up</Link></p>
                </div>
            </Card>
        </div>
    );
};
