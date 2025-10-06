
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  unit?: string;
  containerClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, unit, className, containerClassName, ...props }) => {
  return (
    <div className={`flex flex-col ${containerClassName ?? ''}`}>
      {label && <label className="mb-1 text-sm font-medium text-gray-500">{label}</label>}
      <div className="relative">
        <input
          className={`w-full bg-color-background border border-color-border rounded-md py-2 px-3 text-color-text focus:outline-none focus:border-color-accent focus:ring-1 focus:ring-color-accent transition-colors ${className}`}
          {...props}
        />
        {unit && <span className="absolute inset-y-0 right-3 flex items-center text-gray-500 text-sm pointer-events-none">{unit}</span>}
      </div>
    </div>
  );
};

export default Input;