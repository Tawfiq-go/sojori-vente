/**
 * La fiche d'un type de chambre / d'une villa DANS le site du PM (`<site>/reserver/<id>`) : mosaïque de photos,
 * description, équipements, plan, et à droite le séjour avec son prix exact. Le cadre, le menu, le pied et les
 * couleurs sont ceux du client ; aucune trace de la plateforme.
 */
import { CarteVilla } from '@/components/site/CarteVilla'
import { CHEMIN_RESERVER } from '@/components/site/Chrome'
import { formaterPrix, type Sejour, type TypeChambre } from '@/lib/site/moteur'
import { mm, phrasesAnnulation } from '@/lib/site/moteur-mots'
import { lien } from '@/lib/site/route'
import { mot, t } from '@/lib/site/texte'
import type { Langue, SitePublic } from '@/lib/site/types'
import type { Villa } from '@/lib/site/logement'
import { FormulaireSejour } from './FormulaireSejour'

export function FicheType({
  site,
  base,
  langue,
  type,
  villa,
  sejour,
  valeurs,
}: {
  site: SitePublic
  base: string
  langue: Langue
  type: TypeChambre
  villa: Villa
  sejour: Sejour | null
  valeurs: { checkIn?: string; checkOut?: string; adults?: string }
}) {
  const { defaut } = site.spec.langues
  const l = (c: string) => lien(base, langue, defaut, c)
  const accueil = site.spec.pages[0]
  const photos = villa.images.slice(0, 9)
  const fiche = l(`${CHEMIN_RESERVER}/${type.id}`)
  const qs = sejour ? `?checkIn=${sejour.arrivee}&checkOut=${sejour.depart}&adults=${sejour.voyageurs}` : ''
  const whatsapp = site.contact?.whatsapp
  const specs = [
    villa.ville,
    villa.chambres !== undefined && `${villa.chambres} ${mot('chambres', langue)}`,
    villa.voyageurs !== undefined && `${villa.voyageurs} ${mot('voyageurs', langue)}`,
  ].filter(Boolean)
  const nomSite = site.spec.identite.nom
  const message = `${nomSite} — ${type.nom}${sejour ? `\n${mm('arrivee', langue)} : ${sejour.arrivee}\n${mm('depart', langue)} : ${sejour.depart}\n${mm('voyageurs', langue)} : ${sejour.voyageurs}` : ''}`
  const lienWhatsapp = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}` : null
  const devis = type.devis
  return (
    <article className="section villa moteur-fiche">
      <nav className="villa__ariane" aria-label="Fil d’ariane">
        <a href={l('')}>{t(accueil?.titre, langue, defaut) || nomSite}</a>
        <span aria-hidden="true">›</span>
        <a href={l(`${CHEMIN_RESERVER}${qs}`)}>{mot('reserver', langue)}</a>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{type.nom}</span>
      </nav>
      {type.etablissement && <p className="moteur-carte__etab">{type.etablissement}</p>}
      <h1>{type.nom}</h1>
      <p className="villa__specs">{specs.join(' · ')}</p>
      {photos.length > 0 && (
        <div className="villa__photos" data-nombre={Math.min(photos.length, 5)}>
          {photos.map((u, i) => (
            <img key={u} src={u} alt={`${type.nom} — ${i + 1}`} loading={i < 3 ? 'eager' : 'lazy'} decoding="async" />
          ))}
        </div>
      )}
      <div className="villa__corps">
        <div className="villa__texte">
          {(type.description || villa.description) && (
            <section>
              <h2>{mot('villaDescription', langue)}</h2>
              {/* La description du type (celle de la villa), avant celle de l'établissement. */}
              <p className="multiligne">{type.description || villa.description}</p>
            </section>
          )}
          {villa.equipements.length > 0 && (
            <section>
              <h2>{mot('equipements', langue)}</h2>
              <ul className="villa__equipements">
                {villa.equipements.map((e) => (
                  <li key={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</li>
                ))}
              </ul>
            </section>
          )}
          {phrasesAnnulation(villa.annulation, langue).length > 0 && (
            <section>
              <h2>{mm('annulationTitre', langue)}</h2>
              {phrasesAnnulation(villa.annulation, langue).map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          )}
          {villa.arrivee && villa.depart && (
            <p className="villa__horaires">
              {mot('villaArrivee', langue)} {villa.arrivee} · {mot('villaDepart', langue)} {villa.depart}
            </p>
          )}
          {villa.lat !== undefined && villa.lng !== undefined && (
            <section>
              <h2>{mot('villaEmplacement', langue)}</h2>
              <CarteVilla lat={villa.lat} lng={villa.lng} />
              <p className="villa__note">{mot('villaZoneApprox', langue)}</p>
            </section>
          )}
          <p>
            <a href={l(`${CHEMIN_RESERVER}${qs}`)}>← {mot('villaRetour', langue)}</a>
          </p>
        </div>
        <aside className="villa__demande moteur-devis">
          <h2>{mm('votreSejour', langue)}</h2>
          <FormulaireSejour
            action={fiche}
            langue={langue}
            valeurs={valeurs}
            maxVoyageurs={Math.max(villa.voyageurs ?? 12, 1)}
            libelle={sejour ? mm('modifier', langue) : mm('recalculer', langue)}
          />
          {sejour && type.etat === 'libre' && devis ? (
            <div className="moteur-devis__prix">
              <dl>
                <div>
                  <dt>
                    {mm('sejour', langue)} · {devis.nuits} {mm(devis.nuits > 1 ? 'nuits' : 'nuit', langue)}
                  </dt>
                  <dd>{formaterPrix(devis.sousTotal, devis.devise, langue)}</dd>
                </div>
                {devis.taxesEtFrais > 0 && (
                  <div>
                    <dt>{mm('taxesFrais', langue)}</dt>
                    <dd>{formaterPrix(devis.taxesEtFrais, devis.devise, langue)}</dd>
                  </div>
                )}
                <div className="moteur-devis__total">
                  <dt>{mm('total', langue)}</dt>
                  <dd>{formaterPrix(devis.total, devis.devise, langue)}</dd>
                </div>
              </dl>
              <a className="bouton moteur-devis__suite" href={l(`${CHEMIN_RESERVER}/${type.id}/paiement${qs}`)}>
                {mm('continuer', langue)}
              </a>
              <p className="villa__note">{mm('prixConfirme', langue)}</p>
            </div>
          ) : sejour ? (
            <div className="moteur-devis__prix">
              <p className="moteur-carte__indispo">{mm(type.etat && type.etat !== 'libre' ? type.etat : 'erreur', langue, { n: sejour.voyageurs })}</p>
              <p className="villa__note">{mm('autresDates', langue)}</p>
            </div>
          ) : (
            <div className="moteur-devis__prix">
              {type.prixNuit !== undefined && (
                <p className="villa__prix">
                  <span>{mm('aPartirDe', langue)}</span> <b>{formaterPrix(type.prixNuit, type.devise, langue)}</b> <span>{mm('parNuit', langue)}</span>
                </p>
              )}
              <p className="villa__note">{mm('deMoinsDe', langue)}</p>
            </div>
          )}
          {lienWhatsapp && (
            <a className="moteur-devis__ecrire" href={lienWhatsapp} target="_blank" rel="noopener noreferrer">
              {mm('ecrire', langue)}
            </a>
          )}
        </aside>
      </div>
    </article>
  )
}
