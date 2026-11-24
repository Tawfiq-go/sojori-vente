/**
 * Réserver une chambre EN LIGNE depuis le site d'un PM (moteur de réservation), paiement par carte.
 *
 * Le navigateur ne décide ni du prix ni du compte de paiement : il dit « ce type, ces dates, ces voyageurs, qui je suis ». Le serveur du
 * site RELIT le devis chez srv-listing (`evaluerType`), puis crée la réservation chez srv-reservations avec `payment.method = 'card'` :
 * srv-reservations re-vérifie le prix, applique la garde marque blanche par PROPRIÉTAIRE (`MOTEUR_BLANC_OWNER_IDS`) et choisit le compte
 * CMI du propriétaire. Aucune donnée de carte ne passe ici : le voyageur la saisit sur la page hébergée de CMI.
 *
 * ÉTEINT par défaut : un site n'accepte la réservation en ligne que si son identifiant (slug) est dans `SITE_RESERVATION_LIGNE_SLUGS`
 * ET le type réservé dans `SITE_RESERVATION_LIGNE_TYPES` (listes séparées par des virgules, lues côté serveur ; types vide = aucun). Éteint = le moteur reste « WhatsApp » et la route répond 404.
 * Sans import (testé par `node --test`) ; seuls `creer` fait des appels réseau, par un `fetch` injectable.
 */

/** Les sites dont la réservation en ligne est ouverte (jamais un drapeau envoyé par le navigateur). */
export function sitesEnLigne(env: Record<string, string | undefined> = process.env): Set<string> {
  return new Set(
    (env.SITE_RESERVATION_LIGNE_SLUGS || '')
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter((v) => /^[a-z0-9-]{3,40}$/.test(v)),
  )
}

export const reservationEnLigne = (slug: string, env: Record<string, string | undefined> = process.env): boolean => sitesEnLigne(env).has(slug.toLowerCase())

const ID = /^[a-f0-9]{24}(:[a-f0-9]{24})?$/i

/**
 * Les types de chambre (ou logements) dont la réservation en ligne est ouverte : `SITE_RESERVATION_LIGNE_TYPES`, identifiants
 * séparés par des virgules, exactement ceux de l'adresse `reserver/<id>` (`<logement>` ou `<logement>:<type>`). VIDE par défaut =
 * AUCUN : ouvrir un site n'ouvre aucun type tant qu'il n'est pas nommé ici (les autres restent en WhatsApp).
 */
export function typesEnLigne(env: Record<string, string | undefined> = process.env): Set<string> {
  return new Set(
    (env.SITE_RESERVATION_LIGNE_TYPES || '')
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter((v) => ID.test(v)),
  )
}

/** Ce type de ce site se réserve-t-il en ligne ? Le site ET le type doivent être ouverts (jamais l'un sans l'autre). */
export const typeEnLigne = (slug: string, typeId: string, env: Record<string, string | undefined> = process.env): boolean =>
  reservationEnLigne(slug, env) && typesEnLigne(env).has(String(typeId).trim().toLowerCase())
const DATE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/
const TEL = /^\+?[0-9 ().-]{6,24}$/
const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/

export const CORPS_MAX = 4000

export type Demande = {
  typeId: string
  checkIn: string
  checkOut: string
  adults: number
  prenom: string
  nom: string
  email: string
  telephone: string
  arrivee?: string
}

const texte = (v: unknown, max: number): string | null => (typeof v === 'string' && v.trim().length >= 1 && v.trim().length <= max ? v.trim() : null)

/** La demande du navigateur, ou `null` si une valeur manque ou est hors forme (rien n'est « réparé » en silence). */
export function lireDemande(brut: string): Demande | null {
  if (brut.length > CORPS_MAX) return null
  let j: unknown
  try {
    j = JSON.parse(brut)
  } catch {
    return null
  }
  if (!j || typeof j !== 'object' || Array.isArray(j)) return null
  const o = j as Record<string, unknown>
  const typeId = texte(o.typeId, 49)
  const checkIn = texte(o.checkIn, 10)
  const checkOut = texte(o.checkOut, 10)
  const prenom = texte(o.prenom, 60)
  const nom = texte(o.nom, 60)
  const email = texte(o.email, 254)
  const telephone = texte(o.telephone, 24)
  const adults = typeof o.adults === 'number' ? o.adults : Number(o.adults)
  if (!typeId || !ID.test(typeId) || !checkIn || !DATE.test(checkIn) || !checkOut || !DATE.test(checkOut)) return null
  if (!prenom || !nom || !email || !EMAIL.test(email) || !telephone || !TEL.test(telephone)) return null
  if (!Number.isInteger(adults) || adults < 1 || adults > 20) return null
  const arrivee = o.arrivee === undefined || o.arrivee === '' ? undefined : texte(o.arrivee, 5)
  if (arrivee !== undefined && (arrivee === null || !HEURE.test(arrivee))) return null
  return { typeId, checkIn, checkOut, adults, prenom, nom, email, telephone, ...(arrivee ? { arrivee } : {}) }
}

