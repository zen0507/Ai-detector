import { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '../components/Toast';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((type, message, duration = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications((prev) => [...prev, { id, type, message, duration }]);
        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const notify = {
        success: (msg, duration) => addNotification('success', msg, duration),
        error: (msg, duration) => addNotification('error', msg, duration),
        warning: (msg, duration) => addNotification('warning', msg, duration),
        info: (msg, duration) => addNotification('info', msg, duration),
    };

    return (
        <NotificationContext.Provider value={notify}>
            {children}
            <ToastContainer
                notifications={notifications}
                removeNotification={removeNotification}
            />
        </NotificationContext.Provider>
    );
};
