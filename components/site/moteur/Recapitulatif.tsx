/** Le récapitulatif du séjour (type, dates, voyageurs, prix) — le même sur la fiche, le paiement et la confirmation. */
import { formaterPrix, type Sejour, type TypeChambre } from '@/lib/site/moteur'
import { mm } from '@/lib/site/moteur-mots'
import type { Langue } from '@/lib/site/types'

function jour(iso: string, langue: Langue): string {
  const d = new Date(`${iso}T12:00:00Z`)
  return new Intl.DateTimeFormat(langue === 'ar' ? 'ar-MA' : langue === 'en' ? 'en-GB' : 'fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

export function Recapitulatif({ type, sejour, langue, photo = true }: { type: TypeChambre; sejour: Sejour; langue: Langue; photo?: boolean }) {
  const devis = type.devis
  return (
    <aside className="moteur-recap" aria-label={mm('recapitulatif', langue)}>
      {photo && type.images[0] && <img src={type.images[0]} alt="" loading="lazy" decoding="async" />}
      <div className="moteur-recap__corps">
        {type.etablissement && <p className="moteur-carte__etab">{type.etablissement}</p>}
        <h2>{type.nom}</h2>
        <dl>
          <div>
            <dt>{mm('arrivee', langue)}</dt>
            <dd>{jour(sejour.arrivee, langue)}</dd>
          </div>
          <div>
            <dt>{mm('depart', langue)}</dt>
            <dd>{jour(sejour.depart, langue)}</dd>
          </div>
          <div>
            <dt>{mm('voyageurs', langue)}</dt>
            <dd>{sejour.voyageurs}</dd>
          </div>
        </dl>
        {devis && (
          <dl className="moteur-recap__prix">
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
            <div className="moteur-recap__total">
              <dt>{mm('total', langue)}</dt>
              <dd>{formaterPrix(devis.total, devis.devise, langue)}</dd>
            </div>
          </dl>
        )}
      </div>
    </aside>
  )
}