export type Detail = { baseNights: number; basePrice: number; weekendNights: number; weekendPrice: number; subtotal: number; serviceFee: number; tax: number; total: number }

/** Le corps de `POST /api/v1/guest/reservations` : le prix est celui que le SERVEUR vient de relire, jamais un montant du navigateur. */
export function corpsReservation(d: Demande, ids: { listingId: string; roomTypeId?: string }, detail: Detail, slug: string, retourBase: string) {
  return {
    listingId: ids.listingId,
    ...(ids.roomTypeId ? { roomTypeId: ids.roomTypeId } : {}),
    checkIn: d.checkIn,
    checkOut: d.checkOut,
    guests: { adults: d.adults, children: 0, infants: 0 },
    traveler: { firstName: d.prenom, lastName: d.nom, email: d.email, phone: d.telephone, ...(d.arrivee ? { arrivalTime: d.arrivee } : {}) },
    pricing: detail,
    payment: { method: 'card' as const, returnBaseUrl: retourBase, payMode: 'full' as const },
    source: 'direct-booking',
    bookingChannel: 'directBooking' as const,
    marqueBlanche: { siteSlug: slug },
  }
}

/**
 * Les refus que la page sait dire. Les codes de srv-reservations sont ramenés à quelques messages :
 *  - prix : PRICE_CHANGED, NIGHTS_WITHOUT_PRICE → `PRIX_CHANGE` (rechargez, le prix a changé) ;
 *  - dates : DATES_NOT_AVAILABLE, LISTING_UNAVAILABLE, RESERVATION_ALREADY_EXISTS, INDISPONIBLE → `INDISPONIBLE` ;
 *  - une demande déjà en attente de paiement : UNPAID_RESERVATION_EXISTS ; vente fermée : MOTEUR_FERME ; prix indisponible : PRICING_UNAVAILABLE.
 */
export const ERREURS = ['MOTEUR_FERME', 'UNPAID_RESERVATION_EXISTS', 'PRIX_CHANGE', 'INDISPONIBLE', 'PRICING_UNAVAILABLE'] as const
export type CodeErreur = (typeof ERREURS)[number] | 'VALIDATION' | 'TROP_DE_DEMANDES' | 'autre'
const RAMENE: Record<string, CodeErreur> = {
  PRICE_CHANGED: 'PRIX_CHANGE',
  NIGHTS_WITHOUT_PRICE: 'PRIX_CHANGE',
  DATES_NOT_AVAILABLE: 'INDISPONIBLE',
  LISTING_UNAVAILABLE: 'INDISPONIBLE',
  RESERVATION_ALREADY_EXISTS: 'INDISPONIBLE',
}
export function codeDit(c: unknown): CodeErreur {
  const v = typeof c === 'string' ? (RAMENE[c] ?? c) : ''
  return (ERREURS as readonly string[]).includes(v) ? (v as CodeErreur) : 'autre'
}

/** Hôtes où mène un lien de paiement : nos pages (sojori.com et sous-domaines) et la passerelle de la banque (cmi.co.ma). Jamais un autre hôte. */
export function hotePaiementOk(u: unknown): u is string {
  if (typeof u !== 'string' || u.length > 2000) return false
  try {
    const url = new URL(u)
    if (url.protocol !== 'https:' || url.username || url.password) return false
    const h = url.hostname.toLowerCase()
    return h === 'sojori.com' || h.endsWith('.sojori.com') || h === 'cmi.co.ma' || h.endsWith('.cmi.co.ma')
  } catch {
    return false
  }
}

export type Resultat = { ok: true; paymentUrl: string; reservationNumber: string } | { ok: false; statut: number; code: CodeErreur }

/** Un lien de paiement n'est suivi que s'il est en https ET sur un hôte attendu (`hotePaiementOk`). */
export const lienOuvrable = hotePaiementOk

