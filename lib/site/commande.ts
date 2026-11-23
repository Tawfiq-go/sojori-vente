/**
 * Commander la prestation d'une landing de service (S4) : le panneau de la page, et le relais serveur vers srv-site.
 *
 * Le navigateur ne décide de rien : il dit « cette landing » (slug du site + identifiant de la page), qui il est, combien de places,
 * quel créneau. srv-site en tire le propriétaire (du slug), la prestation (celle que la landing lie) et srv-services calcule le prix
 * (remise de la landing comprise) : la page n'affiche que le `totalCentimes` que le serveur rend. Aucun prix n'est envoyé d'ici.
 *
 * ÉTEINT par défaut : tant que `SITE_COMMANDE_LANDING` ne vaut pas exactement « 1 », le panneau n'existe pas et le relais répond 404.
 * Sans import (testé par `node --test`) ; seul le relais (`relayer`) fait des appels réseau, par un `fetch` injectable.
 */

/** L'interrupteur du panneau et du relais (lu côté serveur seulement). */
export const commandeAllumee = (env: Record<string, string | undefined> = process.env): boolean => (env.SITE_COMMANDE_LANDING || '').trim() === '1'

/**
 * Le panneau de commande n'apparaît que pour une landing EN COURS qui lie une PRESTATION que le catalogue dit commandable (jamais un
 * service de partenaire ni Mews, jamais la carte d'un restaurant), hors aperçu (l'aperçu ne crée aucune commande), et interrupteur allumé.
 */
export function panneauCommande(
  offre: { etat?: string; service?: { forme?: string }; serviceLu?: { commandable?: boolean } } | undefined,
  apercu: boolean,
  allume: boolean,
): boolean {
  return allume && !apercu && offre?.etat === 'en_cours' && offre.service?.forme === 'prestation' && offre.serviceLu?.commandable === true
}

const SLUG = /^[a-z0-9-]{3,40}$/
const PAGE = /^[A-Za-z0-9_-]{1,80}$/
const ID = /^[a-f0-9]{24}$/i

export const CORPS_MAX = 4000

/** Les trois gestes du panneau, et eux seuls : créneaux, commande, lien de paiement. Tout autre chemin est refusé. */
export type Geste = { methode: 'GET' | 'POST'; chemin: string }

/** Le chemin srv-site d'un geste (`…/landings/<page>/commande…`), ou `null` si le slug, la page, le geste ou l'identifiant sont invalides. */
export function geste(methode: string, slug: string, pageId: string, suite: string[]): Geste | null {
  if (!SLUG.test(slug) || !PAGE.test(pageId)) return null
  const base = `pm/${slug}/landings/${pageId}/commande`
  if (methode === 'GET' && suite.length === 1 && suite[0] === 'creneaux') return { methode: 'GET', chemin: `${base}/creneaux` }
  if (methode === 'POST' && suite.length === 1 && suite[0] === 'commande') return { methode: 'POST', chemin: base }
  if (methode === 'POST' && suite.length === 3 && suite[0] === 'commande' && ID.test(suite[1]) && suite[2] === 'paiement') return { methode: 'POST', chemin: `${base}/${suite[1].toLowerCase()}/paiement` }
  return null
}

/** L'adresse du visiteur : la DERNIÈRE de `x-forwarded-for` (posée par le relais de confiance, jamais l'entrée forgée plus à gauche), sinon `x-real-ip`. */
export function ipDuVisiteur(forwardedFor: string | null, realIp: string | null): string {
  const f = (forwardedFor || '').split(',').map((x) => x.trim()).filter(Boolean)
  return (f[f.length - 1] || (realIp || '').trim()).slice(0, 64)
}

/** Une limite par adresse et par minute (en mémoire, par pod) : une commande retient des places. */
export function limiteur(max: number, fenetreMs = 60_000, maintenant: () => number = Date.now) {
  const vus = new Map<string, { debut: number; n: number }>()
  return (ip: string): boolean => {
    const t = maintenant()
    const v = vus.get(ip)
    if (!v || t - v.debut > fenetreMs) {
      if (vus.size > 5_000) vus.clear()
      vus.set(ip, { debut: t, n: 1 })
      return false
    }
    v.n += 1
    return v.n > max
  }
}

