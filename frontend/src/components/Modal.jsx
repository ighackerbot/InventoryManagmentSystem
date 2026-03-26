import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

export const Modal = ({ isOpen, onClose, title, description, children, size = 'md' }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidth = size === 'lg' ? 'max-w-4xl' : size === 'sm' ? 'max-w-xl' : 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-neutral-950/45 p-4 backdrop-blur-sm sm:items-center" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className={cn('glass-panel max-h-[90vh] w-full overflow-hidden rounded-[32px]', maxWidth)}>
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-neutral-950">{title}</h3>
            {description ? <p className="mt-1 text-sm text-neutral-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-neutral-200 bg-white p-2 text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-950"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
};
