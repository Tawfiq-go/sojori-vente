/**
 * Le moteur de réservation DU site d'un PM, côté serveur : pour un séjour (dates + voyageurs), ce que
 * CE propriétaire propose — une ligne par type de chambre / villa, avec sa disponibilité et le prix du séjour.
 *
 * Isolation : chaque appel à srv-listing porte `?pm=<slug>` (srv-listing refuse — 404 — un logement d'un autre
 * propriétaire) et le périmètre part de la liste publique filtrée du PM (`lireLogements`). Un identifiant
 * venu du navigateur n'est jamais servi s'il ne figure pas dans cette liste. Aucun secret, aucune écriture.
 */
import { cache } from 'react'
import { getRemoteApiBaseUrl } from '@/lib/config/apiBase'
import { lireLogements } from './api'
import type { Logement } from './types'

/** Un séjour demandé, déjà validé. */
export type Sejour = { arrivee: string; depart: string; voyageurs: number; nuits: number }

/** Pourquoi un type n'est pas proposé pour ce séjour. */
export type Etat = 'libre' | 'indisponible' | 'capacite' | 'duree' | 'prix' | 'erreur'

export type Devis = {
  nuits: number
  /** Le séjour hors taxes et frais. */
  sousTotal: number
  /** Taxes et frais (service + taxe de séjour), tels que srv-listing les calcule. */
  taxesEtFrais: number
  total: number
  devise: string
  /** Prix moyen d'une nuit (sous-total / nuits). */
  parNuit: number
}

export type TypeChambre = {
  id: string
  /** Le nom du type, sans le nom de l'établissement (« Villa signature »). */
  nom: string
  /** L'établissement quand le titre le porte (« NOMMOS Beach RESORT & POOL CLUB »). */
  etablissement?: string
  description?: string
  images: string[]
  equipements: string[]
  voyageurs?: number
  chambres?: number
  sallesDeBain?: number
  prixNuit?: number
  devise: string
  /** Absent tant que les dates ne sont pas données. */
  etat?: Etat
  devis?: Devis
  /** Le texte de l'erreur quand srv-listing refuse le séjour (séjour minimal, par exemple). */
  motif?: string
}

const ID = /^[A-Za-z0-9:_-]{8,80}$/
const AAAA_MM_JJ = /^\d{4}-\d{2}-\d{2}$/
const JOUR = 86_400_000

/** Aujourd'hui (UTC), AAAA-MM-JJ. */
export const aujourdhui = () => new Date().toISOString().slice(0, 10)

/**
 * Le séjour que le navigateur demande, ou `null` s'il est incomplet ou absurde (dates passées, départ avant
 * l'arrivée, plus de 60 nuits, voyageurs hors 1–20). Rien n'est supposé : sans séjour valide, pas de prix.
 */
export function lireSejour(q: { checkIn?: string; checkOut?: string; adults?: string }): Sejour | null {
  const { checkIn, checkOut } = q
  if (!checkIn || !checkOut || !AAAA_MM_JJ.test(checkIn) || !AAAA_MM_JJ.test(checkOut)) return null
  const a = Date.parse(`${checkIn}T00:00:00Z`)
  const d = Date.parse(`${checkOut}T00:00:00Z`)
  if (!Number.isFinite(a) || !Number.isFinite(d)) return null
  const nuits = Math.round((d - a) / JOUR)
  if (nuits < 1 || nuits > 60 || checkIn < aujourdhui()) return null
  const voyageurs = Math.round(Number(q.adults ?? 2))
  if (!Number.isFinite(voyageurs) || voyageurs < 1 || voyageurs > 20) return null
  return { arrivee: checkIn, depart: checkOut, voyageurs, nuits }
}

/** Sépare le nom du type de celui de l'établissement : « Hôtel — Villa 15 » → « Villa 15 ». */
function titres(titre: string): { nom: string; etablissement?: string } {
  const i = titre.search(/\s[—–-]\s/)
  if (i < 1) return { nom: titre }
  const reste = titre.slice(i).replace(/^\s[—–-]\s/, '').trim()
  return reste ? { nom: reste, etablissement: titre.slice(0, i).trim() } : { nom: titre }
}

const nombre = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)

type Corps = { success?: boolean; error?: string; data?: Record<string, unknown> }

async function lire(chemin: string, slug: string, requete: Record<string, string>): Promise<{ statut: number; corps: Corps | null }> {
  const qs = new URLSearchParams({ ...requete, pm: slug })
  try {
    const r = await fetch(`${getRemoteApiBaseUrl()}/api/v1/listing/public/listings/${chemin}?${qs}`, {
      // Une disponibilité ou un prix ne se garde que quelques secondes : la page se recalcule à chaque séjour.
      next: { revalidate: 20, tags: [`logements:${slug}`] },
      signal: AbortSignal.timeout(7000),
    })
    return { statut: r.status, corps: (await r.json().catch(() => null)) as Corps | null }
  } catch {
    return { statut: 0, corps: null }
  }
}

/** `<listingId>:<roomTypeId>` (multi-unités) ou un listingId seul. */
export function decomposerId(id: string): { listingId: string; roomTypeId?: string } | null {
  if (!ID.test(id)) return null
  const [listingId, roomTypeId] = id.split(':')
  return listingId ? { listingId, ...(roomTypeId ? { roomTypeId } : {}) } : null
}

