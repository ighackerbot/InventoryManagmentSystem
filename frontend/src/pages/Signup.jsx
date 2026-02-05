import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setLoading(true);

        try {
            await signUp(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center" style={{ minHeight: '100vh', background: 'var(--gradient-primary)' }}>
            <Card className="animate-slide-in" style={{ maxWidth: '450px', width: '100%', margin: '2rem' }}>
                <div className="text-center mb-xl">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                    <h2>Create Account</h2>
                    <p>Join Inventory Pro to manage your inventory</p>
                </div>

                {error && (
                    <div className="badge badge-error" style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
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

                    <Input
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        loading={loading}
                        style={{ width: '100%', marginTop: '1rem' }}
                    >
                        Create Account
                    </Button>
                </form>

                <div className="text-center mt-lg">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" style={{ fontWeight: 600 }}>
                            Sign In
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
};
