'use client';

import { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  disabled = false,
  fullWidth = false,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const wrapperWidth = fullWidth ? 'w-full' : '';

  return (
    <div ref={containerRef} className={`relative ${wrapperWidth} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-2 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full h-10 px-3 rounded-lg border transition-all duration-250
          flex items-center justify-between
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-border hover:border-primary'}
          ${isOpen ? 'ring-2 ring-primary border-primary' : ''}
          bg-surface-1
        `}
      >
        <span className={selectedOption ? 'text-text-1' : 'text-text-3'}>
          {selectedOption?.label || placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-surface-1 border border-border rounded-lg shadow-lg overflow-hidden animate-slideUp">
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full h-8 px-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-surface-1 text-text-1 placeholder:text-text-3"
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full px-3 py-2 text-left transition-colors
                    hover:bg-surface-2
                    ${
                      option.value === value
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-text-1'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-text-3 text-sm">
                No options found
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
}
