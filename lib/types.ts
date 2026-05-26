// ─── Property Manager Slugs ───
export type PMSlug = 'riad-luxe' | 'atlas-stays' | 'casa-med' | 'dar-hassan' | 'ocean-berbere';

// ─── City Types ───
export type City = 'marrakech' | 'casablanca' | 'essaouira' | 'fes';

// ─── Listing Source ───
export type ListingSource = 'exclusive' | 'airbnb' | 'booking';

// ─── Property Type ───
export type PropertyType = 'riad' | 'apartment' | 'villa' | 'hotel';

// ─── Property Manager ───
export interface PropertyManager {
  slug: PMSlug;
  name: string;
  logo: string; // Emoji or short text
  description: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  listingCount: number;
  responseTime: string;
  color: {
    from: string;
    to: string;
  };
}

// ─── Listing ───
export interface Listing {
  id: string;
  title: string;
  pm: PMSlug;
  city: City;
  neighborhood: string;
  propertyType: PropertyType;
  pricePerNight: number;
  originalPrice?: number; // For discounts
  rating: number;
  reviewCount: number;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  images: string[]; // Array of image URLs or placeholders
  source: ListingSource;
  featured?: boolean;
  aiMatchPct?: number; // AI match percentage (0-100)
  aiHighlight?: string; // AI highlight badge text
  amenities: string[]; // Array of amenity names
  description: string;
  highlights: {
    icon: string;
    title: string;
    description: string;
  }[];
  location: {
    lat: number;
    lng: number;
    poi: {
      name: string;
      distance: string;
      icon: string;
    }[];
  };
  sleepArrangement: {
    room: string;
    beds: string;
  }[];
  cancellationPolicy: string;
  instantBook: boolean;
}

// ─── Review ───
export interface Review {
  id: string;
  listingId: string;
  author: string;
  avatar: string;
  date: string;
  rating: number;
  text: string;
  highlightedQuote?: string;
  pmReply?: {
    text: string;
    date: string;
  };
}

// ─── Search Filters ───
export interface SearchFilters {
  city?: City;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  priceRange?: [number, number];
  propertyTypes?: PropertyType[];
  sources?: ListingSource[];
  amenities?: string[];
  pms?: PMSlug[];
  minRating?: number;
  instantBook?: boolean;
}

// ─── Booking State ───
export interface BookingState {
  listingId: string | null;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
  adults: number;
  children: number;
  infants: number;
}

// ─── Wishlist ───
export interface WishlistState {
  items: string[]; // Array of listing IDs
}

// ─── Search History ───
export interface SearchHistory {
  prompt: string;
  filters: SearchFilters;
  timestamp: number;
}

// ─── AI Response ───
export interface AISearchResponse {
  prompt: string;
  interpretation: string;
  filters: SearchFilters;
  suggestions: string[];
  insights: {
    icon: string;
    title: string;
    text: string;
  }[];
}

export interface AIListingSummary {
  matchScore: number;
  whyMatch: string[];
  pros: string[];
  cons: string[];
  bestFor: string;
  suggestion: string;
}

export interface AIMarketInsight {
  priceAnalysis: string;
  seasonalTrend: string;
  recommendation: string;
  alternativeDates?: {
    date: string;
    savings: number;
  }[];
}
