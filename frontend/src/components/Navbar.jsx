import { useState } from 'react';
import { ChevronDown, LogOut, UserCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getInitials } from '../lib/utils';
import { Button } from './Button';
import StoreSwitcher from './StoreSwitcher';

export const Navbar = () => {
  const { user, currentStore, signOut, isGuest } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="page-container flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src="/logo.png" alt="Inventory Pro" className="h-11 w-11 rounded-2xl object-cover shadow-sm ring-1 ring-neutral-200" />
            <div>
              <p className="mb-0 text-sm font-semibold text-neutral-950">Inventory Pro</p>
              <p className="mb-0 text-xs text-neutral-500">{currentStore?.name || 'My store'}</p>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StoreSwitcher />

            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="flex items-center gap-3 rounded-[20px] border border-neutral-200 bg-white px-3 py-2 shadow-sm transition hover:border-neutral-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-sm font-semibold text-white">
                  {getInitials(user?.name || user?.email)}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="mb-0 text-sm font-semibold text-neutral-900">{user?.name || 'Guest User'}</p>
                  <p className="mb-0 text-xs text-neutral-500">{isGuest ? 'Guest' : currentStore?.role || 'Member'}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              </button>

              {open ? (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 rounded-[24px] border border-neutral-200 bg-white p-3 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.45)]">
                  <div className="rounded-[18px] bg-neutral-50 p-3">
                    <p className="mb-1 text-sm font-semibold text-neutral-900">{user?.name || 'Guest user'}</p>
                    <p className="mb-0 text-xs text-neutral-500">{user?.email || 'Temporary workspace'}</p>
                  </div>
                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigate('/signup');
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950"
                    >
                      <UserCircle2 className="h-4 w-4" />
                      {isGuest ? 'Create account' : 'Account'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      {isGuest ? 'Exit guest mode' : 'Sign out'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {isGuest ? null : null}
          </div>
        </div>
      </div>
    </header>
  );
};
