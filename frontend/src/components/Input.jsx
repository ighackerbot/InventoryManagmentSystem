export const Input = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    required = false,
    className = '',
    ...props
}) => {
    return (
        <div className="form-group">
            {label && (
                <label className="form-label">
                    {label} {required && <span className="text-danger">*</span>}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`form-input ${className}`.trim()}
                {...props}
            />
            {error && <div className="form-error">{error}</div>}
        </div>
    );
};

export const Select = ({
    label,
    value,
    onChange,
    options = [],
    error,
    required = false,
    className = '',
    placeholder = 'Select...',
    ...props
}) => {
    return (
        <div className="form-group">
            {label && (
                <label className="form-label">
                    {label} {required && <span className="text-danger">*</span>}
                </label>
            )}
            <select
                value={value}
                onChange={onChange}
                className={`form-select ${className}`.trim()}
                {...props}
            >
                <option value="">{placeholder}</option>
                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <div className="form-error">{error}</div>}
        </div>
    );
};

export const Textarea = ({
    label,
    value,
    onChange,
    placeholder,
    error,
    required = false,
    className = '',
    ...props
}) => {
    return (
        <div className="form-group">
            {label && (
                <label className="form-label">
                    {label} {required && <span className="text-danger">*</span>}
                </label>
            )}
            <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`form-textarea ${className}`.trim()}
                {...props}
            />
            {error && <div className="form-error">{error}</div>}
        </div>
    );
};
