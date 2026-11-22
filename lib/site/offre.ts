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

/**
 * La cible d'un bouton sur une landing : avec `paiement: whatsapp`, le lien vers la réservation du site (`/reserver`)
 * devient `#whatsapp` (WhatsApp du compte du PM). `demonstration` et `moteur` (non branché) gardent la réservation.
 */
export const cibleDeLOffre = (cible: unknown, paiement: OffreServie['paiement']): unknown =>
  paiement === 'whatsapp' && cible === '/reserver' ? '#whatsapp' : cible

/** Le second bouton « WhatsApp » ferait doublon avec le premier quand le paiement est déjà WhatsApp. */
export const secondBoutonUtile = (lien2: unknown, paiement: OffreServie['paiement']): boolean =>
  !(paiement === 'whatsapp' && lien2 === '#whatsapp')

/** Le voile sombre d'une landing en plein écran : la couleur sur laquelle la valeur de l'offre doit se lire. */
export const VOILE_SOMBRE = '#14130f'

const lumin = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Rapport de contraste WCAG entre deux couleurs `#RRGGBB` (1 à 21). */
export function contraste(a: string, b: string): number {
  const [la, lb] = [lumin(a), lumin(b)]
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * La couleur de la valeur de l'offre (« -20 % ») sur le voile sombre d'un premier écran : l'accent de la page s'il s'y lit
 * (contraste 4,5 au moins), sinon le blanc — l'accent reste en filet sous la valeur. srv-site a validé l'accent contre le
 * FOND du site, pas contre ce voile : un accent sombre (vert Ramadan #1F5F5B) y serait illisible.
 */
export function couleurValeurSurVoile(accent: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(accent) && contraste(accent, VOILE_SOMBRE) >= 4.5 ? accent : '#ffffff'
}
