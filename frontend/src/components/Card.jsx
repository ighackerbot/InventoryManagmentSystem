import { cn } from '../lib/utils';

export const Card = ({ children, className = '', ...props }) => (
  <div className={cn('glass-panel rounded-[28px] p-5 sm:p-6', className)} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={cn('mb-5 flex items-start justify-between gap-4', className)} {...props}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '', ...props }) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={cn('mt-5 border-t border-neutral-100 pt-5', className)} {...props}>
    {children}
  </div>
);
