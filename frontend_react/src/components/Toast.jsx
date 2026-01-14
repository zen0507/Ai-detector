import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

const Toast = ({ id, type = 'info', message, duration = 5000, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    // Variants for animation
    const variants = {
        initial: { opacity: 0, y: 50, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
    };

    const styles = {
        success: {
            icon: CheckCircle,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]'
        },
        error: {
            icon: AlertCircle,
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            glow: 'shadow-[0_0_15px_rgba(239,68,68,0.1)]'
        },
        warning: {
            icon: AlertTriangle,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]'
        },
        info: {
            icon: Info,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20',
            glow: 'shadow-[0_0_15px_rgba(99,102,241,0.1)]'
        }
    };

    const style = styles[type] || styles.info;
    const Icon = style.icon;

    return (
        <motion.div
            layout
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border ${style.border} ${style.bg} ${style.glow} backdrop-blur-md shadow-lg p-4 flex items-start gap-4`}
        >
            <div className={`p-1 rounded-full bg-white/5 ${style.color} shrink-0`}>
                <Icon size={20} />
            </div>
            <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">{message}</p>
            </div>
            <button
                onClick={() => onClose(id)}
                className="text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors p-1"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

export const ToastContainer = ({ notifications, removeNotification }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none p-4">
            <AnimatePresence mode="popLayout">
                {notifications.map((notif) => (
                    <Toast
                        key={notif.id}
                        {...notif}
                        onClose={removeNotification}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default Toast;
