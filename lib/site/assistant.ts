/**
 * L'espace IA du site d'un PM (Tawfiq, 28/10/2026 : « un espace AI si demandé, conversation et
 * voix ») : la bulle parle à Réservation directe de Sojori, bornée aux logements du PM, par la route
 * serveur `/api/site-assistant/<geste>` (le jeton reste côté serveur). Rattaché à l'abonnement
 * Réservation directe ; 200 conversations par jour et par site ; texte + micro, voix en option.
 */

/** Le site d'où parle le visiteur : son slug (domaine du PM) ou le jeton de l'aperçu. */
export type CibleAssistant = { slug: string } | { jeton: string }

export type LogementPropose = {
  listingId: string
  logement: string
  ville: string
  photo: string
  capacite: number
  nuits: number
  total: number
  prixMoyenNuit: number
  devise: string
}

export type DevisPropose = {
  listingId: string
  logement: string
  periode: string
  nuits: number
  voyageurs: number
  total: number
  devise: string
  conditions: string[]
  photo: string
}

export type CartePropose = { demandeId: string; type: 'reservation' | 'annulation'; resume: string; photo: string }

export type ReponseAssistant = {
  reponse: string
  question: { texte: string; options: string[] } | null
  logements: LogementPropose[]
  devis: DevisPropose | null
  carte: CartePropose | null
  indisponible: boolean
}

export type ClicAssistant = { phrase: string; etat: string; lienPaiement: string | null }

/** Les gestes servis par la route, et le chemin srv-agents de chacun (liste fermée). */
export const GESTES = {
  etat: { methode: 'GET', chemin: 'site/etat' },
  message: { methode: 'POST', chemin: 'site/message' },
  clic: { methode: 'POST', chemin: 'site/clic' },
  transcrire: { methode: 'POST', chemin: 'site/voix/transcrire' },
  parler: { methode: 'POST', chemin: 'site/voix/parler' },
} as const
export type Geste = keyof typeof GESTES

/** Les champs qu'un geste peut porter vers srv-agents : rien d'autre ne passe. */
const CHAMPS = ['session', 'texte', 'slug', 'jeton', 'demandeId', 'geste', 'audio', 'mimeType', 'langue'] as const

export function corpsPermis(brut: unknown): Record<string, string> {
  const b = (brut && typeof brut === 'object' ? brut : {}) as Record<string, unknown>
  const out: Record<string, string> = {}
  for (const k of CHAMPS) if (typeof b[k] === 'string') out[k] = b[k] as string
  return out
}

/** Une session de conversation opaque, gardée le temps de l'onglet (forme attendue par srv-agents). */
export function nouvelleSession(alea: () => number = Math.random): string {
  const c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let s = ''
  for (let i = 0; i < 32; i++) s += c[Math.floor(alea() * c.length)]
  return s
}

/** Un montant en dirhams, à la marocaine (« 1 500 MAD »). */
export const montant = (n: number, devise = 'MAD') =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n).replace(/ /g, ' ')} ${devise}`
