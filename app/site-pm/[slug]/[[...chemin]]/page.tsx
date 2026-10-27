import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { SitePm } from '@/components/site/SitePm'
import { lireSitePm } from '@/lib/site/api'
import { lien, lireCible } from '@/lib/site/route'
import { t } from '@/lib/site/texte'

/**
 * Le site publié d'un PM, sur SON domaine : middleware.ts réécrit ici les chemins de ses pages
 * (domaine → slug → fiche publiée chez srv-site). Le reste (logements, réservation) reste à
 * sojori-vente. Spec : sojori-production/docs/patterns/agents/agent-site-web.md (lot 3).
 */
type Props = { params: Promise<{ slug: string; chemin?: string[] }> }

async function charger(props: Props) {
  const { slug, chemin = [] } = await props.params
  const site = await lireSitePm(slug)
  if (!site) return null
  const cible = lireCible(chemin, site.spec.langues)
  const page = site.spec.pages.find((p) => p.chemin === cible.chemin)
  return page ? { slug, site, cible, page } : null
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const c = await charger(props)
  if (!c) return {}
  const { site, cible, page } = c
  const { defaut, actives } = site.spec.langues
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
  return <SitePm site={c.site} slug={c.slug} base="" langue={c.cible.langue} page={c.page} />
}
