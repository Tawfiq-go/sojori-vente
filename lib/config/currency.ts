/**
 * Currency Configuration
 *
 * IMPORTANT:
 * - Base currency: MAD (stored in database)
 * - Payment: ALWAYS in MAD (we control the amount)
 * - Display: Multi-currency (UX only)
 */

export type Currency = 'MAD' | 'EUR' | 'USD';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  locale: string;
  flag: string;
  position: 'before' | 'after'; // Symbol position
}

export const SUPPORTED_CURRENCIES: Record<Currency, CurrencyConfig> = {
  MAD: {
    code: 'MAD',
    symbol: 'MAD',
    name: 'Dirham Marocain',
    locale: 'ar-MA',
    flag: '🇲🇦',
    position: 'after',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'fr-FR',
    flag: '🇪🇺',
    position: 'before',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    flag: '🇺🇸',
    position: 'before',
  },
} as const;

/**
 * Fixed exchange rates (updated monthly)
 * Base: 1 MAD = X EUR/USD
 *
 * Last update: 2026-06-02
 * Source: Bank Al-Maghrib
 */
export const EXCHANGE_RATES: Record<'EUR' | 'USD', number> = {
  EUR: 0.092,  // 1 MAD = 0.092 EUR (~10.87 MAD = 1 EUR)
  USD: 0.10,   // 1 MAD = 0.10 USD (~10 MAD = 1 USD)
};

/**
 * Default currency (Moroccan Dirham)
 */
export const DEFAULT_CURRENCY: Currency = 'MAD';

/**
 * Payment currency (always MAD)
 */
export const PAYMENT_CURRENCY: Currency = 'MAD';

/**
 * Get currency config
 */
export function getCurrencyConfig(currency: Currency): CurrencyConfig {
  return SUPPORTED_CURRENCIES[currency];
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  return SUPPORTED_CURRENCIES[currency].symbol;
}

/**
 * Get currency flag
 */
export function getCurrencyFlag(currency: Currency): string {
  return SUPPORTED_CURRENCIES[currency].flag;
}
