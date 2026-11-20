/**
 * La fiche d'une villa DANS le site du PM (`<site>/reserver/<id>`) : le cadre du client (`CadreSite`), ses
 * pages pour fil d'ariane et retours, aucune trace de la plateforme (pas de menu du marché, pas d'assistant
 * Sojori, pas de badge « vérifié », pas de connexion). Les données sont celles de CE PM (`lireVilla`).
 */
import { lien } from '@/lib/site/route'
import { mot, t } from '@/lib/site/texte'
import type { Langue, SitePublic } from '@/lib/site/types'
import type { Villa as VillaDonnees } from '@/lib/site/logement'
import { CHEMIN_RESERVER } from './Chrome'
import { CarteVilla } from './CarteVilla'
import { DemandeVilla } from './DemandeVilla'

export function Villa({
  site,
  base,
  langue,
  villa,
}: {
  site: SitePublic
  base: string
  langue: Langue
  villa: VillaDonnees
}) {
  const { defaut } = site.spec.langues
  const l = (c: string) => lien(base, langue, defaut, c)
  const accueil = site.spec.pages[0]
  const photos = villa.images.slice(0, 9)
  return (
    <article className="section villa">
      <nav className="villa__ariane" aria-label="Fil d’ariane">
        <a href={l('')}>{t(accueil?.titre, langue, defaut) || site.spec.identite.nom}</a>
        <span aria-hidden="true">›</span>
        <a href={l(CHEMIN_RESERVER)}>{mot('reserver', langue)}</a>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{villa.titre}</span>
      </nav>
      <p className="recherche__script">{site.spec.identite.nom}</p>
      <h1>{villa.titre}</h1>
      <p className="villa__specs">
        {[
          villa.ville,
          villa.chambres !== undefined && `${villa.chambres} ${mot('chambres', langue)}`,
          villa.voyageurs !== undefined && `${villa.voyageurs} ${mot('voyageurs', langue)}`,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {photos.length > 0 && (
        <div className="villa__photos" data-nombre={Math.min(photos.length, 5)}>
          {photos.map((u, i) => (
            <img key={u} src={u} alt={`${villa.titre} — ${i + 1}`} loading={i < 3 ? 'eager' : 'lazy'} decoding="async" />
          ))}
        </div>
      )}
      <div className="villa__corps">
        <div className="villa__texte">
          {villa.description && (
            <section>
              <h2>{mot('villaDescription', langue)}</h2>
              <p className="multiligne">{villa.description}</p>
            </section>
          )}
          {villa.equipements.length > 0 && (
            <section>
              <h2>{mot('equipements', langue)}</h2>
              <ul className="villa__equipements">
                {villa.equipements.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
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
            <a href={l(CHEMIN_RESERVER)}>← {mot('villaRetour', langue)}</a>
          </p>
        </div>
        <DemandeVilla
          whatsapp={site.contact?.whatsapp ?? null}
          titre={villa.titre}
          nomSite={site.spec.identite.nom}
          prix={villa.prixParNuit}
          devise={villa.devise}
          maxVoyageurs={villa.voyageurs}
          mots={{
            arrivee: mot('villaArrivee', langue),
            depart: mot('villaDepart', langue),
            voyageurs: mot('voyageurs', langue),
            demander: mot('villaDemander', langue),
            note: mot('villaDemandeNote', langue),
            parNuit: mot('parNuit', langue),
            aPartirDe: mot('aPartirDe', langue),
          }}
        />
      </div>
    </article>
  )
}
