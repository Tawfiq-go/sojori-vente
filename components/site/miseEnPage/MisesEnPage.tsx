/**
 * Le rendu des MISES EN PAGE d'une landing de service (lot D2). Rendu serveur, aucun script : chaque composition est faite de
 * blocs fermés et de leurs emplacements d'images (lib/site/miseEnPage.ts). Sans image, toujours belle : en aperçu le repli
 * dessiné dit « Votre photo ici », au public la variante sans image prend le relais. Les couleurs et polices viennent de la
 * marque (variables `--mep-*`), jamais d'une valeur en dur.
 */
import type { CSSProperties, ReactNode } from 'react'
import { type Emplacement, type MiseEnPage, libelleRole, marqueSure, rendreEmplacement, variante } from '@/lib/site/miseEnPage'

export type DonneesLanding = {
  marque: string
  couleurs: { accent: string; fond: string; texte: string; doux: string }
  polices: { titre: string; texte: string }
  surtitre?: string
  titre: string
  accroche?: string
  /** Prix déjà résolus par le serveur (jamais saisis) : le prix de l'offre et le prix d'origine. */
  prix?: { offre?: string; origine?: string; unite?: string }
  bouton: string
  /** Où mène le bouton : le panneau de commande (#reserver), la réservation du site ou WhatsApp. */
  lien?: string
  conditions?: string
  code?: string
  faits?: Array<{ libelle: string; valeur: string }>
  programme?: Array<{ heure: string; quoi: string }>
  carte?: Array<{ categorie: string; lignes: Array<{ nom: string; detail?: string; prix?: string }> }>
  atouts?: string[]
  /** Places restantes, lues en direct (absent = non affiché). */
  restant?: string
  images: Record<string, string | undefined>
}

type Props = { m: MiseEnPage; d: DonneesLanding; apercu: boolean }

/** Un motif de zellige (étoile à huit branches), dessiné en SVG, aux couleurs de la marque : le fond des replis et de la mise en page typographique. */
function motif(couleur: string, opacite = 0.16): string {
  const c = encodeURIComponent(couleur)
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='${c}' stroke-opacity='${opacite}' stroke-width='1.2'%3E%3Cpath d='M32 6 L39 25 L58 32 L39 39 L32 58 L25 39 L6 32 L25 25 Z'/%3E%3Crect x='19' y='19' width='26' height='26' transform='rotate(45 32 32)'/%3E%3Ccircle cx='32' cy='32' r='4'/%3E%3C/g%3E%3C/svg%3E")`
}

function Photo({ e, d, apercu, className }: { e: Emplacement; d: DonneesLanding; apercu: boolean; className?: string }) {
  const r = rendreEmplacement(d.images[e.id], apercu)
  if (r.type === 'photo') return <img className={`mep-photo ${className ?? ''}`} src={r.src} alt="" loading={e.principal ? "eager" : "lazy"} decoding="async" />
  if (r.type === 'aucun') return null
  return (
    <div className={`mep-photo mep-repli ${className ?? ''}`} style={{ backgroundImage: `${motif(d.couleurs.fond, 0.22)}, linear-gradient(135deg, color-mix(in srgb, ${d.couleurs.accent} 92%, #000) 0%, color-mix(in srgb, ${d.couleurs.accent} 60%, ${d.couleurs.fond}) 100%)` }} data-emplacement={e.id}>
      <span className="mep-repli__etiquette">
        <span aria-hidden="true">＋</span> {libelleRole[e.role]} · {e.format}
      </span>
    </div>
  )
}

function Prix({ d, grand }: { d: DonneesLanding; grand?: boolean }) {
  if (!d.prix?.offre) return null
  return (
    <p className={`mep-prix${grand ? ' mep-prix--grand' : ''}`}>
      <strong>{d.prix.offre}</strong>
      <span>
        {d.prix.unite}
        {d.prix.origine && (
          <>
            {d.prix.unite ? ', ' : ''}au lieu de <s>{d.prix.origine}</s>
          </>
        )}
      </span>
    </p>
  )
}

function Faits({ d }: { d: DonneesLanding }) {
  if (!d.faits?.length) return null
  return (
    <dl className="mep-faits">
      {d.faits.map((f) => (
        <div key={f.libelle}>
          <dt>{f.libelle}</dt>
          <dd>{f.valeur}</dd>
        </div>
      ))}
    </dl>
  )
}

function Bas({ d }: { d: DonneesLanding }) {
  if (!d.conditions && !d.code) return null
  return (
    <div className="mep-bas">
      {d.conditions && <p>{d.conditions}</p>}
      {d.code && (
        <p>
          Code à mentionner : <code>{d.code}</code>
        </p>
      )}
    </div>
  )
}

const empl = (m: MiseEnPage, id: string) => m.emplacements.find((e) => e.id === id) as Emplacement

