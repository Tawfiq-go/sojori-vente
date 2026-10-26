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
import type { Logement, SitePublic } from './types'

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
    }))
  } catch {
    return []
  }
})
