import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/config/site';

export const metadata: Metadata = {
  title: 'Expériences au Maroc | Sojori',
  description:
    'Découvrez des expériences sélectionnées au Maroc : excursions, activités locales et découvertes culturelles à réserver avec votre séjour Sojori.',
  alternates: { canonical: `${SITE_URL}/experiences` },
};

export default function ExperiencesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
