/**
 * Dynamic Sitemap Generator
 * Automatically generates sitemap.xml for SEO
 */

import { MetadataRoute } from 'next';
import { apiClient } from '@/lib/api/client';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sojori.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URLs (static pages)
  const baseUrls: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/verified-hosts`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/experiences`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/become-host`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/wishlist`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/profile`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
  ];

  try {
    // Fetch all listings from API
    const listingsResponse = await apiClient.getListings({});

    const listingUrls: MetadataRoute.Sitemap =
      listingsResponse.success && listingsResponse.data
        ? listingsResponse.data.map((listing) => ({
            url: `${SITE_URL}/listings/${listing._id}`,
            lastModified: new Date(), // Could use listing.updatedAt if available
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          }))
        : [];

    // Fetch cities
    const citiesResponse = await apiClient.getCities();

    const cityUrls: MetadataRoute.Sitemap =
      citiesResponse.success && citiesResponse.data
        ? citiesResponse.data.map((city) => ({
            url: `${SITE_URL}/search?city=${city.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
          }))
        : [];

    // Fetch property managers
    const pmResponse = await apiClient.getPropertyManagers();

    const pmUrls: MetadataRoute.Sitemap =
      pmResponse.success && pmResponse.data
        ? pmResponse.data.map((pm) => ({
            url: `${SITE_URL}/pm/${pm.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
          }))
        : [];

    // Combine all URLs
    return [...baseUrls, ...listingUrls, ...cityUrls, ...pmUrls];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return base URLs if API fails
    return baseUrls;
  }
}
