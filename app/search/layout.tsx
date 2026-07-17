import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rechercher un riad, une villa ou un appartement | Sojori',
  description:
    'Trouvez votre séjour idéal au Maroc : riads, villas et appartements vérifiés à Marrakech, Essaouira, Fès et Casablanca. Filtres par ville, dates et équipements.',
  alternates: { canonical: 'https://sojori.com/search' },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
