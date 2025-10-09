import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '../Icons';
import { useTranslation } from '../../hooks/useTranslation';

interface MultiSelectProps {
  label: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selectedValues, onChange }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const displayLabel = () => {
    if (selectedValues.length === 0) return t('Select...');
    if (selectedValues.length === options.length) return t('All selected');
    if (selectedValues.length === 1) {
        const selectedOption = options.find(o => o.value === selectedValues[0]);
        return selectedOption ? selectedOption.label.trim().replace(/^-/, '').trim() : `1 ${t('selected')}`;
    }
    return `${selectedValues.length} ${t('selected')}`;
  };

  return (
    <div className="flex flex-col relative" ref={wrapperRef}>
      <label className="mb-1 text-sm font-medium text-gray-500">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-color-background border border-color-border rounded-md py-2 px-3 text-color-text focus:outline-none focus:border-color-accent focus:ring-1 focus:ring-color-accent transition-colors flex justify-between items-center text-left"
      >
        <span className="truncate">{displayLabel()}</span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-color-surface border border-color-border rounded-md shadow-lg max-h-60 overflow-y-auto top-full">
          <ul>
            {options.map(option => (
              <li key={option.value} className="px-3 py-2 hover:bg-color-background cursor-pointer text-sm">
                <label className="flex items-center space-x-2 w-full">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleToggle(option.value)}
                    className="form-checkbox h-4 w-4 text-color-accent rounded border-color-border focus:ring-color-accent"
                  />
                  <span>{option.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
