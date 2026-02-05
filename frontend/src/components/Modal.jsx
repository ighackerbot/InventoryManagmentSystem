import { useEffect } from 'react';

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className={`modal-content modal-${size}`}>
                <div className="flex justify-between items-center mb-lg">
                    <h3>{title}</h3>
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                        style={{ padding: '0.5rem 1rem' }}
                    >
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};
