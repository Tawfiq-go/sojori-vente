import type {
  PropertyManager,
  Listing,
  Review,
  PMSlug,
  City,
} from '../types';

// Property Managers
export const propertyManagers: PropertyManager[] = [
  {
    slug: 'riad-luxe',
    name: 'Riad Luxe',
    logo: 'RL',
    description: 'Riads authentiques au coeur des medinas',
    verified: true,
    rating: 4.9,
    reviewCount: 2847,
    listingCount: 12,
    responseTime: '< 1h',
    color: { from: '#e8c87a', to: '#c89b3c' },
  },
  {
    slug: 'atlas-stays',
    name: 'Atlas Stays',
    logo: 'AS',
    description: 'Villas modernes avec vue Atlas',
    verified: true,
    rating: 4.8,
    reviewCount: 1923,
    listingCount: 8,
    responseTime: '< 2h',
    color: { from: '#c4b5fd', to: '#7c3aed' },
  },
  {
    slug: 'casa-med',
    name: 'Casa Med',
    logo: 'CM',
    description: 'Appartements contemporains Casablanca',
    verified: true,
    rating: 4.7,
    reviewCount: 1456,
    listingCount: 6,
    responseTime: '< 3h',
    color: { from: '#fda4af', to: '#dc2626' },
  },
  {
    slug: 'dar-hassan',
    name: 'Dar Hassan',
    logo: 'DH',
    description: 'Maisons avec piscine et jardins',
    verified: true,
    rating: 4.8,
    reviewCount: 892,
    listingCount: 4,
    responseTime: '< 1h',
    color: { from: '#a5f3fc', to: '#0e7490' },
  },
  {
    slug: 'ocean-berbere',
    name: 'Ocean Berbere',
    logo: 'OB',
    description: 'Villas face ocean Essaouira',
    verified: true,
    rating: 4.9,
    reviewCount: 1234,
    listingCount: 5,
    responseTime: '< 2h',
    color: { from: '#86efac', to: '#15803d' },
  },
];

// Listings
export const listings: Listing[] = [
  {
    id: 'rl-001',
    title: 'Riad de la Bahia',
    pm: 'riad-luxe',
    city: 'marrakech',
    neighborhood: 'Medina',
    propertyType: 'riad',
    pricePerNight: 189,
    originalPrice: 245,
    rating: 4.9,
    reviewCount: 342,
    guests: 8,
    bedrooms: 4,
    beds: 5,
    bathrooms: 3,
    images: ['photo1', 'photo2', 'photo3'],
    source: 'exclusive',
    featured: true,
    aiMatchPct: 95,
    aiHighlight: '95% MATCH',
    amenities: ['Piscine', 'WiFi', 'Climatisation', 'Terrasse'],
    description: 'Magnifique riad traditionnel au coeur de la medina de Marrakech.',
    highlights: [
      { icon: '🏊', title: 'Piscine chauffee', description: 'Piscine sur le toit avec vue panoramique' },
      { icon: '🍳', title: 'Petit-dejeuner', description: 'Petit-dejeuner marocain inclus' },
    ],
    location: {
      lat: 31.6295,
      lng: -7.9811,
      poi: [
        { name: 'Jemaa el-Fna', distance: '5 min', icon: '🕌' },
        { name: 'Souks', distance: '3 min', icon: '🛍️' },
      ],
    },
    sleepArrangement: [
      { room: 'Chambre 1', beds: '1 lit king' },
      { room: 'Chambre 2', beds: '1 lit queen' },
    ],
    cancellationPolicy: 'Annulation gratuite 7 jours avant',
    instantBook: true,
  },
  {
    id: 'as-001',
    title: 'Villa Atlas View',
    pm: 'atlas-stays',
    city: 'marrakech',
    neighborhood: 'Agdal',
    propertyType: 'villa',
    pricePerNight: 245,
    rating: 4.9,
    reviewCount: 167,
    guests: 8,
    bedrooms: 4,
    beds: 5,
    bathrooms: 3,
    images: ['photo1', 'photo2'],
    source: 'exclusive',
    featured: true,
    aiMatchPct: 92,
    amenities: ['Piscine privee', 'WiFi', 'Jardin', 'BBQ'],
    description: 'Villa moderne avec vue imprenable sur Atlas.',
    highlights: [
      { icon: '🏔️', title: 'Vue Atlas', description: 'Panorama exceptionnel' },
    ],
    location: {
      lat: 31.6189,
      lng: -8.0098,
      poi: [
        { name: 'Jardin Majorelle', distance: '10 min', icon: '🌴' },
      ],
    },
    sleepArrangement: [
      { room: 'Suite', beds: '1 lit king' },
    ],
    cancellationPolicy: 'Annulation gratuite 10 jours avant',
    instantBook: false,
  },
  {
    id: 'cm-001',
    title: 'Appartement Marina',
    pm: 'casa-med',
    city: 'casablanca',
    neighborhood: 'Marina',
    propertyType: 'apartment',
    pricePerNight: 123,
    rating: 4.7,
    reviewCount: 187,
    guests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    images: ['photo1'],
    source: 'exclusive',
    featured: true,
    aiMatchPct: 88,
    amenities: ['WiFi', 'Climatisation', 'Vue mer'],
    description: 'Appartement avec vue sur la marina de Casablanca.',
    highlights: [
      { icon: '🌊', title: 'Vue mer', description: 'Balcon vue marina' },
    ],
    location: {
      lat: 33.6012,
      lng: -7.6289,
      poi: [
        { name: 'Marina', distance: '1 min', icon: '⚓' },
      ],
    },
    sleepArrangement: [
      { room: 'Chambre 1', beds: '1 lit queen' },
    ],
    cancellationPolicy: 'Annulation gratuite 7 jours avant',
    instantBook: true,
  },
];

// Helper Functions
export function getPM(slug: PMSlug): PropertyManager | undefined {
  return propertyManagers.find((pm) => pm.slug === slug);
}

export function getListingById(id: string): Listing | undefined {
  return listings.find((l) => l.id === id);
}

export function getListingsByCity(city: City): Listing[] {
  return listings.filter((l) => l.city === city);
}

export function getListingsByPM(pmSlug: PMSlug): Listing[] {
  return listings.filter((l) => l.pm === pmSlug);
}

export function getFeaturedListings(): Listing[] {
  return listings.filter((l) => l.featured);
}

export function getListings(filters?: {
  city?: City;
  pm?: PMSlug;
  priceMax?: number;
  guests?: number;
}): Listing[] {
  let result = [...listings];

  if (filters?.city) {
    result = result.filter((l) => l.city === filters.city);
  }

  if (filters?.pm) {
    result = result.filter((l) => l.pm === filters.pm);
  }

  if (filters?.priceMax) {
    result = result.filter((l) => l.pricePerNight <= filters.priceMax);
  }

  if (filters?.guests) {
    result = result.filter((l) => l.guests >= filters.guests);
  }

  return result;
}

export function getListingsByIds(ids: string[]): Listing[] {
  return listings.filter((l) => ids.includes(l.id));
}

// Mock Reviews
export const reviews: Review[] = [
  {
    id: 'rev-001',
    listingId: 'rl-001',
    author: 'Sophie M.',
    avatar: 'SM',
    date: 'Mars 2026',
    rating: 5.0,
    text: 'Sejour absolument magique au Riad de la Bahia !',
  },
];

export function getReviewsByListingId(listingId: string): Review[] {
  return reviews.filter((r) => r.listingId === listingId);
}
