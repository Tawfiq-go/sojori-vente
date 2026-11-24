/**
 * Les MISES EN PAGE d'une landing de service (lot D2, cadrage « générateur de landings ultra design », 22/11/2026).
 *
 * Une mise en page est une composition complète et fermée (pas de HTML libre) : un premier écran et ses blocs, avec des
 * EMPLACEMENTS d'images typés (rôle, format). Elle est faite pour certains types de service (restaurant, brunch, piscine,
 * spa, navette, séjour). Règle centrale : une landing générée SANS aucune image est toujours belle et publiable :
 *  - en APERÇU, un emplacement vide montre un repli dessiné (couleurs de la marque, motif) et l'étiquette « Votre photo ici » ;
 *  - au PUBLIC, la mise en page bascule sur sa variante sans image (le bloc d'image disparaît, la composition reste).
 * Le client remplit les emplacements quand il veut (chat, dashboard, photo du service). Pur, sans import (testé par `node --test`).
 */

export const TYPES_SERVICE = ['sejour', 'restaurant', 'brunch', 'piscine', 'spa', 'navette', 'activite', 'soiree'] as const
export type TypeService = (typeof TYPES_SERVICE)[number]

export const FORMATS = ['16:9', '4:5', '1:1', '3:2'] as const
export type Format = (typeof FORMATS)[number]

export type Emplacement = {
  id: string
  /** Ce que la photo doit montrer : le client et l'agent s'en servent pour choisir la bonne image. */
  role: 'couverture' | 'ambiance' | 'detail' | 'plat' | 'portrait' | 'lieu'
  format: Format
  /** Obligatoire pour la variante AVEC images ; jamais pour publier (la variante sans image existe toujours). */
  principal?: boolean
}

export type MiseEnPage = {
  id: string
  /** Nom court montré au client (galerie des mises en page). */
  nom: string
  description: string
  /** Les types de service pour lesquels elle est faite, du plus adapté au moins adapté. */
  pour: readonly TypeService[]
  emplacements: readonly Emplacement[]
}

export const MISES_EN_PAGE: readonly MiseEnPage[] = [
  {
    id: 'editorial',
    nom: 'Éditorial, une image',
    description: 'Une grande photo plein écran, un titre de magazine, le prix en majesté.',
    pour: ['piscine', 'spa', 'sejour', 'brunch', 'restaurant', 'activite', 'navette'],
    emplacements: [{ id: 'couverture', role: 'couverture', format: '16:9', principal: true }],
  },
  {
    id: 'diptyque',
    nom: 'Diptyque, deux images',
    description: 'Le texte sur un aplat de couleur, une photo d’ambiance et une photo de détail qui se chevauchent.',
    pour: ['spa', 'restaurant', 'brunch', 'sejour', 'piscine'],
    emplacements: [
      { id: 'ambiance', role: 'ambiance', format: '4:5', principal: true },
      { id: 'detail', role: 'detail', format: '1:1' },
    ],
  },
  {
    id: 'mosaique',
    nom: 'Mosaïque',
    description: 'Cinq photos en grille, pour un lieu qui se raconte en images.',
    pour: ['sejour', 'piscine', 'restaurant', 'activite'],
    emplacements: [
      { id: 'grande', role: 'couverture', format: '1:1', principal: true },
      { id: 'photo2', role: 'ambiance', format: '1:1' },
      { id: 'photo3', role: 'detail', format: '1:1' },
      { id: 'photo4', role: 'lieu', format: '1:1' },
      { id: 'photo5', role: 'ambiance', format: '1:1' },
    ],
  },
  {
    id: 'typographique',
    nom: 'Typographique',
    description: 'Aucune photo : de grands titres, la couleur de la marque, un motif. Parfaite pour lancer sans attendre.',
    pour: ['navette', 'activite', 'brunch', 'spa', 'piscine', 'restaurant', 'sejour'],
    emplacements: [],
  },
  {
    id: 'carte_chef',
    nom: 'Carte du chef',
    description: 'Le programme et la carte en colonnes, la photo du plat signature.',
    pour: ['brunch', 'restaurant'],
    emplacements: [{ id: 'plat', role: 'plat', format: '1:1', principal: true }],
  },
  {
    id: 'day_pass',
    nom: 'Day pass',
    description: 'La photo du lieu, une carte de réservation, le déroulé de la journée.',
    pour: ['piscine', 'spa', 'activite'],
    emplacements: [
      { id: 'lieu', role: 'lieu', format: '16:9', principal: true },
      { id: 'detail', role: 'detail', format: '4:5' },
    ],
  },
  {
    id: 'brunch',
    nom: 'Brunch, journée',
    description: 'Une page claire : la photo, les prochaines dates à choisir, les formules, le déroulé et une galerie.',
    pour: ['brunch', 'piscine', 'restaurant'],
    emplacements: [
      { id: 'couverture', role: 'couverture', format: '4:5', principal: true },
      { id: 'photo2', role: 'plat', format: '1:1' },
      { id: 'photo3', role: 'ambiance', format: '1:1' },
      { id: 'photo4', role: 'lieu', format: '1:1' },
      { id: 'photo5', role: 'detail', format: '1:1' },
    ],
  },
  {
    id: 'soiree',
    nom: 'Soirée, événement',
    description: 'Un premier écran sombre et le compte à rebours, l’ambiance, la nuit heure par heure, plusieurs formules à réserver.',
    pour: ['soiree', 'restaurant', 'activite'],
    emplacements: [
      { id: 'fond', role: 'couverture', format: '16:9', principal: true },
      { id: 'decor', role: 'ambiance', format: '4:5' },
      { id: 'table', role: 'plat', format: '1:1' },
    ],
  },
]

