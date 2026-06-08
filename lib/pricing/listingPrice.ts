import type { Listing } from '@/lib/api/client';

export type CalendarDay = {
  date: string;
  price: number;
  available?: boolean;
};

/** Prix affiché sur une carte : min de l'intervalle si dates, sinon prix de base. */
export function listingDisplayPrice(
  listing: Pick<Listing, 'pricePerNight' | 'basePricePerNight'>,
  intervalMinPrice?: number | null,
): number {
  if (intervalMinPrice != null && intervalMinPrice > 0) return intervalMinPrice;
  return listing.basePricePerNight || listing.pricePerNight || 0;
}

/** Minimum des prix > 0 sur les jours calendrier (optionnel : jours disponibles seulement). */
export function minPriceFromCalendarDays(
  days: CalendarDay[],
  onlyAvailable = false,
): number | null {
  const prices = days
    .filter((d) => d.price > 0 && (!onlyAvailable || d.available !== false))
    .map((d) => d.price);
  if (!prices.length) return null;
  return Math.min(...prices);
}

export function lastNightIso(checkOutYmd: string): string {
  const d = new Date(`${checkOutYmd}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

export function isObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}
