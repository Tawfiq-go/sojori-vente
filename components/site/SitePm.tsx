/**
 * Le site d'un PM composé par l'agent Site web : le cadre (en-tête, pied, WhatsApp — `CadreSite`) et les
 * sections de la page. Rendu serveur, enfermé dans `.site-pm` : les couleurs et polices du thème ne
 * débordent pas sur le reste de sojori-vente (pages logement, réservation).
 */
import type { Langue, Page, SitePublic } from '@/lib/site/types'
import { AssistantSite } from './AssistantSite'
import { CadreSite } from './Chrome'
import { Sections } from './Sections'

/** Le jeton de l'aperçu, lu dans le préfixe de ses liens (`/site-apercu/<jeton>/<slug>`). */
const jetonDe = (base: string) => decodeURIComponent(base.split('/')[2] ?? '')

export function SitePm({
  site,
  slug,
  base,
  langue,
  page,
}: {
  site: SitePublic
  slug: string
  base: string
  langue: Langue
  page: Page
}) {
  const { defaut } = site.spec.langues
  const ctx = { site, slug, base, langue, defaut }
  return (
    <CadreSite
      site={site}
      base={base}
      langue={langue}
      chemin={page.chemin}
      pageId={page.id}
      apres={
        site.spec.identite.assistant ? (
          <AssistantSite
            cible={site.apercu ? { jeton: jetonDe(base) } : { slug }}
            langue={langue}
            whatsapp={site.contact?.whatsapp}
            suffixe={base ? `?pm=${encodeURIComponent(slug)}` : ''}
          />
        ) : undefined
      }
    >
      <Sections sections={page.sections} ctx={ctx} />
    </CadreSite>
  )
}