function Editorial({ m, d, apercu }: Props) {
  const photo = variante(m, d.images) === 'avec_images'
  const avec = photo || apercu
  return (
    <>
      <section className={`mep-editorial${avec ? '' : ' mep-editorial--sans'}${photo ? '' : ' mep--sans-photo'}`}>
        {avec ? <Photo e={empl(m, 'couverture')} d={d} apercu={apercu} className="mep-editorial__fond" /> : <div className="mep-editorial__fond mep-motif" />}
        <div className="mep-editorial__voile" />
        <div className="mep-editorial__texte">
          {d.surtitre && <p className="mep-surtitre">{d.surtitre}</p>}
          <h1 className="mep-titre">{d.titre}</h1>
          {d.accroche && <p className="mep-accroche">{d.accroche}</p>}
          <Prix d={d} grand />
          <div className="mep-actions">
            <a className="mep-bouton" href={d.lien ?? '#reserver'}>
              {d.bouton}
            </a>
            {d.restant && <span className="mep-restant">{d.restant}</span>}
          </div>
        </div>
        <Faits d={d} />
      </section>
      <Bas d={d} />
    </>
  )
}

function Diptyque({ m, d, apercu }: Props) {
  const avec = variante(m, d.images) === 'avec_images' || apercu
  return (
    <>
      <section className={`mep-diptyque${avec ? '' : ' mep-diptyque--sans'}`}>
        <div className="mep-diptyque__texte">
          {d.surtitre && <p className="mep-surtitre">{d.surtitre}</p>}
          <h1 className="mep-titre">{d.titre}</h1>
          {d.accroche && <p className="mep-accroche">{d.accroche}</p>}
          <div className="mep-carte-prix">
            <Prix d={d} />
            <a className="mep-bouton" href={d.lien ?? '#reserver'}>
              {d.bouton}
            </a>
          </div>
          <Faits d={d} />
        </div>
        {avec && (
          <div className="mep-diptyque__images">
            <Photo e={empl(m, 'ambiance')} d={d} apercu={apercu} className="mep-diptyque__grande" />
            <Photo e={empl(m, 'detail')} d={d} apercu={apercu} className="mep-diptyque__petite" />
          </div>
        )}
      </section>
      <Bas d={d} />
    </>
  )
}

function Mosaique({ m, d, apercu }: Props) {
  const avec = variante(m, d.images) === 'avec_images' || apercu
  return (
    <>
      <section className="mep-mosaique">
        <header className="mep-mosaique__tete">
          {d.surtitre && <p className="mep-surtitre">{d.surtitre}</p>}
          <h1 className="mep-titre">{d.titre}</h1>
          {d.accroche && <p className="mep-accroche">{d.accroche}</p>}
        </header>
        {avec ? (
          <div className="mep-mosaique__grille">
            {m.emplacements.map((e, i) => (
              <Photo key={e.id} e={e} d={d} apercu={apercu} className={`mep-mosaique__${i === 0 ? 'grande' : 'case'}`} />
            ))}
          </div>
        ) : (
          <div className="mep-mosaique__grille mep-mosaique__grille--sans mep-motif" />
        )}
        <div className="mep-mosaique__pied">
          <Prix d={d} />
          <a className="mep-bouton" href={d.lien ?? '#reserver'}>
            {d.bouton}
          </a>
        </div>
        <Faits d={d} />
      </section>
      <Bas d={d} />
    </>
  )
}

function Typographique({ d }: Props) {
  const mots = d.titre.split(' ')
  return (
    <>
      <section className="mep-typo mep-motif">
        {d.surtitre && <p className="mep-surtitre">{d.surtitre}</p>}
        <h1 className="mep-typo__titre">
          {mots.map((w, i) => (
            <span key={`${w}-${i}`} className={i % 2 ? 'mep-typo__creux' : undefined}>
              {w}{' '}
            </span>
          ))}
        </h1>
        <div className="mep-typo__bas">
          {d.accroche && <p className="mep-accroche">{d.accroche}</p>}
          {d.prix?.offre && (
            <div className="mep-tampon" aria-label={`${d.prix.offre} ${d.prix.unite ?? ''}`}>
              <strong>{d.prix.offre}</strong>
              {d.prix.origine && <s>{d.prix.origine}</s>}
            </div>
          )}
        </div>
        <div className="mep-actions">
          <a className="mep-bouton mep-bouton--inverse" href={d.lien ?? '#reserver'}>
            {d.bouton}
          </a>
          {d.restant && <span className="mep-restant">{d.restant}</span>}
        </div>
        <Faits d={d} />
      </section>
      <Bas d={d} />
    </>
  )
}

