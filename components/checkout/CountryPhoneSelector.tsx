'use client';

import { useState, useRef, useEffect } from 'react';
import { COUNTRIES, type Country } from '@/lib/config/countries';
import styles from './CountryPhoneSelector.module.css';

interface CountryPhoneSelectorProps {
  value: string; // dial code
  onChange: (dialCode: string) => void;
}

export function CountryPhoneSelector({ value, onChange }: CountryPhoneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedCountry = COUNTRIES.find(c => c.dialCode === value) || COUNTRIES[0];

  // Filter countries based on search
  const filteredCountries = COUNTRIES.filter(country => {
    if (!search) return true;

    const searchLower = search.toLowerCase();

    return (
      // Search by French name
      country.nameFr.toLowerCase().includes(searchLower) ||
      // Search by English name
      country.name.toLowerCase().includes(searchLower) ||
      // Search by country code (MA, MAR, MOR for Morocco)
      country.code.toLowerCase().includes(searchLower) ||
      country.code.toLowerCase().startsWith(searchLower) ||
      // Search by dial code (212, +212)
      country.dialCode.includes(search) ||
      country.dialCode.replace('+', '').includes(search)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (country: Country) => {
    onChange(country.dialCode);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {/* Selected country button */}
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.flag}>{selectedCountry.flag}</span>
        <span className={styles.dialCode}>{selectedCountry.dialCode}</span>
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* Search input */}
          <div className={styles.searchWrapper}>
            <input
              type="text"
              className={styles.search}
              placeholder="Rechercher pays, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Countries list */}
          <div className={styles.list}>
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  className={`${styles.item} ${country.dialCode === value ? styles.selected : ''}`}
                  onClick={() => handleSelect(country)}
                >
                  <span className={styles.flag}>{country.flag}</span>
                  <span className={styles.countryName}>{country.nameFr}</span>
                  <span className={styles.dialCode}>{country.dialCode}</span>
                </button>
              ))
            ) : (
              <div className={styles.noResults}>Aucun pays trouvé</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
