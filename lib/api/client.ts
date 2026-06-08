/**
 * API Client for Sojori Backend
 * Handles all communication with sojori-production microservices
 */

import { logger } from '@/lib/utils/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.sojori.com';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface ListingFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minGuests?: number;
  limit?: number;
  propertyType?: string;
  amenities?: string[];
  minRating?: number;
  featured?: boolean;
}

interface Listing {
  _id: string;
  title: string;
  city: string;
  neighborhood?: string;
  pricePerNight: number;
  basePricePerNight?: number;
  displayPrice?: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  propertyType: string;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  amenities?: string[];
  images?: string[];
  description?: string;
  pmId?: string;
  propertyManager?: PropertyManager | null;
  lat?: number;
  lng?: number;
}

interface City {
  _id: string;
  name: string;
  slug: string;
  displayName: string;
  country: string;
  listingCount?: number;
}

interface Amenity {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  category?: string;
  count?: number;
  topAmenity?: boolean;
}

interface PropertyManager {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  logoText?: string;
  images?: string[];
  coverUrl?: string;
  tagline?: string;
  description?: string;
  verified?: boolean;
  responseTime?: string;
  brandColor?: { from: string; to: string };
  rating?: number;
  listingCount?: number;
}

interface PropertyManagerPage {
  propertyManager: PropertyManager;
  listings: Listing[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetchJson<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      // Backend returns {success, data, count} - extract the data array
      return { success: true, data: json.data || json };
    } catch (error) {
      logger.warn(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * PUBLIC ENDPOINTS (no authentication required)
   */

  /**
   * Get all cities with listing counts
   */
  async getCities(): Promise<ApiResponse<City[]>> {
    return this.fetchJson<City[]>('/api/v1/listing/public/cities');
  }

  /**
   * Get city by slug
   */
  async getCityBySlug(slug: string): Promise<ApiResponse<City>> {
    return this.fetchJson<City>(`/api/v1/listing/public/cities/${slug}`);
  }

  /**
   * Get all amenities
   */
  async getAmenities(city?: string): Promise<ApiResponse<Amenity[]>> {
    const params = city ? `?city=${encodeURIComponent(city)}` : '';
    return this.fetchJson<Amenity[]>(`/api/v1/listing/public/amenities${params}`);
  }

  /**
   * Get public listings with filters
   */
  async getListings(filters: ListingFilters = {}): Promise<ApiResponse<Listing[]>> {
    const params = new URLSearchParams();

    if (filters.city) params.append('city', filters.city);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.minGuests) params.append('minGuests', filters.minGuests.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.propertyType) params.append('propertyType', filters.propertyType);
    if (filters.minRating) params.append('minRating', filters.minRating.toString());
    if (filters.featured !== undefined) params.append('featured', filters.featured.toString());
    if (filters.amenities && filters.amenities.length > 0) {
      params.append('amenities', filters.amenities.join(','));
    }

    const query = params.toString();
    const endpoint = `/api/v1/listing/public/listings${query ? `?${query}` : ''}`;

    return this.fetchJson<Listing[]>(endpoint);
  }

  /**
   * Check availability for multiple listings (batch check)
   * Returns array of listing IDs that are available for the given date range
   */
  async checkListingsAvailability(
    listingIds: string[],
    checkIn: string,
    checkOut: string
  ): Promise<ApiResponse<{ available: string[]; unavailable: string[] }>> {
    try {
      // Check each listing individually (parallel requests)
      const checks = await Promise.all(
        listingIds.map(async (id) => {
          const result = await this.checkAvailability(id, checkIn, checkOut);
          return {
            id,
            available: result.success && result.data?.available === true,
          };
        })
      );

      const available = checks.filter((c) => c.available).map((c) => c.id);
      const unavailable = checks.filter((c) => !c.available).map((c) => c.id);

      return {
        success: true,
        data: { available, unavailable },
      };
    } catch (error) {
      logger.warn('Batch availability check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get listing by ID
   */
  async getListingById(id: string): Promise<ApiResponse<Listing>> {
    return this.fetchJson<Listing>(`/api/v1/listing/public/listings/${id}`);
  }

  /**
   * Get featured listings (sorted by rating)
   */
  async getFeaturedListings(limit: number = 10): Promise<ApiResponse<Listing[]>> {
    // Backend doesn't have 'featured' field, so we just get top-rated listings
    const params = new URLSearchParams({ limit: limit.toString() });
    const endpoint = `/api/v1/listing/public/listings?${params.toString()}`;
    return this.fetchJson<Listing[]>(endpoint);
  }

  /**
   * Get listings by city
   */
  async getListingsByCity(city: string): Promise<ApiResponse<Listing[]>> {
    return this.getListings({ city });
  }

  /**
   * Get all property managers
   */
  async getPropertyManagers(): Promise<ApiResponse<PropertyManager[]>> {
    return this.fetchJson<PropertyManager[]>('/api/v1/listing/public/property-managers');
  }

  /**
   * Get property manager public profile + their listings by slug
   */
  async getPropertyManagerBySlug(slug: string): Promise<ApiResponse<PropertyManagerPage>> {
    return this.fetchJson<PropertyManagerPage>(
      `/api/v1/listing/public/property-managers/${slug}`
    );
  }

  /**
   * Search listings with query
   */
  async searchListings(query: string, filters: ListingFilters = {}): Promise<ApiResponse<Listing[]>> {
    const params = new URLSearchParams({ q: query });

    if (filters.city) params.append('city', filters.city);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.minGuests) params.append('minGuests', filters.minGuests.toString());

    return this.fetchJson<Listing[]>(`/api/v1/listings/search?${params.toString()}`);
  }

  /**
   * Get currency configuration
   */
  async getCurrency(): Promise<ApiResponse<{ code: string; symbol: string; rate: number }>> {
    return this.fetchJson('/api/v1/config/currency');
  }

  /**
   * Check availability for a listing
   *
   * Calls the public availability endpoint which returns the listing's
   * blocked dates for the range, then derives a simple available boolean:
   * the listing is available if none of the requested nights
   * (checkIn inclusive -> checkOut exclusive) are blocked.
   */
  async checkAvailability(
    listingId: string,
    checkIn: string,
    checkOut: string
  ): Promise<ApiResponse<{ available: boolean; price?: number }>> {
    // Mock/demo listings use non-ObjectId ids (e.g. "rl-001"). Skip the backend
    // call for those to avoid 500s, and treat them as available.
    if (!/^[a-f\d]{24}$/i.test(listingId)) {
      return { success: true, data: { available: true } };
    }

    const params = new URLSearchParams({ from: checkIn, to: checkOut });
    const result = await this.fetchJson<{
      blockedDates?: string[];
      minNights?: number;
      maxNights?: number;
    }>(`/api/v1/listing/public/listings/${listingId}/availability?${params.toString()}`);

    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    const blockedDates = new Set(result.data.blockedDates || []);

    // Nights span from checkIn (inclusive) to checkOut (exclusive), UTC-safe.
    const start = new Date(`${checkIn}T12:00:00.000Z`);
    const end = new Date(`${checkOut}T12:00:00.000Z`);
    let available = true;
    for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
      const iso = d.toISOString().split('T')[0];
      if (blockedDates.has(iso)) {
        available = false;
        break;
      }
    }

    return { success: true, data: { available } };
  }

  /**
   * Get blocked dates for a listing
   */
  async getBlockedDates(listingId: string): Promise<ApiResponse<{ blockedDates: string[] }>> {
    // Get blocked dates for next 12 months
    const from = new Date().toISOString().split('T')[0]; // Today YYYY-MM-DD
    const to = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // +1 year

    const params = new URLSearchParams({ from, to });
    return this.fetchJson<{ blockedDates: string[] }>(`/api/v1/listing/public/listings/${listingId}/availability?${params.toString()}`);
  }

  /**
   * Get calendar data with prices and availability for a listing
   * Returns daily pricing and availability for a date range
   */
  async getCalendarData(
    listingId: string,
    from: string,
    to: string
  ): Promise<ApiResponse<{
    days: Array<{
      date: string;
      available: boolean;
      price: number;
      minStay?: number;
      stopSell?: boolean;
    }>;
  }>> {
    const params = new URLSearchParams({ from, to });
    return this.fetchJson(`/api/v1/listing/public/listings/${listingId}/calendar?${params.toString()}`);
  }

  /**
   * Prix minimum par nuit sur un intervalle (dernière nuit = veille du check-out).
   */
  async getMinNightlyPrice(
    listingId: string,
    checkIn: string,
    checkOut: string,
  ): Promise<number | null> {
    if (!/^[a-f\d]{24}$/i.test(listingId)) return null;
    const { lastNightIso, minPriceFromCalendarDays } = await import('@/lib/pricing/listingPrice');
    const endNight = lastNightIso(checkOut);
    if (endNight < checkIn) return null;
    const result = await this.getCalendarData(listingId, checkIn, endNight);
    if (!result.success || !result.data?.days?.length) return null;
    return minPriceFromCalendarDays(result.data.days, true);
  }

  /** Batch min prices for search cards when dates are selected. */
  async getMinNightlyPrices(
    listingIds: string[],
    checkIn: string,
    checkOut: string,
  ): Promise<Record<string, number>> {
    const ids = listingIds.filter((id) => /^[a-f\d]{24}$/i.test(id));
    const entries = await Promise.all(
      ids.map(async (id) => {
        const min = await this.getMinNightlyPrice(id, checkIn, checkOut);
        return [id, min] as const;
      }),
    );
    const out: Record<string, number> = {};
    for (const [id, min] of entries) {
      if (min != null && min > 0) out[id] = min;
    }
    return out;
  }

  async getListingPricing(
    listingId: string,
    checkIn: string,
    checkOut: string,
    guests = 2,
  ): Promise<ApiResponse<{
    nights: number;
    baseNights: number;
    basePrice: number;
    weekendNights: number;
    weekendPrice: number;
    subtotal: number;
    serviceFee: number;
    tax: number;
    total: number;
    currency: string;
    pricePerNight: number;
    minPricePerNight?: number;
  }>> {
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
    });
    return this.fetchJson(
      `/api/v1/listing/public/listings/${listingId}/pricing?${params.toString()}`,
    );
  }

