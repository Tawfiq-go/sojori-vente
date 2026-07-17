'use client'

/**
 * Tenant marque blanche (mode preview) : slug PM via `?pm=` (persisté),
 * config publique via /public/property-managers/:slug (cache session 5 min).
 * Demain, le middleware multi-tenant fournira le slug par domaine — les
 * consommateurs (hero, footer, sections) resteront identiques.
 */

import { readTenantCookie } from './tenantDomains'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.sojori.com'
const SLUG_KEY = 'sojori_pm_preview'
const CACHE_KEY = 'sojori_pm_public_cache'
const CACHE_MS = 5 * 60 * 1000

export type TenantPublic = {
  slug: string
  name: string
  logoText?: string
  vitrineLogoUrl?: string
  brandColor?: { from?: string; to?: string }
  directBooking?: {
    siteName?: string
    theme?: string
    shape?: string
    heroEyebrow?: string
    heroTitle?: string
    heroSubtitle?: string
    social?: Record<string, string>
  }
}

export function getTenantSlug(): string | null {
  try {
    // Domaine client : le tenant est imposé par le middleware (non débrayable).
    const fromDomain = readTenantCookie()
    if (fromDomain) return fromDomain
    const params = new URLSearchParams(window.location.search)
    // ?fresh=1 (studio d'aperçu du dashboard) : ignorer le cache config
    if (params.has('fresh')) {
      try {
        sessionStorage.removeItem(CACHE_KEY)
      } catch {
        // best-effort
      }
    }
    const fromUrl = params.get('pm')
    if (fromUrl === 'off') {
      sessionStorage.removeItem(SLUG_KEY)
      return null
    }
    if (fromUrl) {
      sessionStorage.setItem(SLUG_KEY, fromUrl)
      return fromUrl
    }
    return sessionStorage.getItem(SLUG_KEY)
  } catch {
    return null
  }
}

export async function fetchTenantPublic(slug: string): Promise<TenantPublic | null> {
  try {
    const cachedRaw = sessionStorage.getItem(CACHE_KEY)
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw) as { slug: string; at: number; data: TenantPublic }
      if (cached.slug === slug && Date.now() - cached.at < CACHE_MS) return cached.data
    }
  } catch {
    // cache best-effort
  }
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/listing/public/property-managers/${encodeURIComponent(slug)}`,
    )
    if (!res.ok) return null
    const body = (await res.json()) as { data?: { propertyManager?: TenantPublic } }
    const pm = body?.data?.propertyManager ?? null
    if (pm) {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ slug, at: Date.now(), data: pm }))
      } catch {
        // best-effort
      }
    }
    return pm
  } catch {
    return null
  }
}
