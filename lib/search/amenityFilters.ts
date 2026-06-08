export type AmenityFilterDef = {
  key: string;
  label: string;
  emoji: string;
  keywords: string[];
};

/** Filtres search — mappés sur les libellés BD (listingAmenities / Amenity.name.FR). */
export const SEARCH_AMENITY_FILTERS: AmenityFilterDef[] = [
  { key: 'wifi', label: 'Wifi', emoji: '📶', keywords: ['wifi', 'wi-fi', 'wi fi', 'internet', 'acces internet'] },
  { key: 'piscine', label: 'Piscine', emoji: '🏊', keywords: ['piscine', 'pool'] },
  { key: 'climatisation', label: 'Climatisation', emoji: '❄️', keywords: ['clim', 'climatisation', 'air conditioning', 'climatiseur'] },
  { key: 'ac', label: 'Clim / AC', emoji: '❄️', keywords: [' ac', '^ac$', 'air cond'] },
  { key: 'cuisine', label: 'Cuisine équipée', emoji: '🍳', keywords: ['cuisine', 'kitchen', 'bouilloire', 'micro-ondes'] },
  { key: 'parking', label: 'Parking', emoji: '🚗', keywords: ['parking', 'stationnement'] },
  { key: 'television', label: 'Télévision', emoji: '📺', keywords: ['television', 'télévision', 'tv', 'streaming'] },
  { key: 'lave-linge', label: 'Lave-linge', emoji: '🧺', keywords: ['lave-linge', 'lave linge', 'washer', 'machine a laver'] },
  { key: 'hammam', label: 'Hammam / Spa', emoji: '🧖', keywords: ['hammam', 'sauna', 'spa'] },
  { key: 'terrasse', label: 'Terrasse / Balcon', emoji: '🌅', keywords: ['terrasse', 'balcon', 'terrace', 'balcony'] },
  { key: 'jardin', label: 'Jardin', emoji: '🌿', keywords: ['jardin', 'garden'] },
  { key: 'seche-cheveux', label: 'Sèche-cheveux', emoji: '💨', keywords: ['seche-cheveux', 'seche cheveux', 'hair dryer'] },
  { key: 'ascenseur', label: 'Ascenseur', emoji: '🛗', keywords: ['ascenseur', 'elevator', 'lift'] },
  { key: 'fibre', label: 'Fibre / Haut débit', emoji: '🌐', keywords: ['fibre', 'haut debit', 'haut débit', 'broadband'] },
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();

function keywordMatchesHaystack(kw: string, haystack: string[]): boolean {
  const k = norm(kw);
  if (!k) return false;
  if (k.startsWith('^') && k.endsWith('$')) {
    const exact = k.slice(1, -1);
    return haystack.some((h) => h === exact);
  }
  return haystack.some((h) => h.includes(k) || k.includes(h));
}

export function listingAmenityHaystack(amenities?: string[]): string[] {
  return (amenities || []).map(norm).filter(Boolean);
}

export function listingMatchesAmenityFilter(
  amenities: string[] | undefined,
  filterKey: string,
  catalog: AmenityFilterDef[] = SEARCH_AMENITY_FILTERS,
): boolean {
  const def = catalog.find((f) => f.key === filterKey);
  if (!def) return false;
  const haystack = listingAmenityHaystack(amenities);
  if (!haystack.length) return false;
  return def.keywords.some((kw) => keywordMatchesHaystack(kw, haystack));
}

export function countListingsWithAmenity(
  listings: Array<{ amenities?: string[] }>,
  filterKey: string,
  catalog: AmenityFilterDef[] = SEARCH_AMENITY_FILTERS,
): number {
  return listings.filter((l) => listingMatchesAmenityFilter(l.amenities, filterKey, catalog)).length;
}

/** Fusionne filtres statiques + catalogue API (top amenities BD). */
export function mergeAmenityCatalog(
  apiAmenities: Array<{ _id?: string; name?: string; slug?: string; count?: number }>,
): AmenityFilterDef[] {
  const seen = new Set(SEARCH_AMENITY_FILTERS.map((f) => f.key));
  const extra: AmenityFilterDef[] = [];

  for (const a of apiAmenities) {
    const label = (a.name || '').trim();
    if (!label || label.length < 3) continue;
    const key = (a.slug || norm(label).replace(/\s+/g, '-')).slice(0, 48);
    if (seen.has(key)) continue;
    seen.add(key);
    extra.push({
      key,
      label,
      emoji: '✨',
      keywords: [norm(label), ...norm(label).split(/\s+/).filter((w) => w.length > 3)],
    });
  }

  return [...SEARCH_AMENITY_FILTERS, ...extra.slice(0, 40)];
}

/** Options affichées : filtres standards toujours visibles + extras BD avec count > 0. */
export function buildAmenityFilterOptions(
  catalog: AmenityFilterDef[],
  facetPool: Array<{ amenities?: string[] }>,
  selectedKeys: string[],
): Array<AmenityFilterDef & { count: number }> {
  const staticKeys = new Set(SEARCH_AMENITY_FILTERS.map((f) => f.key));
  const withCounts = catalog.map((f) => ({
    ...f,
    count: countListingsWithAmenity(facetPool, f.key, catalog),
  }));

  const standard = SEARCH_AMENITY_FILTERS.map((f) => {
    const row = withCounts.find((w) => w.key === f.key);
    return row || { ...f, count: 0 };
  });

  const extras = withCounts
    .filter((f) => !staticKeys.has(f.key))
    .filter((f) => f.count > 0 || selectedKeys.includes(f.key))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  return [...standard, ...extras];
}
