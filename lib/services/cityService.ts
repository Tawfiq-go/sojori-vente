/**
 * City Service
 * Manages city data and synchronization with backend
 */

import { apiClient, type City } from '@/lib/api/client';
import { TARGET_CITIES, type TargetCity } from '@/lib/config/cities';
import { logger } from '@/lib/utils/logger';

interface CityWithStatus extends TargetCity {
  listingCount: number;
  backendId?: string;
}

/**
 * Fetch cities from backend and merge with target cities configuration
 * Returns cities with comingSoon flag based on actual listing counts
 */
export async function getCitiesWithAvailability(): Promise<CityWithStatus[]> {
  try {
    // Fetch cities from backend
    const response = await apiClient.getCities();

    if (!response.success || !response.data) {
      logger.warn('Failed to fetch cities from backend:', response.error);
      // Return target cities with comingSoon flags as-is
      return TARGET_CITIES.map((city) => ({
        ...city,
        listingCount: 0,
      }));
    }

    const backendCities = response.data;

    // Normalize known DB typos / aliases into target city slugs
    const CITY_ALIASES: Record<string, string> = {
      marrackech: 'marrakech',
    };

    const backendCityMap = new Map<string, City>();
    backendCities.forEach((city) => {
      const slug = CITY_ALIASES[city.slug.toLowerCase()] || city.slug.toLowerCase();
      const existing = backendCityMap.get(slug);
      if (existing) {
        backendCityMap.set(slug, {
          ...existing,
          listingCount: (existing.listingCount || 0) + (city.listingCount || 0),
        });
      } else {
        backendCityMap.set(slug, { ...city, slug });
      }
    });

    // Merge target cities with backend data
    const citiesWithStatus: CityWithStatus[] = TARGET_CITIES.map((targetCity) => {
      const backendCity = backendCityMap.get(targetCity.slug.toLowerCase());

      if (backendCity && backendCity.listingCount && backendCity.listingCount > 0) {
        // City has listings in backend - mark as available
        return {
          ...targetCity,
          comingSoon: false,
          listingCount: backendCity.listingCount,
          backendId: backendCity._id,
        };
      } else {
        // No listings or city doesn't exist in backend - mark as coming soon
        return {
          ...targetCity,
          comingSoon: true,
          listingCount: 0,
          backendId: backendCity?._id,
        };
      }
    });

    return citiesWithStatus;
  } catch (error) {
    logger.error('Error in getCitiesWithAvailability:', error);
    // Fallback to target cities
    return TARGET_CITIES.map((city) => ({
      ...city,
      listingCount: 0,
    }));
  }
}

/**
 * Get featured cities (for homepage) — only cities with listings
 */
export async function getFeaturedCities(): Promise<CityWithStatus[]> {
  const cities = await getCitiesWithAvailability();
  return cities.filter((city) => city.featured && !city.comingSoon);
}

/**
 * Homepage destinations strip: featured cities including "coming soon"
 */
export async function getHomepageCities(): Promise<CityWithStatus[]> {
  const cities = await getCitiesWithAvailability();
  return cities.filter((city) => city.featured).slice(0, 8);
}

/**
 * Get all available cities (not coming soon)
 */
export async function getAvailableCities(): Promise<CityWithStatus[]> {
  const cities = await getCitiesWithAvailability();
  return cities.filter((city) => !city.comingSoon);
}

/**
 * Get city by slug
 */
export async function getCityBySlug(slug: string): Promise<CityWithStatus | undefined> {
  const cities = await getCitiesWithAvailability();
  return cities.find((city) => city.slug.toLowerCase() === slug.toLowerCase());
}
