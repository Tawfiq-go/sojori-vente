/**
 * ─── Thèmes direct booking (marque blanche) ────────────────────────────
 * Un thème = un jeu de tokens qui surchargent les CSS variables de
 * globals.css (:root). Les tokens sémantiques (--color-primary, etc.)
 * dérivant des variables brutes (--gold, --paper…), surcharger les brutes
 * re-skinne tout le site sans toucher aux composants.
 *
 * Ajouté pour les sites clients sur domaine propre : le tenant choisit un
 * preset dans le dashboard (pmProfile.directBooking.theme) ; en attendant
 * la couche multi-tenant, le mode preview `?theme=medina` permet de
 * démontrer chaque thème sur n'importe quelle page.
 */

export type ThemeId = 'sojori' | 'medina' | 'riviera' | 'desert'

export type ThemePreset = {
  id: ThemeId
  label: string
  description: string
  /** Surcharges des CSS variables de :root (globals.css). */
  vars: Record<string, string>
}

/** Sojori = thème par défaut : aucune surcharge (les valeurs de globals.css). */
const SOJORI: ThemePreset = {
  id: 'sojori',
  label: 'Sojori',
  description: 'Or et papier — le thème de sojori.com',
  vars: {},
}

/** Médina — terracotta, safran, chaux : l'âme marocaine. */
const MEDINA: ThemePreset = {
  id: 'medina',
  label: 'Médina',
  description: 'Terracotta, safran et chaux — serif contrasté, esprit riad',
  vars: {
    '--gold': '#9a3412',
    '--goldD': '#7c2d12',
    '--goldS': '#d97706',
    '--goldT': 'rgba(154, 52, 18, 0.1)',
    '--ink': '#3b2f2a',
    '--ink2': '#57453d',
    '--ink3': '#8a7466',
    '--ink4': '#b3a193',
    '--paper': '#faf3ec',
    '--paper2': '#f3e4d3',
    '--b': '#e4cdb4',
    '--bs': '#d1b28e',
  },
}

/** Riviera — bleu profond, or discret, blanc cassé : l'élégance européenne. */
const RIVIERA: ThemePreset = {
  id: 'riviera',
  label: 'Riviera',
  description: 'Bleu profond et or discret — lignes fines, blanc généreux',
  vars: {
    '--gold': '#1e3a5f',
    '--goldD': '#152c49',
    '--goldS': '#b3a125',
    '--goldT': 'rgba(30, 58, 95, 0.08)',
    '--ink': '#111827',
    '--ink2': '#374151',
    '--ink3': '#64748b',
    '--ink4': '#94a3b8',
    '--paper': '#fbfbf8',
    '--paper2': '#f1f0ea',
    '--b': '#d6d3cb',
    '--bs': '#b8b4a8',
  },
}

/** Désert — sable, ocre, basalte : le minimal contemporain. */
const DESERT: ThemePreset = {
  id: 'desert',
  label: 'Désert',
  description: 'Sable, ocre et basalte — typo légère, silence visuel',
  vars: {
    '--gold': '#8c6f4e',
    '--goldD': '#6b5238',
    '--goldS': '#c2a878',
    '--goldT': 'rgba(140, 111, 78, 0.1)',
    '--ink': '#44403c',
    '--ink2': '#57534e',
    '--ink3': '#78716c',
    '--ink4': '#a8a29e',
    '--paper': '#f6f1e7',
    '--paper2': '#efe6d4',
    '--b': '#ddd2bd',
    '--bs': '#c4b596',
  },
}

export const THEME_PRESETS: Record<ThemeId, ThemePreset> = {
  sojori: SOJORI,
  medina: MEDINA,
  riviera: RIVIERA,
  desert: DESERT,
}

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return value != null && value in THEME_PRESETS
}

/**
 * Accent personnalisé du PM (brandColor.from du profil) par-dessus le
 * preset : remplace la couleur primaire sans toucher au reste du thème.
 */
export function themeVarsWithAccent(
  preset: ThemePreset,
  accent?: string | null,
): Record<string, string> {
  const hex = String(accent || '').trim()
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return preset.vars
  return { ...preset.vars, '--gold': hex }
}
