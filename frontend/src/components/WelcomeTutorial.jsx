import { useEffect, useMemo, useState } from 'react';
import { Boxes, ChartColumnBig, Home, PackagePlus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';

const steps = [
  {
    route: '/dashboard',
    icon: Home,
    title: 'Step 1: Home',
    description: 'See sales, purchases, and stock here.',
  },
  {
    route: '/products',
    icon: Boxes,
    title: 'Step 2: Add products',
    description: 'Start by adding the items you sell or store.',
  },
  {
    route: '/sales',
    icon: PackagePlus,
    title: 'Step 3: Record sales',
    description: 'When you sell something, enter it here.',
  },
  {
    route: '/purchases',
    icon: ChartColumnBig,
    title: 'Step 4: Add new stock',
    description: 'Use this when new stock comes in from a supplier.',
  },
];

export const WelcomeTutorial = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, currentStore, isGuest, isAdmin } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [dismissedKey, setDismissedKey] = useState('');

  const visibleSteps = useMemo(
    () => steps.filter((step) => step.route !== '/purchases' || isAdmin()),
    [isAdmin]
  );

  const storageKey = useMemo(() => {
    if (!currentStore) return null;
    const identity = isGuest ? 'guest' : user?.email || 'user';
    return `tutorial-seen:${identity}:${currentStore.id}`;
  }, [currentStore, isGuest, user]);

  const shouldShow = Boolean(storageKey) && dismissedKey !== storageKey && !localStorage.getItem(storageKey);
  const currentStepIndex = Math.min(stepIndex, Math.max(visibleSteps.length - 1, 0));
  const currentStep = visibleSteps[currentStepIndex];

  useEffect(() => {
    if (shouldShow && currentStep && location.pathname !== currentStep.route) {
      navigate(currentStep.route, { replace: currentStepIndex === 0 });
    }
  }, [shouldShow, currentStep, location.pathname, navigate, currentStepIndex]);

  const finishTutorial = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
      setDismissedKey(storageKey);
    }
  };

  const handleNext = () => {
    if (currentStepIndex >= visibleSteps.length - 1) {
      finishTutorial();
      return;
    }

    const nextStep = currentStepIndex + 1;
    setStepIndex(nextStep);
    navigate(visibleSteps[nextStep].route);
  };

  if (!shouldShow || !currentStep) return null;

  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-neutral-950/55 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-[32px] border border-white/70 bg-white p-6 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.55)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="mb-0 text-sm font-semibold text-neutral-950">{currentStep.title}</p>
              <p className="mb-0 text-xs text-neutral-500">
                {currentStepIndex + 1} of {visibleSteps.length}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={finishTutorial}
            className="text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
          >
            Skip
          </button>
        </div>

        <div className="mt-6 rounded-[24px] bg-neutral-50 p-5">
          <h3 className="text-xl font-semibold text-neutral-950">{currentStep.title}</h3>
          <p className="mt-2 text-base text-neutral-600">{currentStep.description}</p>
        </div>

        <div className="mt-5 flex items-center gap-2">
          {visibleSteps.map((item, index) => (
            <span key={item.route} className={`h-2.5 flex-1 rounded-full ${index <= currentStepIndex ? 'bg-neutral-950' : 'bg-neutral-200'}`} />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={finishTutorial}>
            Skip Tutorial
          </Button>
          <Button type="button" onClick={handleNext}>
            {currentStepIndex === visibleSteps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};
