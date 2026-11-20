/**
 * Un logement lu pour le site d'un PM : la fiche détaillée du logement, jamais sans que le logement
 * appartienne à CE propriétaire. Le contrôle est côté serveur et ne dépend d'aucun paramètre du navigateur :
 * l'identifiant doit figurer dans la liste publique du PM (`?pm=<slug>` filtré par srv-listing), puis la fiche
 * lue doit porter le même propriétaire. Sinon `null` (404 propre).
 */
import { cache } from 'react'
import { getRemoteApiBaseUrl } from '@/lib/config/apiBase'
import { lireLogements } from './api'

export type Villa = {
  id: string
  titre: string
  ville?: string
  description?: string
  prixParNuit?: number
  devise: string
  voyageurs?: number
  chambres?: number
  sallesDeBain?: number
  images: string[]
  equipements: string[]
  arrivee?: string
  depart?: string
  lat?: number
  lng?: number
  /** Paliers d'annulation lus tels quels sur la fiche (jours avant l'arrivée, % du séjour retenu). Absent = rien d'affiché. */
  annulation?: Array<{ from: number; to: number; value: number }>
}

const texte = (v: unknown) => (typeof v === 'string' ? v : undefined)
const nombre = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)

export const lireVilla = cache(async (slug: string, id: string): Promise<Villa | null> => {
  if (!/^[A-Za-z0-9:_-]{8,80}$/.test(id)) return null
  // 1) le logement est-il à CE PM ? (liste filtrée par srv-listing)
  const siens = await lireLogements(slug)
  if (!siens.some((l) => l.id === id)) return null
  try {
    const r = await fetch(`${getRemoteApiBaseUrl()}/api/v1/listing/public/listings/${encodeURIComponent(id)}`, {
      next: { revalidate: 300, tags: [`logements:${slug}`] },
      signal: AbortSignal.timeout(6000),
    })
    if (!r.ok) return null
    const l = ((await r.json()) as { data?: Record<string, unknown> }).data
    if (!l) return null
    // 2) la fiche porte le même propriétaire (jamais d'un autre PM, même avec un identifiant valide)
    const pm = (l.propertyManager ?? {}) as Record<string, unknown>
    // `slug` est un slug de PM, ou (aperçu d'un brouillon lu chez un autre propriétaire) son identifiant de 24 hex.
    const memeProprietaire = /^[0-9a-f]{24}$/i.test(slug) ? texte(l.pmId)?.toLowerCase() === slug.toLowerCase() : texte(pm.slug) === slug
    if (!memeProprietaire) return null
    const annulation = (Array.isArray(l.cancellationPolicies) ? (l.cancellationPolicies as Array<Record<string, unknown>>) : [])
      .map((r) => ({ from: Number(r?.from), to: Number(r?.to), value: Number(r?.value) }))
      .filter((r) => [r.from, r.to, r.value].every(Number.isFinite))
    const lat = nombre(l.lat)
    const lng = nombre(l.lng)
    return {
      id,
      titre: texte(l.title) ?? '',
      ville: texte(l.city),
      description: texte(l.description),
      prixParNuit: nombre(l.pricePerNight),
      devise: texte(l.currency) ?? 'MAD',
      voyageurs: nombre(l.maxGuests),
      chambres: nombre(l.bedrooms),
      sallesDeBain: nombre(l.bathrooms),
      ...(annulation.length ? { annulation } : {}),
      images: Array.isArray(l.images) ? l.images.filter((x): x is string => typeof x === 'string' && x.startsWith('https://')) : [],
      equipements: Array.isArray(l.amenities) ? l.amenities.filter((x): x is string => typeof x === 'string') : [],
      arrivee: texte(l.checkInTime),
      depart: texte(l.checkOutTime),
      ...(lat !== undefined && lng !== undefined && (lat !== 0 || lng !== 0) ? { lat, lng } : {}),
    }
  } catch {
    return null
  }
})
