import React from 'react';
import { ChevronDownIcon } from '../Icons';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  containerClassName?: string;
}

const Select: React.FC<SelectProps> = ({ label, className, containerClassName, children, ...props }) => {
  return (
    <div className={`flex flex-col ${containerClassName ?? ''}`}>
      {label && <label className="mb-1 text-sm font-medium text-gray-500">{label}</label>}
      <div className="relative">
        <select
          className={`w-full appearance-none bg-color-background border border-color-border rounded-md py-2 px-3 text-color-text focus:outline-none focus:border-color-accent focus:ring-1 focus:ring-color-accent transition-colors ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <ChevronDownIcon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default Select;