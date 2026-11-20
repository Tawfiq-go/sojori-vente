/**
 * La carte d'un restaurant, d'un bar ou d'un pool club (section `carteRestaurant`, Nommos Beach Resort,
 * 20/11/2026). Rendu serveur, sans JavaScript : les onglets sont des cases à cocher cachées (la catégorie
 * affichée suit la case cochée, voir `.carte-resto__radio:nth-of-type(n):checked` dans site-pm.css).
 * Les prix sont écrits tels que le client les écrit : jamais recalculés ni convertis. Un plat sans prix
 * est un plat dont la catégorie dit le prix dans sa `note` (« Tous les cocktails classiques : 200 DH »).
 */
import { t } from '@/lib/site/texte'
import type { Valeur } from '@/lib/site/types'
import type { Contexte } from './Sections'

type Obj = Record<string, unknown>
const liste = (v: unknown): Obj[] =>
  Array.isArray(v) ? v.filter((x): x is Obj => Boolean(x) && typeof x === 'object') : []
const prix = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

function Categorie({ cat, ctx }: { cat: Obj; ctx: Contexte }) {
  const tx = (v: unknown) => t(v, ctx.langue, ctx.defaut)
  const plats = liste(cat.plats)
  const deuxColonnes = plats.some((p) => prix(p.prix2)) || Boolean(tx(cat.colonne1) || tx(cat.colonne2))
  return (
    <div className="carte-resto__categorie">
      <h3 className="carte-resto__titre">{tx(cat.titre)}</h3>
      {tx(cat.note) && <p className="carte-resto__note">{tx(cat.note)}</p>}
      <ul className="carte-resto__plats">
        {deuxColonnes && (tx(cat.colonne1) || tx(cat.colonne2)) && (
          <li className="carte-resto__entetes" aria-hidden="true">
            <span />
            <span className="carte-resto__prix">{tx(cat.colonne1)}</span>
            <span className="carte-resto__prix">{tx(cat.colonne2)}</span>
          </li>
        )}
        {plats.map((p, i) => (
          <li key={i} className={deuxColonnes ? 'carte-resto__plat carte-resto__plat--2' : 'carte-resto__plat'}>
            <span className="carte-resto__nom">
              {tx(p.nom)}
              {tx(p.description) && <small className="carte-resto__description">{tx(p.description)}</small>}
            </span>
            {prix(p.prix) && <span className="carte-resto__prix">{prix(p.prix)}</span>}
            {deuxColonnes && <span className="carte-resto__prix">{prix(p.prix2)}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CarteRestaurant({
  id,
  variante,
  contenu,
  ctx,
}: {
  id: string
  variante: string
  contenu: Record<string, Valeur>
  ctx: Contexte
}) {
  const tx = (k: string) => t(contenu[k], ctx.langue, ctx.defaut)
  const cats = liste(contenu.categories)
  const onglets = variante === 'onglets' && cats.length > 1
  return (
    <section
      className={`section carteRestaurant carteRestaurant--${variante}`}
      data-section={id}
      id={id}
    >
      <header className="carte-resto__entete">
        {tx('surTitre') && (
          <p className="sur-titre" data-champ="surTitre">
            {tx('surTitre')}
          </p>
        )}
        {tx('titre') && <h2 data-champ="titre">{tx('titre')}</h2>}
        {tx('texte') && <p data-champ="texte">{tx('texte')}</p>}
      </header>
      {onglets ? (
        <div className="carte-resto carte-resto--onglets">
          {cats.map((_, i) => (
            <input
              key={i}
              type="radio"
              className="carte-resto__radio"
              name={`carte-${id}`}
              id={`carte-${id}-${i}`}
              defaultChecked={i === 0}
              aria-label={t(cats[i].titre, ctx.langue, ctx.defaut)}
            />
          ))}
          <div className="carte-resto__onglets" role="presentation">
            {cats.map((c, i) => (
              <label key={i} htmlFor={`carte-${id}-${i}`}>
                {t(c.titre, ctx.langue, ctx.defaut)}
              </label>
            ))}
          </div>
          <div className="carte-resto__panneaux">
            {cats.map((c, i) => (
              <div key={i} className="carte-resto__panneau">
                <Categorie cat={c} ctx={ctx} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`carte-resto carte-resto--${variante === 'colonnes' ? 'colonnes' : 'liste'}`}>
          {cats.map((c, i) => (
            <Categorie key={i} cat={c} ctx={ctx} />
          ))}
        </div>
      )}
      {tx('mention') && (
        <p className="carte-resto__mention" data-champ="mention">
          {tx('mention')}
        </p>
      )}
    </section>
  )
}
