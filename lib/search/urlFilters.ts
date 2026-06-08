import type { SearchPropertyType } from '@/lib/search/propertyTypes';

export type UrlFilterState = {
  pms: string[];
  types: SearchPropertyType[];
  amenities: string[];
  minRating: number;
  minPrice: number | null;
  maxPrice: number | null;
};

export function parseFiltersFromSearchParams(params: URLSearchParams): UrlFilterState {
  const types = (params.get('types') || '')
    .split(',')
    .filter(Boolean) as SearchPropertyType[];

  return {
    pms: (params.get('pms') || '').split(',').filter(Boolean),
    types,
    amenities: (params.get('amenities') || '').split(',').filter(Boolean),
    minRating: Number.parseFloat(params.get('rating') || '0') || 0,
    minPrice: params.get('minPrice') ? Number.parseInt(params.get('minPrice')!, 10) : null,
    maxPrice: params.get('maxPrice') ? Number.parseInt(params.get('maxPrice')!, 10) : null,
  };
}

export function countActiveUrlFilters(
  filters: UrlFilterState,
  priceRange: [number, number],
  priceBounds: [number, number],
): number {
  let n =
    filters.pms.length +
    filters.types.length +
    filters.amenities.length +
    (filters.minRating > 0 ? 1 : 0);
  const priceActive =
    priceRange[0] > priceBounds[0] || priceRange[1] < priceBounds[1];
  if (priceActive) n += 1;
  return n;
}

export function buildSearchParamsWithFilters(
  base: URLSearchParams,
  filters: {
    selectedPMs: string[];
    selectedTypes: string[];
    selectedAmenities: string[];
    minRating: number;
    priceRange: [number, number];
    priceBounds: [number, number];
  },
): URLSearchParams {
  const params = new URLSearchParams(base.toString());

  const setList = (key: string, values: string[]) => {
    if (values.length) params.set(key, values.join(','));
    else params.delete(key);
  };

  setList('pms', filters.selectedPMs);
  setList('types', filters.selectedTypes);
  setList('amenities', filters.selectedAmenities);

  if (filters.minRating > 0) params.set('rating', String(filters.minRating));
  else params.delete('rating');

  const priceActive =
    filters.priceRange[0] > filters.priceBounds[0] ||
    filters.priceRange[1] < filters.priceBounds[1];

  if (priceActive) {
    params.set('minPrice', String(filters.priceRange[0]));
    params.set('maxPrice', String(filters.priceRange[1]));
  } else {
    params.delete('minPrice');
    params.delete('maxPrice');
  }

  return params;
}
