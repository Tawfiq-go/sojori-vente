/**
 * Le site d'un PM composé par l'agent Site web : en-tête (pages, langues), sections de la page,
 * pied de page avec les mentions légales. Rendu serveur, enfermé dans `.site-pm` : les couleurs
 * et polices du thème ne débordent pas sur le reste de sojori-vente (pages logement, réservation).
 */
import { lien } from '@/lib/site/route'
import { mot, t } from '@/lib/site/texte'
import { lienPolices, variablesDuTheme } from '@/lib/site/theme'
import type { Langue, Page, SitePublic } from '@/lib/site/types'
import { Reseaux, WhatsappFlottant } from './Reseaux'
import { Sections } from './Sections'
import '@/app/site-pm.css'
import '@/app/site-styles.css'

export function SitePm({
  site,
  slug,
  base,
  langue,
  page,
}: {
  site: SitePublic
  slug: string
  base: string
  langue: Langue
  page: Page
}) {
  const { defaut, actives } = site.spec.langues
  const legal = site.spec.pages.find((p) => p.sections.some((s) => s.niveau === 'sojori' && s.type === 'legal'))
  const logo = site.spec.identite.logo ? site.medias[site.spec.identite.logo] : undefined
  // L'en-tête : logo seul (défaut quand il y en a un), logo et nom, ou nom seul (28/10/2026).
  const affichage = site.spec.identite.affichage ?? 'logo'
  const whatsapp = site.spec.identite.whatsappFlottant ? site.contact?.whatsapp : null
  const l = (lg: Langue, chemin: string) => lien(base, lg, defaut, chemin)
  const ctx = { site, slug, base, langue, defaut }
  return (
    <div
      className="site-pm"
      data-style={site.spec.theme.style ?? 'classique'}
      dir={langue === 'ar' ? 'rtl' : 'ltr'}
      lang={langue}
      style={variablesDuTheme(site.spec.theme)}
    >
      <link rel="stylesheet" href={lienPolices(site.spec.theme)} />
      {site.apercu && <div className="bandeau-apercu">{mot('apercu', langue)}</div>}
      <header className="entete">
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
              <a key={p.id} href={l(langue, p.chemin)} aria-current={p.id === page.id ? 'page' : undefined}>
                {t(p.titre, langue, defaut)}
              </a>
            ))}
        </nav>
        {actives.length > 1 && (
          <nav className="entete__langues" aria-label="Langue">
            {actives.map((lg) => (
              <a key={lg} href={l(lg, page.chemin)} hrefLang={lg} aria-current={lg === langue ? 'true' : undefined}>
                {lg.toUpperCase()}
              </a>
            ))}
          </nav>
        )}
      </header>
      <main data-page={page.id}>
        <Sections sections={page.sections} ctx={ctx} />
      </main>
      <footer className="pied">
        {t(site.spec.piedDePage.texte, langue, defaut) && <p>{t(site.spec.piedDePage.texte, langue, defaut)}</p>}
        <div className="pied__liens">
          <Reseaux reseaux={site.spec.piedDePage.reseaux ?? []} />
          {legal && <a href={l(langue, legal.chemin)}>{mot('mentions', langue)}</a>}
        </div>
      </footer>
      {whatsapp && <WhatsappFlottant numero={whatsapp} langue={langue} />}
    </div>
  )
}
