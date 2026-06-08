import type { SearchPropertyType } from '@/lib/search/propertyTypes';

/** Build histogram buckets from listing nightly prices. */
export function buildPriceHistogram(
  prices: number[],
  bucketCount = 24,
): number[] {
  if (!prices.length) return [];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = Math.max(max - min, 1);
  const buckets = Array.from({ length: bucketCount }, () => 0);
  for (const p of prices) {
    const idx = Math.min(bucketCount - 1, Math.floor(((p - min) / span) * bucketCount));
    buckets[idx] += 1;
  }
  return buckets;
}

export function computePriceBounds(prices: number[]): [number, number] {
  if (!prices.length) return [0, 5000];
  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const min = Math.floor(rawMin / 100) * 100;
  const max = Math.ceil(rawMax / 100) * 100;
  return [Math.max(0, min), Math.max(min + 100, max)];
}

export function clampPriceRange(
  range: [number, number],
  bounds: [number, number],
): [number, number] {
  return [
    Math.max(bounds[0], Math.min(range[0], bounds[1] - 50)),
    Math.min(bounds[1], Math.max(range[1], bounds[0] + 50)),
  ];
}

export function isSearchPropertyType(v: string): v is SearchPropertyType {
  return ['riad', 'appartement', 'villa', 'maison'].includes(v);
}
