/**
 * Country calling codes configuration
 * Priority: Morocco, France, Spain, top booking countries for Morocco, then rest of the world
 */

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  nameFr: string;
  dialCode: string;
  flag: string;
  phoneFormat?: RegExp; // Optional regex for validation
  phoneLength?: number; // Expected phone number length (without dial code)
}

export const COUNTRIES: Country[] = [
  // Top 3 priority countries
  { code: 'MA', name: 'Morocco', nameFr: 'Maroc', dialCode: '+212', flag: '🇲🇦', phoneFormat: /^[67]\d{8}$/, phoneLength: 9 },
  { code: 'FR', name: 'France', nameFr: 'France', dialCode: '+33', flag: '🇫🇷', phoneFormat: /^[67]\d{8}$/, phoneLength: 9 },
  { code: 'ES', name: 'Spain', nameFr: 'Espagne', dialCode: '+34', flag: '🇪🇸', phoneFormat: /^[67]\d{8}$/, phoneLength: 9 },

  // Top booking countries for Morocco
  { code: 'DE', name: 'Germany', nameFr: 'Allemagne', dialCode: '+49', flag: '🇩🇪' },
  { code: 'GB', name: 'United Kingdom', nameFr: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' },
  { code: 'IT', name: 'Italy', nameFr: 'Italie', dialCode: '+39', flag: '🇮🇹' },
  { code: 'BE', name: 'Belgium', nameFr: 'Belgique', dialCode: '+32', flag: '🇧🇪' },
  { code: 'NL', name: 'Netherlands', nameFr: 'Pays-Bas', dialCode: '+31', flag: '🇳🇱' },
  { code: 'CH', name: 'Switzerland', nameFr: 'Suisse', dialCode: '+41', flag: '🇨🇭' },
  { code: 'US', name: 'United States', nameFr: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', nameFr: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'PT', name: 'Portugal', nameFr: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'SE', name: 'Sweden', nameFr: 'Suède', dialCode: '+46', flag: '🇸🇪' },
  { code: 'DK', name: 'Denmark', nameFr: 'Danemark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'NO', name: 'Norway', nameFr: 'Norvège', dialCode: '+47', flag: '🇳🇴' },
  { code: 'FI', name: 'Finland', nameFr: 'Finlande', dialCode: '+358', flag: '🇫🇮' },
  { code: 'IE', name: 'Ireland', nameFr: 'Irlande', dialCode: '+353', flag: '🇮🇪' },
  { code: 'AT', name: 'Austria', nameFr: 'Autriche', dialCode: '+43', flag: '🇦🇹' },
  { code: 'PL', name: 'Poland', nameFr: 'Pologne', dialCode: '+48', flag: '🇵🇱' },
  { code: 'AE', name: 'UAE', nameFr: 'Émirats', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', nameFr: 'Arabie Saoudite', dialCode: '+966', flag: '🇸🇦' },

  // Rest of the world (alphabetical)
  { code: 'AL', name: 'Albania', nameFr: 'Albanie', dialCode: '+355', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', nameFr: 'Algérie', dialCode: '+213', flag: '🇩🇿' },
  { code: 'AR', name: 'Argentina', nameFr: 'Argentine', dialCode: '+54', flag: '🇦🇷' },
  { code: 'AU', name: 'Australia', nameFr: 'Australie', dialCode: '+61', flag: '🇦🇺' },
  { code: 'BR', name: 'Brazil', nameFr: 'Brésil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'CN', name: 'China', nameFr: 'Chine', dialCode: '+86', flag: '🇨🇳' },
  { code: 'EG', name: 'Egypt', nameFr: 'Égypte', dialCode: '+20', flag: '🇪🇬' },
  { code: 'GR', name: 'Greece', nameFr: 'Grèce', dialCode: '+30', flag: '🇬🇷' },
  { code: 'IN', name: 'India', nameFr: 'Inde', dialCode: '+91', flag: '🇮🇳' },
  { code: 'JP', name: 'Japan', nameFr: 'Japon', dialCode: '+81', flag: '🇯🇵' },
  { code: 'MX', name: 'Mexico', nameFr: 'Mexique', dialCode: '+52', flag: '🇲🇽' },
  { code: 'RU', name: 'Russia', nameFr: 'Russie', dialCode: '+7', flag: '🇷🇺' },
  { code: 'TN', name: 'Tunisia', nameFr: 'Tunisie', dialCode: '+216', flag: '🇹🇳' },
  { code: 'TR', name: 'Turkey', nameFr: 'Turquie', dialCode: '+90', flag: '🇹🇷' },
];

/**
 * Get country by dial code
 */
export function getCountryByDialCode(dialCode: string): Country | undefined {
  return COUNTRIES.find(c => c.dialCode === dialCode);
}

/**
 * Get country by code
 */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

/**
 * Validate phone number for a specific country
 */
export function validatePhoneNumber(phone: string, country: Country): boolean {
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Phone should not start with 0
  if (cleaned.startsWith('0')) {
    return false;
  }

  // If country has specific format, validate
  if (country.phoneFormat) {
    return country.phoneFormat.test(cleaned);
  }

  // If country has expected length, validate
  if (country.phoneLength) {
    return cleaned.length === country.phoneLength;
  }

  // Default: 7-15 digits
  return /^\d{7,15}$/.test(cleaned);
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string, country: Country): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Morocco: 6XX-XXXXXX
  if (country.code === 'MA' && cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }

  // France: 6 XX XX XX XX
  if (country.code === 'FR' && cleaned.length === 9) {
    return `${cleaned[0]} ${cleaned.slice(1, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`;
  }

  // Default: return as-is
  return cleaned;
}
