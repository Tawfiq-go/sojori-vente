import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { CadreSite, CHEMIN_RESERVER } from '@/components/site/Chrome'
import { Reservation } from '@/components/site/Reservation'
import { Villa } from '@/components/site/Villa'
import { lireVilla } from '@/lib/site/logement'
import { SitePm } from '@/components/site/SitePm'
import { lireSitePm } from '@/lib/site/api'
import { lien, lireCible } from '@/lib/site/route'
import { t } from '@/lib/site/texte'

/**
 * Le site publié d'un PM, sur SON domaine : middleware.ts réécrit ici les chemins de ses pages
 * (domaine → slug → fiche publiée chez srv-site). Le reste (logements, réservation) reste à
 * sojori-vente. Spec : sojori-production/docs/patterns/agents/agent-site-web.md (lot 3).
 */
type Props = {
  params: Promise<{ slug: string; chemin?: string[] }>
  searchParams: Promise<{ checkIn?: string; checkOut?: string; adults?: string }>
}

async function charger(props: Props) {
  const { slug, chemin = [] } = await props.params
  const site = await lireSitePm(slug)
  if (!site) return null
  const cible = lireCible(chemin, site.spec.langues)
  // `/reserver` : la page de réservation du site (dates → logements de ce PM), dans son cadre.
  if (cible.chemin === CHEMIN_RESERVER || cible.chemin.startsWith(`${CHEMIN_RESERVER}/`)) return { slug, site, cible, page: null }
  const page = site.spec.pages.find((p) => p.chemin === cible.chemin)
  return page ? { slug, site, cible, page } : null
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const c = await charger(props)
  if (!c) return {}
  const { site, cible, page } = c
  const { defaut, actives } = site.spec.langues
  if (!page) return { title: site.spec.identite.nom, robots: { index: false, follow: true } }
  const hote = ((await headers()).get('host') || '').split(':')[0]
  const titre = t(page.seo?.titre, cible.langue, defaut) || t(page.titre, cible.langue, defaut)
  return {
    title: page.chemin === '' || !titre ? site.spec.identite.nom : `${titre} · ${site.spec.identite.nom}`,
    description: t(page.seo?.description, cible.langue, defaut) || undefined,
    ...(hote ? { metadataBase: new URL(`https://${hote}`) } : {}),
    alternates: {
      canonical: lien('', cible.langue, defaut, page.chemin),
      languages: Object.fromEntries(actives.map((lg) => [lg, lien('', lg, defaut, page.chemin)])),
    },
  }
}

export default async function SitePublie(props: Props) {
  const c = await charger(props)
  if (!c) notFound()
  if (!c.page && c.cible.chemin.startsWith(`${CHEMIN_RESERVER}/`)) {
    // `/reserver/<id>` : la fiche d'une villa DE CE PM, dans son cadre (404 pour tout autre logement).
    const villa = await lireVilla(c.slug, c.cible.chemin.slice(CHEMIN_RESERVER.length + 1))
    if (!villa) notFound()
    return (
      <CadreSite site={c.site} base="" langue={c.cible.langue} chemin={c.cible.chemin}>
        <Villa site={c.site} base="" langue={c.cible.langue} villa={villa} />
      </CadreSite>
    )
  }
  if (!c.page) {
    const valeurs = await props.searchParams
    return (
      <CadreSite site={c.site} base="" langue={c.cible.langue} chemin={CHEMIN_RESERVER}>
        <Reservation site={c.site} slug={c.slug} base="" langue={c.cible.langue} valeurs={valeurs} />
      </CadreSite>
    )
  }
  return <SitePm site={c.site} slug={c.slug} base="" langue={c.cible.langue} page={c.page} />
}
