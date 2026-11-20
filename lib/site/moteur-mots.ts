/** Les mots fixes du moteur de réservation du site d'un PM (FR, EN, AR). Ceux du PM sont dans sa fiche. */
import type { Langue } from './types'

const M = {
  titre: { fr: 'Votre séjour', en: 'Your stay', ar: 'إقامتك' },
  sousTitre: {
    fr: 'Choisissez vos dates : nous vous montrons ce qui est libre, au prix exact du séjour.',
    en: 'Choose your dates: we show what is free, at the exact price of your stay.',
    ar: 'اختر تواريخك: نعرض لك المتاح بالسعر الدقيق لإقامتك.',
  },
  voyageurs: { fr: 'Voyageurs', en: 'Guests', ar: 'الضيوف' },
  voirDispo: { fr: 'Voir les disponibilités', en: 'Check availability', ar: 'تحقق من التوفر' },
  nuit: { fr: 'nuit', en: 'night', ar: 'ليلة' },
  nuits: { fr: 'nuits', en: 'nights', ar: 'ليالٍ' },
  pourNuits: { fr: 'Pour {n} nuits', en: 'For {n} nights', ar: 'لـ {n} ليالٍ' },
  pourUneNuit: { fr: 'Pour 1 nuit', en: 'For 1 night', ar: 'لليلة واحدة' },
  parNuitMoyen: { fr: '{p} par nuit en moyenne', en: '{p} per night on average', ar: '{p} لليلة في المتوسط' },
  taxesFrais: { fr: 'Taxes et frais', en: 'Taxes and fees', ar: 'الضرائب والرسوم' },
  sejour: { fr: 'Séjour', en: 'Stay', ar: 'الإقامة' },
  total: { fr: 'Total', en: 'Total', ar: 'المجموع' },
  dontTaxes: { fr: 'dont {p} de taxes et frais', en: 'incl. {p} of taxes and fees', ar: 'منها {p} ضرائب ورسوم' },
  choisir: { fr: 'Choisir', en: 'Select', ar: 'اختر' },
  continuer: { fr: 'Continuer', en: 'Continue', ar: 'متابعة' },
  voirDetails: { fr: 'Voir le détail', en: 'View details', ar: 'عرض التفاصيل' },
  aPartirDe: { fr: 'à partir de', en: 'from', ar: 'ابتداءً من' },
  parNuit: { fr: '/ nuit', en: '/ night', ar: '/ ليلة' },
  indisponible: { fr: 'Indisponible à ces dates', en: 'Not available on these dates', ar: 'غير متاح في هذه التواريخ' },
  capacite: { fr: 'Capacité insuffisante pour {n} voyageurs', en: 'Not enough room for {n} guests', ar: 'السعة غير كافية لـ {n} ضيوف' },
  duree: { fr: 'Durée de séjour non proposée', en: 'This length of stay is not offered', ar: 'مدة الإقامة غير متاحة' },
  prix: { fr: 'Prix à confirmer pour ces dates', en: 'Price to be confirmed for these dates', ar: 'السعر قيد التأكيد لهذه التواريخ' },
  erreur: { fr: 'Disponibilité momentanément illisible', en: 'Availability temporarily unavailable', ar: 'التوفر غير متاح مؤقتًا' },
  autresDates: { fr: 'Essayez d’autres dates, ou écrivez-nous.', en: 'Try other dates, or write to us.', ar: 'جرّب تواريخ أخرى أو راسلنا.' },
  ecrire: { fr: 'Nous écrire sur WhatsApp', en: 'Message us on WhatsApp', ar: 'راسلنا عبر واتساب' },
  aucunType: { fr: 'Les hébergements arrivent bientôt.', en: 'Our accommodations are coming soon.', ar: 'الإقامات ستتوفر قريبًا.' },
  datesInvalides: { fr: 'Ces dates ne conviennent pas : l’arrivée doit être aujourd’hui ou plus tard, le départ après l’arrivée.', en: 'These dates do not work: arrival must be today or later, and departure after arrival.', ar: 'هذه التواريخ غير صالحة: يجب أن يكون الوصول اليوم أو بعده والمغادرة بعد الوصول.' },
  chambre: { fr: 'chambre', en: 'bedroom', ar: 'غرفة' },
  chambres: { fr: 'chambres', en: 'bedrooms', ar: 'غرف' },
  salleDeBain: { fr: 'salle de bain', en: 'bathroom', ar: 'حمام' },
  sallesDeBain: { fr: 'salles de bain', en: 'bathrooms', ar: 'حمامات' },
  jusqua: { fr: 'jusqu’à {n} voyageurs', en: 'up to {n} guests', ar: 'حتى {n} ضيوف' },
  plusPhotos: { fr: '{n} photos', en: '{n} photos', ar: '{n} صور' },
  // Fiche
  votreSejour: { fr: 'Votre séjour', en: 'Your stay', ar: 'إقامتك' },
  modifier: { fr: 'Modifier', en: 'Update', ar: 'تعديل' },
  recalculer: { fr: 'Calculer le prix', en: 'Calculate price', ar: 'احسب السعر' },
  deMoinsDe: { fr: 'Choisissez vos dates pour voir le prix exact.', en: 'Choose your dates to see the exact price.', ar: 'اختر تواريخك لرؤية السعر الدقيق.' },
  prixConfirme: { fr: 'Le prix affiché est celui du séjour, taxes et frais compris.', en: 'The price shown is for your whole stay, taxes and fees included.', ar: 'السعر المعروض هو سعر الإقامة كاملة شاملًا الضرائب والرسوم.' },
  // Paiement
  paiementTitre: { fr: 'Vos coordonnées et le paiement', en: 'Your details and payment', ar: 'بياناتك والدفع' },
  coordonnees: { fr: 'Vos coordonnées', en: 'Your details', ar: 'بياناتك' },
  prenom: { fr: 'Prénom', en: 'First name', ar: 'الاسم الأول' },
  nom: { fr: 'Nom', en: 'Last name', ar: 'اسم العائلة' },
  email: { fr: 'E-mail', en: 'Email', ar: 'البريد الإلكتروني' },
  telephone: { fr: 'Téléphone', en: 'Phone', ar: 'الهاتف' },
  heureArrivee: { fr: 'Heure d’arrivée prévue (facultatif)', en: 'Expected arrival time (optional)', ar: 'وقت الوصول المتوقع (اختياري)' },
  paiement: { fr: 'Paiement', en: 'Payment', ar: 'الدفع' },
  carte: { fr: 'Carte bancaire', en: 'Bank card', ar: 'بطاقة بنكية' },
  demoCarte: { fr: 'Démonstration : aucune carte n’est demandée et rien n’est débité.', en: 'Demonstration: no card is requested and nothing is charged.', ar: 'عرض تجريبي: لا تُطلب أي بطاقة ولا يُخصم أي مبلغ.' },
  confirmerPayer: { fr: 'Confirmer et payer {p}', en: 'Confirm and pay {p}', ar: 'تأكيد ودفع {p}' },
  confirmerDemo: { fr: 'Confirmer (démonstration)', en: 'Confirm (demonstration)', ar: 'تأكيد (عرض تجريبي)' },
  envoyerDemande: { fr: 'Envoyer ma demande sur WhatsApp', en: 'Send my request on WhatsApp', ar: 'إرسال طلبي عبر واتساب' },
  fermeNote: {
    fr: 'La réservation en ligne ouvre bientôt. Votre demande part par WhatsApp : l’équipe vous répond avec la confirmation.',
    en: 'Online booking opens soon. Your request goes through WhatsApp: the team replies with the confirmation.',
    ar: 'الحجز عبر الإنترنت سيفتح قريبًا. يُرسل طلبك عبر واتساب ويردّ الفريق بالتأكيد.',
  },
  conditions: {
    fr: 'En confirmant, vous acceptez les conditions de réservation de l’établissement.',
    en: 'By confirming, you accept the property’s booking conditions.',
    ar: 'بتأكيدك، فإنك توافق على شروط الحجز لدى المؤسسة.',
  },
  recapitulatif: { fr: 'Récapitulatif', en: 'Summary', ar: 'الملخص' },
  arrivee: { fr: 'Arrivée', en: 'Check-in', ar: 'الوصول' },
  depart: { fr: 'Départ', en: 'Check-out', ar: 'المغادرة' },
  retour: { fr: 'Retour', en: 'Back', ar: 'رجوع' },
  champObligatoire: { fr: 'Champ obligatoire', en: 'Required field', ar: 'حقل مطلوب' },
  // Confirmation
  confirmeTitre: { fr: 'Merci, {p}', en: 'Thank you, {p}', ar: 'شكرًا، {p}' },
  confirmeSousTitre: { fr: 'Votre séjour est confirmé.', en: 'Your stay is confirmed.', ar: 'تم تأكيد إقامتك.' },
  reference: { fr: 'Référence', en: 'Reference', ar: 'المرجع' },
  confirmeMail: { fr: 'Un e-mail de confirmation est envoyé à {e}.', en: 'A confirmation email is sent to {e}.', ar: 'تم إرسال رسالة تأكيد إلى {e}.' },
  demoNote: {
    fr: 'Démonstration — aucune réservation n’est enregistrée, aucun paiement n’est pris et aucun e-mail n’est envoyé.',
    en: 'Demonstration — no booking is saved, no payment is taken and no email is sent.',
    ar: 'عرض تجريبي — لا يُسجَّل أي حجز ولا يُؤخذ أي دفع ولا يُرسل أي بريد.',
  },
  retourAccueil: { fr: 'Retour au site', en: 'Back to the site', ar: 'العودة إلى الموقع' },
  rienARetrouver: { fr: 'Aucune réservation à afficher. Recommencez depuis la page de réservation.', en: 'No booking to display. Start again from the booking page.', ar: 'لا يوجد حجز للعرض. ابدأ من جديد من صفحة الحجز.' },
} as const

export type CleMot = keyof typeof M

/** « 2 chambres » / « 1 chambre » : le mot au singulier ou au pluriel selon n. */
export function nb(n: number, un: CleMot, plusieurs: CleMot, langue: Langue): string {
  return `${n} ${mm(n > 1 ? plusieurs : un, langue)}`
}

/** Un mot du moteur ; `{n}`, `{p}`, `{e}` sont remplacés par `vars`. */
export function mm(cle: CleMot, langue: Langue, vars: Record<string, string | number> = {}): string {
  const mot = M[cle] as Record<Langue, string>
  let s = mot[langue] ?? mot.fr
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
  return s
}
