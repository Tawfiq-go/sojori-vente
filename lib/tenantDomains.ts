/**
 * Domaines clients direct booking → slug PM (marque blanche).
 * Le middleware lit le Host et pose le cookie `pm_tenant` ; tout le
 * mécanisme tenant côté client (hero, catalogue scopé, footer, thème)
 * le lit en priorité. Pilote : mapping statique — passera en config
 * (pmProfile.directBooking.domain) quand il y aura plusieurs clients.
 */
export const TENANT_COOKIE = 'pm_tenant'

export const TENANT_DOMAINS: Record<string, string> = {
  'siyahai.com': 'sojori-collection',
  'www.siyahai.com': 'sojori-collection',
}

export function resolveTenantFromHost(host: string | null | undefined): string | null {
  if (!host) return null
  const clean = host.toLowerCase().split(':')[0]
  return TENANT_DOMAINS[clean] ?? null
}

/** Côté navigateur : slug tenant imposé par le domaine (cookie du middleware). */
export function readTenantCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)pm_tenant=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}
