'use client';

import { useCurrency } from '@/context/CurrencyContext';
import { Currency, SUPPORTED_CURRENCIES } from '@/lib/config/currency';
import styles from './CurrencySelector.module.css';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrency(e.target.value as Currency);
  };

  return (
    <div className={styles.wrapper}>
      <select
        value={currency}
        onChange={handleChange}
        className={styles.select}
        aria-label="Sélectionner la devise"
      >
        {Object.entries(SUPPORTED_CURRENCIES).map(([code, config]) => (
          <option key={code} value={code}>
            {config.flag} {config.symbol}
          </option>
        ))}
      </select>
    </div>
  );
}
