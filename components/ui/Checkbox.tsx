'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, disabled, className = '', ...props }, ref) => {
    return (
      <div className={className}>
        <label className="inline-flex items-center cursor-pointer group">
          <div className="relative">
            <input
              ref={ref}
              type="checkbox"
              disabled={disabled}
              className="peer sr-only"
              {...props}
            />
            <div
              className={`
              w-5 h-5 rounded border-2 transition-all duration-250
              peer-checked:bg-primary peer-checked:border-primary
              peer-focus:ring-2 peer-focus:ring-offset-1 peer-focus:ring-primary
              peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
              ${error ? 'border-red-500' : 'border-border group-hover:border-primary'}
              flex items-center justify-center
            `}
            >
              <svg
                width="12"
                height="10"
                viewBox="0 0 12 10"
                fill="none"
                className="opacity-0 peer-checked:opacity-100 transition-opacity"
              >
                <path
                  d="M1 5L4.5 8.5L11 1.5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          {label && (
            <span className="ml-2 text-sm text-text-2 group-hover:text-text-1 transition-colors select-none">
              {label}
            </span>
          )}
        </label>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
