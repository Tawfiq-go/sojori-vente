/**
 * Liste des villes ciblées pour Sojori OTA
 * Si une ville n'a pas encore de biens, on affichera "Coming Soon"
 */

export interface TargetCity {
  name: string;
  slug: string;
  displayName: string;
  featured: boolean; // Afficher sur homepage
  comingSoon: boolean; // Sera mis à jour dynamiquement
}

export const TARGET_CITIES: TargetCity[] = [
  // Villes principales (featured on homepage)
  {
    name: 'Marrakech',
    slug: 'marrakech',
    displayName: 'Marrakech',
    featured: true,
    comingSoon: false,
  },
  {
    name: 'Casablanca',
    slug: 'casablanca',
    displayName: 'Casablanca',
    featured: true,
    comingSoon: false,
  },
  {
    name: 'Essaouira',
    slug: 'essaouira',
    displayName: 'Essaouira',
    featured: true,
    comingSoon: false,
  },
  {
    name: 'Fès',
    slug: 'fes',
    displayName: 'Fès',
    featured: true,
    comingSoon: false,
  },

  // Autres villes (dans la liste complète)
  {
    name: 'Tanger',
    slug: 'tanger',
    displayName: 'Tanger',
    featured: true,
    comingSoon: false,
  },
  {
    name: 'Agadir',
    slug: 'agadir',
    displayName: 'Agadir',
    featured: true,
    comingSoon: false,
  },
  {
    name: 'Rabat',
    slug: 'rabat',
    displayName: 'Rabat',
    featured: false,
    comingSoon: true, // Pas encore de données
  },
  {
    name: 'Chefchaouen',
    slug: 'chefchaouen',
    displayName: 'Chefchaouen',
    featured: true,
    comingSoon: false,
  },
  {
    name: 'Ouarzazate',
    slug: 'ouarzazate',
    displayName: 'Ouarzazate',
    featured: true,
    comingSoon: false,
  },
  {
    name: 'Dakhla',
    slug: 'dakhla',
    displayName: 'Dakhla',
    featured: false,
    comingSoon: true, // Pas encore de données
  },
  {
    name: 'Fnideq',
    slug: 'fnideq',
    displayName: 'Fnideq',
    featured: false,
    comingSoon: true, // Pas encore de données
  },
  {
    name: 'Meknès',
    slug: 'meknes',
    displayName: 'Meknès',
    featured: false,
    comingSoon: true,
  },
];

/**
 * Villes à afficher sur la homepage (section "12 villes")
 * Les 8 premières featured + coming soon badges si nécessaire
 */
export const HOMEPAGE_CITIES = TARGET_CITIES.filter((c) => c.featured).slice(0, 8);

/**
 * Toutes les villes pour le dropdown de recherche
 */
export const ALL_CITIES = TARGET_CITIES;

/**
 * Helper: Get city by slug
 */
export function getCityBySlug(slug: string): TargetCity | undefined {
  return TARGET_CITIES.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
}

/**
 * Helper: Get featured cities only
 */
export function getFeaturedCities(): TargetCity[] {
  return TARGET_CITIES.filter((c) => c.featured && !c.comingSoon);
}
