'use client';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'flat' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export default function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  className = '',
  onClick,
}: CardProps) {
  const baseStyles = 'rounded-xl transition-all duration-250 bg-surface-1';

  const variants = {
    flat: 'shadow-none',
    elevated: 'shadow-md hover:shadow-lg',
    outlined: 'shadow-none border border-border hover:border-primary/30',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const interactiveStyles = onClick
    ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
    : '';

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${interactiveStyles} ${className}`}
    >
      {children}
    </div>
  );
}
