/**
 * Les métadonnées d'une page du site d'un PM SANS trace de la plateforme : le layout racine de sojori-vente
 * pose « Sojori » en titre, auteur, éditeur, mots-clés, nom de site Open Graph et favicon ; chaque page de site
 * les remplace par ceux du client (nom du site, son logo comme icône, aucune image ni mot-clé de la plateforme).
 */
import type { Metadata } from 'next'
import type { SitePublic } from './types'

/** Une icône vide (1 pixel transparent) : à défaut de logo, jamais le favicon de la plateforme. */
const ICONE_VIDE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/** Métadonnées neutres (page introuvable, site sans fiche) : rien de la plateforme n'est hérité du layout racine. */
export function metaNeutre(titre = 'Page introuvable'): Metadata {
  return {
    title: titre,
    description: titre,
    authors: [],
    creator: '',
    publisher: '',
    keywords: [],
    icons: { icon: ICONE_VIDE, shortcut: ICONE_VIDE, apple: ICONE_VIDE },
    openGraph: { type: 'website', title: titre, description: titre, siteName: '', images: [] },
    twitter: { card: 'summary', title: titre, images: [] },
    robots: { index: false, follow: false },
  }
}

export function metaMarqueBlanche(site: SitePublic, titre: string, descriptionPage?: string): Metadata {
  const nom = site.spec.identite.nom
  // Jamais la description de la plateforme (celle du layout racine) : à défaut, le nom du site.
  const description = descriptionPage || nom
  const logo = site.spec.identite.logo ? site.medias[site.spec.identite.logo]?.url : undefined
  return {
    title: titre,
    description,
    applicationName: nom,
    authors: [{ name: nom }],
    creator: nom,
    publisher: nom,
    keywords: [],
    icons: { icon: logo ?? ICONE_VIDE, shortcut: logo ?? ICONE_VIDE, apple: logo ?? ICONE_VIDE },
    openGraph: { type: 'website', siteName: nom, title: titre, description, images: [] },
    twitter: { card: 'summary', title: titre, description, images: [] },
  }
}
