import { PackageSearch } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({ icon, title, description, action, tone = 'default' }) => {
  const IconComponent = icon || PackageSearch;
  const panel = tone === 'error' ? 'from-rose-50 to-white' : 'from-brand-50 to-white';

  return (
    <div className={`glass-panel rounded-[28px] border-dashed bg-gradient-to-br ${panel} p-8 text-center`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-neutral-200">
        <IconComponent className="h-8 w-8 text-brand-600" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-neutral-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">{description}</p>
      {action ? (
        <div className="mt-6">
          <Button onClick={action.onClick} icon={action.icon}>
            {action.label}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
