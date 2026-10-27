/**
 * Le chemin d'une page du site d'un PM, lu sans I/O : une langue autre que celle par défaut en
 * préfixe (/en/…, /ar/…), puis le chemin d'une page de la fiche (vide = l'accueil).
 */
import type { Langue } from './types'

export type Cible = { langue: Langue; chemin: string }

export function lireCible(segments: string[], langues: { defaut: Langue; actives: Langue[] }): Cible {
  let r = segments.map((x) => decodeURIComponent(x)).filter(Boolean)
  let langue = langues.defaut
  if (r[0] && r[0] !== langues.defaut && (langues.actives as string[]).includes(r[0])) {
    langue = r[0] as Langue
    r = r.slice(1)
  }
  return { langue, chemin: r.join('/') }
}

/** Le lien vers une page du site dans une langue : <base>/<langue si pas défaut>/<chemin>. */
export function lien(base: string, langue: Langue, defaut: Langue, chemin: string): string {
  const morceaux = [base, langue !== defaut ? langue : '', chemin].filter(Boolean).join('/')
  return `/${morceaux.replace(/^\/+/, '')}`.replace(/\/+$/, '') || '/'
}

/** Les chemins (avec ou sans langue) que le site d'un PM sert : le reste reste à sojori-vente. */
export function estUnCheminDuSite(chemin: string, pages: string[], langues: { defaut: Langue; actives: Langue[] }): boolean {
  const segments = chemin.split('/').filter(Boolean)
  return pages.includes(lireCible(segments, langues).chemin)
}
