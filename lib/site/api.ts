/**
 * Les lectures du site d'un PM, côté serveur seulement :
 *  - la fiche publiée chez srv-site, par le slug du PM (celui que le domaine désigne), ou le
 *    brouillon sur jeton d'aperçu ;
 *  - les logements du PM, dans la liste publique de srv-listing (`?pm=<slug>`).
 *
 * Un site publié se met en cache 60 s ; l'aperçu jamais. Une source qui ne répond pas rend
 * `null` / `[]` : sans fiche, sojori-vente affiche ce qu'il affichait avant.
 */
import { cache } from 'react'
import { getRemoteApiBaseUrl } from '@/lib/config/apiBase'
import type { Avis, Logement, SitePublic } from './types'

const SITE_API = (process.env.SITE_API_URL || 'https://api.sojori.com/api/v1/public/sites').replace(/\/+$/, '')

async function lire(chemin: string, init: RequestInit & { next?: { revalidate?: number; tags?: string[] } }) {
  try {
    const r = await fetch(`${SITE_API}/${chemin}`, { ...init, signal: AbortSignal.timeout(4000) })
    if (!r.ok) return null
    const corps = (await r.json()) as { success?: boolean; data?: SitePublic }
    return corps.success && corps.data ? corps.data : null
  } catch {
    return null
  }
}

export const lireSitePm = cache((slug: string) =>
  lire(`pm/${encodeURIComponent(slug)}`, { next: { revalidate: 60, tags: [`site-pm:${slug}`] } }),
)

export const lireApercu = cache((jeton: string) => lire(`apercu/${encodeURIComponent(jeton)}`, { cache: 'no-store' }))

/** srv-listing rend 0 quand il n'a pas de coordonnées : un tel logement n'a pas de place sur la carte. */
function coordonnees(lat: unknown, lng: unknown): { lat?: number; lng?: number } {
  const a = typeof lat === 'number' ? lat : Number(lat)
  const o = typeof lng === 'number' ? lng : Number(lng)
  return Number.isFinite(a) && Number.isFinite(o) && (a !== 0 || o !== 0) ? { lat: a, lng: o } : {}
}

const liste = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

export const lireLogements = cache(async (slug: string): Promise<Logement[]> => {
  try {
    const r = await fetch(`${getRemoteApiBaseUrl()}/api/v1/listing/public/listings?pm=${encodeURIComponent(slug)}&limit=50`, {
      next: { revalidate: 300, tags: [`logements:${slug}`] },
      signal: AbortSignal.timeout(6000),
    })
    if (!r.ok) return []
    const corps = (await r.json()) as { data?: Array<Record<string, unknown>> }
    return (corps.data ?? []).map((l) => ({
      id: String(l.id ?? l._id ?? ''),
      title: String(l.title ?? ''),
      city: typeof l.city === 'string' ? l.city : undefined,
      pricePerNight: typeof l.pricePerNight === 'number' ? l.pricePerNight : undefined,
      currency: typeof l.currency === 'string' ? l.currency : 'MAD',
      maxGuests: typeof l.maxGuests === 'number' ? l.maxGuests : undefined,
      bedrooms: typeof l.bedrooms === 'number' ? l.bedrooms : undefined,
      images: liste(l.images),
      ...coordonnees(l.lat, l.lng),
      ...(typeof l.rating === 'number' ? { rating: l.rating } : {}),
      ...(typeof l.reviewCount === 'number' ? { reviewCount: l.reviewCount } : {}),
    }))
  } catch {
    return []
  }
})

/** Les logements dont on lit les avis : quelques appels, jamais un par logement du parc. */
const LOGEMENTS_LUS_POUR_AVIS = 5
/** Sur la vitrine du PM, seulement les bons avis (4/5 et plus). */
const NOTE_MINIMALE = 4

