/**
 * Le middleware doit savoir, pour un domaine de PM, si un chemin est une page de SON site (composé
 * par l'agent Site web) : la liste des chemins publiés, gardée 60 s en mémoire, comme la résolution
 * domaine → slug de `tenantDomains.ts`. Pas de site publié, ou srv-site injoignable : `null`, et
 * sojori-vente sert ce qu'il servait avant.
 */
import type { Langue } from './types'

const SITE_API = (process.env.SITE_API_URL || 'https://api.sojori.com/api/v1/public/sites').replace(/\/+$/, '')
const CACHE_MS = 60_000

export type PagesDuSite = { pages: string[]; langues: { defaut: Langue; actives: Langue[] } }

const cache = new Map<string, { valeur: PagesDuSite | null; at: number }>()

export async function pagesDuSite(slug: string): Promise<PagesDuSite | null> {
  const lu = cache.get(slug)
  if (lu && Date.now() - lu.at < CACHE_MS) return lu.valeur
  let valeur: PagesDuSite | null = null
  try {
    const r = await fetch(`${SITE_API}/pm/${encodeURIComponent(slug)}`, { signal: AbortSignal.timeout(2500) })
    if (r.ok) {
      const corps = (await r.json()) as {
        data?: { spec?: { pages?: Array<{ chemin: string }>; langues?: PagesDuSite['langues'] } }
      }
      const spec = corps.data?.spec
      if (spec?.pages?.length && spec.langues) valeur = { pages: spec.pages.map((p) => p.chemin), langues: spec.langues }
    }
  } catch {
    // srv-site injoignable : le site du PM reste celui d'avant, rien ne casse.
  }
  cache.set(slug, { valeur, at: Date.now() })
  return valeur
}
