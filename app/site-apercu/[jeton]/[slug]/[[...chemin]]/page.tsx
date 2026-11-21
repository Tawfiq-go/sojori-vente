import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AnnotationApercu } from '@/components/site/AnnotationApercu'
import { CadreSite, CHEMIN_RESERVER } from '@/components/site/Chrome'
import { Parcours } from '@/components/site/moteur/Parcours'
import { metaMarqueBlanche, metaNeutre } from '@/lib/site/meta'
import { SitePm } from '@/components/site/SitePm'
import { lireApercu, lireLogements, lireProprietaireApercu } from '@/lib/site/api'
import { proprietaireLuPourApercu } from '@/lib/site/apercu-lecture'
import { LienApercuExpire } from '@/components/site/LienApercuExpire'
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
    ...(site ? metaMarqueBlanche(site, `Aperçu · ${site.spec.identite.nom}`) : metaNeutre('Aperçu')),
    title: site ? `Aperçu · ${site.spec.identite.nom}` : 'Aperçu',
    // Jamais l'adresse canonique de la plateforme (layout racine) ni celle de l'aperçu (elle porte le jeton).
    alternates: { canonical: null },
    robots: { index: false, follow: false },
  }
}

export default async function ApercuDuSite(props: Props) {
  const { jeton, slug, chemin = [] } = await props.params
  const site = await lireApercu(jeton)
  // Jeton expiré (15 min) ou inconnu : un message neutre, pas « Page introuvable ».
  if (!site) return <LienApercuExpire />
  const cible = lireCible(chemin, site.spec.langues)
  const base = `/site-apercu/${encodeURIComponent(jeton)}/${encodeURIComponent(slug)}`
  // `/reserver…` : le parcours de réservation du site (liste, fiche, paiement, confirmation), dans son cadre.
  if (cible.chemin === CHEMIN_RESERVER || cible.chemin.startsWith(`${CHEMIN_RESERVER}/`)) {
    // Le slug de l'adresse n'est qu'une indication : il doit désigner le propriétaire que le JETON autorise, sinon un
    // jeton valide ouvrirait les types, prix et disponibilités de n'importe quel autre PM (revue du 20/11/2026).
    const proprietaire = await lireProprietaireApercu(jeton)
    if (!proprietaire) return <LienApercuExpire />
    // Brouillon sur un compte sans logement : la configuration peut désigner UN autre propriétaire à lire en lecture seule.
    const lu = proprietaireLuPourApercu(proprietaire)
    const source = lu === proprietaire ? slug : lu
    const logements = await lireLogements(source)
    if (logements.some((l) => l.pmId !== lu)) notFound()
    const valeurs = await props.searchParams
    return (
      <CadreSite site={site} base={base} langue={cible.langue} chemin={cible.chemin}>
        <Parcours site={site} slug={source} base={base} langue={cible.langue} sousChemin={cible.chemin.slice(CHEMIN_RESERVER.length + 1)} valeurs={valeurs} />
      </CadreSite>
    )
  }
  const page = site.spec.pages.find((p) => p.chemin === cible.chemin)
  if (!page) notFound()
  // Champs dynamiques d'une landing : l'adresse de l'aperçu n'est pas toujours le slug du PM (site d'Ali : nommos-beach-resort-ali).
  // Les tarifs se lisent chez le propriétaire que le JETON autorise, jamais d'après l'adresse.
  const proprietaire = page.offre ? await lireProprietaireApercu(jeton) : null
  const sourceLogements = proprietaire ? proprietaireLuPourApercu(proprietaire) : undefined
  return (
    <>
      <SitePm site={site} slug={slug} base={base} langue={cible.langue} page={page} sourceLogements={sourceLogements} />
      <AnnotationApercu />
    </>
  )
}
