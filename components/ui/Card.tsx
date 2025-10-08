import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  bodyClassName?: string;
}

const Card: React.FC<CardProps> = ({ children, title, className, icon, action, bodyClassName, ...props }) => {
  return (
    <div 
      className={`bg-color-surface rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}
      {...props}
    >
      {title && (
        <div className="p-4 border-b border-color-border flex justify-between items-center">
            <div className="flex items-center space-x-2">
                {icon}
                <h3 className="text-lg font-semibold text-color-accent">{title}</h3>
            </div>
            {action}
        </div>
      )}
      <div className={`p-4 ${bodyClassName ?? ''}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;