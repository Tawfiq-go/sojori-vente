/**
 * Les liens du site en icônes (Tawfiq, 28/10/2026 : « lien LinkedIn, lien WhatsApp, lien Insta »),
 * et le bouton WhatsApp flottant au numéro du compte du PM. Dessins simples, au trait de la
 * couleur du texte : ils prennent le thème du site.
 */
import { mot } from '@/lib/site/texte'
import type { Langue } from '@/lib/site/types'

const NOMS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
}

const BULLE_WHATSAPP =
  'M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Zm-3.1 5.2c.2 0 .4 0 .6.5l.8 1.8c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5a7 7 0 0 0 3.3 2.9c.2.1.4.1.5-.1l.7-.8c.2-.2.4-.2.6-.1l1.8.8c.3.1.4.3.3.6-.1 1-1 1.8-2 1.8-3.4-.1-7.2-3.6-7.3-7 0-1 .7-1.9 1.3-2.1Z'

function Icone({ type }: { type: string }) {
  const trait = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  switch (type) {
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" {...trait} />
          <circle cx="12" cy="12" r="4" {...trait} />
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
        </svg>
      )
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M14.5 21v-7.5H17l.5-3h-3V8.7c0-.9.3-1.5 1.6-1.5H17.6V4.6A20 20 0 0 0 15.4 4.5c-2.2 0-3.9 1.4-3.9 3.9v2.1H9v3h2.5V21" {...trait} />
        </svg>
      )
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="3.5" y="3.5" width="17" height="17" rx="3" {...trait} />
          <path d="M8 10.5V16M8 7.8v.1M11.5 16v-5.5M11.5 13c0-1.6 1-2.6 2.3-2.6s2.2.9 2.2 2.6V16" {...trait} />
        </svg>
      )
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" {...trait} />
          <path d="M10.3 9.4v5.2l4.5-2.6-4.5-2.6Z" fill="currentColor" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.4 2.4 2 4 4.5 4.3" {...trait} />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d={BULLE_WHATSAPP} fill="currentColor" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" {...trait} />
        </svg>
      )
  }
}

export function Reseaux({ reseaux }: { reseaux: Array<{ type: string; url: string }> }) {
  if (!reseaux.length) return null
  return (
    <div className="reseaux">
      {reseaux.map((r) => (
        <a
          key={r.type}
          className="reseaux__lien"
          data-reseau={r.type}
          href={r.url}
          target="_blank"
          rel="noopener nofollow"
          aria-label={NOMS[r.type] ?? r.type}
          title={NOMS[r.type] ?? r.type}
        >
          <Icone type={r.type} />
        </a>
      ))}
    </div>
  )
}

/** Le bouton WhatsApp flottant : le numéro du compte du PM (celui du bloc contact). */
export function WhatsappFlottant({ numero, langue }: { numero: string; langue: Langue }) {
  return (
    <a
      className="whatsapp-flottant"
      href={`https://wa.me/${numero}?text=${encodeURIComponent(mot('bonjourWhatsapp', langue))}`}
      target="_blank"
      rel="noopener nofollow"
      aria-label={mot('ecrireWhatsapp', langue)}
      title={mot('ecrireWhatsapp', langue)}
    >
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d={BULLE_WHATSAPP} fill="currentColor" />
      </svg>
    </a>
  )
}
