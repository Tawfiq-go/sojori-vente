/**
 * Le cadre du site d'un PM : en-tête (logo, pages, langues, bouton Réserver), pied de page, WhatsApp
 * flottant, enfermés dans `.site-pm` avec les couleurs et polices du thème. Partagé par les pages de la
 * fiche (`SitePm`) et par la page de réservation du site (`/reserver`), pour que le moteur de réservation
 * porte le design du client et jamais celui de Sojori (Tawfiq, 20/11/2026).
 */
import type { ReactNode } from 'react'
import { lien } from '@/lib/site/route'
import { mot, t } from '@/lib/site/texte'
import { lienPolices, variablesDuTheme } from '@/lib/site/theme'
import type { Langue, SitePublic } from '@/lib/site/types'
import { Reseaux, WhatsappFlottant } from './Reseaux'
import '@/app/site-pm.css'
import '@/app/site-styles.css'

/** Le chemin, dans le site, de la page de réservation (dates → logements du PM). */
export const CHEMIN_RESERVER = 'reserver'

export function CadreSite({
  site,
  base,
  langue,
  chemin,
  pageId,
  children,
  apres,
}: {
  site: SitePublic
  /** '' sur le domaine du PM ; `/site-apercu/<jeton>/<slug>` dans l'aperçu ; `/site-pm/<slug>` sur sojori-vente. */
  base: string
  langue: Langue
  /** Le chemin de la page courante (liens de langue, entrée de menu active). */
  chemin: string
  pageId?: string
  children: ReactNode
  /** Rendu après le pied de page (assistant, annotations). */
  apres?: ReactNode
}) {
  const { defaut, actives } = site.spec.langues
  const legal = site.spec.pages.find((p) => p.sections.some((s) => s.niveau === 'sojori' && s.type === 'legal'))
  const logo = site.spec.identite.logo ? site.medias[site.spec.identite.logo] : undefined
  // L'en-tête : logo seul (défaut quand il y en a un), logo et nom, ou nom seul (28/10/2026).
  const affichage = site.spec.identite.affichage ?? 'logo'
  const whatsapp = site.spec.identite.whatsappFlottant ? site.contact?.whatsapp : null
  const l = (lg: Langue, c: string) => lien(base, lg, defaut, c)
  return (
    <div
      className="site-pm"
      data-style={site.spec.theme.style ?? 'classique'}
      data-anim={site.spec.theme.animations ?? 'douces'}
      dir={langue === 'ar' ? 'rtl' : 'ltr'}
      lang={langue}
      style={variablesDuTheme(site.spec.theme)}
    >
      <link rel="stylesheet" href={lienPolices(site.spec.theme)} />
      {/* Style minimal : le mot en écriture manuscrite du premier écran sobre (Nommos Beach Resort, 20/11/2026). */}
      {site.spec.theme.style === 'minimal' && (
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" />
      )}
      {/* Pas de bandeau « Aperçu — non publié » (Tawfiq, 16/11/2026) : l'écran Site web du dashboard dit déjà
          « Brouillon — pas encore en ligne » au-dessus du cadre, et le bandeau masquait l'en-tête du site. */}
      <header className="entete" data-bloc="entete">
        <a className="entete__nom" href={l(langue, '')} data-affichage={affichage}>
          {affichage !== 'nom' && logo && (
            <img src={logo.url} alt={affichage === 'logo' ? site.spec.identite.nom : ''} />
          )}
          {(affichage !== 'logo' || !logo) && <span>{site.spec.identite.nom}</span>}
        </a>
        <nav className="entete__menu" aria-label="Menu">
          {site.spec.pages
            .filter((p) => p !== legal)
            .map((p) => (
              <a key={p.id} href={l(langue, p.chemin)} aria-current={p.id === pageId ? 'page' : undefined}>
                {t(p.titre, langue, defaut)}
              </a>
            ))}
        </nav>
        {site.spec.identite.reserver && (
          // « Réserver » : la page de réservation DU site (dates → logements de ce PM), dans son design.
          <a className="bouton entete__reserver" href={l(langue, CHEMIN_RESERVER)}>
            {mot('reserver', langue)}
          </a>
        )}
        {actives.length > 1 && (
          <nav className="entete__langues" aria-label="Langue">
            {actives.map((lg) => (
              <a key={lg} href={l(lg, chemin)} hrefLang={lg} aria-current={lg === langue ? 'true' : undefined}>
                {lg.toUpperCase()}
              </a>
            ))}
          </nav>
        )}
      </header>
      <main data-page={pageId ?? CHEMIN_RESERVER} data-chemin={chemin === '' ? 'accueil' : chemin}>{children}</main>
      <footer className="pied" data-bloc="pied">
        <div className="pied__colonnes">
          <div className="pied__col pied__col--marque">
            {logo && <img className="pied__logo" src={logo.url} alt={site.spec.identite.nom} loading="lazy" decoding="async" />}
            {t(site.spec.piedDePage.texte, langue, defaut) && (
              <p className="multiligne">{t(site.spec.piedDePage.texte, langue, defaut)}</p>
            )}
          </div>
          <nav className="pied__col pied__col--menu" aria-label={mot('pied_navigation', langue)}>
            <h3>{mot('pied_navigation', langue)}</h3>
            <ul>
              {site.spec.pages
                .filter((p) => p !== legal)
                .map((p) => (
                  <li key={p.id}>
                    <a href={l(langue, p.chemin)}>{t(p.titre, langue, defaut)}</a>
                  </li>
                ))}
            </ul>
          </nav>
          {((site.spec.piedDePage.infos ?? []).length > 0 || (site.spec.piedDePage.reseaux ?? []).length > 0) && (
            <div className="pied__col pied__col--infos">
              {(site.spec.piedDePage.infos ?? []).length > 0 && (
                <>
                  <h3>{mot('pied_infos', langue)}</h3>
                  <ul>
                    {(site.spec.piedDePage.infos ?? []).map((ligne, i) => (
                      <li key={i}>{t(ligne, langue, defaut)}</li>
                    ))}
                  </ul>
                </>
              )}
              {(site.spec.piedDePage.reseaux ?? []).length > 0 && (
                <>
                  <h3>{mot('pied_suivez', langue)}</h3>
                  <div className="pied__liens">
                    <Reseaux reseaux={site.spec.piedDePage.reseaux ?? []} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <p className="pied__droits">
          © {new Date().getFullYear()} {site.spec.identite.nom} · {mot('pied_droits', langue)}
          {legal && (
            <>
              {' · '}
              <a href={l(langue, legal.chemin)}>{mot('mentions', langue)}</a>
            </>
          )}
        </p>
      </footer>
      {whatsapp && <WhatsappFlottant numero={whatsapp} langue={langue} />}
      {apres}
    </div>
  )
}
