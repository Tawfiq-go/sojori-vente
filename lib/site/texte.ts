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
  ecrireWhatsapp: { fr: 'Nous écrire sur WhatsApp', en: 'Message us on WhatsApp', ar: 'راسلنا عبر واتساب' },
  bonjourWhatsapp: {
    fr: 'Bonjour, je vous écris depuis votre site.',
    en: 'Hello, I am writing to you from your website.',
    ar: 'مرحبًا، أكتب إليكم من موقعكم.',
  },
  formulaire: { fr: 'Formulaire de contact', en: 'Contact form', ar: 'استمارة التواصل' },
  arrivee: { fr: 'Arrivée', en: 'Check-in', ar: 'الوصول' },
  depart: { fr: 'Départ', en: 'Check-out', ar: 'المغادرة' },
  adultes: { fr: 'Voyageurs', en: 'Guests', ar: 'الضيوف' },
  rechercher: { fr: 'Voir les disponibilités', en: 'Check availability', ar: 'تحقق من التوفر' },
  questionsFrequentes: { fr: 'Questions fréquentes', en: 'Frequently asked questions', ar: 'أسئلة شائعة' },
  nosExperiences: { fr: 'Expériences et services', en: 'Experiences and services', ar: 'تجارب وخدمات' },
  surDevis: { fr: 'Sur devis', en: 'On request', ar: 'حسب الطلب' },
  surLaCarte: { fr: 'Nos logements sur la carte', en: 'Our homes on the map', ar: 'مساكننا على الخريطة' },
  // L'espace IA du site (28/10/2026)
  assistantOuvrir: { fr: 'Poser une question', en: 'Ask a question', ar: 'اطرح سؤالاً' },
  assistantTitre: { fr: 'Votre séjour, en direct', en: 'Your stay, booked direct', ar: 'إقامتك، مباشرة' },
  assistantAccueil: {
    fr: 'Bonjour ! Dites-moi vos dates et le nombre de voyageurs : je vous montre ce qui est libre, avec le prix exact.',
    en: 'Hello! Tell me your dates and how many guests: I will show you what is available, with the exact price.',
    ar: 'مرحبًا! أخبرني بتواريخك وعدد الضيوف: سأعرض عليك المتاح بالسعر الدقيق.',
  },
  assistantSaisie: { fr: 'Écrivez ou dictez…', en: 'Type or dictate…', ar: 'اكتب أو أملِ…' },
  assistantEnvoyer: { fr: 'Envoyer', en: 'Send', ar: 'إرسال' },
  assistantDicter: { fr: 'Dicter', en: 'Dictate', ar: 'إملاء' },
  assistantEcoute: { fr: 'J’écoute… touchez pour terminer', en: 'Listening… tap to finish', ar: 'أستمع… المس للإنهاء' },
  assistantLire: { fr: 'Lire les réponses à voix haute', en: 'Read answers aloud', ar: 'قراءة الردود بصوت عالٍ' },
  assistantFermer: { fr: 'Fermer', en: 'Close', ar: 'إغلاق' },
  assistantConfirmer: { fr: 'Confirmer la réservation', en: 'Confirm the booking', ar: 'تأكيد الحجز' },
  assistantEcarter: { fr: 'Non merci', en: 'No thanks', ar: 'لا، شكرًا' },
  assistantPayer: { fr: 'Payer en ligne', en: 'Pay online', ar: 'الدفع عبر الإنترنت' },
  assistantPour: { fr: 'pour', en: 'for', ar: 'لـ' },
  assistantNuits: { fr: 'nuits', en: 'nights', ar: 'ليالٍ' },
  assistantErreur: {
    fr: 'Je n’arrive pas à répondre pour l’instant. Réessayez, ou écrivez-nous sur WhatsApp.',
    en: 'I cannot answer right now. Please try again, or message us on WhatsApp.',
    ar: 'لا أستطيع الرد الآن. حاول مجددًا أو راسلنا عبر واتساب.',
  },
} as const

export const mot = (cle: keyof typeof MOTS, langue: Langue) => MOTS[cle][langue]

export const prix = (montant: number, devise: string, langue: Langue) =>
  new Intl.NumberFormat(langue === 'ar' ? 'ar-MA' : langue === 'en' ? 'en-GB' : 'fr-MA', {
    style: 'currency',
    currency: devise || 'MAD',
    maximumFractionDigits: 0,
  }).format(montant)
