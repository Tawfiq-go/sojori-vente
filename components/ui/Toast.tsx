'use client';

import { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  type = 'info',
  duration = 4000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.2" />
        <path
          d="M6 10L9 13L14 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.2" />
        <path
          d="M13 7L7 13M7 7L13 13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    warning: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.2" />
        <path
          d="M10 6V11M10 14H10.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.2" />
        <path
          d="M10 10V14M10 6H10.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  };

  const colors = {
    success: 'bg-green-50 text-green-600 border-green-200',
    error: 'bg-red-50 text-red-600 border-red-200',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
    info: 'bg-blue-50 text-blue-600 border-blue-200',
  };

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
        ${colors[type]}
        animate-slideUp
      `}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="ml-2 flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M12 4L4 12M4 4L12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
