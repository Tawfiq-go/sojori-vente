/**
 * La forme d'un site telle que srv-site la sert (`GET /api/v1/public/sites/…`). Copie de lecture
 * du contrat `SiteSpec` v1 (sojori-production, apps/srv-site/src/domaine/spec.ts) : l'app affiche,
 * elle ne valide pas — srv-site a déjà refusé tout ce qui n'est pas permis. Spec :
 * sojori-production/docs/patterns/agents/agent-site-web.md.
 */
export type Langue = 'fr' | 'en' | 'ar'
export type Texte = Partial<Record<Langue, string>>
export type Valeur = Texte | string | string[] | Array<Record<string, Texte | string>>

export type Section =
  | { id: string; niveau: 'sojori'; type: string; reglages: Record<string, unknown> }
  | { id: string; niveau: 'bibliotheque'; type: string; variante: string; contenu: Record<string, Valeur> }
  | { id: string; niveau: 'mesure'; nom: string; html: Texte; css: string }

export type Page = {
  id: string
  chemin: string
  titre: Texte
  seo?: { titre?: Texte; description?: Texte }
  sections: Section[]
}

export type SiteSpec = {
  v: 1
  identite: { nom: string; logo?: string }
  theme: {
    couleurs: { fond: string; texte: string; accent: string; accentDoux: string }
    polices: { titres: string; texte: string }
    arrondi: 'aucun' | 'doux' | 'rond'
    densite: 'aeree' | 'normale' | 'serree'
  }
  langues: { defaut: Langue; actives: Langue[] }
  pages: Page[]
  piedDePage: { texte?: Texte; reseaux?: Array<{ type: string; url: string }> }
}

export type Media = { url: string; type: 'image' | 'video'; alt?: string }

export type SitePublic = {
  siteId: string
  adresse: string
  spec: SiteSpec
  medias: Record<string, Media>
  /** Les mentions légales de la version publiée (raison sociale, ICE, RC, adresse…). */
  mentions: Record<string, string> | null
  /** Le bloc « contact » : numéro WhatsApp (chiffres, pour wa.me) et formulaire de la page de contact du PM. */
  contact?: { whatsapp: string | null; formulaire: string | null }
  version: number | null
  apercu: boolean
}

/** Un logement tel que la liste publique de srv-listing le rend (`?pm=<slug>`). */
export type Logement = {
  id: string
  title: string
  city?: string
  pricePerNight?: number
  currency?: string
  maxGuests?: number
  bedrooms?: number
  bathrooms?: number
  images?: string[]
  description?: string
  amenities?: string[]
}
