'use client';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ai' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-full whitespace-nowrap';

  const variants = {
    primary: 'bg-primary/10 text-primary border border-primary/20',
    ai: 'bg-ai/10 text-ai border border-ai/20',
    success: 'bg-green-500/10 text-green-600 border border-green-500/20',
    warning: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
    danger: 'bg-red-500/10 text-red-600 border border-red-500/20',
    neutral: 'bg-surface-2 text-text-2 border border-border',
  };

  const sizes = {
    sm: 'h-5 px-2 text-xs',
    md: 'h-6 px-2.5 text-sm',
    lg: 'h-7 px-3 text-base',
  };

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}
