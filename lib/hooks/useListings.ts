/**
 * Custom hooks for fetching listings data
 */

import { useState, useEffect } from 'react';
import { apiClient, type Listing, type ListingFilters } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';

/**
 * Hook to fetch featured listings
 */
export function useFeaturedListings(limit: number = 10) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true);
        const response = await apiClient.getFeaturedListings(limit);

        if (response.success && response.data) {
          setListings(response.data);
          setError(null);
        } else {
          setError(response.error || 'Failed to fetch listings');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [limit]);

  return { listings, loading, error };
}

/**
 * Hook to fetch listings with filters
 */
export function useListings(filters: ListingFilters = {}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true);
        const response = await apiClient.getListings(filters);

        if (response.success && response.data) {
          setListings(response.data);
          setError(null);
        } else {
          setError(response.error || 'Failed to fetch listings');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [JSON.stringify(filters)]);

  return { listings, loading, error };
}

/**
 * Hook to fetch listing by ID
 */
export function useListing(id: string | null) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchListing() {
      try {
        setLoading(true);
        const response = await apiClient.getListingById(id);

        if (response.success && response.data) {
          setListing(response.data);
          setError(null);
        } else {
          setError(response.error || 'Failed to fetch listing');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchListing();
  }, [id]);

  return { listing, loading, error };
}

/**
 * Hook to fetch blocked dates for a listing
 */
export function useBlockedDates(listingId: string | null) {
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) {
      setLoading(false);
      return;
    }

    async function fetchBlockedDates() {
      try {
        setLoading(true);
        const response = await apiClient.getBlockedDates(listingId);

        if (response.success && response.data?.blockedDates) {
          // Convert ISO strings to Date objects
          const dates = response.data.blockedDates.map((dateStr: string) => new Date(dateStr));
          logger.debug(`[useBlockedDates] Fetched ${dates.length} blocked dates for listing ${listingId}`);
          setBlockedDates(dates);
          setError(null);
        } else {
          // If API fails, return empty array (graceful degradation)
          logger.warn('[useBlockedDates] API response missing blockedDates:', response);
          setBlockedDates([]);
          setError(null);
        }
      } catch (err) {
        // Graceful degradation: if API fails, just show empty blocked dates
        logger.warn('[useBlockedDates] Failed to fetch, using empty array:', err);
        setBlockedDates([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    }

    fetchBlockedDates();
  }, [listingId]);

  return { blockedDates, loading, error };
}

/**
 * Hook to fetch calendar data (prices + availability) for a specific listing
 * This replaces the simple blockedDates with full calendar information from backend
 */
export function useCalendarData(listingId: string | null, monthsAhead: number = 3) {
  const [calendarData, setCalendarData] = useState<Array<{
    date: string;
    available: boolean;
    price: number;
    minStay?: number;
    stopSell?: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) {
      setLoading(false);
      return;
    }

    async function fetchCalendarData() {
      try {
        setLoading(true);

        // Get data for next N months
        const from = new Date().toISOString().split('T')[0];
        const toDate = new Date();
        toDate.setMonth(toDate.getMonth() + monthsAhead);
        const to = toDate.toISOString().split('T')[0];

        const response = await apiClient.getCalendarData(listingId, from, to);

        if (response.success && response.data?.days) {
          logger.debug(`[useCalendarData] Fetched ${response.data.days.length} days for listing ${listingId}`);
          setCalendarData(response.data.days);
          setError(null);
        } else {
          logger.warn('[useCalendarData] API response missing days:', response);
          setCalendarData([]);
          setError(null);
        }
      } catch (err) {
        logger.warn('[useCalendarData] Failed to fetch, using empty array:', err);
        setCalendarData([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    }

    fetchCalendarData();
  }, [listingId, monthsAhead]);

  return { calendarData, loading, error };
}

/**
 * Hook to fetch amenities for a specific listing
 */
export function useListingAmenities(listingId: string | null) {
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) {
      setLoading(false);
      return;
    }

    async function fetchAmenities() {
      try {
        setLoading(true);
        const response = await apiClient.getListingAmenities(listingId);

        if (response.success && response.data) {
          setAmenities(response.data);
          setError(null);
        } else {
          setAmenities([]);
          setError(null);
        }
      } catch (err) {
        logger.warn('[useListingAmenities] Failed to fetch:', err);
        setAmenities([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAmenities();
  }, [listingId]);

  return { amenities, loading, error };
}

/**
 * Hook to fetch rules for a specific listing
 */
export function useListingRules(listingId: string | null) {
  const [rules, setRules] = useState<string[]>([]);
  const [info, setInfo] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) {
      setLoading(false);
      return;
    }

    async function fetchRules() {
      try {
        setLoading(true);
        const response = await apiClient.getListingRules(listingId);

        if (response.success && response.data) {
          setRules(response.data.rules || []);
          setInfo(response.data.info || []);
          setError(null);
        } else {
          setRules([]);
          setInfo([]);
          setError(null);
        }
      } catch (err) {
        logger.warn('[useListingRules] Failed to fetch:', err);
        setRules([]);
        setInfo([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRules();
  }, [listingId]);

  return { rules, info, loading, error };
}

/**
 * Hook to fetch reviews for a specific listing
 */
export function useListingReviews(listingId: string | null, limit: number = 10) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) {
      setLoading(false);
      return;
    }

    async function fetchReviews() {
      try {
        setLoading(true);
        const response = await apiClient.getListingReviews(listingId, limit);

        if (response.success && response.data) {
          setReviews(response.data);
          setError(null);
        } else {
          setReviews([]);
          setError(null);
        }
      } catch (err) {
        logger.warn('[useListingReviews] Failed to fetch:', err);
        setReviews([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [listingId, limit]);

  return { reviews, loading, error };
}

/**
 * Hook to fetch nearby POIs with real distances
 */
export function useNearbyPOIs(listingId: string | null) {
  const [pois, setPois] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) {
      setLoading(false);
      return;
    }

    async function fetchPOIs() {
      try {
        setLoading(true);
        const response = await apiClient.getNearbyPOIs(listingId);

        if (response.success && response.data) {
          setPois(response.data);
          setError(null);
        } else {
          setPois([]);
          setError(null);
        }
      } catch (err) {
        logger.warn('[useNearbyPOIs] Failed to fetch:', err);
        setPois([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPOIs();
  }, [listingId]);

  return { pois, loading, error };
}
