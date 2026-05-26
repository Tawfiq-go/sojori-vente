/**
 * Mock Images - Unsplash URLs for Marrakech themed photos
 * Using Unsplash source API for high-quality placeholder images
 */

const UNSPLASH_BASE = 'https://images.unsplash.com';

export const MARRAKECH_IMAGES = {
  // Riad interiors and courtyards
  riad: [
    `${UNSPLASH_BASE}/photo-1597504853460-12eb5b04e1dd?w=800&h=600&fit=crop`, // Riad courtyard
    `${UNSPLASH_BASE}/photo-1591825729070-8832ca-c1f21?w=800&h=600&fit=crop`, // Riad interior
    `${UNSPLASH_BASE}/photo-1609137144813-7d9921338f24?w=800&h=600&fit=crop`, // Moroccan tiles
    `${UNSPLASH_BASE}/photo-1565967211849-6f49b8c8f6fc?w=800&h=600&fit=crop`, // Riad pool
    `${UNSPLASH_BASE}/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop`, // Moroccan architecture
  ],

  // Modern villas and luxury homes
  villa: [
    `${UNSPLASH_BASE}/photo-1602343168775-e2c8e5f2b1d2?w=800&h=600&fit=crop`, // Modern villa exterior
    `${UNSPLASH_BASE}/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop`, // Luxury pool
    `${UNSPLASH_BASE}/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop`, // Modern interior
    `${UNSPLASH_BASE}/photo-1600607687644-aac4c3eac7f4?w=800&h=600&fit=crop`, // Luxury living room
    `${UNSPLASH_BASE}/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop`, // Garden view
  ],

  // Apartments and modern spaces
  apartment: [
    `${UNSPLASH_BASE}/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop`, // Modern bedroom
    `${UNSPLASH_BASE}/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop`, // Bright living space
    `${UNSPLASH_BASE}/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop`, // Minimalist room
    `${UNSPLASH_BASE}/photo-1595526114035-0d45ed16cfbf?w=800&h=600&fit=crop`, // Balcony view
  ],

  // Marrakech city views
  city: [
    `${UNSPLASH_BASE}/photo-1597211833712-5e41faa202ea?w=1200&h=800&fit=crop`, // Marrakech medina
    `${UNSPLASH_BASE}/photo-1597504183855-8c0b6719dfde?w=1200&h=800&fit=crop`, // Koutoubia at sunset
    `${UNSPLASH_BASE}/photo-1570829053984-c0cadc1e13fa?w=1200&h=800&fit=crop`, // Marrakech rooftops
    `${UNSPLASH_BASE}/photo-1563532772-c21d9f4ba12d?w=1200&h=800&fit=crop`, // Majorelle Garden
  ],

  // Property Manager avatars (generic professional photos)
  pm: [
    `${UNSPLASH_BASE}/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces`, // Professional woman
    `${UNSPLASH_BASE}/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces`, // Professional man
    `${UNSPLASH_BASE}/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces`, // Professional woman 2
    `${UNSPLASH_BASE}/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces`, // Professional man 2
    `${UNSPLASH_BASE}/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces`, // Professional woman 3
  ],
};

// Helper function to get random image from category
export function getRandomImage(category: keyof typeof MARRAKECH_IMAGES): string {
  const images = MARRAKECH_IMAGES[category];
  return images[Math.floor(Math.random() * images.length)];
}

// Helper function to get multiple images for gallery
export function getImageGallery(
  category: keyof typeof MARRAKECH_IMAGES,
  count: number = 5
): string[] {
  const images = MARRAKECH_IMAGES[category];
  const shuffled = [...images].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, images.length));
}

// Placeholder for logos and icons with color
export function getColorPlaceholder(
  width: number,
  height: number,
  color: string,
  text?: string
): string {
  return `https://placehold.co/${width}x${height}/${color.replace('#', '')}/white${
    text ? `?text=${encodeURIComponent(text)}` : ''
  }`;
}
