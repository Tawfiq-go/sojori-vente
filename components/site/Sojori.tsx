/**
 * Les blocs Sojori du site d'un PM : notre code, ses données en direct. La fiche ne garde que des
 * réglages et des identifiants ; prix et photos sont lus à l'affichage (srv-listing). Un logement
 * ouvre la page logement de sojori-vente, avec son tunnel de réservation aux couleurs du PM.
 * Un bloc pas encore branché ne s'affiche que dans l'aperçu, avec ce qu'il deviendra.
 */
import { lireLogements } from '@/lib/site/api'
import { mot, prix } from '@/lib/site/texte'
import type { Logement, Section } from '@/lib/site/types'
import type { Contexte } from './Sections'

const nombre = (v: unknown, defaut: number) => (typeof v === 'number' ? v : defaut)

/** Sur le domaine du PM, le cookie du tenant suffit ; dans l'aperçu (domaine Sojori), `?pm=`. */
const lienLogement = (id: string, ctx: Contexte) =>
  `/listings/${id}${ctx.base ? `?pm=${encodeURIComponent(ctx.slug)}` : ''}`

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

const A_VENIR: Record<string, string> = {
  avis: 'les avis de vos voyageurs',
  faq: 'vos questions fréquentes',
  contact: 'votre contact WhatsApp et le formulaire',
  carte: 'la carte de vos logements',
  experiences: 'vos expériences et services',
  recherche: 'la recherche par dates',
  logement: 'la page d’un logement',
}

export async function BlocSojori({ s, ctx }: { s: Extract<Section, { niveau: 'sojori' }>; ctx: Contexte }) {
  if (s.type === 'logements') return <Logements s={s} ctx={ctx} />
  if (s.type === 'legal') return <Legal s={s} ctx={ctx} />
  // Pas encore branché : rien pour les visiteurs, une place visible dans l'aperçu.
  if (!ctx.site.apercu) return null
  return (
    <section className="section a-venir" data-section={s.id} id={s.id}>
      Bloc « {s.type} » : {A_VENIR[s.type] ?? 'bientôt'} s’afficheront ici.
    </section>
  )
}