  /**
   * Get amenities for a specific listing (full details from dashboard endpoint)
   */
  async getListingAmenities(listingId: string): Promise<ApiResponse<any[]>> {
    return this.fetchJson<any[]>(`/api/v1/listing/listings/listing-amenities/${listingId}`);
  }

  /**
   * Get rules and info for a specific listing
   */
  async getListingRules(listingId: string): Promise<ApiResponse<{ rules: string[]; info: string[] }>> {
    return this.fetchJson<{ rules: string[]; info: string[] }>(`/api/v1/listing/public/listings/${listingId}/rules`);
  }

  /**
   * Get reviews for a specific listing
   */
  async getListingReviews(listingId: string, limit: number = 10): Promise<ApiResponse<any[]>> {
    return this.fetchJson<any[]>(`/api/v1/guest/listings/${listingId}/reviews?limit=${limit}`);
  }

  /**
   * Get nearby points of interest with real distances
   */
  async getNearbyPOIs(listingId: string): Promise<ApiResponse<any[]>> {
    return this.fetchJson<any[]>(`/api/v1/listing/public/listings/${listingId}/nearby`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types
export type {
  ApiResponse,
  Listing,
  City,
  Amenity,
  PropertyManager,
  PropertyManagerPage,
  ListingFilters,
};
