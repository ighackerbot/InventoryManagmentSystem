import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const GuestBanner = () => {
  const { isGuest } = useAuth();
  const navigate = useNavigate();

  if (!isGuest) return null;

  return (
    <div className="sticky top-0 z-50 border-b border-amber-200 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-4 py-3 text-white shadow-lg shadow-amber-500/20">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm font-medium">
          <span>You are in guest mode. Demo data is temporary and expires within 24 hours.</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/signup')}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:-translate-y-0.5 hover:bg-amber-50"
        >
          Save your workspace
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
