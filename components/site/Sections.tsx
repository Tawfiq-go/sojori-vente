/**
 * Les sections d'une page : bibliothèque (mise en page commune, variantes), sur mesure (HTML et CSS
 * déjà filtrés et préparés par srv-site) et blocs Sojori (données en direct). Chaque section porte
 * `data-section` : l'écran « Site web » s'en sert pour annoter (lot 4). Chaque texte de la bibliothèque
 * porte `data-champ` (`titre`, `elements.2.libelle`…) : on le modifie sur place dans l'aperçu
 * (Tawfiq, 28/10/2026). Rendu serveur seulement.
 */
import { cibleDeLOffre, lienWhatsappOffre, secondBoutonUtile } from '@/lib/site/offre'
import { lien } from '@/lib/site/route'
import { t } from '@/lib/site/texte'
import type { Langue, Media, OffreServie, Section, SitePublic, Texte } from '@/lib/site/types'
import { CarteRestaurant } from './CarteRestaurant'
import { SectionOffre } from './Offre'
import { BarreRecherche, BlocSojori, FondLogement } from './Sojori'

export type Contexte = {
  site: SitePublic
  /** Le slug du PM : la liste publique de ses logements (`?pm=`). */
  slug: string
  /** '' sur le domaine du PM ; `/site-apercu/<jeton>` dans l'aperçu. */
  base: string
  langue: Langue
  defaut: Langue
  /** La fenêtre de la landing d'offre dont la page fait partie (`page.offre`), avec son état à la lecture. */
  offre?: OffreServie
  /** Le titre de la page : celui de l'offre quand la section n'en a pas. */
  titrePage?: Texte
  /** L'identifiant de la page (landing) : le panneau de commande s'adresse à elle. */
  pageId?: string
}

function MediaVue({
  ref_,
  site,
  className,
  alt,
  attente,
}: {
  ref_: unknown
  site: SitePublic
  className?: string
  alt?: string
  /** L'image montrée le temps que la vidéo se charge (bandeau, `imageAttente`). */
  attente?: unknown
}) {
  const m: Media | undefined = typeof ref_ === 'string' ? site.medias[ref_] : undefined
  if (!m) return null
  const poster = typeof attente === 'string' ? site.medias[attente] : undefined
  if (m.type === 'video')
    return (
      <video
        className={className}
        src={m.url}
        poster={poster?.type === 'image' ? poster.url : undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt || m.alt || ''}
      />
    )
  return <img className={className} src={m.url} alt={alt || m.alt || ''} loading="lazy" decoding="async" />
}

/** Un lien de la fiche : interne (/chemin), ancre (#…), ou externe (https, mailto, tel). */
function href(brut: unknown, ctx: Contexte): string | undefined {
  // Landing d'offre avec paiement WhatsApp : la réservation devient WhatsApp (lib/site/offre.ts).
  const cible = cibleDeLOffre(brut, ctx.offre?.paiement)
  if (typeof cible !== 'string' || !cible) return undefined
  // `#whatsapp` : WhatsApp du compte du PM, avec un message qui nomme l'offre (sans numéro, pas de bouton).
  if (cible === '#whatsapp')
    return lienWhatsappOffre(ctx.site.contact?.whatsapp, ctx.langue, t(ctx.titrePage, ctx.langue, ctx.defaut) || ctx.site.spec.identite.nom)
  if (cible.startsWith('/')) return lien(ctx.base, ctx.langue, ctx.defaut, cible.slice(1))
  return cible
}

function Bouton({
  texte,
  cible,
  ctx,
  second = false,
  champ,
}: {
  texte: unknown
  cible: unknown
  ctx: Contexte
  second?: boolean
  /** Le champ du texte du bouton (`bouton`, `bouton2`) : modifiable sur place dans l'aperçu. */
  champ?: string
}) {
  const libelle = t(texte, ctx.langue, ctx.defaut)
  const h = href(cible, ctx)
  if (!libelle || !h) return null
  const externe = /^https:/i.test(h)
  return (
    <a
      className={second ? 'bouton bouton--second' : 'bouton'}
      href={h}
      data-champ={champ}
      {...(externe ? { target: '_blank', rel: 'noopener nofollow' } : {})}
    >
      {libelle}
    </a>
  )
}