function CarteChef({ m, d, apercu }: Props) {
  const avec = variante(m, d.images) === 'avec_images' || apercu
  return (
    <>
      <section className="mep-chef">
        <aside className="mep-chef__intro">
          {d.surtitre && <p className="mep-surtitre">{d.surtitre}</p>}
          <h1 className="mep-titre">{d.titre}</h1>
          {d.accroche && <p className="mep-accroche">{d.accroche}</p>}
          {avec ? <Photo e={empl(m, 'plat')} d={d} apercu={apercu} className="mep-chef__plat" /> : <div className="mep-chef__plat mep-motif mep-chef__plat--sans" />}
          <Prix d={d} />
          <a className="mep-bouton" href={d.lien ?? '#reserver'}>
            {d.bouton}
          </a>
          {d.programme && d.carte?.length ? (
            <ol className="mep-programme">
              {d.programme.map((p) => (
                <li key={p.heure}>
                  <time>{p.heure}</time> {p.quoi}
                </li>
              ))}
            </ol>
          ) : null}
        </aside>
        {/* Sans carte lue (prestation), la colonne de droite raconte le déroulé, en grand. */}
        {!d.carte?.length && d.programme?.length ? (
          <ol className="mep-chef__deroule">
            {d.programme.map((p) => (
              <li key={p.heure}>
                <time>{p.heure}</time>
                <span>{p.quoi}</span>
              </li>
            ))}
          </ol>
        ) : null}
        <div className="mep-chef__carte" hidden={!d.carte?.length}>
          {(d.carte ?? []).map((c) => (
            <div key={c.categorie} className="mep-chef__categorie">
              <h2>{c.categorie}</h2>
              <ul>
                {c.lignes.map((l) => (
                  <li key={l.nom}>
                    <span className="mep-chef__nom">{l.nom}</span>
                    <span className="mep-chef__points" aria-hidden="true" />
                    {l.prix && <span className="mep-chef__prixligne">{l.prix}</span>}
                    {l.detail && <span className="mep-chef__detail">{l.detail}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <Bas d={d} />
    </>
  )
}

function DayPass({ m, d, apercu }: Props) {
  const avec = variante(m, d.images) === 'avec_images' || apercu
  return (
    <>
      <section className={`mep-daypass${avec ? '' : ' mep-daypass--sans'}`}>
        <div className="mep-daypass__haut">
          {avec ? <Photo e={empl(m, 'lieu')} d={d} apercu={apercu} className="mep-daypass__fond" /> : <div className="mep-daypass__fond mep-motif" />}
          <div className="mep-daypass__voile" />
          <div className="mep-daypass__titre">
            {d.surtitre && <p className="mep-surtitre">{d.surtitre}</p>}
            <h1 className="mep-titre">{d.titre}</h1>
            {d.accroche && <p className="mep-accroche">{d.accroche}</p>}
          </div>
          <div className="mep-daypass__carte">
            <Prix d={d} grand />
            {d.restant && <p className="mep-daypass__restant">{d.restant}</p>}
            <a className="mep-bouton" href={d.lien ?? '#reserver'}>
              {d.bouton}
            </a>
            {d.atouts && (
              <ul className="mep-atouts">
                {d.atouts.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {d.programme && (
          <ol className="mep-frise">
            {d.programme.map((p) => (
              <li key={p.heure}>
                <time>{p.heure}</time>
                <span>{p.quoi}</span>
              </li>
            ))}
          </ol>
        )}
        {avec && m.emplacements[1] && (
          <div className="mep-daypass__detail">
            <Photo e={m.emplacements[1]} d={d} apercu={apercu} className="mep-daypass__detailphoto" />
            <Faits d={d} />
          </div>
        )}
      </section>
      <Bas d={d} />
    </>
  )
}

const RENDUS: Record<string, (p: Props) => ReactNode> = {
  editorial: Editorial,
  diptyque: Diptyque,
  mosaique: Mosaique,
  typographique: Typographique,
  carte_chef: CarteChef,
  day_pass: DayPass,
}

/** Une landing rendue dans sa mise en page, aux couleurs et polices de la marque. */
export function LandingMiseEnPage({ m, d: brut, apercu }: Props) {
  const Rendu = RENDUS[m.id]
  if (!Rendu) return null
  // Jamais une valeur non validée dans le style en ligne (ni dans les replis dessinés) : couleurs #RRGGBB, polices en clair.
  const d: DonneesLanding = { ...brut, ...marqueSure(brut.couleurs, brut.polices) }
  const style = {
    '--mep-accent': d.couleurs.accent,
    '--mep-fond': d.couleurs.fond,
    '--mep-texte': d.couleurs.texte,
    '--mep-doux': d.couleurs.doux,
    '--mep-police-titre': `'${d.polices.titre}', Georgia, serif`,
    '--mep-police-texte': `'${d.polices.texte}', system-ui, sans-serif`,
    '--mep-motif': motif(d.couleurs.fond, 0.18),
  } as CSSProperties
  return (
    <div className={`mep mep--${m.id}`} style={style} data-mise-en-page={m.id}>
      <Rendu m={m} d={d} apercu={apercu} />
    </div>
  )
}
