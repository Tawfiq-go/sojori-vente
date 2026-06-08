'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Currency, DEFAULT_CURRENCY } from '@/lib/config/currency';
import { getCurrency, saveCurrency, convertFromMAD, formatPrice, getPriceDisplay } from '@/lib/utils/currency';

interface CurrencyContextValue {
  /** Current display currency */
  currency: Currency;

  /** Change display currency */
  setCurrency: (currency: Currency) => void;

  /** Convert price from MAD to current currency */
  convert: (amountInMAD: number) => number;

  /** Format price in current currency */
  format: (amount: number, showOriginal?: boolean, originalAmount?: number) => string;

  /** Get price display object */
  getDisplay: (priceInMAD: number) => ReturnType<typeof getPriceDisplay>;

  /** Is currency loading */
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
  /** Initial currency (SSR) */
  initialCurrency?: Currency;
}

export function CurrencyProvider({ children, initialCurrency }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency || DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState(true);

  // Load currency from localStorage on mount (client-side only)
  useEffect(() => {
    const stored = getCurrency();
    setCurrencyState(stored);
    setIsLoading(false);
  }, []);

  // Save currency when it changes
  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    saveCurrency(newCurrency);

    // TODO: If user is logged in, save to backend
    // await updateUserPreferences({ currency: newCurrency });
  };

  // Helper functions
  const convert = (amountInMAD: number) => convertFromMAD(amountInMAD, currency);

  const format = (amount: number, showOriginal?: boolean, originalAmount?: number) =>
    formatPrice(amount, currency, showOriginal, originalAmount);

  const getDisplay = (priceInMAD: number) => getPriceDisplay(priceInMAD, currency);

  const value: CurrencyContextValue = {
    currency,
    setCurrency: handleSetCurrency,
    convert,
    format,
    getDisplay,
    isLoading,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

/**
 * Hook to access currency context
 *
 * @example
 * ```tsx
 * const { currency, setCurrency, convert, format } = useCurrency();
 *
 * // Convert 100 MAD to current currency
 * const converted = convert(100);
 *
 * // Format price in current currency
 * const formatted = format(converted);
 * ```
 */
export function useCurrency() {
  const context = useContext(CurrencyContext);

  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }

  return context;
}
