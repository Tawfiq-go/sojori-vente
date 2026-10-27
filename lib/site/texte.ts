import type { Langue, Texte } from './types'

/** Un texte dans la langue demandée, sinon dans la langue par défaut du site, sinon vide. */
export function t(v: unknown, langue: Langue, defaut: Langue): string {
  if (typeof v === 'string') return v
  if (!v || typeof v !== 'object') return ''
  const x = v as Texte
  return x[langue] ?? x[defaut] ?? ''
}

/** Les mots fixes de l'app (jamais ceux du PM, qui sont dans sa fiche). */
const MOTS = {
  aPartirDe: { fr: 'à partir de', en: 'from', ar: 'ابتداءً من' },
  parNuit: { fr: '/ nuit', en: '/ night', ar: '/ ليلة' },
  voyageurs: { fr: 'voyageurs', en: 'guests', ar: 'ضيوف' },
  chambres: { fr: 'chambres', en: 'bedrooms', ar: 'غرف' },
  reserver: { fr: 'Réserver', en: 'Book', ar: 'احجز' },
  voir: { fr: 'Voir', en: 'View', ar: 'عرض' },
  equipements: { fr: 'Équipements', en: 'Amenities', ar: 'المرافق' },
  mentions: { fr: 'Mentions légales', en: 'Legal notice', ar: 'إشعار قانوني' },
  aucunLogement: { fr: 'Aucun logement disponible pour le moment.', en: 'No property available right now.', ar: 'لا يوجد سكن متاح حاليًا.' },
  editeur: { fr: 'Éditeur du site', en: 'Site publisher', ar: 'ناشر الموقع' },
  donnees: {
    fr: 'Les données que vous nous confiez (réservation, contact) servent à gérer votre séjour. Conformément à la loi 09-08, vous disposez d’un droit d’accès, de rectification et d’opposition, à exercer auprès de l’éditeur.',
    en: 'The data you share with us (booking, contact) is used to manage your stay. Under Moroccan law 09-08, you may access, correct or object to it by contacting the publisher.',
    ar: 'تُستخدم البيانات التي تشاركها معنا (الحجز، التواصل) لتدبير إقامتك. وفقًا للقانون 09-08، يحق لك الولوج إليها وتصحيحها والاعتراض عليها لدى الناشر.',
  },
  hebergement: { fr: 'Site hébergé par Sojori.', en: 'Site hosted by Sojori.', ar: 'الموقع مستضاف لدى Sojori.' },
  apercu: { fr: 'Aperçu — non publié', en: 'Preview — not published', ar: 'معاينة — غير منشور' },
} as const

export const mot = (cle: keyof typeof MOTS, langue: Langue) => MOTS[cle][langue]

export const prix = (montant: number, devise: string, langue: Langue) =>
  new Intl.NumberFormat(langue === 'ar' ? 'ar-MA' : langue === 'en' ? 'en-GB' : 'fr-MA', {
    style: 'currency',
    currency: devise || 'MAD',
    maximumFractionDigits: 0,
  }).format(montant)
