import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from './Card';
import { cn } from '../lib/utils';

export const StatCard = ({ icon, label, value, description, trend, tone = 'brand' }) => {
  const IconComponent = icon;
  const toneClasses = {
    brand: 'bg-brand-50 text-brand-700 ring-brand-100',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    warning: 'bg-amber-50 text-amber-700 ring-amber-100',
    danger: 'bg-rose-50 text-rose-700 ring-rose-100',
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="space-y-1">
            <p className="mb-0 text-sm font-medium text-neutral-500">{label}</p>
            <p className="mb-0 text-2xl font-semibold text-neutral-950 sm:text-3xl">{value}</p>
          </div>
          {description ? <p className="mb-0 text-sm text-neutral-500">{description}</p> : null}
        </div>
        <div className={cn('rounded-2xl p-3 ring-1', toneClasses[tone])}>
          {IconComponent ? <IconComponent className="h-5 w-5" /> : null}
        </div>
      </div>
      {trend ? (
        <div className="mt-6 flex items-center gap-2 border-t border-neutral-100 pt-4 text-sm">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium',
              trend.direction === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            )}
          >
            {trend.direction === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {trend.value.toFixed(1)}%
          </span>
          <span className="text-neutral-500">from before</span>
        </div>
      ) : null}
    </Card>
  );
};