/**
 * Un avis écrit PAR l'hôte sur son voyageur (Airbnb : `"Creator":"host"`) n'a rien à faire sur le site :
 * la route le rend avec les autres (recette du 27/10/2026).
 */
const ecritParLHote = (texte: string) => /"Creator"\s*:\s*"host"/i.test(texte)

/**
 * Le commentaire écrit du voyageur, tel qu'on peut le montrer, ou `null`. La route rend le corps brut
 * des messages d'avis (recette du 27/10/2026) :
 *  - Booking : « Summary : … I liked : … I did not like : … » → le résumé et ce qu'il a aimé ;
 *    la note chiffrée qui suit (« … rated their stay as follows: … ») est coupée ; seule, rien ;
 *  - Airbnb : `{"Creator":"guest","Category <texte>","Mode":"review"}` → le texte.
 */
export function texteAvis(brut: string): string | null {
  // La note chiffrée de Booking (« SONIA rated their stay as follows: 50 Location : 7.50 … ») suit le
  // commentaire : on la coupe, avec le nom qui la précède. Une note sans commentaire ne laisse rien.
  let t = brut
    .replace(/You may respond to this review[\s\S]*$/i, '')
    .replace(/\s*[^\s.!?]+(?:\s+[^\s.!?]+)?\s+rated their stay as follows:[\s\S]*$/i, '')
    .trim()
  const airbnb = /"Category\s+([\s\S]*?)"\s*,\s*"Mode"/.exec(t)
  if (airbnb) t = airbnb[1]
  const resume = /Summary\s*:\s*([\s\S]*?)(?=\s*I liked\s*:|\s*I did not like\s*:|$)/i.exec(t)?.[1]?.trim()
  const aime = /I liked\s*:\s*([\s\S]*?)(?=\s*I did not like\s*:|$)/i.exec(t)?.[1]?.trim()
  if (resume || aime) t = [resume, aime].filter(Boolean).join(' — ')
  t = t.replace(/\s+/g, ' ').trim()
  return t.length >= 15 ? t : null
}

/**
 * Les avis du PM : ceux de ses premiers logements (route publique des avis par logement, données
 * personnelles déjà retirées), notés 4/5 et plus, avec un texte, les plus récents d'abord. Prénom seul.
 * Le `reviewCount` de la liste vaut 0 même quand des avis existent : on ne s'y fie pas.
 */
export const lireAvis = cache(async (slug: string, nombre: number): Promise<Avis[]> => {
  const logements = (await lireLogements(slug)).slice(0, LOGEMENTS_LUS_POUR_AVIS)
  const lots = await Promise.all(
    logements.map(async (l) => {
      try {
        const r = await fetch(`${getRemoteApiBaseUrl()}/api/v1/guest/listings/${encodeURIComponent(l.id)}/reviews?limit=${Math.min(30, nombre * 3)}`, {
          next: { revalidate: 3600, tags: [`avis:${slug}`] },
          signal: AbortSignal.timeout(6000),
        })
        if (!r.ok) return []
        const corps = (await r.json()) as { data?: Array<Record<string, unknown>> }
        return (corps.data ?? []).map((a) => ({
          id: String(a.id ?? ''),
          prenom: String(a.guestName ?? '').trim().split(/\s+/)[0] ?? '',
          note: typeof a.rating === 'number' ? a.rating : null,
          brut: String(a.reviewText ?? ''),
          plateforme: typeof a.platform === 'string' ? a.platform : undefined,
          date: typeof a.date === 'string' ? a.date : undefined,
          logement: l.title,
        }))
      } catch {
        return []
      }
    }),
  )
  return lots
    .flat()
    .filter((a) => a.id && !ecritParLHote(a.brut) && (a.note ?? 0) >= NOTE_MINIMALE)
    .map(({ brut, ...a }) => ({ ...a, texte: texteAvis(brut) ?? '' }))
    .filter((a) => a.texte)
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
    .slice(0, nombre)
})
