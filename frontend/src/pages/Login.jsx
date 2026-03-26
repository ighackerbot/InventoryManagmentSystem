import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Mail, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn, staffLogin, continueAsGuest } = useAuth();
  const [activeTab, setActiveTab] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (activeTab === 'staff') {
        await staffLogin(form.email, form.password);
      } else {
        await signIn(form.email, form.password);
      }
      toast.success('Welcome back. Your workspace is ready.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setGuestLoading(true);
    setError('');
    try {
      await continueAsGuest();
      toast.info('Guest workspace started. Data will remain temporary.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start guest workspace');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      description="Open your store."
      asideTitle="Easy stock control for every shop."
      asideCopy="Use simple screens to add items, record sales, and check stock."
      highlights={[
        { title: 'Simple home screen', description: 'See money and stock in one place.' },
        { title: 'Easy team use', description: 'Admin, co-admin, and staff each get simple access.' },
        { title: 'Try as guest', description: 'Explore first, sign up later.' },
      ]}
      footer={
        <p className="mb-0 text-sm text-neutral-500">
          New here?{' '}
          <Link to="/signup" className="font-semibold text-neutral-950 transition hover:text-brand-600">
            Create an account
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-2 rounded-[22px] bg-neutral-100 p-1.5">
          {[
            { id: 'admin', label: 'Admin' },
            { id: 'coadmin', label: 'Co-admin' },
            { id: 'staff', label: 'Staff' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-[18px] px-3 py-2.5 text-sm font-medium transition ${
                activeTab === tab.id ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-950'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Work email"
            type="email"
            icon={Mail}
            placeholder="you@company.com"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={ShieldCheck}
              placeholder="Enter your password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-4 top-[42px] text-neutral-400 transition hover:text-neutral-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Button type="submit" loading={loading} className="w-full" iconRight={ArrowRight}>
            {activeTab === 'staff' ? 'Continue as staff member' : 'Continue to dashboard'}
          </Button>
        </form>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGuest}
          className="flex w-full items-center justify-between rounded-[24px] border border-brand-200 bg-gradient-to-r from-brand-50 to-cyan-50 px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-brand-300"
        >
          <div>
            <p className="mb-1 text-sm font-semibold text-neutral-950">Continue as Guest</p>
            <p className="mb-0 text-sm text-neutral-500">Try the app first.</p>
          </div>
          <Button type="button" variant="secondary" size="sm" loading={guestLoading}>
            Try demo
          </Button>
        </button>
      </div>
    </AuthLayout>
  );
};
