/**
 * Un type de chambre / une villa du PM : photos en grand format, ce qu'il offre, le prix du séjour entier et un
 * seul bouton. Rien du marché : ni cœur, ni note, ni badge, ni tri. Les couleurs, polices et angles sont ceux du site.
 */
import { formaterPrix, type TypeChambre } from '@/lib/site/moteur'
import { mm, nb } from '@/lib/site/moteur-mots'
import type { Langue } from '@/lib/site/types'

const MOTIF = { indisponible: 'indisponible', capacite: 'capacite', duree: 'duree', prix: 'prix', erreur: 'erreur' } as const

export function CarteType({
  type,
  langue,
  lienFiche,
  voyageurs,
  index,
}: {
  type: TypeChambre
  langue: Langue
  /** Le lien de la fiche, séjour compris. */
  lienFiche: string
  voyageurs?: number
  index: number
}) {
  const photos = type.images.slice(0, 5)
  const libre = type.etat === 'libre' && type.devis
  const specs = [
    type.chambres ? nb(type.chambres, 'chambre', 'chambres', langue) : null,
    type.sallesDeBain ? nb(type.sallesDeBain, 'salleDeBain', 'sallesDeBain', langue) : null,
    type.voyageurs ? mm('jusqua', langue, { n: type.voyageurs }) : null,
  ].filter(Boolean)
  return (
    <article className="moteur-carte" data-etat={type.etat ?? 'libre'}>
      {photos.length > 0 ? (
        <a className="moteur-carte__photos" data-nombre={Math.min(photos.length, 3)} href={lienFiche} aria-label={type.nom}>
          {photos.map((u, i) => (
            <img key={u} src={u} alt={i === 0 ? type.nom : ''} loading={index === 0 && i < 2 ? 'eager' : 'lazy'} decoding="async" />
          ))}
        </a>
      ) : (
        <a className="moteur-carte__photos moteur-carte__photos--vide" href={lienFiche} aria-label={type.nom} />
      )}
      <div className="moteur-carte__corps">
        <div className="moteur-carte__texte">
          {type.etablissement && <p className="moteur-carte__etab">{type.etablissement}</p>}
          <h2 className="moteur-carte__nom">
            <a href={lienFiche}>{type.nom}</a>
          </h2>
          {specs.length > 0 && <p className="moteur-carte__specs">{specs.join(' · ')}</p>}
          {type.description && <p className="moteur-carte__description">{type.description}</p>}
          {type.equipements.length > 0 && (
            <ul className="moteur-carte__equipements">
              {type.equipements.slice(0, 6).map((e) => (
                <li key={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="moteur-carte__prix">
          {libre && type.devis ? (
            <>
              <p className="moteur-carte__duree">{type.devis.nuits > 1 ? mm('pourNuits', langue, { n: type.devis.nuits }) : mm('pourUneNuit', langue)}</p>
              <p className="moteur-carte__total">{formaterPrix(type.devis.total, type.devis.devise, langue)}</p>
              <p className="moteur-carte__detail">
                {mm('parNuitMoyen', langue, { p: formaterPrix(type.devis.parNuit, type.devis.devise, langue) })}
                {type.devis.taxesEtFrais > 0 && (
                  <>
                    <br />
                    {mm('dontTaxes', langue, { p: formaterPrix(type.devis.taxesEtFrais, type.devis.devise, langue) })}
                  </>
                )}
              </p>
              <a className="bouton" href={lienFiche}>
                {mm('choisir', langue)}
              </a>
            </>
          ) : type.etat && type.etat !== 'libre' ? (
            <>
              <p className="moteur-carte__indispo">{mm(MOTIF[type.etat === 'libre' ? 'erreur' : type.etat], langue, { n: voyageurs ?? '' })}</p>
              {type.motif && type.etat === 'duree' && <p className="moteur-carte__detail">{type.motif}</p>}
            </>
          ) : (
            <>
              {type.prixNuit !== undefined && (
                <p className="moteur-carte__total moteur-carte__total--nuit">
                  <small>{mm('aPartirDe', langue)}</small> {formaterPrix(type.prixNuit, type.devise, langue)} <small>{mm('parNuit', langue)}</small>
                </p>
              )}
              <a className="bouton" href={lienFiche}>
                {mm('voirDetails', langue)}
              </a>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
