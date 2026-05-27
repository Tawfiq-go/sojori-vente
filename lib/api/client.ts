/**
 * API Client for Sojori Backend
 * Handles all communication with sojori-production microservices
 */

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
  pmId?: string;
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
}

interface PropertyManager {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  rating?: number;
  listingCount?: number;
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

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
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
  async getAmenities(): Promise<ApiResponse<Amenity[]>> {
    return this.fetchJson<Amenity[]>('/api/v1/listing/public/amenities');
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
   * Get listing by ID
   */
  async getListingById(id: string): Promise<ApiResponse<Listing>> {
    return this.fetchJson<Listing>(`/api/v1/listing/public/listings/${id}`);
  }

  /**
   * Get featured listings
   */
  async getFeaturedListings(limit: number = 10): Promise<ApiResponse<Listing[]>> {
    return this.getListings({ featured: true });
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
   * Get property manager by slug
   */
  async getPropertyManagerBySlug(slug: string): Promise<ApiResponse<PropertyManager>> {
    return this.fetchJson<PropertyManager>(`/api/v1/property-managers/${slug}`);
  }

  /**
   * Get listings by property manager
   */
  async getListingsByPM(pmSlug: string): Promise<ApiResponse<Listing[]>> {
    return this.fetchJson<Listing[]>(`/api/v1/property-managers/${pmSlug}/listings`);
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
   */
  async checkAvailability(
    listingId: string,
    checkIn: string,
    checkOut: string
  ): Promise<ApiResponse<{ available: boolean; price?: number }>> {
    const params = new URLSearchParams({ checkIn, checkOut });
    return this.fetchJson(`/api/v1/listings/${listingId}/availability?${params.toString()}`);
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
  ListingFilters,
};
