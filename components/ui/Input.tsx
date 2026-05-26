'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      type = 'text',
      ...props
    },
    ref
  ) => {
    const baseInputStyles =
      'h-10 px-3 rounded-lg border transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed text-text-1 placeholder:text-text-3';

    const inputStateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-border focus:border-primary focus:ring-primary bg-surface-1';

    const wrapperWidth = fullWidth ? 'w-full' : '';
    const hasLeftIcon = leftIcon ? 'pl-10' : '';
    const hasRightIcon = rightIcon ? 'pr-10' : '';

    return (
      <div className={`${wrapperWidth} ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-text-2 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            disabled={disabled}
            className={`${baseInputStyles} ${inputStateStyles} ${hasLeftIcon} ${hasRightIcon} w-full`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-text-3">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
