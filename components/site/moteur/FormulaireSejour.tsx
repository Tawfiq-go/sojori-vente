/**
 * Dates et voyageurs : un formulaire GET vers la page elle-même (aucun JavaScript requis). Le séjour vit dans
 * l'adresse — jamais de donnée personnelle — et chaque écran du parcours le relit côté serveur.
 */
import { mm } from '@/lib/site/moteur-mots'
import { aujourdhui } from '@/lib/site/moteur'
import type { Langue } from '@/lib/site/types'

export function FormulaireSejour({
  action,
  langue,
  valeurs,
  maxVoyageurs = 12,
  libelle,
}: {
  action: string
  langue: Langue
  valeurs: { checkIn?: string; checkOut?: string; adults?: string }
  maxVoyageurs?: number
  libelle?: string
}) {
  const min = aujourdhui()
  const adultes = Math.min(Math.max(Number(valeurs.adults) || 2, 1), maxVoyageurs)
  return (
    <form className="moteur-sejour" action={action} method="get">
      <label>
        <span>{mm('arrivee', langue)}</span>
        <input type="date" name="checkIn" required min={min} defaultValue={valeurs.checkIn ?? ''} />
      </label>
      <label>
        <span>{mm('depart', langue)}</span>
        <input type="date" name="checkOut" required min={valeurs.checkIn && valeurs.checkIn > min ? valeurs.checkIn : min} defaultValue={valeurs.checkOut ?? ''} />
      </label>
      <label>
        <span>{mm('voyageurs', langue)}</span>
        <select name="adults" defaultValue={String(adultes)}>
          {Array.from({ length: maxVoyageurs }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <button className="bouton" type="submit">
        {libelle ?? mm('voirDispo', langue)}
      </button>
    </form>
  )
}
