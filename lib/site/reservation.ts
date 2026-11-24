/**
 * Réserver une chambre EN LIGNE depuis le site d'un PM (moteur de réservation), paiement par carte.
 *
 * Le navigateur ne décide ni du prix ni du compte de paiement : il dit « ce type, ces dates, ces voyageurs, qui je suis ». Le serveur du
 * site RELIT le devis chez srv-listing (`evaluerType`), puis crée la réservation chez srv-reservations avec `payment.method = 'card'` :
 * srv-reservations re-vérifie le prix, applique la garde marque blanche par PROPRIÉTAIRE (`MOTEUR_BLANC_OWNER_IDS`) et choisit le compte
 * CMI du propriétaire. Aucune donnée de carte ne passe ici : le voyageur la saisit sur la page hébergée de CMI.
 *
 * ÉTEINT par défaut : un site n'accepte la réservation en ligne que si son identifiant (slug) est dans `SITE_RESERVATION_LIGNE_SLUGS`
 * (liste séparée par des virgules, lue côté serveur). Éteint = le moteur reste « WhatsApp » et la route répond 404.
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

/** Les refus que la page sait dire (codes stables de srv-reservations), sinon le message générique. */
export const ERREURS = ['MOTEUR_FERME', 'UNPAID_RESERVATION_EXISTS', 'DEVIS_PERIME', 'INDISPONIBLE'] as const
export type CodeErreur = (typeof ERREURS)[number] | 'autre'

export type Resultat = { ok: true; paymentUrl: string; reservationNumber: string } | { ok: false; statut: number; code: CodeErreur }

/** Un lien de paiement n'est suivi que s'il est en https (jamais un `javascript:` ni un schéma imprévu). */
export function lienOuvrable(u: unknown): u is string {
  if (typeof u !== 'string' || u.length > 2000) return false
  try {
    return new URL(u).protocol === 'https:'
  } catch {
    return false
  }
}

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
  const code = (ERREURS as readonly string[]).includes(j?.code ?? '') ? (j?.code as CodeErreur) : 'autre'
  return { ok: false, statut: r.ok ? 502 : r.status === 403 || r.status === 409 ? r.status : 502, code }
}
