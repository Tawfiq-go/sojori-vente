/**
 * Currency Conversion Utilities
 */

import { Currency, EXCHANGE_RATES, SUPPORTED_CURRENCIES, PAYMENT_CURRENCY } from '@/lib/config/currency';

/**
 * Convert price from MAD to target currency
 *
 * @param amountInMAD - Amount in Moroccan Dirham (base currency)
 * @param targetCurrency - Target currency (MAD/EUR/USD)
 * @returns Converted amount rounded to 2 decimals
 */
export function convertFromMAD(
  amountInMAD: number,
  targetCurrency: Currency
): number {
  if (targetCurrency === 'MAD') {
    return amountInMAD;
  }

  const rate = EXCHANGE_RATES[targetCurrency];
  const converted = amountInMAD * rate;

  return Math.round(converted * 100) / 100; // Round to 2 decimals
}

/**
 * Convert price from any currency to MAD
 *
 * @param amount - Amount in source currency
 * @param sourceCurrency - Source currency (MAD/EUR/USD)
 * @returns Amount in MAD rounded to 2 decimals
 */
export function convertToMAD(
  amount: number,
  sourceCurrency: Currency
): number {
  if (sourceCurrency === 'MAD') {
    return amount;
  }

  const rate = EXCHANGE_RATES[sourceCurrency];
  const converted = amount / rate;

  return Math.round(converted * 100) / 100; // Round to 2 decimals
}

/**
 * Convert price between any two currencies
 *
 * @param amount - Amount to convert
 * @param from - Source currency
 * @param to - Target currency
 * @returns Converted amount
 */
export function convertPrice(
  amount: number,
  from: Currency,
  to: Currency
): number {
  if (from === to) return amount;

  // Always convert via MAD (base currency)
  const amountInMAD = convertToMAD(amount, from);
  return convertFromMAD(amountInMAD, to);
}

/**
 * Format price with currency symbol and locale
 *
 * @param amount - Amount to format
 * @param currency - Currency code
 * @param showOriginal - Show original MAD price in parentheses
 * @param originalAmount - Original amount in MAD (if different from amount)
 * @returns Formatted price string
 *
 * @example
 * formatPrice(100, 'MAD') => "100 MAD"
 * formatPrice(9.2, 'EUR') => "€9.20"
 * formatPrice(9.2, 'EUR', true, 100) => "€9.20 (100 MAD)"
 */
export function formatPrice(
  amount: number,
  currency: Currency,
  showOriginal: boolean = false,
  originalAmount?: number
): string {
  const config = SUPPORTED_CURRENCIES[currency];

  // Format with Intl.NumberFormat for proper locale
  const formatted = new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'MAD' ? 0 : 2,
    maximumFractionDigits: currency === 'MAD' ? 0 : 2,
  }).format(amount);

  // Show original MAD price if requested and currency is not MAD
  if (showOriginal && currency !== 'MAD' && originalAmount) {
    return `${formatted} (${Math.round(originalAmount)} MAD)`;
  }

  return formatted;
}

/**
 * Get price display for a listing
 *
 * @param priceInMAD - Original price in MAD (from database)
 * @param displayCurrency - Currency to display
 * @returns Object with formatted price and conversion info
 */
export function getPriceDisplay(
  priceInMAD: number,
  displayCurrency: Currency
) {
  const convertedAmount = convertFromMAD(priceInMAD, displayCurrency);

  return {
    amount: convertedAmount,
    formatted: formatPrice(convertedAmount, displayCurrency),
    formattedWithOriginal: formatPrice(convertedAmount, displayCurrency, true, priceInMAD),
    originalMAD: priceInMAD,
    currency: displayCurrency,
    isConverted: displayCurrency !== 'MAD',
  };
}

/**
 * Calculate total with conversion
 *
 * @param subtotalInMAD - Subtotal in MAD
 * @param serviceFeeInMAD - Service fee in MAD
 * @param taxInMAD - Tax in MAD
 * @param displayCurrency - Currency to display
 * @returns Breakdown with all amounts converted
 */
export function calculateTotalWithConversion(
  subtotalInMAD: number,
  serviceFeeInMAD: number,
  taxInMAD: number,
  displayCurrency: Currency
) {
  const subtotal = convertFromMAD(subtotalInMAD, displayCurrency);
  const serviceFee = convertFromMAD(serviceFeeInMAD, displayCurrency);
  const tax = convertFromMAD(taxInMAD, displayCurrency);
  const total = subtotal + serviceFee + tax;

  return {
    subtotal: {
      amount: subtotal,
      formatted: formatPrice(subtotal, displayCurrency),
      originalMAD: subtotalInMAD,
    },
    serviceFee: {
      amount: serviceFee,
      formatted: formatPrice(serviceFee, displayCurrency),
      originalMAD: serviceFeeInMAD,
    },
    tax: {
      amount: tax,
      formatted: formatPrice(tax, displayCurrency),
      originalMAD: taxInMAD,
    },
    total: {
      amount: total,
      formatted: formatPrice(total, displayCurrency),
      originalMAD: subtotalInMAD + serviceFeeInMAD + taxInMAD,
    },
    currency: displayCurrency,
    paymentCurrency: PAYMENT_CURRENCY,
    disclaimer: displayCurrency !== 'MAD'
      ? `Prix indicatif. Paiement en ${PAYMENT_CURRENCY}.`
      : null,
  };
}

/**
 * Detect user currency based on browser locale
 *
 * @returns Detected currency or default (MAD)
 */
export function detectUserCurrency(): Currency {
  if (typeof navigator === 'undefined') return 'MAD';

  const locale = navigator.language.toLowerCase();

  // European countries → EUR
  if (
    locale.startsWith('fr') ||
    locale.startsWith('de') ||
    locale.startsWith('es') ||
    locale.startsWith('it') ||
    locale.startsWith('pt') ||
    locale.startsWith('nl') ||
    locale.startsWith('be')
  ) {
    return 'EUR';
  }

  // US, Canada → USD
  if (locale.startsWith('en-us') || locale.startsWith('en-ca')) {
    return 'USD';
  }

  // Default: MAD (Morocco)
  return 'MAD';
}

/**
 * Get currency from localStorage or detect automatically
 */
export function getCurrency(): Currency {
  if (typeof window === 'undefined') return 'MAD';

  // Try localStorage first
  const stored = localStorage.getItem('sojori:currency');
  if (stored && ['MAD', 'EUR', 'USD'].includes(stored)) {
    return stored as Currency;
  }

  // Fallback: auto-detect
  return detectUserCurrency();
}

/**
 * Save currency to localStorage
 */
export function saveCurrency(currency: Currency): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sojori:currency', currency);
}
