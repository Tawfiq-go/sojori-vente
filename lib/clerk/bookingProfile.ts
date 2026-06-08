/** Metadata Clerk pour clients Sojori Booking (unsafe_metadata côté Clerk). */
export type BookingProfileMetadata = {
  role?: 'customer'
  country?: string
  nationality?: string
  phoneCountryCode?: string
  phone?: string
  profileSource?: 'signup' | 'checkout' | 'settings'
}

export function dialCodeToCountryCode(dialCode: string): string {
  const map: Record<string, string> = {
    '+212': 'MA',
    '+33': 'FR',
    '+34': 'ES',
    '+1': 'US',
    '+44': 'GB',
  }
  return map[dialCode] || ''
}

/** Numéro local sans indicatif (ex. 612345678) à partir du profil Clerk. */
export function localPhoneFromMetadata(dialCode: string, phone?: string): string {
  if (!phone?.trim()) return '';
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) {
    if (trimmed.startsWith(dialCode)) {
      return trimmed.slice(dialCode.length).replace(/^0+/, '');
    }
    return trimmed.replace(/^\+\d{1,4}/, '').replace(/^0+/, '');
  }
  return trimmed.replace(/^0+/, '');
}

export function buildBookingProfilePayload(input: {
  phone?: string
  phoneCountryCode?: string
  country?: string
  nationality?: string
  source: BookingProfileMetadata['profileSource']
}): BookingProfileMetadata {
  return {
    role: 'customer',
    phone: input.phone?.trim() || undefined,
    phoneCountryCode: input.phoneCountryCode?.trim() || undefined,
    country: input.country?.trim() || undefined,
    nationality: input.nationality?.trim() || undefined,
    profileSource: input.source,
  }
}
