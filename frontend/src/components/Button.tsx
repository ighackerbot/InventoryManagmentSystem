import React, { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    className?: string;
}

export const Button = ({
    children, variant = 'primary', size = 'md',
    onClick, type = 'button', disabled = false, loading = false, className = '', ...props
}: ButtonProps) => {
    const variantClass = `btn-${variant}`;
    const sizeClass = size !== 'md' ? `btn-${size}` : '';
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
            {...props}
        >
            {loading ? (<><div className="spinner spinner-sm" />Loading...</>) : children}
        </button>
    );
};
