/**
 * Custom hooks for fetching cities data
 */

import { useState, useEffect } from 'react';
import { getCitiesWithAvailability, getFeaturedCities, getAvailableCities, getHomepageCities } from '@/lib/services/cityService';
import type { TargetCity } from '@/lib/config/cities';

interface CityWithStatus extends TargetCity {
  listingCount: number;
  backendId?: string;
}

/**
 * Hook to fetch all cities with availability status
 */
export function useCities() {
  const [cities, setCities] = useState<CityWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCities() {
      try {
        setLoading(true);
        const citiesData = await getCitiesWithAvailability();
        setCities(citiesData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchCities();
  }, []);

  return { cities, loading, error };
}

/**
 * Hook to fetch featured cities only
 */
export function useFeaturedCities() {
  const [cities, setCities] = useState<CityWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCities() {
      try {
        setLoading(true);
        const citiesData = await getFeaturedCities();
        setCities(citiesData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchCities();
  }, []);

  return { cities, loading, error };
}

/**
 * Hook to fetch homepage destination cities (featured, incl. coming soon)
 */
export function useHomepageCities() {
  const [cities, setCities] = useState<CityWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCities() {
      try {
        setLoading(true);
        const citiesData = await getHomepageCities();
        setCities(citiesData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchCities();
  }, []);

  return { cities, loading, error };
}

/**
 * Hook to fetch available cities (not coming soon)
 */
export function useAvailableCities() {
  const [cities, setCities] = useState<CityWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCities() {
      try {
        setLoading(true);
        const citiesData = await getAvailableCities();
        setCities(citiesData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchCities();
  }, []);

  return { cities, loading, error };
}
