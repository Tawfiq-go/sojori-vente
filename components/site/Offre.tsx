/**
 * La section « offre » d'une landing : le premier écran de la page d'une offre (Black Friday, Ramadan…) — titre,
 * valeur de l'offre, conditions, décompte jusqu'à la fin et boutons. Les dates et le design sont ceux de la PAGE
 * (`page.offre`, calculés par srv-site) ; ici, seulement l'affichage. Aucun élément de la plateforme : tout vient de
 * la fiche du PM et de son thème. Le bouton mène au moteur de réservation du site (`/reserver`) ou à WhatsApp ;
 * l'offre ne crée ni réservation ni paiement, SAUF une landing de service commandable avec l'interrupteur allumé : le panneau de
 * commande (CommandeLanding, lib/site/commande.ts) crée la commande de la prestation liée. Rendu serveur (décompte et panneau sont clients).
 */
import type { CSSProperties } from 'react'
import { commandeAllumee, panneauCommande } from '@/lib/site/commande'
import { prixServiceRemise } from '@/lib/site/jetons'
import { cibleDeLOffre, couleurValeurSurVoile, lienWhatsappOffre, secondBoutonUtile } from '@/lib/site/offre'
import { lien } from '@/lib/site/route'
import { mot, t } from '@/lib/site/texte'
import type { Media, Section } from '@/lib/site/types'
import { CommandeLanding } from './CommandeLanding'
import { Decompte } from './Decompte'
import { FondLogement } from './Sojori'
import type { Contexte } from './Sections'

function Visuel({ c, ctx }: { c: Record<string, unknown>; ctx: Contexte }) {
  if (c.media === 'logement:auto') return <FondLogement ctx={ctx} className="offre__media" />
  // La photo de couverture du service lié, lue en direct par srv-site (https seulement ; absente = pas de visuel, jamais une autre image).
  if (c.media === 'service:auto') {
    const url = ctx.offre?.serviceLu?.image
    return typeof url === 'string' && /^https:\/\//i.test(url) ? <img className="offre__media" src={url} alt={t(ctx.offre?.serviceLu?.nom, ctx.langue, ctx.defaut)} loading="eager" decoding="async" /> : null
  }
  const m: Media | undefined = typeof c.media === 'string' ? ctx.site.medias[c.media] : undefined
  if (!m) return null
  const attente = typeof c.imageAttente === 'string' ? ctx.site.medias[c.imageAttente] : undefined
  if (m.type === 'video')
    return (
      <video className="offre__media" src={m.url} poster={attente?.type === 'image' ? attente.url : undefined} autoPlay muted loop playsInline preload="metadata" aria-label={m.alt || ''} />
    )
  return <img className="offre__media" src={m.url} alt={m.alt || ''} loading="eager" decoding="async" />
}

/** Un bouton de l'offre : interne (/reserver…), `#whatsapp` (numéro du compte du PM) ou externe. */
function BoutonOffre({ texte, cible: brut, ctx, titre, code, second }: { texte: unknown; cible: unknown; ctx: Contexte; titre: string; code?: string; second?: boolean }) {
  const cible = cibleDeLOffre(brut, ctx.offre?.paiement)
  const libelle = t(texte, ctx.langue, ctx.defaut)
  if (!libelle || typeof cible !== 'string' || !cible) return null
  let h: string | undefined
  if (cible === '#whatsapp') h = lienWhatsappOffre(ctx.site.contact?.whatsapp, ctx.langue, titre, code)
  else if (cible.startsWith('/')) h = lien(ctx.base, ctx.langue, ctx.defaut, cible.slice(1))
  else h = cible
  if (!h) return null
  const externe = /^https:/i.test(h)
  return (
    <a className={second ? 'bouton bouton--second' : 'bouton'} href={h} {...(externe ? { target: '_blank', rel: 'noopener nofollow' } : {})}>
      {libelle}
    </a>
  )
}

