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
  {
    id: 'dh-001',
    title: 'Maison des Roses',
    pm: 'dar-hassan',
    city: 'marrakech',
    neighborhood: 'Palmeraie',
    propertyType: 'maison',
    pricePerNight: 210,
    rating: 4.8,
    reviewCount: 142,
    guests: 6,
    bedrooms: 3,
    beds: 4,
    bathrooms: 2,
    images: ['photo1', 'photo2'],
    source: 'exclusive',
    featured: true,
    aiMatchPct: 90,
    amenities: ['Piscine', 'Jardin', 'WiFi', 'Parking'],
    description: 'Maison traditionnelle avec jardin fleuri dans la Palmeraie.',
    highlights: [
      { icon: '🌺', title: 'Jardin', description: 'Jardin prive avec roses' },
    ],
    location: {
      lat: 31.6523,
      lng: -8.0156,
      poi: [{ name: 'Palmeraie Golf', distance: '5 min', icon: '⛳' }],
    },
    sleepArrangement: [
      { room: 'Chambre principale', beds: '1 lit king' },
      { room: 'Chambre 2', beds: '2 lits simples' },
    ],
    cancellationPolicy: 'Annulation gratuite 5 jours avant',
    instantBook: true,
  },
  {
    id: 'ob-001',
    title: 'Villa Ocean Bleue',
    pm: 'ocean-berbere',
    city: 'essaouira',
    neighborhood: 'Plage',
    propertyType: 'villa',
    pricePerNight: 275,
    rating: 4.9,
    reviewCount: 198,
    guests: 10,
    bedrooms: 5,
    beds: 6,
    bathrooms: 4,
    images: ['photo1', 'photo2', 'photo3'],
    source: 'exclusive',
    featured: true,
    aiMatchPct: 94,
    amenities: ['Vue mer', 'Piscine', 'WiFi', 'BBQ'],
    description: 'Villa de luxe face à l\'océan Atlantique avec piscine chauffée.',
    highlights: [
      { icon: '🌊', title: 'Front de mer', description: 'Acces direct a la plage' },
      { icon: '🏊', title: 'Piscine chauffee', description: 'Toute l\'annee' },
    ],
    location: {
      lat: 31.5084,
      lng: -9.7595,
      poi: [{ name: 'Medina Essaouira', distance: '10 min', icon: '🕌' }],
    },
    sleepArrangement: [
      { room: 'Suite parentale', beds: '1 lit king' },
      { room: 'Chambres', beds: '4 lits queen' },
    ],
    cancellationPolicy: 'Annulation gratuite 14 jours avant',
    instantBook: false,
  },
  {
    id: 'rl-002',
    title: 'Riad Ambre & Epices',
    pm: 'riad-luxe',
    city: 'marrakech',
    neighborhood: 'Medina',
    propertyType: 'riad',
    pricePerNight: 165,
    rating: 4.8,
    reviewCount: 267,
    guests: 6,
    bedrooms: 3,
    beds: 4,
    bathrooms: 2,
    images: ['photo1', 'photo2'],
    source: 'exclusive',
    featured: true,
    aiMatchPct: 87,
    amenities: ['Hammam', 'WiFi', 'Terrasse', 'Climatisation'],
    description: 'Riad intime avec hammam traditionnel privatif.',
    highlights: [
      { icon: '🛁', title: 'Hammam prive', description: 'Spa traditionnel marocain' },
    ],
    location: {
      lat: 31.6312,
      lng: -7.9897,
      poi: [{ name: 'Palais Bahia', distance: '8 min', icon: '🏰' }],
    },
    sleepArrangement: [
      { room: 'Chambre 1', beds: '1 lit king' },
      { room: 'Chambre 2', beds: '2 lits simples' },
    ],
    cancellationPolicy: 'Annulation gratuite 7 jours avant',
    instantBook: true,
  },
  {
    id: 'as-002',
    title: 'Villa Moderne Hivernage',
    pm: 'atlas-stays',
    city: 'marrakech',
    neighborhood: 'Hivernage',
    propertyType: 'villa',
    pricePerNight: 320,
    rating: 4.9,
    reviewCount: 89,
    guests: 8,
    bedrooms: 4,
    beds: 5,
    bathrooms: 3,
    images: ['photo1', 'photo2'],
    source: 'exclusive',
    featured: true,
    aiMatchPct: 91,
    amenities: ['Piscine privee', 'WiFi', 'Salle sport', 'Cinema'],
    description: 'Villa contemporaine de standing avec salle de cinema privee.',
    highlights: [
      { icon: '🎬', title: 'Cinema prive', description: 'Salle home cinema' },
      { icon: '💪', title: 'Salle sport', description: 'Equipement complet' },
    ],
    location: {
      lat: 31.6234,
      lng: -8.0189,
      poi: [{ name: 'Carre Eden', distance: '3 min', icon: '🛍️' }],
    },
    sleepArrangement: [
      { room: 'Suite', beds: '1 lit king' },
      { room: 'Chambres', beds: '3 lits queen' },
    ],
    cancellationPolicy: 'Annulation gratuite 10 jours avant',
    instantBook: true,
  },
  {
    id: 'cm-002',
    title: 'Penthouse Anfa',
    pm: 'casa-med',
    city: 'casablanca',
    neighborhood: 'Anfa',
    propertyType: 'apartment',
    pricePerNight: 195,
    rating: 4.8,
    reviewCount: 134,
    guests: 5,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    images: ['photo1'],
    source: 'exclusive',
    featured: true,
    aiMatchPct: 85,
    amenities: ['WiFi', 'Climatisation', 'Terrasse', 'Parking'],
    description: 'Penthouse moderne avec grande terrasse panoramique.',
    highlights: [
      { icon: '🌆', title: 'Vue panoramique', description: 'Terrasse 360°' },
    ],
    location: {
      lat: 33.5889,
      lng: -7.6345,
      poi: [{ name: 'Morocco Mall', distance: '5 min', icon: '🛍️' }],
    },
    sleepArrangement: [
      { room: 'Chambre principale', beds: '1 lit king' },
      { room: 'Chambre 2', beds: '2 lits simples' },
    ],
    cancellationPolicy: 'Annulation gratuite 7 jours avant',
    instantBook: true,
  },
  {
    id: 'rl-003',
    title: 'Riad Jasmin du Sud',
    pm: 'riad-luxe',
    city: 'marrakech',
    neighborhood: 'Medina',
    propertyType: 'riad',
    pricePerNight: 145,
    rating: 4.7,
    reviewCount: 221,
    guests: 5,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    images: ['photo1'],
    source: 'exclusive',
    featured: true,
    aiMatchPct: 83,
    amenities: ['Piscine', 'WiFi', 'Petit-dejeuner', 'Terrasse'],
    description: 'Riad charmant avec piscine sur le toit et vue sur la Koutoubia.',
    highlights: [
      { icon: '🕌', title: 'Vue Koutoubia', description: 'Terrasse avec vue' },
    ],
    location: {
      lat: 31.6278,
      lng: -7.9923,
      poi: [{ name: 'Jemaa el-Fna', distance: '7 min', icon: '🎭' }],
    },
    sleepArrangement: [
      { room: 'Chambre 1', beds: '1 lit king' },
      { room: 'Chambre 2', beds: '2 lits simples' },
    ],
    cancellationPolicy: 'Annulation gratuite 5 jours avant',
    instantBook: true,
  },
  {
    id: 'dh-002',
    title: 'Dar du Palmier d\'Or',
    pm: 'dar-hassan',
    city: 'marrakech',
    neighborhood: 'Palmeraie',
    propertyType: 'maison',
    pricePerNight: 180,
    rating: 4.8,
    reviewCount: 156,
    guests: 6,
    bedrooms: 3,
    beds: 4,
    bathrooms: 2,
    images: ['photo1', 'photo2'],
    source: 'exclusive',
    featured: true,
    aiMatchPct: 89,
    amenities: ['Piscine', 'Jardin', 'WiFi', 'BBQ'],
    description: 'Maison avec jardin luxuriant et piscine dans la Palmeraie.',
    highlights: [
      { icon: '🌴', title: 'Palmeraie', description: 'Au coeur de la palmeraie' },
    ],
    location: {
      lat: 31.6489,
      lng: -8.0123,
      poi: [{ name: 'Golf Royal', distance: '8 min', icon: '⛳' }],
    },
    sleepArrangement: [
      { room: 'Suite', beds: '1 lit king' },
      { room: 'Chambres', beds: '2 lits queen' },
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