const elements = (v: unknown): Array<Record<string, unknown>> =>
  Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object') : []

/** Un ou deux boutons (le second en contour), alignés. */
function Actions({ c, ctx }: { c: Record<string, unknown>; ctx: Contexte }) {
  if (!c.bouton && !c.bouton2) return null
  return (
    <div className="actions">
      <Bouton texte={c.bouton} cible={c.lien} ctx={ctx} champ="bouton" />
      {secondBoutonUtile(c.lien2, ctx.offre?.paiement) && <Bouton texte={c.bouton2} cible={c.lien2} ctx={ctx} second champ="bouton2" />}
    </div>
  )
}

function Bibliotheque({ s, ctx, premier = false }: { s: Extract<Section, { niveau: 'bibliotheque' }>; ctx: Contexte; premier?: boolean }) {
  const c = s.contenu
  const tx = (k: string) => t(c[k], ctx.langue, ctx.defaut)
  const classe = `section ${s.type} ${s.type}--${s.variante}`
  const surTitre = tx('surTitre') ? (
    <p className="sur-titre" data-champ="surTitre">
      {tx('surTitre')}
    </p>
  ) : null
  switch (s.type) {
    case 'bandeau': {
      // `plein_ecran_recherche` : le plein écran, avec la recherche de dates (comme le moteur) dans le premier écran.
      const recherche = s.variante === 'plein_ecran_recherche'
      return (
        <section className={recherche ? `${classe} bandeau--plein_ecran bandeau--recherche` : classe} data-section={s.id} id={s.id}>
          {s.variante !== 'texte_seul' &&
            (c.media === 'logement:auto' ? (
              <FondLogement ctx={ctx} className="bandeau__media" />
            ) : (
              <MediaVue ref_={c.media} site={ctx.site} className="bandeau__media" attente={c.imageAttente} />
            ))}
          <div className="bandeau__texte">
            {surTitre}
            {tx('titre') && <h1 data-champ="titre">{tx('titre')}</h1>}
            {tx('sousTitre') && (
              <p className="bandeau__sous" data-champ="sousTitre">
                {tx('sousTitre')}
              </p>
            )}
            <Actions c={c} ctx={ctx} />
            {recherche && <BarreRecherche ctx={ctx} />}
          </div>
          {elements(c.infos).length > 0 && (
            <ul className="bandeau__infos">
              {elements(c.infos).map((e, i) => (
                <li key={i} data-champ={`infos.${i}.texte`}>
                  {t(e.texte, ctx.langue, ctx.defaut)}
                </li>
              ))}
            </ul>
          )}
        </section>
      )
    }
    case 'texteImage':
      return (
        <section className={classe} data-section={s.id} id={s.id}>
          <MediaVue ref_={c.media} site={ctx.site} className="texteImage__media" />
          <div className="texteImage__texte">
            {surTitre}
            {tx('titre') &&
              (premier ? (
                // Premier bloc de la page : c'est le titre de la page (h1), pas un titre de section.
                <h1 className="titre-section" data-champ="titre">{tx('titre')}</h1>
              ) : (
                <h2 data-champ="titre">{tx('titre')}</h2>
              ))}
            {tx('texte') && (
              <p className="multiligne" data-champ="texte">
                {tx('texte')}
              </p>
            )}
            <Bouton texte={c.bouton} cible={c.lien} ctx={ctx} champ="bouton" />
          </div>
        </section>
      )
    case 'galerie':
      return (
        <section className={classe} data-section={s.id} id={s.id}>
          {tx('titre') && <h2 data-champ="titre">{tx('titre')}</h2>}
          <div className="galerie__grille">
            {(Array.isArray(c.medias) ? c.medias : []).map((m) => (
              <MediaVue key={String(m)} ref_={m} site={ctx.site} className="galerie__media" />
            ))}
          </div>
        </section>
      )
    case 'chiffres':
      return (
        <section className={classe} data-section={s.id} id={s.id}>
          {surTitre}
          {tx('titre') && <h2 data-champ="titre">{tx('titre')}</h2>}
          {tx('texte') && (
            <p className="chiffres__texte multiligne" data-champ="texte">
              {tx('texte')}
            </p>
          )}
          <div className="chiffres__liste">
            {elements(c.elements).map((e, i) => (
              <div key={i} className="chiffres__item">
                <strong data-champ={`elements.${i}.valeur`}>{t(e.valeur, ctx.langue, ctx.defaut)}</strong>
                <span data-champ={`elements.${i}.libelle`}>{t(e.libelle, ctx.langue, ctx.defaut)}</span>
              </div>
            ))}
          </div>
        </section>
      )
    case 'temoignages':
      return (
        <section className={classe} data-section={s.id} id={s.id}>
          {tx('titre') && <h2 data-champ="titre">{tx('titre')}</h2>}
          <div className="temoignages__liste">
            {elements(c.elements).map((e, i) => (
              <figure key={i} className="temoignages__item">
                <blockquote data-champ={`elements.${i}.texte`}>{t(e.texte, ctx.langue, ctx.defaut)}</blockquote>
                <figcaption data-champ={`elements.${i}.auteur`}>{t(e.auteur, ctx.langue, ctx.defaut)}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )
    case 'appel':
      return (
        <section className={classe} data-section={s.id} id={s.id}>
          <div className="appel__boite">
            {surTitre}
            {tx('titre') && <h2 data-champ="titre">{tx('titre')}</h2>}
            {tx('texte') && <p data-champ="texte">{tx('texte')}</p>}
            <Actions c={c} ctx={ctx} />
          </div>
        </section>
      )
    case 'offre':
      return <SectionOffre s={s} ctx={ctx} />
    case 'carteRestaurant':
      return <CarteRestaurant id={s.id} variante={s.variante} contenu={c} ctx={ctx} />
    case 'equipe':
      return (
        <section className={classe} data-section={s.id} id={s.id}>
          {tx('titre') && <h2 data-champ="titre">{tx('titre')}</h2>}
          <div className="equipe__liste">
            {elements(c.elements).map((e, i) => (
              <div key={i} className="equipe__item">
                <MediaVue ref_={e.photo} site={ctx.site} className="equipe__photo" alt={t(e.nom, ctx.langue, ctx.defaut)} />
                <strong data-champ={`elements.${i}.nom`}>{t(e.nom, ctx.langue, ctx.defaut)}</strong>
                <span data-champ={`elements.${i}.role`}>{t(e.role, ctx.langue, ctx.defaut)}</span>
              </div>
            ))}
          </div>
        </section>
      )
    default:
      return null
  }
}

/** Sur mesure : HTML filtré à l'écriture et préparé par srv-site (médias, CSS enfermé). */
function Mesure({ s, ctx }: { s: Extract<Section, { niveau: 'mesure' }>; ctx: Contexte }) {
  const html = t(s.html, ctx.langue, ctx.defaut)
  if (!html) return null
  return (
    <section className="section mesure" data-section={s.id} id={s.id}>
      {s.css && <style>{s.css}</style>}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  )
}

export function Sections({ sections, ctx }: { sections: Section[]; ctx: Contexte }) {
  return (
    <>
      {sections.map((s, i) => {
        if (s.niveau === 'bibliotheque') return <Bibliotheque key={s.id} s={s} ctx={ctx} premier={i === 0} />
        if (s.niveau === 'mesure') return <Mesure key={s.id} s={s} ctx={ctx} />
        return <BlocSojori key={s.id} s={s} ctx={ctx} />
      })}
    </>
  )
}
