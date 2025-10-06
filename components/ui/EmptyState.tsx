import React from 'react';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    message: string;
    action?: {
        text: string;
        onClick: () => void;
    };
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, action }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8 bg-color-background rounded-lg">
            <div className="text-color-accent mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-semibold text-color-text mb-2">{title}</h3>
            <p className="max-w-xs">{message}</p>
            {action && (
                <button 
                    onClick={action.onClick}
                    className="mt-6 flex items-center space-x-2 bg-color-accent hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                    {action.text}
                </button>
            )}
        </div>
    );
};

export default EmptyState;