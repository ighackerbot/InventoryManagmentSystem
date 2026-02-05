export const LoadingSpinner = ({ size = 'md', centered = true }) => {
    const sizeClass = size !== 'md' ? `spinner-${size}` : '';

    if (centered) {
        return (
            <div className="flex justify-center items-center p-xl">
                <div className={`spinner ${sizeClass}`.trim()}></div>
            </div>
        );
    }

    return <div className={`spinner ${sizeClass}`.trim()}></div>;
};
