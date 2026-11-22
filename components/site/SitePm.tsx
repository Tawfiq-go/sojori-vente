/**
 * Le site d'un PM composé par l'agent Site web : le cadre (en-tête, pied, WhatsApp — `CadreSite`) et les
 * sections de la page. Rendu serveur, enfermé dans `.site-pm` : les couleurs et polices du thème ne
 * débordent pas sur le reste de sojori-vente (pages logement, réservation).
 */
import { pageAvecChampsDynamiques } from '@/lib/site/offreDonnees'
import { offreTerminee, themeDeLaPage } from '@/lib/site/offre'
import type { Langue, Page, SitePublic } from '@/lib/site/types'
import { AssistantSite } from './AssistantSite'
import { CadreSite } from './Chrome'
import { Sections } from './Sections'

/** Le jeton de l'aperçu, lu dans le préfixe de ses liens (`/site-apercu/<jeton>/<slug>`). */
const jetonDe = (base: string) => decodeURIComponent(base.split('/')[2] ?? '')

export async function SitePm({
  site,
  slug,
  base,
  langue,
  page: pageBrute,
  sourceLogements,
}: {
  site: SitePublic
  slug: string
  base: string
  langue: Langue
  page: Page
  /** Aperçu : le propriétaire que le jeton autorise quand l'adresse n'est pas le slug du PM (lecture des tarifs). */
  sourceLogements?: string
}) {
  const { defaut } = site.spec.langues
  // Champs dynamiques d'une landing (prix, remise, nuits, disponibilité) : vrais tarifs lus à chaque rendu, aperçu comme public.
  const page = await pageAvecChampsDynamiques(sourceLogements ?? slug, pageBrute, langue)
  const ctx = { site, slug, base, langue, defaut, offre: page.offre, titrePage: page.titre, pageId: page.id }
  // Une landing a son design (accent, police, style) ; le cadre le lit dans le thème : site, en-tête et pied suivent.
  const vue: SitePublic = page.offre ? { ...site, spec: { ...site.spec, theme: themeDeLaPage(site.spec.theme, page.offre) } } : site
  // Une offre terminée n'a plus d'appel vers l'offre : on garde son message de fin et le reste de la page.
  const sections = offreTerminee(page.offre, site.apercu) ? page.sections.filter((s) => !(s.niveau === 'bibliotheque' && s.type === 'appel')) : page.sections
  return (
    <CadreSite
      site={vue}
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
      <Sections sections={sections} ctx={ctx} />
    </CadreSite>
  )
}