/** Une nuit de [arrivée, départ[ est-elle bloquée ? (la veille du départ est la dernière nuit) */
function nuitBloquee(bloquees: unknown, sejour: Sejour): boolean {
  if (!Array.isArray(bloquees)) return false
  return bloquees.some((j) => typeof j === 'string' && j >= sejour.arrivee && j < sejour.depart)
}

/** Disponibilité et prix d'UN type pour un séjour. Jamais d'exception : un échec devient `etat: 'erreur'`. */
export async function evaluerType(slug: string, id: string, sejour: Sejour, maxVoyageurs?: number): Promise<Pick<TypeChambre, 'etat' | 'devis' | 'motif'>> {
  const ids = decomposerId(id)
  if (!ids) return { etat: 'erreur' }
  if (maxVoyageurs !== undefined && maxVoyageurs > 0 && sejour.voyageurs > maxVoyageurs) return { etat: 'capacite' }
  const unite = ids.roomTypeId ? { roomTypeId: ids.roomTypeId } : {}
  const [dispo, prix] = await Promise.all([
    lire(`${encodeURIComponent(ids.listingId)}/availability`, slug, { from: sejour.arrivee, to: sejour.depart, ...unite }),
    lire(`${encodeURIComponent(ids.listingId)}/pricing`, slug, {
      checkIn: sejour.arrivee,
      checkOut: sejour.depart,
      guests: String(sejour.voyageurs),
      ...unite,
    }),
  ])
  if (dispo.statut === 404 || prix.statut === 404) return { etat: 'erreur' }
  if (prix.statut === 400) return { etat: 'duree', motif: typeof prix.corps?.error === 'string' ? prix.corps.error : undefined }
  if (!dispo.corps?.success || !prix.corps?.success || !prix.corps.data) return { etat: 'erreur' }
  // La disponibilité d'abord : un séjour bloqué n'a pas à montrer de prix.
  if (nuitBloquee(dispo.corps.data?.blockedDates, sejour)) return { etat: 'indisponible' }
  const d = prix.corps.data
  const sousTotal = nombre(d.subtotal)
  const total = nombre(d.total)
  const frais = nombre(d.serviceFee)
  const taxe = nombre(d.tax)
  const nuits = nombre(d.nuits ?? d.nights)
  const pricees = (nombre(d.baseNights) ?? 0) + (nombre(d.weekendNights) ?? 0)
  // Une nuit sans prix sous-évaluerait le total : on ne propose pas ce séjour (comme srv-reservations le refuserait).
  if (sousTotal === undefined || total === undefined || !(total > 0) || nuits !== sejour.nuits || pricees !== sejour.nuits) return { etat: 'prix' }
  return {
    etat: 'libre',
    devis: {
      nuits: sejour.nuits,
      sousTotal,
      taxesEtFrais: (frais ?? 0) + (taxe ?? 0),
      total,
      devise: typeof d.currency === 'string' ? d.currency : 'MAD',
      parNuit: Math.round(sousTotal / sejour.nuits),
    },
  }
}

function enType(l: Logement): TypeChambre {
  const { nom, etablissement } = titres(l.title)
  return {
    id: l.id,
    nom,
    ...(etablissement ? { etablissement } : {}),
    ...(l.description ? { description: l.description } : {}),
    images: (l.images ?? []).filter((u) => typeof u === 'string' && u.startsWith('https://')),
    equipements: l.amenities ?? [],
    voyageurs: l.maxGuests,
    chambres: l.bedrooms,
    sallesDeBain: l.bathrooms,
    prixNuit: l.pricePerNight && l.pricePerNight > 0 ? l.pricePerNight : undefined,
    devise: l.currency ?? 'MAD',
  }
}

/**
 * Les types de chambre de CE PM pour un séjour. Sans séjour valide : la liste seule (« à partir de »).
 * Les types disponibles passent d'abord, puis les autres ; l'ordre de la fiche est gardé à l'intérieur.
 */
export const lireTypes = cache(async (slug: string, sejour: Sejour | null): Promise<TypeChambre[]> => {
  const logements = await lireLogements(slug)
  const types = logements.map(enType)
  if (!sejour) return types
  const evalues = await Promise.all(
    types.map(async (tp) => ({ ...tp, ...(await evaluerType(slug, tp.id, sejour, tp.voyageurs)) })),
  )
  const rang = (t: TypeChambre) => (t.etat === 'libre' ? 0 : t.etat === 'erreur' ? 2 : 1)
  return evalues.map((t, i) => ({ t, i })).sort((a, b) => rang(a.t) - rang(b.t) || a.i - b.i).map(({ t }) => t)
})

/** Un type précis de CE PM (404 propre sinon) avec le devis du séjour demandé. */
export async function lireType(slug: string, id: string, sejour: Sejour | null): Promise<TypeChambre | null> {
  const logements = await lireLogements(slug)
  const l = logements.find((x) => x.id === id)
  if (!l) return null
  const base = enType(l)
  return sejour ? { ...base, ...(await evaluerType(slug, id, sejour, base.voyageurs)) } : base
}

export function formaterPrix(montant: number, devise: string, langue: string): string {
  const nb = new Intl.NumberFormat(langue === 'ar' ? 'ar-MA' : langue === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 0 }).format(montant)
  return `${nb} ${devise}`
}
