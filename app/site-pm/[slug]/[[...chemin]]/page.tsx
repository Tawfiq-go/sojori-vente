import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { CadreSite, CHEMIN_RESERVER } from '@/components/site/Chrome'
import { Parcours } from '@/components/site/moteur/Parcours'
import { metaMarqueBlanche, metaNeutre } from '@/lib/site/meta'
import { SitePm } from '@/components/site/SitePm'
import { lireSitePm } from '@/lib/site/api'
import { lien, lireCible } from '@/lib/site/route'
import { mot, t } from '@/lib/site/texte'

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
  if (!c) return metaNeutre()
  const { site, cible, page } = c
  const { defaut, actives } = site.spec.langues
  const hote = ((await headers()).get('host') || '').split(':')[0]
  if (!page) {
    // Le parcours de réservation : à la marque du client, adresse canonique sur SON domaine (jamais celle de la
    // plateforme du layout racine) ; seules la liste de réservation est indexable, pas la fiche, le paiement ni la confirmation.
    return {
      ...metaMarqueBlanche(site, `${mot('reserver', cible.langue)} · ${site.spec.identite.nom}`),
      ...(hote ? { metadataBase: new URL(`https://${hote}`) } : {}),
      alternates: { canonical: lien('', cible.langue, defaut, cible.chemin) },
      robots: { index: cible.chemin === CHEMIN_RESERVER, follow: true },
    }
  }
  const titre = t(page.seo?.titre, cible.langue, defaut) || t(page.titre, cible.langue, defaut)
  const titreComplet = page.chemin === '' || !titre ? site.spec.identite.nom : `${titre} · ${site.spec.identite.nom}`
  const description = t(page.seo?.description, cible.langue, defaut) || undefined
  return {
    ...metaMarqueBlanche(site, titreComplet, description),
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
  if (!c.page) {
    // `/reserver…` : le parcours de réservation du site (liste, fiche, paiement, confirmation) dans son cadre,
    // limité aux logements de CE PM (404 pour tout autre logement).
    const valeurs = await props.searchParams
    return (
      <CadreSite site={c.site} base="" langue={c.cible.langue} chemin={c.cible.chemin}>
        <Parcours site={c.site} slug={c.slug} base="" langue={c.cible.langue} sousChemin={c.cible.chemin.slice(CHEMIN_RESERVER.length + 1)} valeurs={valeurs} />
      </CadreSite>
    )
  }
  return <SitePm site={c.site} slug={c.slug} base="" langue={c.cible.langue} page={c.page} />
}
