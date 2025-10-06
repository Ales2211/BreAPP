import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from '../Icons';

interface ToastProps {
  message: string;
  title: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const icons = {
  success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
  error: <AlertTriangleIcon className="w-6 h-6 text-red-500" />,
  info: <InfoIcon className="w-6 h-6 text-blue-500" />,
};

const Toast: React.FC<ToastProps> = ({ message, title, type, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 300);
    };
    
    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, 5000);

        return () => {
            clearTimeout(timer);
        };
    }, []);

  return (
    <div
      className={`
        w-full bg-color-surface shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden
        flex items-start p-4 space-x-3
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-color-text">{title}</p>
        <p className="mt-1 text-sm text-gray-600">{message}</p>
      </div>
      <div className="flex-shrink-0">
        <button onClick={handleClose} className="p-1 rounded-md text-gray-500 hover:text-color-text hover:bg-color-border focus:outline-none">
            <span className="sr-only">Close</span>
            <XIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;