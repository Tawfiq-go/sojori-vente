/**
 * Les blocs Sojori du site d'un PM : notre code, ses données en direct. La fiche ne garde que des
 * réglages et des identifiants ; prix et photos sont lus à l'affichage (srv-listing). Un logement
 * ouvre la page logement de sojori-vente, avec son tunnel de réservation aux couleurs du PM.
 * Un bloc pas encore branché ne s'affiche que dans l'aperçu, avec ce qu'il deviendra.
 */
import { lireAvis, lireLogements } from '@/lib/site/api'
import { mot, prix } from '@/lib/site/texte'
import type { Logement, Section } from '@/lib/site/types'
import { CarteSite } from './CarteSite'
import type { Contexte } from './Sections'

const nombre = (v: unknown, defaut: number) => (typeof v === 'number' ? v : defaut)

/** Sur le domaine du PM, le cookie du tenant suffit ; dans l'aperçu (domaine Sojori), `?pm=`. */
const suffixePm = (ctx: Contexte) => (ctx.base ? `?pm=${encodeURIComponent(ctx.slug)}` : '')
const lienLogement = (id: string, ctx: Contexte) => `/listings/${id}${suffixePm(ctx)}`

function Carte({ l, ctx }: { l: Logement; ctx: Contexte }) {
  return (
    <a className="logement-carte" href={lienLogement(l.id, ctx)}>
      {l.images?.[0] && <img src={l.images[0]} alt={l.title} loading="lazy" />}
      <div className="logement-carte__texte">
        <strong>{l.title}</strong>
        <span className="muet">
          {[l.city, l.maxGuests ? `${l.maxGuests} ${mot('voyageurs', ctx.langue)}` : '']
            .filter(Boolean)
            .join(' · ')}
        </span>
        {l.pricePerNight ? (
          <span>
            {mot('aPartirDe', ctx.langue)} <b>{prix(l.pricePerNight, l.currency || 'MAD', ctx.langue)}</b>{' '}
            {mot('parNuit', ctx.langue)}
          </span>
        ) : null}
      </div>
    </a>
  )
}

async function Logements({ s, ctx }: { s: Extract<Section, { niveau: 'sojori' }>; ctx: Contexte }) {
  const tous = await lireLogements(ctx.slug)
  const choisis = Array.isArray(s.reglages.logementIds) ? (s.reglages.logementIds as string[]) : []
  const logements = choisis.length
    ? choisis.map((id) => tous.find((l) => l.id === id)).filter((l): l is Logement => Boolean(l))
    : tous
  const variante = typeof s.reglages.variante === 'string' ? s.reglages.variante : 'grille'
  const titre = typeof s.reglages.titre === 'string' ? s.reglages.titre : ''
  return (
    <section
      className={`section logements logements--${variante}`}
      data-section={s.id}
      id={s.id}
      style={{ ['--colonnes' as string]: String(nombre(s.reglages.colonnes, 3)) }}
    >
      <span id="logements" />
      {titre && <h2>{titre}</h2>}
      {logements.length ? (
        <div className="logements__liste">
          {logements.map((l) => (
            <Carte key={l.id} l={l} ctx={ctx} />
          ))}
        </div>
      ) : (
        <p className="muet">{mot('aucunLogement', ctx.langue)}</p>
      )}
    </section>
  )
}

const LIBELLES_MENTIONS: Record<string, string> = {
  legalName: 'Raison sociale',
  legalForm: 'Forme juridique',
  ice: 'ICE',
  rc: 'RC',
  rcCity: 'Tribunal du RC',
  taxId: 'IF',
  address: 'Adresse',
  postalCode: 'Code postal',
  city: 'Ville',
  country: 'Pays',
  phone: 'Téléphone',
  email: 'E-mail',
}

