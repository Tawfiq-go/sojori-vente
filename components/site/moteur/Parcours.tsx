/**
 * Le parcours de réservation DU site d'un PM, de bout en bout, dans le cadre du client :
 *   `/reserver`                  dates + voyageurs → un type de chambre par carte, prix du séjour, disponibilité
 *   `/reserver/<id>`             la fiche du type et son devis
 *   `/reserver/<id>/paiement`    coordonnées + paiement
 *   `/reserver/<id>/confirmation`
 * Un seul composant pour le site publié, le domaine du client et l'aperçu du brouillon : même rendu partout.
 * Tout est lu côté serveur avec le périmètre du PM (`lib/site/moteur.ts`) ; rien du marché Sojori n'y entre.
 */
import { notFound } from 'next/navigation'
import { lireVilla } from '@/lib/site/logement'
import { lireSejour, lireType, lireTypes, formaterPrix } from '@/lib/site/moteur'
import { mm } from '@/lib/site/moteur-mots'
import { lien } from '@/lib/site/route'
import { mot, t } from '@/lib/site/texte'
import type { Langue, SitePublic } from '@/lib/site/types'
import { CHEMIN_RESERVER } from '@/components/site/Chrome'
import '@/app/site-moteur.css'
import { CarteType } from './CarteType'
import { Confirmation } from './Confirmation'
import { FicheType } from './FicheType'
import { FormulaireSejour } from './FormulaireSejour'
import { Paiement } from './Paiement'
import { Recapitulatif } from './Recapitulatif'

type Valeurs = { checkIn?: string; checkOut?: string; adults?: string }

/** `demo` : brouillon du site (rien d'écrit nulle part). `ferme` : site publié, réservation en ligne pas encore ouverte. */
export function modeMoteur(site: SitePublic): 'demo' | 'ferme' {
  return site.apercu ? 'demo' : 'ferme'
}

export async function Parcours({
  site,
  slug,
  base,
  langue,
  sousChemin,
  valeurs,
}: {
  site: SitePublic
  slug: string
  base: string
  langue: Langue
  /** Ce qui suit `reserver/` : '' | '<id>' | '<id>/paiement' | '<id>/confirmation'. */
  sousChemin: string
  valeurs: Valeurs
}) {
  const { defaut } = site.spec.langues
  const l = (c: string) => lien(base, langue, defaut, c)
  const sejour = lireSejour(valeurs)
  const qs = sejour ? `?checkIn=${sejour.arrivee}&checkOut=${sejour.depart}&adults=${sejour.voyageurs}` : ''
  const [id, etape, ...reste] = sousChemin.split('/').filter(Boolean)
  if (reste.length > 0 || (etape !== undefined && etape !== 'paiement' && etape !== 'confirmation')) notFound()

  // ─── /reserver : la liste ───
  if (!id) {
    const types = await lireTypes(slug, sejour)
    const aDesDates = Boolean(valeurs.checkIn || valeurs.checkOut)
    const maxVoy = Math.max(...types.map((x) => x.voyageurs ?? 0), 4)
    return (
      <>
        <section className="section moteur-entete">
          <p className="moteur-entete__accent">{site.spec.identite.nom}</p>
          <h1>{mm('titre', langue)}</h1>
          <p className="moteur-entete__sous">{mm('sousTitre', langue)}</p>
          <FormulaireSejour action={l(CHEMIN_RESERVER)} langue={langue} valeurs={valeurs} maxVoyageurs={maxVoy} />
          {aDesDates && !sejour && <p className="moteur-alerte">{mm('datesInvalides', langue)}</p>}
        </section>
        <section className="section moteur-liste">
          {types.length === 0 ? (
            <p>{mm('aucunType', langue)}</p>
          ) : (
            types.map((tp, i) => (
              <CarteType key={tp.id} type={tp} langue={langue} index={i} voyageurs={sejour?.voyageurs} lienFiche={l(`${CHEMIN_RESERVER}/${tp.id}${qs}`)} />
            ))
          )}
          {sejour && types.length > 0 && types.every((x) => x.etat !== 'libre') && (
            <p className="moteur-alerte">{mm('autresDates', langue)}</p>
          )}
        </section>
      </>
    )
  }

  // ─── /reserver/<id>… : un type de CE PM, sinon 404 ───
  const [type, villa] = await Promise.all([lireType(slug, id, sejour), lireVilla(slug, id)])
  if (!type || !villa) notFound()

  if (!etape) return <FicheType site={site} base={base} langue={langue} type={type} villa={villa} sejour={sejour} valeurs={valeurs} />

  const fiche = l(`${CHEMIN_RESERVER}/${type.id}${qs}`)
  const mode = modeMoteur(site)
  const whatsapp = site.contact?.whatsapp
  const libre = Boolean(sejour && type.etat === 'libre' && type.devis)
  const nomSite = site.spec.identite.nom

  if (!sejour || !libre || !type.devis) {
    return (
      <section className="section moteur-entete">
        <h1>{type.nom}</h1>
        <p className="moteur-alerte">{sejour ? mm(type.etat && type.etat !== 'libre' ? type.etat : 'erreur', langue, { n: sejour.voyageurs }) : mm('deMoinsDe', langue)}</p>
        <a className="bouton" href={fiche}>
          {mm('retour', langue)}
        </a>
      </section>
    )
  }
  const accueil = l('')
  const accueilTitre = t(site.spec.pages[0]?.titre, langue, defaut) || nomSite
  const recap = <Recapitulatif type={type} sejour={sejour} langue={langue} />

  if (etape === 'paiement') {
    const message = `${nomSite} — ${type.nom}\n${mm('arrivee', langue)} : ${sejour.arrivee}\n${mm('depart', langue)} : ${sejour.depart}\n${mm('voyageurs', langue)} : ${sejour.voyageurs}\n${mm('total', langue)} : ${formaterPrix(type.devis.total, type.devis.devise, langue)}`
    return (
      <section className="section moteur-etape">
        <nav className="villa__ariane" aria-label="Fil d’ariane">
          <a href={accueil}>{accueilTitre}</a>
          <span aria-hidden="true">›</span>
          <a href={l(`${CHEMIN_RESERVER}${qs}`)}>{mot('reserver', langue)}</a>
          <span aria-hidden="true">›</span>
          <a href={fiche}>{type.nom}</a>
        </nav>
        <h1>{mm('paiementTitre', langue)}</h1>
        <div className="moteur-etape__grille">
          <Paiement
            langue={langue}
            mode={mode}
            typeId={type.id}
            total={formaterPrix(type.devis.total, type.devis.devise, langue)}
            suite={l(`${CHEMIN_RESERVER}/${type.id}/confirmation${qs}`)}
            retour={fiche}
            lienWhatsapp={whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}` : null}
          />
          {recap}
        </div>
      </section>
    )
  }

  // confirmation : seulement quand le moteur sait confirmer (démonstration) ; un site publié encore fermé n'a rien à confirmer.
  if (mode !== 'demo') notFound()
  return (
    <section className="section moteur-etape">
      <Confirmation langue={langue} typeId={type.id} accueil={accueil} demo recap={<Recapitulatif type={type} sejour={sejour} langue={langue} photo={false} />} />
    </section>
  )
}
