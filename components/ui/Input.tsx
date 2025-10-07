import React from 'react';
import { ClockIcon } from '../Icons';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  unit?: string;
  containerClassName?: string;
  showTimeNowButton?: boolean;
}

const Input: React.FC<InputProps> = ({ label, unit, className, containerClassName, showTimeNowButton, ...props }) => {
    
    const handleNowClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        
        const now = new Date();
        let formattedNow: string;

        if (props.type === 'time') {
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            formattedNow = `${hours}:${minutes}`;
        } else { // Assumes 'datetime-local'
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            formattedNow = now.toISOString().slice(0, 16);
        }

        const syntheticEvent = {
            target: {
                name: props.name || '',
                value: formattedNow,
            },
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        if (props.onChange) {
            props.onChange(syntheticEvent);
        }
    };
    
    let paddingRightClass = 'pr-3';
    if (showTimeNowButton && unit) {
        paddingRightClass = 'pr-20';
    } else if (showTimeNowButton || unit) {
        paddingRightClass = 'pr-12';
    }

  return (
    <div className={`flex flex-col ${containerClassName ?? ''}`}>
      {label && <label className="mb-1 text-sm font-medium text-gray-500">{label}</label>}
      <div className="relative">
        <input
          className={`w-full bg-color-background border border-color-border rounded-md py-2 pl-3 ${paddingRightClass} text-color-text focus:outline-none focus:border-color-accent focus:ring-1 focus:ring-color-accent transition-colors ${className}`}
          {...props}
        />
        <div className="absolute inset-y-0 right-3 flex items-center space-x-1">
            {showTimeNowButton && (
                <button 
                    type="button" 
                    onClick={handleNowClick} 
                    className="p-1 text-gray-500 rounded-full hover:bg-color-border hover:text-color-accent focus:outline-none z-10"
                    aria-label="Set current time"
                >
                    <ClockIcon className="w-5 h-5"/>
                </button>
            )}
            {unit && <span className="text-gray-500 text-sm pointer-events-none">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

export default Input;