import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

type SignupTab = 'admin' | 'coadmin' | 'staff';

export const Signup = () => {
    const [activeTab, setActiveTab] = useState<SignupTab>('admin');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [storeName, setStoreName] = useState('');
    const [storeType, setStoreType] = useState('Warehouse & Logistics');
    const [teamCapacity, setTeamCapacity] = useState('50');
    const [adminCode, setAdminCode] = useState('');
    const [adminPin, setAdminPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp, joinStore } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if ((activeTab === 'coadmin' || activeTab === 'staff') && password !== confirmPassword) return setError('Passwords do not match');
        if (password.length < 6) return setError('Password must be at least 6 characters');
        if (!name.trim()) return setError('Name is required');
        if (activeTab === 'admin' && !storeName.trim()) return setError('Organization name is required for Admin');
        if ((activeTab === 'coadmin' || activeTab === 'staff') && !adminCode.trim()) return setError('Admin generated code is required');
        setLoading(true);
        try {
            if (activeTab === 'admin') {
                await signUp(name, email, password, storeName || `${name}'s Store`, storeType, activeTab, adminPin, parseInt(teamCapacity) || 50);
            } else {
                await joinStore(name, email, password, activeTab, adminCode);
            }
            navigate('/dashboard');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { error?: string } }; message?: string };
            setError(e.response?.data?.error || e.message || 'Failed to create account');
        } finally { setLoading(false); }
    };

    return (
        <div className="flex justify-center items-center" style={{ minHeight: '100vh', background: 'var(--gradient-primary)' }}>
            <Card className="animate-slide-in" style={{ maxWidth: '550px', width: '100%', margin: '2rem' }}>
                <div className="text-center mb-xl">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                    <h2>Welcome to InventoryPro</h2>
                    <p>Choose your role and get started</p>
                </div>
                <div className="tab-container">
                    {(['admin', 'coadmin', 'staff'] as SignupTab[]).map(tab => (
                        <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)} type="button">
                            {tab === 'admin' ? 'Admin' : tab === 'coadmin' ? 'Co-Admin' : 'Staff'}
                        </button>
                    ))}
                </div>
                {error && <div className="badge badge-error" style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="tab-content">
                        <Input label="Full Name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
                        <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                        {(activeTab === 'coadmin' || activeTab === 'staff') && (
                            <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                        )}
                        {activeTab === 'admin' && (
                            <>
                                <Input label="Organization Name" type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="My Company" required />
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Store Type</label>
                                    <select value={storeType} onChange={(e) => setStoreType(e.target.value)} className="form-input" style={{ width: '100%' }}>
                                        {['Warehouse & Logistics', 'Retail Shop', 'Godown', 'Branch', 'Distribution Center'].map(t => (<option key={t} value={t}>{t}</option>))}
                                    </select>
                                </div>
                                <Input label="Admin PIN" type="text" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} placeholder="Enter secure PIN" />
                                <Input label="Team Capacity" type="number" value={teamCapacity} onChange={(e) => setTeamCapacity(e.target.value)} placeholder="50" />
                            </>
                        )}
                        {(activeTab === 'coadmin' || activeTab === 'staff') && (
                            <Input label="Admin PIN Code" type="text" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} placeholder="Enter the admin's PIN to join their store" required />
                        )}
                        <Button type="submit" variant="primary" loading={loading} style={{ width: '100%', marginTop: '1rem' }}>
                            {activeTab === 'admin' ? 'Create Organization' : `Join Store as ${activeTab === 'coadmin' ? 'Co-Admin' : 'Staff'}`}
                        </Button>
                    </div>
                </form>
                <div className="text-center mt-lg">
                    <p>Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign In</Link></p>
                </div>
            </Card>
        </div>
    );
};
