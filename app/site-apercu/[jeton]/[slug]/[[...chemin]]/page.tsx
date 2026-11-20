import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AnnotationApercu } from '@/components/site/AnnotationApercu'
import { CadreSite, CHEMIN_RESERVER } from '@/components/site/Chrome'
import { Reservation } from '@/components/site/Reservation'
import { Villa } from '@/components/site/Villa'
import { lireVilla } from '@/lib/site/logement'
import { SitePm } from '@/components/site/SitePm'
import { lireApercu } from '@/lib/site/api'
import { lireCible } from '@/lib/site/route'

/**
 * L'aperçu du brouillon d'un site, sur jeton signé (15 min) délivré par srv-site à l'écran
 * « Site web » du tableau de bord. Jamais indexé, jamais mis en cache.
 */
type Props = {
  params: Promise<{ jeton: string; slug: string; chemin?: string[] }>
  searchParams: Promise<{ checkIn?: string; checkOut?: string; adults?: string }>
}

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
  const base = `/site-apercu/${encodeURIComponent(jeton)}/${encodeURIComponent(slug)}`
  // `/reserver` : la page de réservation du site (dates → logements de ce PM), dans son cadre.
  if (cible.chemin === CHEMIN_RESERVER) {
    const valeurs = await props.searchParams
    return (
      <CadreSite site={site} base={base} langue={cible.langue} chemin={CHEMIN_RESERVER}>
        <Reservation site={site} slug={slug} base={base} langue={cible.langue} valeurs={valeurs} />
      </CadreSite>
    )
  }
  // `/reserver/<id>` : la fiche d'une villa DE CE PM, dans son cadre (404 pour tout autre logement).
  if (cible.chemin.startsWith(`${CHEMIN_RESERVER}/`)) {
    const villa = await lireVilla(slug, cible.chemin.slice(CHEMIN_RESERVER.length + 1))
    if (!villa) notFound()
    return (
      <CadreSite site={site} base={base} langue={cible.langue} chemin={cible.chemin}>
        <Villa site={site} base={base} langue={cible.langue} villa={villa} />
      </CadreSite>
    )
  }
  const page = site.spec.pages.find((p) => p.chemin === cible.chemin)
  if (!page) notFound()
  return (
    <>
      <SitePm site={site} slug={slug} base={base} langue={cible.langue} page={page} />
      <AnnotationApercu />
    </>
  )
}