export const miseEnPage = (id: string): MiseEnPage | undefined => MISES_EN_PAGE.find((m) => m.id === id)

/** Les mises en page faites pour un type de service, la plus adaptée d'abord (rang dans `pour`), à nombre de photos égal. */
export function misesEnPagePour(type: TypeService, photosDisponibles = 0): MiseEnPage[] {
  return MISES_EN_PAGE.filter((m) => m.pour.includes(type))
    .map((m) => ({
      m,
      // Une mise en page qui demande plus de photos qu'il n'y en a passe après (sans être retirée : les emplacements restent à remplir).
      manque: Math.max(0, m.emplacements.length - photosDisponibles),
      rang: m.pour.indexOf(type),
    }))
    .sort((a, b) => (a.manque > 0 ? 1 : 0) - (b.manque > 0 ? 1 : 0) || a.rang - b.rang)
    .map((x) => x.m)
}

/** Les emplacements encore vides (dans l'ordre de la mise en page). */
export function emplacementsVides(m: MiseEnPage, images: Readonly<Record<string, string | undefined>>): Emplacement[] {
  return m.emplacements.filter((e) => !imageUtilisable(images[e.id]))
}

/** Une image n'est posée que si c'est une adresse https (ou un chemin local de démonstration, jamais `//hôte` qui sortirait du site) : jamais `javascript:` ni `data:`. */
export function imageUtilisable(v: unknown): v is string {
  return typeof v === 'string' && (/^https:\/\/[^\s"'()]+$/i.test(v) || /^\/(?!\/)[A-Za-z0-9/_.-]+$/.test(v))
}

/**
 * La variante à rendre : `avec_images` dès que l'emplacement principal est rempli ; sinon `sans_image` (jamais un trou au public).
 * Une mise en page sans emplacement (typographique) est toujours `sans_image`.
 */
export function variante(m: MiseEnPage, images: Readonly<Record<string, string | undefined>>): 'avec_images' | 'sans_image' {
  const principal = m.emplacements.find((e) => e.principal)
  return principal && imageUtilisable(images[principal.id]) ? 'avec_images' : 'sans_image'
}

/** Ce que montre un emplacement : la photo, ou en aperçu le repli « Votre photo ici », ou rien au public. */
export function rendreEmplacement(
  src: unknown,
  apercu: boolean,
): { type: 'photo'; src: string } | { type: 'repli'; etiquette: boolean } | { type: 'aucun' } {
  if (imageUtilisable(src)) return { type: 'photo', src }
  return apercu ? { type: 'repli', etiquette: true } : { type: 'aucun' }
}

/** Le libellé d'un format pour l'étiquette du repli. */
export const libelleRole: Record<Emplacement['role'], string> = {
  couverture: 'Photo de couverture',
  ambiance: 'Photo d’ambiance',
  detail: 'Photo de détail',
  plat: 'Plat signature',
  portrait: 'Portrait',
  lieu: 'Photo du lieu',
}

/**
 * Les photos des emplacements telles que le site les sert : `media:<id>` → l'adresse du média du site, `service:auto` → la photo
 * du service lié (lue en direct par srv-site). Une référence inconnue, ou une adresse qui n'est pas sûre, laisse l'emplacement VIDE
 * (repli en aperçu, variante sans image au public), jamais une autre image.
 */
export function imagesDesEmplacements(
  emplacements: Readonly<Record<string, string>> | undefined,
  medias: Readonly<Record<string, { url?: string; type?: string } | undefined>>,
  imageService: string | undefined,
): Record<string, string | undefined> {
  const r: Record<string, string | undefined> = {}
  for (const [k, ref] of Object.entries(emplacements ?? {})) {
    const url = ref === 'service:auto' ? imageService : medias[ref]?.type === 'video' ? undefined : medias[ref]?.url
    if (imageUtilisable(url) && /^https:/i.test(url)) r[k] = url
  }
  return r
}

/**
 * Couleurs et polices posées dans le style en ligne de la mise en page (variables `--mep-*`) : validées ICI aussi (défense en
 * profondeur, srv-site les valide déjà à l'écriture). Un « ; » ou une parenthèse dans une valeur ouvrirait une déclaration CSS :
 * seules passent une couleur #RRGGBB et un nom de police fait de lettres, chiffres et espaces ; sinon, le repli sûr.
 */
export const REPLI_MARQUE = {
  couleurs: { accent: '#0d7a85', fond: '#f7f1e6', texte: '#1d1a16', doux: '#e2eeec' },
  polices: { titre: 'Cormorant Garamond', texte: 'Inter' },
} as const
const COULEUR = /^#[0-9a-fA-F]{6}$/
const POLICE = /^[A-Za-z0-9 ]{1,40}$/
export const couleurSure = (v: unknown, repli: string): string => (typeof v === 'string' && COULEUR.test(v) ? v : repli)
export const policeSure = (v: unknown, repli: string): string => (typeof v === 'string' && POLICE.test(v) ? v : repli)
export function marqueSure(couleurs: Partial<Record<keyof typeof REPLI_MARQUE.couleurs, unknown>>, polices: Partial<Record<keyof typeof REPLI_MARQUE.polices, unknown>>) {
  const r = REPLI_MARQUE
  return {
    couleurs: {
      accent: couleurSure(couleurs.accent, r.couleurs.accent),
      fond: couleurSure(couleurs.fond, r.couleurs.fond),
      texte: couleurSure(couleurs.texte, r.couleurs.texte),
      doux: couleurSure(couleurs.doux, r.couleurs.doux),
    },
    polices: { titre: policeSure(polices.titre, r.polices.titre), texte: policeSure(polices.texte, r.polices.texte) },
  }
}

/**
 * Le moment fort d'une soirée tel qu'écrit par le PM (heure LOCALE, `2026-12-31T23:59`), en clair : « 31 décembre 2026, 23:59 ». Lu sans
 * fuseau (c'est l'heure du lieu, jamais convertie) ; une date mal formée donne une chaîne vide.
 */
export function dateDuMoment(quand: string, langue: 'fr' | 'en' | 'ar'): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(quand)
  if (!m) return ''
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]))
  if (Number.isNaN(d.getTime()) || d.getUTCDate() !== +m[3]) return ''
  const locale = langue === 'ar' ? 'ar-MA' : langue === 'en' ? 'en-GB' : 'fr-FR'
  const jour = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d)
  return `${jour}, ${m[4]}:${m[5]}`
}
