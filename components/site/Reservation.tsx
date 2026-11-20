/**
 * La page de réservation DU site d'un PM (`/reserver`) : dates et voyageurs, puis les logements de CE PM
 * seulement — dans le cadre et le design du client, sans la barre ni les filtres du marché Sojori
 * (Tawfiq, 20/11/2026 : « le moteur de réservation doit être intégré chez le client »). Un simple
 * formulaire GET vers la même page ; la liste est celle de la recherche, en mode « un propriétaire ».
 */
import SearchPage from '@/app/search/SearchPage'
import { lien } from '@/lib/site/route'
import { mot } from '@/lib/site/texte'
import type { Langue, SitePublic } from '@/lib/site/types'
import { CHEMIN_RESERVER } from './Chrome'

export function Reservation({
  site,
  slug,
  base,
  langue,
  valeurs,
}: {
  site: SitePublic
  slug: string
  base: string
  langue: Langue
  valeurs: { checkIn?: string; checkOut?: string; adults?: string }
}) {
  const action = lien(base, langue, site.spec.langues.defaut, CHEMIN_RESERVER)
  return (
    <>
      <section className="section recherche recherche--page">
        <h1>{mot('reserver', langue)}</h1>
        <form className="recherche__barre" action={action} method="get">
          <label>
            <span>{mot('arrivee', langue)}</span>
            <input type="date" name="checkIn" required defaultValue={valeurs.checkIn ?? ''} />
          </label>
          <label>
            <span>{mot('depart', langue)}</span>
            <input type="date" name="checkOut" required defaultValue={valeurs.checkOut ?? ''} />
          </label>
          <label>
            <span>{mot('adultes', langue)}</span>
            <input type="number" name="adults" min={1} max={20} defaultValue={valeurs.adults ?? 2} />
          </label>
          <button className="bouton" type="submit">
            {mot('rechercher', langue)}
          </button>
        </form>
      </section>
      <section className="section mesure">
        <SearchPage pm={slug} integre prefixeLogement={action} />
      </section>
    </>
  )
}
