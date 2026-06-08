/**
 * Territoire marocain affiché sur les cartes (listing + search).
 * Nord Tanger → sud Lagouira (Sahara marocain), ouest Atlantique → est Figuig.
 */
export const MOROCCO_MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [20.5, -17.5], // Sud-Ouest : Lagouira
  [36.0, -0.5], // Nord-Est : Saïdia / Figuig
];

export const MOROCCO_MAP_MIN_ZOOM = 5;
export const MOROCCO_MAP_MAX_ZOOM = 18;

/** Coordonnées GPS des villes marocaines (fallback si listing sans lat/lng). */
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  tanger: { lat: 35.7595, lng: -5.834 },
  tetouan: { lat: 35.5889, lng: -5.3626 },
  rabat: { lat: 34.0209, lng: -6.8416 },
  casablanca: { lat: 33.5731, lng: -7.5898 },
  fes: { lat: 34.0181, lng: -5.0078 },
  meknes: { lat: 33.8935, lng: -5.5473 },
  kenitra: { lat: 34.261, lng: -6.5802 },
  oujda: { lat: 34.6867, lng: -1.9114 },
  marrakech: { lat: 31.6295, lng: -7.9811 },
  essaouira: { lat: 31.5085, lng: -9.7595 },
  safi: { lat: 32.2994, lng: -9.2372 },
  'el-jadida': { lat: 33.2316, lng: -8.5007 },
  'beni-mellal': { lat: 32.3373, lng: -6.3498 },
  khouribga: { lat: 32.8864, lng: -6.9063 },
  agadir: { lat: 30.4278, lng: -9.5981 },
  ouarzazate: { lat: 30.9335, lng: -6.937 },
  errachidia: { lat: 31.9314, lng: -4.424 },
  guelmim: { lat: 28.987, lng: -10.0574 },
  laayoune: { lat: 27.1536, lng: -13.1994 },
  dakhla: { lat: 23.7185, lng: -15.9582 },
  boujdour: { lat: 26.125, lng: -14.4833 },
  smara: { lat: 26.7396, lng: -11.6714 },
  tarfaya: { lat: 27.9378, lng: -12.9224 },
};

export function normalizeCityKey(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

export function cityCenter(city?: string | null): { lat: number; lng: number } {
  const key = normalizeCityKey(city || 'casablanca');
  return CITY_COORDS[key] || CITY_COORDS.casablanca;
}

/** Décalage déterministe autour du centre ville pour listings sans GPS. */
export function listingCoordJitter(listingId: string): { lat: number; lng: number } {
  let h = 0;
  for (let i = 0; i < listingId.length; i++) {
    h = (h * 31 + listingId.charCodeAt(i)) | 0;
  }
  const a = ((h % 1000) / 1000 - 0.5) * 0.06;
  const b = (((h >> 10) % 1000) / 1000 - 0.5) * 0.06;
  return { lat: a, lng: b };
}

function isValidMoroccoCoord(lat: number, lng: number): boolean {
  const [[south, west], [north, east]] = MOROCCO_MAP_MAX_BOUNDS;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}

/** Borne un point dans le territoire marocain (Sahara inclus). */
export function clampToMoroccoBounds(lat: number, lng: number): [number, number] {
  const [[south, west], [north, east]] = MOROCCO_MAP_MAX_BOUNDS;
  return [
    Math.min(Math.max(lat, south), north),
    Math.min(Math.max(lng, west), east),
  ];
}

export function resolveListingCoords(
  listing: { id: string; city?: string; lat?: number; lng?: number },
): { lat: number; lng: number; approximate: boolean } {
  const lat = Number(listing.lat);
  const lng = Number(listing.lng);
  if (
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    (lat !== 0 || lng !== 0) &&
    isValidMoroccoCoord(lat, lng)
  ) {
    const [clat, clng] = clampToMoroccoBounds(lat, lng);
    return { lat: clat, lng: clng, approximate: false };
  }
  const center = cityCenter(listing.city);
  const jitter = listingCoordJitter(listing.id);
  const [clat, clng] = clampToMoroccoBounds(center.lat + jitter.lat, center.lng + jitter.lng);
  return { lat: clat, lng: clng, approximate: true };
}
