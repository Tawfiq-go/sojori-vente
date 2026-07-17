/**
 * Dynamic Robots.txt Generator
 */

import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sojori.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/checkout/*', // Don't index checkout pages
          '/profile', // Don't index user profiles
          '/wishlist', // Don't index wishlists
          '/fail/*', // Transactional page, no SEO value
          '/thankYou/*', // Transactional page, no SEO value
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/checkout/*', '/profile', '/wishlist', '/fail/*', '/thankYou/*'],
        crawlDelay: 0,
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
