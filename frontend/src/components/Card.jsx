export const Card = ({ children, className = '', hover = true, glass = false, ...props }) => {
    const hoverClass = hover ? '' : 'card-no-hover';
    const glassClass = glass ? 'card-glass' : '';

    return (
        <div className={`card ${glassClass} ${hoverClass} ${className}`.trim()} {...props}>
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = '', ...props }) => {
    return (
        <div className={`card-header ${className}`.trim()} {...props}>
            {children}
        </div>
    );
};

export const CardBody = ({ children, className = '', ...props }) => {
    return (
        <div className={`card-body ${className}`.trim()} {...props}>
            {children}
        </div>
    );
};

export const CardFooter = ({ children, className = '', ...props }) => {
    return (
        <div className={`card-footer ${className}`.trim()} {...props}>
            {children}
        </div>
    );
};
