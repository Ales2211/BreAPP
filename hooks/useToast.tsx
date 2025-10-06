import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import Toast from '../components/ui/Toast';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  title: string;
}

interface ToastContextType {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType, title: string) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type, title }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  const success = (message: string, title = 'Success') => addToast(message, 'success', title);
  const error = (message: string, title = 'Error') => addToast(message, 'error', title);
  const info = (message: string, title = 'Info') => addToast(message, 'info', title);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// This component will render the toasts
export const ToastContainer: React.FC<{ toasts: ToastMessage[]; removeToast: (id: number) => void; }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-xs space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          title={toast.title}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
