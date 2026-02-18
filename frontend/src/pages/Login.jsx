import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const Login = () => {
    const [activeTab, setActiveTab] = useState('admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Pass role information to signIn if needed for backend differentiation
            await signIn(email, password, activeTab);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center" style={{ minHeight: '100vh', background: 'var(--gradient-primary)' }}>
            <Card className="animate-slide-in" style={{ maxWidth: '450px', width: '100%', margin: '2rem' }}>
                <div className="text-center mb-xl">
                    <img
                        src="/logo.png"
                        alt="Inventory APK"
                        style={{
                            width: '120px',
                            height: '120px',
                            objectFit: 'contain',
                            margin: '0 auto 1rem',
                            display: 'block',
                            borderRadius: '12px'
                        }}
                    />
                    <h2>Welcome Back</h2>
                    <p>Sign in to your Inventory APK account</p>
                </div>

                {/* Tab Navigation */}
                <div className="tab-container">
                    <button
                        className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
                        onClick={() => setActiveTab('admin')}
                        type="button"
                    >
                        Admin
                    </button>
                    <button
                        className={`tab ${activeTab === 'coadmin' ? 'active' : ''}`}
                        onClick={() => setActiveTab('coadmin')}
                        type="button"
                    >
                        Co-Admin
                    </button>
                    <button
                        className={`tab ${activeTab === 'staff' ? 'active' : ''}`}
                        onClick={() => setActiveTab('staff')}
                        type="button"
                    >
                        Staff
                    </button>
                </div>

                {error && (
                    <div className="badge badge-error" style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="tab-content">
                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                            style={{ width: '100%', marginTop: '1rem' }}
                        >
                            Sign In as {activeTab === 'admin' ? 'Admin' : activeTab === 'coadmin' ? 'Co-Admin' : 'Staff'}
                        </Button>
                    </div>
                </form>

                <div className="text-center mt-lg">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/signup" style={{ fontWeight: 600 }}>
                            Sign Up
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
};
