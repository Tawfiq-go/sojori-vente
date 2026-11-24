/**
 * La section « offre » d'une landing : le premier écran de la page d'une offre (Black Friday, Ramadan…) — titre,
 * valeur de l'offre, conditions, décompte jusqu'à la fin et boutons. Les dates et le design sont ceux de la PAGE
 * (`page.offre`, calculés par srv-site) ; ici, seulement l'affichage. Aucun élément de la plateforme : tout vient de
 * la fiche du PM et de son thème. Le bouton mène au moteur de réservation du site (`/reserver`) ou à WhatsApp ;
 * l'offre ne crée ni réservation ni paiement, SAUF une landing de service commandable avec l'interrupteur allumé : le panneau de
 * commande (CommandeLanding, lib/site/commande.ts) crée la commande de la prestation liée. Rendu serveur (décompte et panneau sont clients).
 */
import type { CSSProperties } from 'react'
import '@/app/mise-en-page.css'
import '@/app/mise-en-page-boheme.css'
import { commandeAllumee, dateCourte, datesAChoisir, indicationCalendrier, montantMad, panneauApercu, panneauCommande, quandAffiche, quandPeriodique, raisonFermee } from '@/lib/site/commande'
import { dateDuMoment, imagesDesEmplacements, miseEnPage } from '@/lib/site/miseEnPage'
import { prixServiceRemise } from '@/lib/site/jetons'
import { cibleDeLOffre, couleurValeurSurVoile, lienWhatsappOffre, secondBoutonUtile } from '@/lib/site/offre'
import { lien } from '@/lib/site/route'
import { mot, t } from '@/lib/site/texte'
import type { Media, Section } from '@/lib/site/types'
import { CommandeLanding } from './CommandeLanding'
import { Decompte } from './Decompte'
import { LandingMiseEnPage } from './miseEnPage/MisesEnPage'
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

/**
 * Une landing qui porte une MISE EN PAGE (srv-site, lot D1) : rendue dans sa composition (carte du chef, day pass…), aux couleurs
 * et polices de la page, avec ses emplacements d'images (médias du site ou photo du service). Les textes et les prix viennent de la
 * section « offre », champs dynamiques déjà remplacés par les vrais prix. Le bouton mène au panneau de commande quand il existe,
 * sinon à la cible de l'offre (réservation, WhatsApp).
 */
