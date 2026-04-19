import React, { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    hover?: boolean;
    glass?: boolean;
    className?: string;
}

export const Card = ({ children, className = '', hover = true, glass = false, ...props }: CardProps) => (
    <div className={`card ${glass ? 'card-glass' : ''} ${!hover ? 'card-no-hover' : ''} ${className}`.trim()} {...props}>
        {children}
    </div>
);

export const CardHeader = ({ children, className = '', ...props }: CardProps) => (
    <div className={`card-header ${className}`.trim()} {...props}>{children}</div>
);

export const CardBody = ({ children, className = '', ...props }: CardProps) => (
    <div className={`card-body ${className}`.trim()} {...props}>{children}</div>
);

export const CardFooter = ({ children, className = '', ...props }: CardProps) => (
    <div className={`card-footer ${className}`.trim()} {...props}>{children}</div>
);
