'use client';

export interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) {
  const baseStyles =
    'animate-pulse bg-gradient-to-r from-surface-2 via-surface-3 to-surface-2 bg-[length:200%_100%]';

  const variants = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={style}
    />
  );
}

// Helper components for common skeleton patterns
export function SkeletonCard() {
  return (
    <div className="p-4 border border-border rounded-xl space-y-3">
      <Skeleton variant="rectangular" height={200} />
      <Skeleton width="60%" />
      <Skeleton width="80%" />
      <div className="flex gap-2">
        <Skeleton variant="circular" width={32} height={32} />
        <div className="flex-1 space-y-2">
          <Skeleton width="40%" />
          <Skeleton width="60%" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonListingCard() {
  return (
    <div className="space-y-3">
      <Skeleton variant="rectangular" height={240} className="rounded-2xl" />
      <div className="space-y-2">
        <Skeleton width="70%" height={20} />
        <Skeleton width="50%" height={16} />
        <Skeleton width="30%" height={24} />
      </div>
    </div>
  );
}
