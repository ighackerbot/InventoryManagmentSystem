import { LoaderCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const variants = {
  primary:
    'bg-neutral-950 text-white shadow-[0_20px_45px_-22px_rgba(15,23,42,0.55)] hover:-translate-y-0.5 hover:bg-neutral-800',
  secondary:
    'bg-white text-neutral-800 ring-1 ring-neutral-200 hover:-translate-y-0.5 hover:bg-neutral-50',
  ghost: 'bg-transparent text-neutral-600 ring-1 ring-transparent hover:bg-white hover:text-neutral-950 hover:ring-neutral-200',
  danger: 'bg-rose-600 text-white shadow-[0_20px_45px_-22px_rgba(225,29,72,0.55)] hover:-translate-y-0.5 hover:bg-rose-500',
};

const sizes = {
  sm: 'h-10 rounded-2xl px-4 text-sm',
  md: 'h-11 rounded-[18px] px-5 text-sm',
  lg: 'h-12 rounded-[20px] px-6 text-sm',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  icon: Icon,
  iconRight: IconRight,
  ...props
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:pointer-events-none disabled:opacity-60',
      variants[variant],
      sizes[size],
      className
    )}
    {...props}
  >
    {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
    <span>{children}</span>
    {!loading && IconRight ? <IconRight className="h-4 w-4" /> : null}
  </button>
);
