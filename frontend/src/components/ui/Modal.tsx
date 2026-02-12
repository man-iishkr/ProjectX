import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
    maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    className = '',
    maxWidth = 'max-w-md'
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={onClose}>
            <div
                className={`bg-white dark:bg-card w-full ${maxWidth} rounded-lg shadow-lg border border-slate-200 dark:border-border max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 ${className}`}
                onMouseDown={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-border sticky top-0 bg-white dark:bg-card z-10">
                    {title && <h3 className="text-lg font-semibold text-slate-800 dark:text-foreground">{title}</h3>}
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-muted text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
