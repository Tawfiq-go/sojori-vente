export type SearchPropertyType = 'riad' | 'appartement' | 'villa' | 'maison';

export const SEARCH_PROPERTY_TYPES: {
  key: SearchPropertyType;
  label: string;
  emoji: string;
}[] = [
  { key: 'riad', label: 'Riad', emoji: '🕌' },
  { key: 'appartement', label: 'Appartement', emoji: '🏢' },
  { key: 'villa', label: 'Villa', emoji: '🏰' },
  { key: 'maison', label: 'Maison', emoji: '🏡' },
];

/** Normalise propertyType Mongo (Apartment, Villa…) vers clé filtre search. */
export function normalizePropertyType(raw?: string | null): SearchPropertyType {
  const t = (raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

  if (t.includes('riad')) return 'riad';
  if (t.includes('villa')) return 'villa';
  if (t.includes('maison') || t.includes('house') || t.includes('home')) return 'maison';
  if (t.includes('apartment') || t.includes('appartement') || t.includes('studio') || t.includes('flat')) {
    return 'appartement';
  }
  return 'appartement';
}
