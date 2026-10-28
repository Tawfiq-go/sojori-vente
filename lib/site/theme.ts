import type { SiteSpec } from './types'

const ARRONDI = { aucun: '0px', doux: '10px', rond: '22px' } as const
const ESPACE = { aeree: '96px', normale: '64px', serree: '40px' } as const

/** Les variables CSS du thème : toutes les sections les lisent, blocs Sojori compris. */
export function variablesDuTheme(theme: SiteSpec['theme']): Record<string, string> {
  // Immersif : toujours sombre (fond presque noir, texte clair) ; l'accent reste celui du PM.
  const sombre = theme.style === 'immersif'
  return {
    '--fond': sombre ? '#0d0c0b' : theme.couleurs.fond,
    '--texte': sombre ? '#f4efe7' : theme.couleurs.texte,
    '--accent': theme.couleurs.accent,
    '--accent-doux': theme.couleurs.accentDoux,
    '--police-titres': `'${theme.polices.titres}', Georgia, serif`,
    '--police-texte': `'${theme.polices.texte}', system-ui, sans-serif`,
    '--arrondi': ARRONDI[theme.arrondi] ?? '10px',
    '--espace': ESPACE[theme.densite] ?? '64px',
  }
}

/** Le lien Google Fonts des deux polices du thème (liste fermée côté srv-site). */
export function lienPolices(theme: SiteSpec['theme']): string {
  const familles = [...new Set([theme.polices.titres, theme.polices.texte])]
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${familles}&display=swap`
}