/** Crée la réservation chez srv-reservations. Tout échec est un refus net (aucune réservation devinée), sans détail technique. */
export async function creer(corps: ReturnType<typeof corpsReservation>, base: string, fetchImpl: typeof fetch = fetch): Promise<Resultat> {
  let r: Response
  try {
    r = await fetchImpl(`${base.replace(/\/$/, '')}/api/v1/guest/reservations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(corps),
      signal: AbortSignal.timeout(45_000),
    })
  } catch {
    return { ok: false, statut: 502, code: 'autre' }
  }
  const j = (await r.json().catch(() => null)) as { success?: boolean; code?: string; data?: { paymentUrl?: unknown; reservationNumber?: unknown } } | null
  if (r.ok && j?.success && lienOuvrable(j.data?.paymentUrl) && typeof j.data?.reservationNumber === 'string') {
    return { ok: true, paymentUrl: j.data.paymentUrl, reservationNumber: j.data.reservationNumber }
  }
  const code = r.ok ? 'autre' : codeDit(j?.code)
  const statut = code === 'MOTEUR_FERME' ? 403 : code === 'PRICING_UNAVAILABLE' ? 503 : code === 'autre' ? 502 : 409
  return { ok: false, statut, code }
}

/** Le mode du moteur pour UN type : brouillon = `demo`, site publié ET type nommés (listes serveur) = `ligne`, sinon `ferme` (WhatsApp). */
export function choisirMode(apercu: boolean, slug: string, typeId: string, env: Record<string, string | undefined> = process.env): 'demo' | 'ferme' | 'ligne' {
  if (apercu) return 'demo'
  return slug && typeEnLigne(slug, typeId, env) ? 'ligne' : 'ferme'
}

type Sejour = { arrivee: string; depart: string; voyageurs: number; nuits: number }
export type Deps = {
  env: Record<string, string | undefined>
  limite: (ip: string) => boolean
  sejour: (q: { checkIn?: string; checkOut?: string; adults?: string }) => Sejour | null
  ids: (id: string) => { listingId: string; roomTypeId?: string } | null
  type: (slug: string, id: string, sejour: Sejour, ip: string) => Promise<{ etat?: string; devis?: { detail?: Detail } } | null>
  creer: (corps: ReturnType<typeof corpsReservation>) => Promise<Resultat>
}
export type Reponse = { statut: number; corps: Record<string, unknown> }

/** Toute la décision de la route, sans réseau direct (les lectures et la création sont injectées : testable). */
export async function traiter(e: { slug: string; brut: string; ip: string; hote: string }, d: Deps): Promise<Reponse> {
  if (!/^[a-z0-9-]{3,40}$/.test(e.slug) || !reservationEnLigne(e.slug, d.env)) return { statut: 404, corps: { success: false } }
  if (d.limite(e.ip)) return { statut: 429, corps: { success: false, code: 'TROP_DE_DEMANDES' } }
  if (e.brut.length > CORPS_MAX) return { statut: 413, corps: { success: false, code: 'VALIDATION' } }
  const demande = lireDemande(e.brut)
  const sejour = demande ? d.sejour({ checkIn: demande.checkIn, checkOut: demande.checkOut, adults: String(demande.adults) }) : null
  const ids = demande ? d.ids(demande.typeId) : null
  // Un type non nommé dans `SITE_RESERVATION_LIGNE_TYPES` ne se réserve pas en ligne, même sur un site ouvert : 404, aucun appel.
  if (demande && !typeEnLigne(e.slug, demande.typeId, d.env)) return { statut: 404, corps: { success: false } }
  const hote = e.hote.trim().toLowerCase()
  if (!demande || !sejour || !ids || !/^[a-z0-9.-]{3,100}$/.test(hote)) return { statut: 400, corps: { success: false, code: 'VALIDATION' } }
  // Le type est un type de CE PM, libre pour ces dates, avec son devis relu à l'instant.
  const type = await d.type(e.slug, demande.typeId, sejour, e.ip)
  if (!type || type.etat !== 'libre' || !type.devis?.detail) return { statut: 409, corps: { success: false, code: 'INDISPONIBLE' } }
  const r = await d.creer(corpsReservation(demande, ids, type.devis.detail, e.slug, `https://${hote}`))
  if (!r.ok) return { statut: r.statut, corps: { success: false, code: r.code } }
  return { statut: 200, corps: { success: true, paymentUrl: r.paymentUrl, reservationNumber: r.reservationNumber } }
}
