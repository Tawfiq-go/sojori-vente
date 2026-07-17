import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/config/site';

export const metadata: Metadata = {
  title: 'Rechercher un riad, une villa ou un appartement | Sojori',
  description:
    'Trouvez votre séjour idéal au Maroc : riads, villas et appartements vérifiés à Marrakech, Essaouira, Fès et Casablanca. Filtres par ville, dates et équipements.',
  alternates: { canonical: `${SITE_URL}/search` },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
