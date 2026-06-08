/**
 * Optimized Image Component
 * Wrapper around Next.js Image with best practices
 */

import Image from 'next/image';
import { useState } from 'react';
import { logger } from '@/lib/utils/logger';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  aspectRatio?: string;
  sizes?: string;
  fallbackSrc?: string;
}

/**
 * OptimizedImage component with:
 * - Lazy loading by default
 * - Blur placeholder
 * - Error fallback
 * - Responsive sizes
 * - CDN optimization
 */
export function OptimizedImage({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  priority = false,
  objectFit = 'cover',
  aspectRatio,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fallbackSrc = '/placeholder-image.jpg',
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  // Handle image load error
  const handleError = () => {
    logger.debug(`Failed to load image: ${src}`);
    setImgSrc(fallbackSrc);
  };

  // Check if image is from external CDN
  const isExternalImage = src.startsWith('http');

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: aspectRatio || `${width}/${height}` }}
    >
      {isExternalImage ? (
        // External images (S3, CDN) - use next/image with unoptimized if needed
        <Image
          src={imgSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className={`object-${objectFit} transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoadingComplete={() => setIsLoading(false)}
          onError={handleError}
          unoptimized // For external URLs without Next.js optimization
        />
      ) : (
        // Local images - use Next.js optimization
        <Image
          src={imgSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className={`object-${objectFit} transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoadingComplete={() => setIsLoading(false)}
          onError={handleError}
        />
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * ListingImage - Specialized component for listing cards
 */
export function ListingImage({
  src,
  alt,
  className = '',
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={800}
      height={600}
      className={className}
      priority={priority}
      objectFit="cover"
      aspectRatio="4/3"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  );
}

/**
 * HeroImage - Specialized component for hero sections
 */
export function HeroImage({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      className={className}
      priority={true} // Hero images should be loaded immediately
      objectFit="cover"
      aspectRatio="16/9"
      sizes="100vw"
    />
  );
}

/**
 * Avatar - Specialized component for user/PM avatars
 */
export function Avatar({
  src,
  alt,
  size = 48,
  className = '',
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      objectFit="cover"
      aspectRatio="1/1"
      sizes={`${size}px`}
    />
  );
}
