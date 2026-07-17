/**
 * Domaines clients direct booking → slug PM (marque blanche).
 * Le middleware lit le Host et pose le cookie `pm_tenant` ; tout le
 * mécanisme tenant côté client (hero, catalogue scopé, footer, thème)
 * le lit en priorité. Résolution DYNAMIQUE via l'API (le domaine saisi
 * dans la config direct booking suffit — aucun déploiement par client),
 * avec cache mémoire 5 min et la map statique en fallback réseau.
 */
export const TENANT_COOKIE = 'pm_tenant'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.sojori.com'

/** Fallback si l'API est injoignable — les domaines pilotes connus. */
export const TENANT_DOMAINS: Record<string, string> = {
  'siyahai.com': 'sojori-collection',
  'www.siyahai.com': 'sojori-collection',
}

/** Hôtes qui ne sont JAMAIS des tenants — sojori.com reste la marketplace. */
const OWN_HOSTS = /(^|\.)sojori\.com$|\.vercel\.app$|^localhost$|^127\.0\.0\.1$/

type CacheEntry = { slug: string | null; at: number }
const CACHE_MS = 5 * 60 * 1000
const domainCache = new Map<string, CacheEntry>()

export async function resolveTenantFromHost(
  host: string | null | undefined,
): Promise<string | null> {
  if (!host) return null
  const clean = host.toLowerCase().split(':')[0]
  if (OWN_HOSTS.test(clean)) return null

  const cached = domainCache.get(clean)
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.slug

  let slug: string | null = null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(
      `${API_BASE}/api/v1/listing/public/property-managers/by-domain/${encodeURIComponent(clean)}`,
      { signal: controller.signal },
    )
    clearTimeout(timer)
    if (res.ok) {
      const body = (await res.json()) as { data?: { slug?: string } }
      slug = String(body?.data?.slug || '').trim() || null
    } else if (res.status === 404) {
      slug = null
    } else {
      slug = TENANT_DOMAINS[clean] ?? null
    }
  } catch {
    slug = TENANT_DOMAINS[clean] ?? null
  }

  domainCache.set(clean, { slug, at: Date.now() })
  return slug
}

/** Côté navigateur : slug tenant imposé par le domaine (cookie du middleware). */
export function readTenantCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)pm_tenant=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}
