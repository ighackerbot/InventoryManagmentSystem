import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

const fieldStyles =
  'w-full rounded-[20px] border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10';

const FieldWrapper = ({ label, hint, error, required, children }) => (
  <label className="block space-y-2">
    {label ? (
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-neutral-700">
          {label}
          {required ? <span className="text-rose-500"> *</span> : null}
        </span>
        {hint ? <span className="text-xs text-neutral-400">{hint}</span> : null}
      </div>
    ) : null}
    {children}
    {error ? <p className="mb-0 text-sm text-rose-600">{error}</p> : null}
  </label>
);

export const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  className = '',
  icon: Icon,
  hint,
  ...props
}) => (
  <FieldWrapper label={label} hint={hint} error={error} required={required}>
    <div className="relative">
      {Icon ? <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /> : null}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(fieldStyles, Icon ? 'pl-11' : '', className)}
        {...props}
      />
    </div>
  </FieldWrapper>
);

export const Select = ({
  label,
  value,
  onChange,
  options = [],
  error,
  required = false,
  className = '',
  placeholder = 'Select...',
  hint,
  ...props
}) => (
  <FieldWrapper label={label} hint={hint} error={error} required={required}>
    <div className="relative">
      <select value={value} onChange={onChange} className={cn(fieldStyles, 'appearance-none pr-10', className)} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
    </div>
  </FieldWrapper>
);

export const Textarea = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  className = '',
  hint,
  ...props
}) => (
  <FieldWrapper label={label} hint={hint} error={error} required={required}>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn(fieldStyles, 'min-h-[120px] resize-y', className)}
      {...props}
    />
  </FieldWrapper>
);
