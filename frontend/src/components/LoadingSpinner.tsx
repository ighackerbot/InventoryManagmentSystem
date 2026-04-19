import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    centered?: boolean;
}

export const LoadingSpinner = ({ size = 'md', centered = true }: LoadingSpinnerProps) => {
    const sizeClass = size !== 'md' ? `spinner-${size}` : '';
    if (centered) {
        return (
            <div className="flex justify-center items-center p-xl">
                <div className={`spinner ${sizeClass}`.trim()} />
            </div>
        );
    }
    return <div className={`spinner ${sizeClass}`.trim()} />;
};
