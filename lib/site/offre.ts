/**
 * Les landings d'offre (Black Friday, Ramadan…), côté affichage. srv-site fait tout le calcul (fuseau, état, instants
 * UTC) : ici, seulement la mise en forme — le décompte, le design propre à la page, le lien WhatsApp de l'offre.
 * Spec : sojori-production/docs/patterns/agents/agent-site-web.md §13. Pur, sans I/O.
 */
import type { Langue, OffreServie, SiteSpec } from './types'

/**
 * Le thème de la page : celui du site, avec l'accent, la police des titres et le style propres à la landing.
 * Jamais une autre valeur que celles que srv-site a validées (listes fermées, couleurs lisibles).
 */
export function themeDeLaPage(theme: SiteSpec['theme'], offre?: OffreServie): SiteSpec['theme'] {
  const d = offre?.design
  if (!d) return theme
  return {
    ...theme,
    ...(d.style ? { style: d.style as SiteSpec['theme']['style'] } : {}),
    couleurs: {
      ...theme.couleurs,
      ...(d.accent ? { accent: d.accent } : {}),
      ...(d.accentDoux ? { accentDoux: d.accentDoux } : {}),
    },
    polices: { ...theme.polices, ...(d.police ? { titres: d.police } : {}) },
  }
}

/** Le temps restant, découpé pour le décompte ; `null` une fois la fin atteinte. */
export function reste(finMs: number, maintenantMs: number): { j: number; h: number; m: number; s: number } | null {
  const ms = finMs - maintenantMs
  if (!Number.isFinite(ms) || ms <= 0) return null
  const total = Math.floor(ms / 1000)
  return { j: Math.floor(total / 86400), h: Math.floor((total % 86400) / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 }
}

const TEXTE_WHATSAPP: Record<Langue, (titre: string, code?: string) => string> = {
  fr: (t, c) => `Bonjour, je vous écris au sujet de l’offre « ${t} »${c ? ` (code ${c})` : ''}.`,
  en: (t, c) => `Hello, I am writing about the offer “${t}”${c ? ` (code ${c})` : ''}.`,
  ar: (t, c) => `مرحبًا، أكتب إليكم بخصوص العرض «${t}»${c ? ` (الرمز ${c})` : ''}.`,
}

/** Le lien WhatsApp de l'offre (`#whatsapp` dans la fiche) : le numéro du compte du PM, un message qui nomme l'offre. */
export function lienWhatsappOffre(numero: string | null | undefined, langue: Langue, titre: string, code?: string): string | undefined {
  if (!numero || !/^[1-9][0-9]{7,14}$/.test(numero)) return undefined
  return `https://wa.me/${numero}?text=${encodeURIComponent(TEXTE_WHATSAPP[langue](titre, code))}`
}

/** Une landing terminée n'est jamais indexée ; en cours ou à venir (aperçu), elle l'est comme les autres pages. */
export const offreTerminee = (offre: OffreServie | undefined, apercu: boolean): boolean => Boolean(offre) && offre?.etat === 'terminee' && !apercu