function OffreEnMiseEnPage({ s, ctx }: { s: Extract<Section, { niveau: 'bibliotheque' }>; ctx: Contexte }) {
  const offre = ctx.offre
  const mep = offre?.miseEnPage
  const m = mep ? miseEnPage(mep.id) : undefined
  if (!offre || !mep || !m) return null
  const c = s.contenu
  const tx = (k: string) => t(c[k], ctx.langue, ctx.defaut) || undefined
  const theme = ctx.site.spec.theme
  const commande = panneauCommande(offre, ctx.site.apercu, commandeAllumee())
  // L'aperçu montre le panneau d'un événement (brouillon compris) sans pouvoir réserver.
  const enApercu = panneauApercu(offre, ctx.site.apercu)
  const panneau = commande || enApercu
  const fermee = raisonFermee(offre.evenementLu, ctx.site.apercu)
  const titre = tx('titre') || t(ctx.titrePage, ctx.langue, ctx.defaut)
  const valeur = tx('valeur')
  // Le bouton : le panneau de commande s'il existe, sinon la cible de l'offre (réservation du site, WhatsApp), comme le rendu classique.
  const cible = cibleDeLOffre(c.lien, offre.paiement)
  const lienBouton = panneau
    ? '#reserver'
    : cible === '#whatsapp'
      ? lienWhatsappOffre(ctx.site.contact?.whatsapp, ctx.langue, titre, typeof c.code === 'string' ? c.code : undefined)
      : typeof cible === 'string' && cible.startsWith('/')
        ? lien(ctx.base, ctx.langue, ctx.defaut, cible.slice(1))
        : undefined
  // Soirée : les formules lisibles (prix du catalogue, jamais remisé), chacune menant au panneau avec SA formule choisie.
  const lang = ctx.langue === 'ar' || ctx.langue === 'en' ? ctx.langue : 'fr'
  // Landing d'un ÉVÉNEMENT : ses formules viennent de Services (ordre de l'événement), avec ce qui est compris et la taille d'une table.
  const evenement = offre.service?.forme === 'evenement'
  const formulesEvenement = (offre.formulesLues ?? []).flatMap((lu, indice) => {
    if (!lu) return []
    const table = lu.par === 'table' && lu.personnesParTable ? mot('soireeTable', ctx.langue).replace('{n}', String(lu.personnesParTable)) : ''
    return [
      {
        indice,
        nom: t(lu.nom, ctx.langue, ctx.defaut),
        prixCentimes: lu.prixCentimes,
        prix: typeof lu.prixCentimes === 'number' ? montantMad(lu.prixCentimes, lu.devise ?? 'MAD', lang) : undefined,
        points: [table, t(lu.description, ctx.langue, ctx.defaut)].filter(Boolean),
        badge: undefined,
        lien: fermee ? undefined : panneau && (lu.commandable || enApercu) ? `#reserver-f${indice}` : lienBouton,
        commandable: lu.commandable || enApercu,
        par: lu.par,
        id: lu.id,
        unite: mot(lu.par === 'table' ? 'cmdPrixTable' : 'evtPar_personne', ctx.langue),
        prixNombre: typeof lu.prixCentimes === 'number' ? new Intl.NumberFormat(lang === 'ar' ? 'ar-MA' : lang, { maximumFractionDigits: 2 }).format(lu.prixCentimes / 100) : undefined,
        devise: lu.devise ?? 'MAD',
      },
    ]
  })
  // Périodique : les places se lisent date par date dans le panneau, jamais un seul nombre en tête de page.
  const restantes = offre.evenementLu && !fermee
    ? offre.evenementLu.repetition
      ? undefined
      : offre.evenementLu.restantes > 0
      ? mot('soireeRestantes', ctx.langue).replace('{n}', String(offre.evenementLu.restantes))
      : mot('soireeComplet', ctx.langue)
    : undefined
  const formulesPage = (mep.formules ?? []).flatMap((f, indice) => {
    const lu = offre.formulesLues?.[indice]
    if (!lu) return []
    return [
      {
        indice,
        nom: t(lu.nom, ctx.langue, ctx.defaut) || f.service.nom,
        prixCentimes: lu.prixCentimes,
        prix: typeof lu.prixCentimes === 'number' ? montantMad(lu.prixCentimes, lu.devise ?? 'MAD', lang) : undefined,
        points: (f.points ?? []).map((p) => t(p, ctx.langue, ctx.defaut)).filter(Boolean),
        badge: t(f.badge, ctx.langue, ctx.defaut) || undefined,
        lien: commande && lu.commandable ? `#reserver-f${indice}` : lienBouton,
        commandable: lu.commandable,
        par: lu.par,
      },
    ]
  })
  const formules = evenement ? formulesEvenement : formulesPage
  const dates = datesAChoisir(offre.evenementLu)
  const quand = quandPeriodique(offre.evenementLu?.repetition, ctx.langue, { chaque: mot('evtChaque', ctx.langue), tous: mot('evtTousLesJours', ctx.langue) })
  const lieu = t(mep.evenement?.lieu, ctx.langue, ctx.defaut)
  // Bohème : page complète. Son en-tête, son pied, et le panneau de commande DANS la page (bandeau).
  const boheme = m.id === 'boheme'
  const repetition = offre.evenementLu?.repetition
  const affiche = boheme ? quandAffiche(repetition, offre.evenementLu?.debut ?? '', new Date().toISOString().slice(0, 10), ctx.langue, { des: mot('bohDes', ctx.langue), tous: mot('bohTous', ctx.langue), tousLesJours: mot('evtTousLesJours', ctx.langue) }) : ''
  const modesPaiement = panneau && evenement ? offre.evenementLu?.paiement : undefined
  const modes = [
    ...(modesPaiement?.surPlace ? [{ id: 'sur_place' as const, badge: mot('bohSansBadge', ctx.langue), titre: mot('bohSansTitre', ctx.langue), texte: mot('bohSansTexte', ctx.langue), bouton: mot('bohSansBouton', ctx.langue), lien: '#reserver-sur-place' }] : []),
    ...(modesPaiement?.carte ? [{ id: 'carte' as const, badge: mot('bohAvecBadge', ctx.langue), titre: mot('bohAvecTitre', ctx.langue), texte: mot('bohAvecTexte', ctx.langue), bouton: mot('bohAvecBouton', ctx.langue), lien: '#reserver-carte' }] : []),
  ]
  const legal = boheme ? ctx.site.spec.pages.find((p) => p.sections.some((x) => x.niveau === 'sojori' && x.type === 'legal')) : undefined
  const logoSite = ctx.site.spec.identite.logo ? ctx.site.medias[ctx.site.spec.identite.logo]?.url : undefined
  const chemin = ctx.site.spec.pages.find((p) => p.id === ctx.pageId)?.chemin ?? ''
  const commandeLanding = panneau && ctx.pageId && (
    <CommandeLanding
      slug={ctx.slug}
      pageId={ctx.pageId}
      langue={ctx.langue}
      devise={offre.serviceLu?.devise ?? 'MAD'}
      prixCentimes={offre.serviceLu?.prixCentimes}
      prixOffreCentimes={typeof offre.serviceLu?.prixCentimes === 'number' && offre.remise ? prixServiceRemise(offre.serviceLu.prixCentimes, offre.remise.pourcent, offre.remise.arrondi) : undefined}
      formules={formules.some((f) => f.commandable) ? formules.filter((f) => f.commandable).map((f) => ({ indice: f.indice, nom: f.nom, prixCentimes: f.prixCentimes, par: f.par, id: 'id' in f && typeof f.id === 'string' ? f.id : undefined })) : undefined}
      apercu={enApercu}
      whatsapp={evenement}
      paiement={evenement ? offre.evenementLu?.paiement : undefined}
      evenement={evenement && offre.evenementLu?.debut ? { debut: offre.evenementLu.debut, dates } : undefined}
      bandeau={boheme}
      indication={boheme ? indicationCalendrier(repetition, ctx.langue, { uniquement: mot('bohUniquement', ctx.langue), jusquau: mot('bohJusquau', ctx.langue) }) : undefined}
    />
  )
  const moment = mep.evenement?.quand ? dateDuMoment(mep.evenement.quand, lang) : ''
  return (
    <section className="section offre offre--mise-en-page" data-section={s.id} id={s.id}>
      <LandingMiseEnPage
        m={m}
        apercu={ctx.site.apercu}
        d={{
          marque: ctx.site.spec.identite.nom,
          couleurs: { accent: offre.design?.accent ?? theme.couleurs.accent, fond: theme.couleurs.fond, texte: theme.couleurs.texte, doux: offre.design?.accentDoux ?? theme.couleurs.accentDoux },
          polices: { titre: offre.design?.police ?? theme.polices.titres, texte: theme.polices.texte },
          surtitre: tx('surTitre'),
          titre,
          accroche: tx('accroche'),
          prix: valeur || (boheme && tx('valeurLibelle')) ? { offre: valeur, unite: tx('valeurLibelle') } : undefined,
          bouton: tx('bouton') || mot('reserver', ctx.langue),
          lien: lienBouton,
          conditions: tx('conditions'),
          code: typeof c.code === 'string' ? c.code : undefined,
          programme: mep.programme?.map((p) => ({ heure: p.heure, quoi: t(p.quoi, ctx.langue, ctx.defaut) })).filter((p) => p.quoi),
          atouts: mep.atouts?.map((a) => t(a, ctx.langue, ctx.defaut)).filter(Boolean),
          images: imagesDesEmplacements(mep.emplacements, ctx.site.medias, offre.serviceLu?.image),
          lieuDate: affiche || [lieu, moment || quand].filter(Boolean).join(' · ') || undefined,
          ...(boheme
            ? {
                boheme: {
                  logoSite,
                  langues: ctx.site.spec.langues.actives.map((lg) => ({ code: lg, lien: lien(ctx.base, lg, ctx.defaut, chemin), actif: lg === ctx.langue })),
                  ...(legal ? { mentions: { texte: mot('mentions', ctx.langue), lien: lien(ctx.base, ctx.langue, ctx.defaut, legal.chemin) } } : {}),
                  annee: new Date().getFullYear(),
                  modes,
                  panneau: commandeLanding || undefined,
                  mots: {
                    experience: mot('bohExperience', ctx.langue),
                    formules: mot('bohFormules', ctx.langue),
                    reserver: mot('reserver', ctx.langue),
                    reservation: mot('bohReservation', ctx.langue),
                    choix: mot('bohChoix', ctx.langue),
                    choisissez: mot('bohChoisissez', ctx.langue),
                    galerie: mot('bohGalerie', ctx.langue),
                    fermer: mot('bohFermer', ctx.langue),
                    photoAvant: mot('bohPhotoAvant', ctx.langue),
                    photoApres: mot('bohPhotoApres', ctx.langue),
                    conditions: mot('offreConditions', ctx.langue),
                  },
                },
              }
            : {}),
          ...(fermee ? { ferme: mot(fermee, ctx.langue) } : {}),
          dates: fermee
            ? undefined
            : dates?.slice(0, 6).map((x) => ({
                cle: x.date,
                nom: dateCourte(x.date, ctx.langue),
                places: x.restantes < 1 ? mot('soireeComplet', ctx.langue) : mot('soireeRestantes', ctx.langue).replace('{n}', String(x.restantes)),
                lien: x.restantes < 1 ? undefined : panneau ? `#reserver-d${x.date}` : lienBouton,
              })),
          momentUtc: offre.momentUtc,
          ...(restantes ? { restant: restantes } : {}),
          decompte: {
            j: mot('decompteJours', ctx.langue),
            h: mot('decompteHeures', ctx.langue),
            m: mot('decompteMinutes', ctx.langue),
            s: mot('decompteSecondes', ctx.langue),
            fin: mot('soireeMoment', ctx.langue),
          },
          palette: mep.palette?.map((c) => ({ nom: t(c.nom, ctx.langue, ctx.defaut), couleur: c.couleur })).filter((c) => c.nom),
          sections: mep.sections
            ?.map((x) => ({ titre: t(x.titre, ctx.langue, ctx.defaut), points: x.points.map((p) => t(p, ctx.langue, ctx.defaut)).filter(Boolean) }))
            .filter((x) => x.titre && x.points.length),
          formules,
          libelles: {
            formules: mot('soireeFormules', ctx.langue),
            voirFormules: mot('soireeVoirFormules', ctx.langue),
            programme: mot(m.id === 'soiree' ? 'soireeProgramme' : 'evtProgramme', ctx.langue),
            dates: mot('evtDates', ctx.langue),
            choisir: mot('soireeChoisir', ctx.langue),
            ambiance: mot('soireeAmbiance', ctx.langue),
          },
        }}
      />
      {commandeLanding && !boheme && (
        <div id="reserver" className="offre__commande-zone">
          {commandeLanding}
        </div>
      )}
    </section>
  )
}

export function SectionOffre({ s, ctx }: { s: Extract<Section, { niveau: 'bibliotheque' }>; ctx: Contexte }) {
  // Une offre terminée garde le rendu classique (message de fin) ; sinon, une mise en page connue prend la main.
  if (ctx.offre?.miseEnPage && miseEnPage(ctx.offre.miseEnPage.id) && !(ctx.offre.etat === 'terminee' && !ctx.site.apercu)) return <OffreEnMiseEnPage s={s} ctx={ctx} />
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
