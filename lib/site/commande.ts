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
  // Une prestation commandable, ou un ÉVÉNEMENT en vente (ses formules se choisissent dans le panneau).
  return (
    allume &&
    !apercu &&
    offre?.etat === 'en_cours' &&
    (offre.service?.forme === 'prestation' || offre.service?.forme === 'evenement') &&
    offre.serviceLu?.commandable === true
  )
}

/**
 * En APERÇU, le panneau d'un événement se montre (dates, formules, champs) mais ne réserve jamais : le propriétaire voit la page telle
 * qu'elle sera, brouillon compris. Jamais pour un événement terminé, ni sans événement lu.
 */
export function panneauApercu(offre: { service?: { forme?: string }; evenementLu?: { statut: string } } | undefined, apercu: boolean): boolean {
  return apercu && offre?.service?.forme === 'evenement' && offre.evenementLu !== undefined && offre.evenementLu.statut !== 'termine'
}

/**
 * Pourquoi un événement ne se réserve pas (public) : fermé par le propriétaire, plus aucune date, ou complet. `null` s'il se réserve, si
 * l'événement n'est pas lu, ou en aperçu. La page le dit au lieu de mener le visiteur ailleurs.
 */
export function raisonFermee(
  e: { statut: string; reservable: boolean; restantes: number; repetition?: unknown; prochaines?: ReadonlyArray<unknown> } | undefined,
  apercu: boolean,
): 'evtFerme' | 'evtTermine' | 'soireeComplet' | null {
  if (!e || apercu || e.reservable) return null
  if (e.statut === 'termine') return 'evtTermine'
  if (e.statut !== 'en_vente') return 'evtFerme'
  if (e.prochaines && e.prochaines.length === 0) return 'evtTermine'
  return 'soireeComplet'
}

/** Ce qui part au serveur pour un choix de formules d'événement : une seule formule = l'écriture d'avant ; plusieurs = `formules`. */
export function corpsFormules(quantites: Readonly<Record<string, number>>): { formule: string; quantite: number } | { formules: Array<{ id: string; quantite: number }> } | null {
  const choix = Object.entries(quantites).filter(([, n]) => n > 0)
  if (choix.length === 0) return null
  if (choix.length === 1) return { formule: choix[0][0], quantite: choix[0][1] }
  return { formules: choix.map(([id, quantite]) => ({ id, quantite })) }
}

/** Le total affiché avant l'envoi : les prix du catalogue fois les places (jamais envoyé ; le serveur recalcule). `null` si un prix manque. */
export function totalFormules(formules: ReadonlyArray<{ id?: string; prixCentimes?: number }>, quantites: Readonly<Record<string, number>>): number | null {
  let total = 0
  for (const f of formules) {
    const n = (f.id && quantites[f.id]) || 0
    if (!n) continue
    if (f.prixCentimes === undefined) return null
    total += f.prixCentimes * n
  }
  return total
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
export const ERREURS = ['CRENEAU_COMPLET', 'CRENEAU_INDISPONIBLE', 'STOCK_INSUFFISANT', 'HORS_PORTEE', 'CATALOGUE_EXTERNE', 'PROMOTION_INDISPONIBLE', 'TROP_DE_COMMANDES', 'VALIDATION', 'EMAIL_INVALIDE', 'paiement_indisponible', 'landing_non_servie', 'EVENEMENT_FERME', 'EVENEMENT_PASSE', 'EVENEMENT_SEUL', 'MODE_PAIEMENT_REFUSE', 'SUR_PLACE_PLAFOND', 'DATE_EVENEMENT_INVALIDE', 'EVENEMENT_UNE_DATE'] as const
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
    // La formule choisie : l'identifiant de sa prestation (événement) ou l'indice d'une formule de la page (0 à 5), sinon rien
    // (la prestation principale). srv-site revérifie tout.
    const formule = d.recherche.get('formule') || ''
    if (/^[0-5]$/.test(formule) || /^[a-f0-9]{24}$/i.test(formule)) url += `&formule=${formule.toLowerCase()}`
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

/**
 * La date et l'heure d'un événement telles qu'écrites dans Services (`AAAA-MM-JJThh:mm`, heure du lieu), lues SANS conversion de fuseau :
 * le visiteur voit l'heure du lieu, jamais celle de son navigateur. Vide si la valeur n'a pas cette forme.
 */
export function dateEvenement(debut: string, langue: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(debut)) return ''
  const d = new Date(`${debut}:00Z`)
  if (Number.isNaN(d.getTime())) return ''
  const loc = langue === 'ar' ? 'ar-MA' : langue
  return d.toLocaleString(loc, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/**
 * Les dates à proposer pour un événement PÉRIODIQUE (dates lues par srv-site, jamais calculées ici), chacune avec ses places. Absent :
 * événement à date unique (ou répétition illisible) : la date se montre, elle ne se choisit pas.
 */
export function datesAChoisir(e: { repetition?: { heure: string }; prochaines?: Array<{ date: string; restantes: number }> } | undefined): Array<{ date: string; debut: string; restantes: number }> | undefined {
  const heure = e?.repetition?.heure
  if (!heure) return undefined
  return (e?.prochaines ?? []).filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.date)).map((p) => ({ date: p.date, debut: `${p.date}T${heure}`, restantes: p.restantes }))
}

/** La date proposée d'abord : la première qui a encore de la place (sinon aucune : rien n'est présélectionné sur une date complète). */
export const premiereDateLibre = (dates: ReadonlyArray<{ date: string; restantes: number }> | undefined): string => dates?.find((d) => d.restantes > 0)?.date ?? ''

/** La date désignée par un lien `#reserver-d2026-12-06` (carte de date de la page), si elle est proposée et qu'il y reste de la place. */
export function dateDuLien(hash: string, dates: ReadonlyArray<{ date: string; restantes: number }> | undefined): string {
  const m = /^#reserver-d(\d{4}-\d{2}-\d{2})$/.exec(hash)
  return (m && dates?.find((d) => d.date === m[1] && d.restantes > 0)?.date) || ''
}

/**
 * Quand a lieu un événement périodique, en clair : « Chaque dimanche · 12:00 - 16:00 ». Les noms de jours viennent de la langue du
 * visiteur ; vide sans répétition. 2023-01-01 est un dimanche (jour 0).
 */
export function quandPeriodique(r: { jours: number[]; heure: string; heureFin: string | null } | undefined, langue: string, mots: { chaque: string; tous: string }): string {
  if (!r) return ''
  const loc = langue === 'ar' ? 'ar-MA' : langue
  const nom = (j: number) => new Date(Date.UTC(2023, 0, 1 + j)).toLocaleDateString(loc, { timeZone: 'UTC', weekday: 'long' })
  const jours = r.jours.length === 7 ? mots.tous : mots.chaque.replace('{jours}', new Intl.ListFormat(loc, { type: 'conjunction' }).format(r.jours.map(nom)))
  return `${jours} · ${r.heure}${r.heureFin ? ` - ${r.heureFin}` : ''}`
}

/** Une date courte pour une carte (« dim. 29 nov. »), heure du lieu, sans conversion de fuseau. */
export function dateCourte(date: string, langue: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(langue === 'ar' ? 'ar-MA' : langue, { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })
}
