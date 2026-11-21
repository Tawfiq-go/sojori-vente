/**
 * Le thème PROPRE du moteur de réservation, appliqué à la page `/reserver` du site (Tawfiq, 21/11/2026 : « l'aperçu utilise
 * exactement les mêmes API que le futur public, aucun chemin de rendu parallèle »). Il vient de srv-site :
 *  - aperçu du brouillon : `GET /apercu/:jeton/moteur` (jeton = seule entrée) ;
 *  - site publié : `GET /pm/:slug/moteur` (thème appliqué).
 * Seul un thème `source: 'moteur'` (réglé dans l'onglet « Moteur de réservation ») change le rendu ; `source: 'site'` (le
 * moteur hérite du site) ne change rien : la page garde le thème du site.
 *
 * Rien de ce qui vient du réseau n'entre tel quel dans le CSS : chaque valeur est revalidée ici (hexadécimal, police sans
 * caractère de contrôle, listes fermées). Une valeur hors forme est ignorée, jamais corrigée.
 */
import type { Langue } from './types'

const HEX6 = /^#[0-9a-f]{6}$/i
const POLICE = /^[\p{L}\p{N} ]{2,40}$/u
const HTTPS = /^https:\/\/[^\s"'<>()\\]{3,500}$/
const ARRONDI = { aucun: '0px', doux: '10px', rond: '22px' } as const
const ESPACE = { aeree: '96px', normale: '64px', serree: '40px' } as const

export type SurchargeMoteur = {
  /** Variables CSS posées sur `.site-pm`, par-dessus celles du site. */
  variables: Record<string, string>
  /** La police du moteur (une seule famille, pour titres et textes), à charger. */
  police: string | null
  logoUrl: string | null
  /** Titre et sous-titre du premier écran de la liste (texte du client), ou le ton d'accroche pour le sous-titre. */
  titre: string | null
  sousTitre: string | null
}

type Texte = Partial<Record<string, unknown>> | null | undefined

const choisir = (t: Texte, langue: Langue, defaut: Langue): string | null => {
  const v = t && typeof t === 'object' ? (t[langue] ?? t[defaut]) : undefined
  return typeof v === 'string' && v.trim() ? v.replace(/\s+/g, ' ').trim().slice(0, 200) : null
}

/** La charte du moteur à poser, ou `null` : rien à changer (le moteur hérite du site, ou la réponse est illisible). */
export function surchargeMoteur(brut: unknown, langue: Langue, defaut: Langue): SurchargeMoteur | null {
  if (!brut || typeof brut !== 'object') return null
  const m = brut as {
    source?: unknown
    theme?: { couleurs?: { marque?: unknown; accent?: unknown }; police?: unknown; arrondi?: unknown; densite?: unknown }
    variables?: Record<string, unknown>
    logoUrl?: unknown
    accroche?: Texte
    accueil?: { titre?: Texte; sousTitre?: Texte } | null
  }
  if (m.source !== 'moteur') return null
  const variables: Record<string, string> = {}
  const marque = m.theme?.couleurs?.marque
  const accent = m.theme?.couleurs?.accent
  if (typeof marque === 'string' && HEX6.test(marque)) variables['--accent'] = marque.toLowerCase()
  if (typeof accent === 'string' && HEX6.test(accent)) variables['--accent-doux'] = accent.toLowerCase()
  const encre = m.variables?.['--encre-bouton']
  if (typeof encre === 'string' && HEX6.test(encre)) variables['--encre-bouton'] = encre.toLowerCase()
  const police = typeof m.theme?.police === 'string' && POLICE.test(m.theme.police) ? m.theme.police : null
  if (police) {
    variables['--police-titres'] = `'${police}', Georgia, serif`
    variables['--police-texte'] = `'${police}', system-ui, sans-serif`
  }
  const arrondi = ARRONDI[m.theme?.arrondi as keyof typeof ARRONDI]
  if (arrondi) variables['--arrondi'] = arrondi
  const espace = ESPACE[m.theme?.densite as keyof typeof ESPACE]
  if (espace) variables['--espace'] = espace
  return {
    variables,
    police,
    logoUrl: typeof m.logoUrl === 'string' && HTTPS.test(m.logoUrl) ? m.logoUrl : null,
    titre: choisir(m.accueil?.titre, langue, defaut),
    sousTitre: choisir(m.accueil?.sousTitre, langue, defaut) ?? choisir(m.accroche, langue, defaut),
  }
}

/** Le lien Google Fonts de la police du moteur. */
export const lienPoliceMoteur = (police: string): string =>
  `https://fonts.googleapis.com/css2?family=${encodeURIComponent(police).replace(/%20/g, '+')}:wght@400;500;600;700&display=swap`