/** Les erreurs que le panneau sait dire (codes stables de srv-services, relayés par srv-site), sinon le message générique. */
export const ERREURS = ['CRENEAU_COMPLET', 'CRENEAU_INDISPONIBLE', 'STOCK_INSUFFISANT', 'HORS_PORTEE', 'CATALOGUE_EXTERNE', 'PROMOTION_INDISPONIBLE', 'TROP_DE_COMMANDES', 'VALIDATION', 'EMAIL_INVALIDE', 'paiement_indisponible', 'landing_non_servie'] as const
export type CodeErreur = (typeof ERREURS)[number]
export const codeErreur = (v: unknown): CodeErreur | 'autre' => ((ERREURS as readonly string[]).includes(v as string) ? (v as CodeErreur) : 'autre')

/** Un lien de paiement n'est ouvert que s'il est en https (jamais un `javascript:` ni un schéma imprévu). */
export const lienOuvrable = (v: unknown): v is string => typeof v === 'string' && /^https:\/\/[^\s]+$/i.test(v)

/** Un montant en centimes rendu par le serveur, en MAD lisible. */
export const montantMad = (centimes: number, devise: string, langue: 'fr' | 'en' | 'ar'): string =>
  new Intl.NumberFormat(langue === 'ar' ? 'ar-MA' : langue === 'en' ? 'en-GB' : 'fr-MA', { style: 'currency', currency: devise || 'MAD', minimumFractionDigits: centimes % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(centimes / 100)

/* ── Le relais serveur : le navigateur parle à CE site (même origine), qui parle à srv-site. La route Next est mince, la logique est ici. ── */
/** Décidé ici : interrupteur (éteint = 404), liste fermée de gestes, taille et forme du corps, une limite par adresse, adresse du visiteur transmise. Décidé AILLEURS : propriétaire, prestation, prix, remise (srv-site, srv-services). */
export type Demande = {
  methode: string
  slug: string
  pageId: string
  suite: string[]
  /** La chaîne de requête (`?date=…`) : seule `date` est transmise, aux créneaux. */
  recherche: URLSearchParams
  corps: string | null
  forwardedFor: string | null
  realIp: string | null
}
export type Reponse = { statut: number; corps: string; type: string }

const json = (statut: number, objet: unknown): Reponse => ({ statut, corps: JSON.stringify(objet), type: 'application/json' })

const parMinute = limiteur(12)
/** Les lectures de créneaux sont plus fréquentes (un visiteur change de date) : une limite plus large, mais une limite. */
const creneauxParMinute = limiteur(60)

export async function relayer(d: Demande, env: Record<string, string | undefined> = process.env, appeler: typeof fetch = fetch): Promise<Reponse> {
  if (!commandeAllumee(env)) return json(404, { success: false, error: 'commande_eteinte' })
  const g = geste(d.methode, d.slug, d.pageId, d.suite)
  if (!g) return json(404, { success: false, error: 'geste_inconnu' })
  const ip = ipDuVisiteur(d.forwardedFor, d.realIp)
  if (g.methode === 'POST' ? parMinute(ip || 'inconnue') : creneauxParMinute(ip || 'inconnue')) return json(429, { success: false, error: 'TROP_DE_COMMANDES' })

  let url = `${(env.SITE_API_URL || 'https://api.sojori.com/api/v1/public/sites').replace(/\/+$/, '')}/${g.chemin}`
  if (g.methode === 'GET') {
    const date = d.recherche.get('date') || ''
    url += `?date=${encodeURIComponent(date.slice(0, 10))}`
    // Soirée : l'indice de la formule choisie (un chiffre de 0 à 5), sinon rien (la prestation principale). srv-site revérifie.
    const formule = d.recherche.get('formule') || ''
    if (/^[0-5]$/.test(formule)) url += `&formule=${formule}`
  }
  const init: RequestInit = { method: g.methode, headers: { 'x-forwarded-for': ip, 'content-type': 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(15_000) }
  if (g.methode === 'POST') {
    const brut = d.corps ?? ''
    if (brut.length > CORPS_MAX) return json(413, { success: false, error: 'trop_long' })
    try {
      const lu = JSON.parse(brut || '{}')
      if (!lu || typeof lu !== 'object' || Array.isArray(lu)) throw new Error('objet attendu')
    } catch {
      return json(400, { success: false, error: 'demande_invalide' })
    }
    init.body = brut || '{}'
  }
  try {
    const r = await appeler(url, init)
    return { statut: r.status, corps: await r.text(), type: r.headers.get('content-type') || 'application/json' }
  } catch {
    return json(503, { success: false, error: 'commande_indisponible' })
  }
}
