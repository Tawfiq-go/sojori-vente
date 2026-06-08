/**
 * Listing Service
 * Manages listing data and integrates with backend API
 */

import { apiClient, type Listing } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';

/**
 * Fetch featured listings for homepage
 */
export async function getFeaturedListings(limit: number = 10): Promise<Listing[]> {
  try {
    const response = await apiClient.getFeaturedListings(limit);

    if (!response.success || !response.data) {
      logger.warn('Failed to fetch featured listings:', response.error);
      return [];
    }

    return response.data;
  } catch (error) {
    logger.error('Error fetching featured listings:', error);
    return [];
  }
}

/**
 * Fetch listings by city
 */
export async function getListingsByCity(city: string): Promise<Listing[]> {
  try {
    const response = await apiClient.getListingsByCity(city);

    if (!response.success || !response.data) {
      logger.warn(`Failed to fetch listings for ${city}:`, response.error);
      return [];
    }

    return response.data;
  } catch (error) {
    logger.error(`Error fetching listings for ${city}:`, error);
    return [];
  }
}

/**
 * Fetch listing by ID
 */
export async function getListingById(id: string): Promise<Listing | null> {
  try {
    const response = await apiClient.getListingById(id);

    if (!response.success || !response.data) {
      logger.warn(`Failed to fetch listing ${id}:`, response.error);
      return null;
    }

    return response.data;
  } catch (error) {
    logger.error(`Error fetching listing ${id}:`, error);
    return null;
  }
}

/**
 * Search listings
 */
export async function searchListings(query: string, city?: string): Promise<Listing[]> {
  try {
    const response = await apiClient.searchListings(query, { city });

    if (!response.success || !response.data) {
      logger.warn('Failed to search listings:', response.error);
      return [];
    }

    return response.data;
  } catch (error) {
    logger.error('Error searching listings:', error);
    return [];
  }
}
