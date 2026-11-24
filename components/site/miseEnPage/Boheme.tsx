/**
 * La mise en page « bohème » (24/11/2026, demande de Tawfiq : reprendre à l'identique l'affiche du brunch de Nommos) : une affiche plein
 * écran, le titre sur du papier déchiré, comment réserver, une photo par formule, le calendrier et le récapitulatif, une galerie. Page
 * COMPLÈTE : son en-tête et son pied. Rien n'est propre à un client : textes, dates, prix et places viennent de l'événement, les photos
 * des médias du site ; la couleur d'accent est celle de la landing.
 */
import type { ReactNode } from 'react'
import { type Emplacement, type MiseEnPage, libelleRole, rendreEmplacement } from '@/lib/site/miseEnPage'
import { titreAffiche } from '@/lib/site/commande'
import { GalerieAgrandie } from './GalerieAgrandie'
import type { DonneesLanding } from './MisesEnPage'

const Calendrier = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </svg>
)
const Carte = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 9.5h19M6 15h4" />
  </svg>
)
const Fleche = () => (
  <span className="mep-boheme__fleche" aria-hidden="true">
    →
  </span>
)

function Titre({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 className="mep-boheme__h2" id={id}>
      <span aria-hidden="true" />
      {children}
      <span aria-hidden="true" />
    </h2>
  )
}

function Vide({ e }: { e: Emplacement }) {
  return (
    <div className="mep-boheme__vide" data-emplacement={e.id}>
      <span>
        ＋ {libelleRole[e.role]} · {e.format}
      </span>
    </div>
  )
}