function Legal({ s, ctx }: { s: Extract<Section, { niveau: 'sojori' }>; ctx: Contexte }) {
  const m = ctx.site.mentions ?? {}
  return (
    <section className="section legal" data-section={s.id} id={s.id}>
      <h1>{mot('mentions', ctx.langue)}</h1>
      <h2>{mot('editeur', ctx.langue)}</h2>
      {Object.keys(m).length ? (
        <dl className="legal__liste">
          {Object.entries(LIBELLES_MENTIONS).map(([k, libelle]) =>
            m[k] ? (
              <div key={k}>
                <dt>{libelle}</dt>
                <dd>{m[k]}</dd>
              </div>
            ) : null,
          )}
        </dl>
      ) : (
        ctx.site.apercu && (
          <p className="a-venir">
            Les mentions légales s’afficheront ici à la mise en ligne, depuis votre identité légale.
          </p>
        )
      )}
      <p>{mot('donnees', ctx.langue)}</p>
      <p className="muet">{mot('hebergement', ctx.langue)}</p>
    </section>
  )
}

/**
 * Contact : le WhatsApp du compte du PM (décision de Tawfiq, 27/10/2026) et le formulaire de sa page
 * de contact, relié à son CRM (anti-spam et plafond côté srv-crm). Les deux sont figés à la mise en
 * ligne ; l'aperçu montre le numéro d'aujourd'hui.
 */
