/**
 * Dynamic Robots.txt Generator
 */

import { MetadataRoute } from 'next';

// 2026-09-11 : le site de location déménage de sojori.com (repris par le
// SaaS) vers book.sojori.com. Le repli suit la nouvelle adresse.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://book.sojori.com';

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
