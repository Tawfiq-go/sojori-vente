import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AnnotationApercu } from '@/components/site/AnnotationApercu'
import { SitePm } from '@/components/site/SitePm'
import { lireApercu } from '@/lib/site/api'
import { lireCible } from '@/lib/site/route'

/**
 * L'aperçu du brouillon d'un site, sur jeton signé (15 min) délivré par srv-site à l'écran
 * « Site web » du tableau de bord. Jamais indexé, jamais mis en cache.
 */
type Props = { params: Promise<{ jeton: string; slug: string; chemin?: string[] }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { jeton } = await props.params
  const site = await lireApercu(jeton)
  return {
    title: site ? `Aperçu · ${site.spec.identite.nom}` : 'Aperçu',
    robots: { index: false, follow: false },
  }
}

export default async function ApercuDuSite(props: Props) {
  const { jeton, slug, chemin = [] } = await props.params
  const site = await lireApercu(jeton)
  if (!site) notFound()
  const cible = lireCible(chemin, site.spec.langues)
  const page = site.spec.pages.find((p) => p.chemin === cible.chemin)
  if (!page) notFound()
  return (
    <>
      <SitePm
        site={site}
        slug={slug}
        base={`/site-apercu/${encodeURIComponent(jeton)}/${encodeURIComponent(slug)}`}
        langue={cible.langue}
        page={page}
      />
      <AnnotationApercu />
    </>
  )
}
