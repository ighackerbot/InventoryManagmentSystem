import { LoaderCircle } from 'lucide-react';

export const LoadingSpinner = ({ centered = true, label = 'Loading...' }) => {
  const content = (
    <div className="inline-flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-600 shadow-sm">
      <LoaderCircle className="h-4 w-4 animate-spin text-brand-600" />
      {label}
    </div>
  );

  if (centered) {
    return <div className="flex min-h-[240px] items-center justify-center">{content}</div>;
  }

  return content;
};