export function Boheme({ m, d, apercu }: { m: MiseEnPage; d: DonneesLanding; apercu: boolean }) {
  const b = d.boheme
  if (!b) return null
  const empl = (id: string) => m.emplacements.find((e) => e.id === id) as Emplacement
  const image = (id: string) => {
    const r = rendreEmplacement(d.images[id], false)
    return r.type === 'photo' ? r.src : undefined
  }
  const { grand, ecriture } = titreAffiche(d.titre)
  const couverture = image('couverture')
  const logo = image('logo') ?? b.logoSite
  const paiements = image('paiements')
  const galerie = m.emplacements.filter((e) => /^photo\d+$/.test(e.id))
  const photos = galerie.flatMap((e) => {
    const src = image(e.id)
    return src ? [{ id: e.id, src }] : []
  })
  const [badge1, ...badgeSuite] = (d.prix?.offre ?? '').trim().split(/\s+/)
  const reserver = d.ferme ? (
    <p className="mep-ferme">{d.ferme}</p>
  ) : (
    <a className="mep-boheme__bouton mep-boheme__bouton--grand" href={b.modes.length ? '#modes' : (d.lien ?? '#reserver')}>
      <Calendrier /> {d.bouton} <Fleche />
    </a>
  )
  return (
    <div className="mep-boheme">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,500;1,500&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Playfair+Display:wght@600;700;800;900&family=Yellowtail&display=swap" />
      <header className="mep-boheme__entete" data-bloc="entete">
        <a className="mep-boheme__logo" href="#affiche">
          {logo ? <img src={logo} alt={d.marque} /> : <strong>{d.marque}</strong>}
        </a>
        <nav aria-label="Menu">
          <a href="#affiche">{b.mots.experience}</a>
          <a href="#formules">{b.mots.formules}</a>
          {!d.ferme && (
            <a className="mep-boheme__bouton mep-boheme__bouton--petit" href={b.modes.length ? '#modes' : '#reserver'}>
              {b.mots.reserver}
            </a>
          )}
        </nav>
        {b.langues.length > 1 && (
          <nav className="mep-boheme__langues" aria-label="Langue">
            {b.langues.map((x) => (
              <a key={x.code} href={x.lien} hrefLang={x.code} aria-current={x.actif ? 'true' : undefined}>
                {x.code.toUpperCase()}
              </a>
            ))}
          </nav>
        )}
      </header>

      <section className={`mep-boheme__affiche${couverture ? '' : ' mep-boheme__affiche--sans'}`} id="affiche">
        {couverture ? <img className="mep-boheme__fond" src={couverture} alt="" loading="eager" decoding="async" /> : apercu ? <Vide e={empl('couverture')} /> : null}
        <div className="mep-boheme__voile" aria-hidden="true" />
        {badge1 && (
          <span className="mep-boheme__badge" data-champ="valeur">
            <svg viewBox="0 0 240 150" preserveAspectRatio="none" aria-hidden="true">
              <ellipse cx="120" cy="75" rx="112" ry="60" filter="url(#mep-dechire-badge)" />
            </svg>
            <span>
              {badge1}
              {badgeSuite.length > 0 && <em>{badgeSuite.join(' ')}</em>}
            </span>
          </span>
        )}
        <svg className="mep-boheme__papier" viewBox="0 0 640 520" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <filter id="mep-dechire" x="-15%" y="-15%" width="130%" height="130%">
              <feTurbulence type="fractalNoise" baseFrequency="0.014 0.02" numOctaves="4" seed="7" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="34" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="mep-dechire-badge" x="-16%" y="-16%" width="132%" height="132%">
              <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="3" seed="5" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <ellipse cx="320" cy="260" rx="290" ry="220" filter="url(#mep-dechire)" />
        </svg>
        <div className="mep-boheme__centre">
          <h1>
            <span className="mep-boheme__grand">{grand}</span>
            {ecriture && (
              <span className="mep-boheme__ecriture">
                {ecriture}
                <svg viewBox="0 0 360 46" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M8 31 C 80 19, 190 16, 262 20 C 305 22, 332 22, 356 11 C 340 26, 306 31, 262 30 C 190 31, 82 33, 10 35 C 6 35 5 31 8 31 Z" />
                </svg>
              </span>
            )}
          </h1>
          {d.accroche && <p className="mep-boheme__accroche">{d.accroche}</p>}
          {d.lieuDate && <p className="mep-boheme__quand">{d.lieuDate}</p>}
          <div>{reserver}</div>
        </div>
      </section>

      {!d.ferme && b.modes.length > 0 && (
        <section className="mep-boheme__bloc" id="modes">
          <Titre>{b.mots.reservation}</Titre>
          {b.modes.length > 1 && <p className="mep-boheme__sous">{b.mots.choix}</p>}
          <div className="mep-boheme__modes" data-nombre={b.modes.length}>
            {b.modes.map((x) => (
              <article key={x.id}>
                <div className="mep-boheme__mode-tete">
                  <span className="mep-boheme__icone">{x.id === 'carte' ? <Carte /> : <Calendrier />}</span>
                  <span className="mep-boheme__etiquette">{x.badge}</span>
                </div>
                <h3>{x.titre}</h3>
                <p>{x.texte}</p>
                <a className="mep-boheme__bouton" href={x.lien}>
                  {x.bouton} <Fleche />
                </a>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mep-boheme__bloc" id="formules">
        <Titre>{b.mots.choisissez}</Titre>
        <div className="mep-boheme__formules">
          {(d.formules ?? []).map((f, i) => {
            const src = image(`formule${i + 1}`)
            const carte = (
              <>
                {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : apercu && i < 3 ? <Vide e={empl(`formule${i + 1}`)} /> : null}
                <div>
                  <h3>{f.nom}</h3>
                  {f.prixNombre && (
                    <p className="mep-boheme__prix">
                      <strong>{f.prixNombre}</strong> <span>{f.devise}</span>
                    </p>
                  )}
                  {f.unite && <p className="mep-boheme__unite">{f.unite}</p>}
                  {f.points.length > 0 && <p className="mep-boheme__points">{f.points.join(' · ')}</p>}
                </div>
              </>
            )
            return f.lien ? (
              <a key={f.indice} className="mep-boheme__formule" href={f.lien}>
                {carte}
              </a>
            ) : (
              <article key={f.indice} className="mep-boheme__formule">
                {carte}
              </article>
            )
          })}
        </div>
        {b.panneau && (
          <div id="reserver" className="mep-boheme__panneau">
            {b.panneau}
          </div>
        )}
      </section>

      {(photos.length > 0 || apercu) && (
        <section className="mep-boheme__bloc" id="galerie">
          <Titre>{b.mots.galerie}</Titre>
          {photos.length > 0 ? (
            <GalerieAgrandie photos={photos} libelles={{ fermer: b.mots.fermer, avant: b.mots.photoAvant, apres: b.mots.photoApres, photo: b.mots.galerie }} />
          ) : (
            <div className="mep-boheme__grille" data-nombre={galerie.length}>
              {galerie.map((e) => (
                <Vide key={e.id} e={e} />
              ))}
            </div>
          )}
        </section>
      )}

      <footer className="mep-boheme__pied" data-bloc="pied">
        {d.prix?.unite && (
          <p className="mep-boheme__devise" data-champ="valeurLibelle">
            {d.prix.unite}
          </p>
        )}
        {paiements && <img className="mep-boheme__paiements" src={paiements} alt="" loading="lazy" decoding="async" />}
        {d.conditions && (
          <details>
            <summary>{b.mots.conditions}</summary>
            <p className="multiligne" data-champ="conditions">
              {d.conditions}
            </p>
          </details>
        )}
        {b.mentions && <a href={b.mentions.lien}>{b.mentions.texte}</a>}
        <p className="mep-boheme__droits">
          © {b.annee} {d.marque}
        </p>
      </footer>
    </div>
  )
}
