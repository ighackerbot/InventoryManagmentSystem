import { useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, KeyRound, LockKeyhole, Mail, User2, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../contexts/AuthContext';

const STORE_TYPES = ['Warehouse & Logistics', 'Retail Shop', 'Godown', 'Branch', 'Distribution Center'];

export const Signup = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { signUp, joinStore } = useAuth();
  const [activeTab, setActiveTab] = useState('admin');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    storeType: 'Warehouse & Logistics',
    teamCapacity: '50',
    adminCode: '',
    adminPin: '',
  });

  const basicValid =
    form.name.trim() &&
    form.email.trim() &&
    form.password.length >= 6 &&
    (activeTab === 'admin' || form.confirmPassword === form.password);

  const handlePrimary = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Name is required.');
    if (!form.email.trim()) return setError('Email is required.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (activeTab !== 'admin' && form.confirmPassword !== form.password) {
      return setError('Passwords do not match.');
    }

    if (activeTab === 'admin' && step === 1) {
      setStep(2);
      return;
    }

    if (activeTab !== 'admin' && !form.adminCode.trim()) {
      return setError('Admin code is required to join an existing workspace.');
    }

    setLoading(true);
    try {
      if (activeTab === 'admin') {
        await signUp(
          form.name,
          form.email,
          form.password,
          form.storeName || `${form.name}'s Workspace`,
          form.storeType,
          activeTab,
          form.adminPin,
          form.teamCapacity
        );
      } else {
        await joinStore(form.name, form.email, form.password, activeTab, form.adminCode);
      }

      toast.success('Your workspace is ready. Welcome aboard.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const formTitle =
    activeTab === 'admin' ? 'Create a new business workspace' : `Join as ${activeTab === 'coadmin' ? 'co-admin' : 'staff'}`;

  return (
    <AuthLayout
      title="Create account"
      description="Start in a few easy steps."
      asideTitle="Set up your store in a simple way."
      asideCopy="First create your account. Then add store details if you want."
      highlights={[
        { title: 'Step by step', description: 'Personal details first.' },
        { title: 'Easy join code', description: 'Team members can join with one code.' },
        { title: 'Mobile friendly', description: 'Works well on phone and desktop.' },
      ]}
      footer={
        <p className="mb-0 text-sm text-neutral-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-neutral-950 transition hover:text-brand-600">
            Sign in
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
              onClick={() => {
                setActiveTab(tab.id);
                setStep(1);
                setError('');
              }}
              className={`rounded-[18px] px-3 py-2.5 text-sm font-medium transition ${
                activeTab === tab.id ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-950'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-[24px] border border-neutral-100 bg-neutral-50/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-sm font-semibold text-neutral-950">{formTitle}</p>
              <p className="mb-0 text-sm text-neutral-500">
                {activeTab === 'admin'
                  ? step === 1
                    ? 'Step 1 of 2'
                    : 'Step 2 of 2'
                  : 'Use the code from your admin.'}
              </p>
            </div>
            {activeTab === 'admin' ? (
              <div className="flex items-center gap-2">
                {[1, 2].map((item) => (
                  <span key={item} className={`h-2.5 w-10 rounded-full ${step >= item ? 'bg-neutral-950' : 'bg-neutral-200'}`} />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <form className="space-y-5" onSubmit={handlePrimary}>
          <div className="grid gap-4 rounded-[24px] border border-neutral-100 bg-neutral-50/80 p-5">
            <div>
              <h3 className="text-base font-semibold text-neutral-950">Your account</h3>
              <p className="mt-1 text-sm text-neutral-500">Enter your basic details.</p>
            </div>
            <Input
              label="Full name"
              icon={User2}
              placeholder="Anuj Jain"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              icon={Mail}
              placeholder="you@company.com"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Password"
                type="password"
                icon={LockKeyhole}
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
              {activeTab !== 'admin' ? (
                <Input
                  label="Confirm password"
                  type="password"
                  icon={LockKeyhole}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                  required
                />
              ) : null}
            </div>
          </div>

          {activeTab === 'admin' && step === 2 ? (
            <div className="grid gap-4 rounded-[24px] border border-neutral-100 bg-neutral-50/80 p-5">
              <div>
                <h3 className="text-base font-semibold text-neutral-950">Organization details</h3>
                <p className="mt-1 text-sm text-neutral-500">You can fill this now or later.</p>
              </div>
              <Input
                label="Organization name"
                icon={Building2}
                placeholder="Inventory Management HQ"
                value={form.storeName}
                onChange={(event) => setForm({ ...form, storeName: event.target.value })}
                hint="Optional"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Store type"
                  value={form.storeType}
                  onChange={(event) => setForm({ ...form, storeType: event.target.value })}
                  options={STORE_TYPES.map((type) => ({ value: type, label: type }))}
                />
                <Input
                  label="Team capacity"
                  type="number"
                  icon={Users}
                  min="1"
                  placeholder="50"
                  value={form.teamCapacity}
                  onChange={(event) => setForm({ ...form, teamCapacity: event.target.value })}
                />
              </div>
              <Input
                label="Admin code"
                icon={KeyRound}
                placeholder="Optional invite code for teammates"
                value={form.adminPin}
                onChange={(event) => setForm({ ...form, adminPin: event.target.value })}
                hint="Optional"
              />
            </div>
          ) : null}

          {activeTab !== 'admin' ? (
            <div className="grid gap-4 rounded-[24px] border border-neutral-100 bg-neutral-50/80 p-5">
              <div>
                <h3 className="text-base font-semibold text-neutral-950">Join organization</h3>
                <p className="mt-1 text-sm text-neutral-500">Ask your admin for the code.</p>
              </div>
              <Input
                label="Admin code"
                icon={KeyRound}
                placeholder="Paste the workspace code"
                value={form.adminCode}
                onChange={(event) => setForm({ ...form, adminCode: event.target.value })}
                required
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            {activeTab === 'admin' && step === 2 ? (
              <Button type="button" variant="ghost" icon={ArrowLeft} onClick={() => setStep(1)}>
                Back
              </Button>
            ) : (
              <span />
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              {activeTab === 'admin' && step === 1 ? (
                <Button type="submit" iconRight={ArrowRight} disabled={!basicValid}>
                  Continue to workspace setup
                </Button>
              ) : (
                <>
                  {activeTab === 'admin' ? (
                    <Button type="submit" variant="secondary" disabled={loading}>
                      Skip for now
                    </Button>
                  ) : null}
                  <Button type="submit" loading={loading} iconRight={ArrowRight}>
                    {activeTab === 'admin' ? 'Create workspace' : 'Join workspace'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};
