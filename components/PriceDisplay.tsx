'use client';

import { useCurrency } from '@/context/CurrencyContext';
import styles from './PriceDisplay.module.css';

interface PriceDisplayProps {
  /** Price in MAD (base currency) */
  priceInMAD: number;

  /** Display period (e.g., "nuit", "semaine", "mois") */
  period?: string;

  /** Show original MAD price when displaying converted currency */
  showOriginal?: boolean;

  /** Size variant */
  size?: 'small' | 'medium' | 'large';

  /** Custom className */
  className?: string;
}

/**
 * Reusable component for displaying prices with multi-currency support
 *
 * @example
 * ```tsx
 * <PriceDisplay priceInMAD={1500} period="nuit" showOriginal />
 * ```
 */
export function PriceDisplay({
  priceInMAD,
  period = 'nuit',
  showOriginal = false,
  size = 'medium',
  className = '',
}: PriceDisplayProps) {
  const { currency, getDisplay, isLoading } = useCurrency();

  // Don't render if price is 0 or invalid
  if (!priceInMAD || priceInMAD <= 0) {
    return null;
  }

  // Show loading state to avoid flashing MAD before currency loads
  if (isLoading) {
    return (
      <div className={`${styles.price} ${styles[size]} ${className}`}>
        <span className={styles.loading}>Chargement...</span>
      </div>
    );
  }

  const display = getDisplay(priceInMAD);
  const isConverted = currency !== 'MAD';

  return (
    <div className={`${styles.price} ${styles[size]} ${className}`}>
      <div className={styles.main}>
        <span className={styles.amount}>{display.formatted}</span>
        {period && <span className={styles.period}>/{period}</span>}
      </div>

      {/* Show original MAD price when displaying converted currency */}
      {isConverted && showOriginal && (
        <div className={styles.original}>
          ({priceInMAD} MAD)
        </div>
      )}

      {/* Disclaimer for converted currencies */}
      {isConverted && (
        <div className={styles.disclaimer}>
          Prix indicatif. Paiement en MAD.
        </div>
      )}
    </div>
  );
}
