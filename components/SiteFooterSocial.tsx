'use client'

/**
 * Réseaux sociaux du footer — pilotés par la config direct booking du PM
 * (pmProfile.directBooking.social, exposée par /public/property-managers/:slug).
 * Tenant actif : ?pm=<slug> (persisté, comme ?theme=) — demain le middleware
 * multi-tenant fournira le slug par domaine. Sans tenant : réseaux Sojori.
 */
import { useEffect, useState } from 'react'
import { getTenantSlug } from '@/lib/tenantPreview'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.sojori.com'

const SOJORI_SOCIAL: Record<string, string> = {
  instagram: 'https://instagram.com/sojoriapp',
  linkedin: 'https://www.linkedin.com/company/108488739',
}

const NETWORKS: Array<{ key: string; label: string; icon: string }> = [
  { key: 'instagram', label: 'Instagram', icon: '📷' },
  { key: 'facebook', label: 'Facebook', icon: '📘' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵' },
  { key: 'youtube', label: 'YouTube', icon: '📺' },
  { key: 'website', label: 'Site web', icon: '🌐' },
]

export default function SiteFooterSocial() {
  const [links, setLinks] = useState<Record<string, string>>(SOJORI_SOCIAL)

  useEffect(() => {
    try {
      const slug = getTenantSlug()
      if (!slug) return

      void fetch(`${API_BASE}/api/v1/listing/public/property-managers/${encodeURIComponent(slug)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const social = d?.data?.propertyManager?.directBooking?.social as
            | Record<string, string>
            | undefined
          if (!social) return
          const filled = Object.fromEntries(
            Object.entries(social).filter(([, v]) => String(v || '').trim() !== ''),
          )
          if (Object.keys(filled).length > 0) setLinks(filled)
        })
        .catch(() => {})
    } catch {
      // best-effort
    }
  }, [])

  const entries = NETWORKS.filter((n) => links[n.key])
  if (entries.length === 0) return null

  return (
    <div className="footer-social">
      {entries.map((n) => (
        <a
          key={n.key}
          className="fs-ic"
          href={links[n.key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={n.label}
          title={n.label}
        >
          {n.icon}
        </a>
      ))}
    </div>
  )
}
