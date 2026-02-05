export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    onClick,
    type = 'button',
    disabled = false,
    loading = false,
    className = '',
    ...props
}) => {
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
            {loading ? (
                <>
                    <div className="spinner spinner-sm"></div>
                    Loading...
                </>
            ) : (
                children
            )}
        </button>
    );
};