export function SectionOffre({ s, ctx }: { s: Extract<Section, { niveau: 'bibliotheque' }>; ctx: Contexte }) {
  const c = s.contenu
  const tx = (k: string) => t(c[k], ctx.langue, ctx.defaut)
  const offre = ctx.offre
  // Une landing terminée (public) : le message de fin, plus aucun bouton vers l'offre.
  const terminee = offre?.etat === 'terminee' && !ctx.site.apercu
  const titre = tx('titre') || t(ctx.titrePage, ctx.langue, ctx.defaut)
  const code = typeof c.code === 'string' ? c.code : undefined
  const decompte = !terminee && offre?.finUtc && tx('decompteLibelle')
  const variante = s.variante === 'moitie' || s.variante === 'carte' ? s.variante : 'plein_ecran'
  return (
    <section
      className={`section offre offre--${variante}${terminee ? ' offre--terminee' : ''}`}
      data-section={s.id}
      id={s.id}
      // Plein écran : la valeur se lit sur le voile sombre, quel que soit l'accent (voir couleurValeurSurVoile).
      style={variante === 'plein_ecran' ? ({ '--valeur-voile': couleurValeurSurVoile(offre?.design?.accent ?? ctx.site.spec.theme.couleurs.accent) } as CSSProperties) : undefined}
    >
      {variante !== 'carte' && <Visuel c={c} ctx={ctx} />}
      <div className="offre__texte">
        {tx('surTitre') && (
          <p className="sur-titre" data-champ="surTitre">
            {tx('surTitre')}
          </p>
        )}
        {titre && <h1 data-champ="titre">{titre}</h1>}
        {tx('accroche') && (
          <p className="offre__accroche" data-champ="accroche">
            {tx('accroche')}
          </p>
        )}
        {terminee ? (
          <div className="offre__fin">
            <strong>{mot('offreTerminee', ctx.langue)}</strong>
            <p>{tx('messageFin') || mot('offreTermineeTexte', ctx.langue)}</p>
            <a className="bouton" href={lien(ctx.base, ctx.langue, ctx.defaut, 'reserver')}>
              {mot('reserver', ctx.langue)}
            </a>
          </div>
        ) : (
          <>
            {tx('valeur') && (
              <p className="offre__valeur">
                <strong data-champ="valeur">{tx('valeur')}</strong>
                {tx('valeurLibelle') && <span data-champ="valeurLibelle">{tx('valeurLibelle')}</span>}
              </p>
            )}
            {decompte && offre?.finUtc && (
              <div className="offre__compte">
                <p className="offre__decompte-titre" data-champ="decompteLibelle">
                  {tx('decompteLibelle')}
                </p>
                <Decompte
                  finUtc={offre.finUtc}
                  libelles={{
                    j: mot('decompteJours', ctx.langue),
                    h: mot('decompteHeures', ctx.langue),
                    m: mot('decompteMinutes', ctx.langue),
                    s: mot('decompteSecondes', ctx.langue),
                    fin: mot('offreTerminee', ctx.langue),
                  }}
                />
              </div>
            )}
            <div className="actions">
              <BoutonOffre texte={c.bouton} cible={c.lien} ctx={ctx} titre={titre} code={code} />
              {secondBoutonUtile(c.lien2, offre?.paiement) && <BoutonOffre texte={c.bouton2} cible={c.lien2} ctx={ctx} titre={titre} code={code} second />}
            </div>
            {panneauCommande(offre, ctx.site.apercu, commandeAllumee()) && ctx.pageId && (
              <CommandeLanding
                slug={ctx.slug}
                pageId={ctx.pageId}
                langue={ctx.langue}
                devise={offre?.serviceLu?.devise ?? 'MAD'}
                prixCentimes={offre?.serviceLu?.prixCentimes}
                prixOffreCentimes={typeof offre?.serviceLu?.prixCentimes === 'number' && offre.remise ? prixServiceRemise(offre.serviceLu.prixCentimes, offre.remise.pourcent, offre.remise.arrondi) : undefined}
              />
            )}
            {ctx.offre?.cadeauLu && t(ctx.offre.cadeauLu.nom, ctx.langue, ctx.defaut) && (
              <p className="offre__cadeau">
                <strong>{mot('cadeauOffert', ctx.langue)}</strong> {t(ctx.offre.cadeauLu.nom, ctx.langue, ctx.defaut)}
              </p>
            )}
            {code && (
              <p className="offre__code">
                {mot('offreCode', ctx.langue)} : <code>{code}</code>
              </p>
            )}
          </>
        )}
        {tx('conditions') && !terminee && (
          <details className="offre__conditions">
            <summary>{mot('offreConditions', ctx.langue)}</summary>
            <p className="multiligne" data-champ="conditions">
              {tx('conditions')}
            </p>
          </details>
        )}
      </div>
    </section>
  )
}