function Contact({ s, ctx }: { s: Extract<Section, { niveau: 'sojori' }>; ctx: Contexte }) {
  const { whatsapp, formulaire } = ctx.site.contact ?? { whatsapp: null, formulaire: null }
  const avecWhatsapp = s.reglages.whatsapp !== false && Boolean(whatsapp)
  const avecFormulaire = s.reglages.formulaire !== false && Boolean(formulaire)
  const titre = typeof s.reglages.titre === 'string' ? s.reglages.titre : ''
  if (!avecWhatsapp && !avecFormulaire && !ctx.site.apercu) return null
  return (
    <section className="section contact" data-section={s.id} id={s.id}>
      {titre && <h2>{titre}</h2>}
      {avecWhatsapp && (
        <a
          className="bouton contact__whatsapp"
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mot('bonjourWhatsapp', ctx.langue))}`}
          target="_blank"
          rel="noopener nofollow"
        >
          {mot('ecrireWhatsapp', ctx.langue)}
        </a>
      )}
      {avecFormulaire && (
        <iframe
          className="contact__formulaire"
          src={formulaire as string}
          title={mot('formulaire', ctx.langue)}
          loading="lazy"
        />
      )}
      {ctx.site.apercu && !avecFormulaire && s.reglages.formulaire !== false && (
        <p className="a-venir">
          Le formulaire de votre page de contact s’affichera ici à la mise en ligne, si votre page de
          contact est en ligne.
        </p>
      )}
      {ctx.site.apercu && !avecWhatsapp && s.reglages.whatsapp !== false && (
        <p className="a-venir">Aucun numéro sur votre compte : le bouton WhatsApp n’apparaîtra pas.</p>
      )}
    </section>
  )
}

/** Avis : ceux des logements du PM (route publique des avis), les plus récents, avec un texte. */
async function AvisVoyageurs({ s, ctx }: { s: Extract<Section, { niveau: 'sojori' }>; ctx: Contexte }) {
  const avis = await lireAvis(ctx.slug, Math.min(12, Math.max(3, nombre(s.reglages.nombre, 6))))
  const titre = typeof s.reglages.titre === 'string' ? s.reglages.titre : ''
  const variante = s.reglages.variante === 'carrousel' ? 'carrousel' : 'cartes'
  if (!avis.length) {
    return ctx.site.apercu ? (
      <section className="section a-venir" data-section={s.id} id={s.id}>
        Pas encore d’avis écrits sur vos logements : ce bloc restera invisible jusque-là.
      </section>
    ) : null
  }
  return (
    <section className={`section avis avis--${variante}`} data-section={s.id} id={s.id}>
      {titre && <h2>{titre}</h2>}
      <div className="avis__liste">
        {avis.map((a) => (
          <figure key={a.id} className="avis__item">
            {a.note != null && (
              <span className="avis__note" aria-label={`${a.note} / 5`}>
                {'★'.repeat(Math.round(a.note))}
              </span>
            )}
            <blockquote>{a.texte}</blockquote>
            <figcaption className="muet">{[a.prenom, a.logement].filter(Boolean).join(' · ')}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

/** Carte : les logements du PM qui ont des coordonnées, sur la carte de la recherche. */
async function CarteDesLogements({ s, ctx }: { s: Extract<Section, { niveau: 'sojori' }>; ctx: Contexte }) {
  const places = (await lireLogements(ctx.slug))
    .filter((l) => l.lat != null && l.lng != null)
    .map((l) => ({
      id: l.id,
      title: l.title,
      city: l.city,
      price: l.pricePerNight ?? 0,
      currency: l.currency,
      lat: l.lat,
      lng: l.lng,
      image: l.images?.[0],
      rating: l.rating,
    }))
  const titre = typeof s.reglages.titre === 'string' ? s.reglages.titre : mot('surLaCarte', ctx.langue)
  if (!places.length) {
    return ctx.site.apercu ? (
      <section className="section a-venir" data-section={s.id} id={s.id}>
        Aucun de vos logements n’a encore de position : la carte restera invisible jusque-là.
      </section>
    ) : null
  }
  return (
    <section className="section carte" data-section={s.id} id={s.id}>
      {titre && <h2>{titre}</h2>}
      <CarteSite logements={places} suffixe={suffixePm(ctx)} />
    </section>
  )
}

/**
 * Recherche : dates et voyageurs, puis la recherche de sojori-vente, limitée aux logements du PM
 * (cookie du domaine ; `pm` dans l'aperçu). Un simple formulaire GET : rien côté navigateur.
 */
function Recherche({ s, ctx }: { s: Extract<Section, { niveau: 'sojori' }>; ctx: Contexte }) {
  const titre = typeof s.reglages.titre === 'string' ? s.reglages.titre : ''
  return (
    <section className="section recherche" data-section={s.id} id={s.id}>
      {titre && <h2>{titre}</h2>}
      <form className="recherche__barre" action="/search" method="get">
        {ctx.base && <input type="hidden" name="pm" value={ctx.slug} />}
        <label>
          <span>{mot('arrivee', ctx.langue)}</span>
          <input type="date" name="checkIn" required />
        </label>
        <label>
          <span>{mot('depart', ctx.langue)}</span>
          <input type="date" name="checkOut" required />
        </label>
        <label>
          <span>{mot('adultes', ctx.langue)}</span>
          <input type="number" name="adults" min={1} max={20} defaultValue={2} />
        </label>
        <button className="bouton" type="submit">
          {mot('rechercher', ctx.langue)}
        </button>
      </form>
    </section>
  )
}

const A_VENIR: Record<string, string> = {
  faq: 'vos questions fréquentes',
  experiences: 'vos expériences et services',
  logement: 'la page d’un logement',
}

export async function BlocSojori({ s, ctx }: { s: Extract<Section, { niveau: 'sojori' }>; ctx: Contexte }) {
  if (s.type === 'logements') return <Logements s={s} ctx={ctx} />
  if (s.type === 'legal') return <Legal s={s} ctx={ctx} />
  if (s.type === 'contact') return <Contact s={s} ctx={ctx} />
  if (s.type === 'avis') return <AvisVoyageurs s={s} ctx={ctx} />
  if (s.type === 'carte') return <CarteDesLogements s={s} ctx={ctx} />
  if (s.type === 'recherche') return <Recherche s={s} ctx={ctx} />
  // Pas encore branché : rien pour les visiteurs, une place visible dans l'aperçu.
  if (!ctx.site.apercu) return null
  return (
    <section className="section a-venir" data-section={s.id} id={s.id}>
      Bloc « {s.type} » à venir : {A_VENIR[s.type] ?? 'bientôt'}.
    </section>
  )
}
