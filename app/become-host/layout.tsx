import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Devenir hôte sur Sojori | Publiez votre riad, villa ou appartement',
  description:
    'Publiez votre bien sur Sojori et touchez des voyageurs qualifiés au Maroc. Property managers vérifiés, visibilité multi-plateforme, sans frais cachés.',
  alternates: { canonical: 'https://sojori.com/become-host' },
};

export default function BecomeHostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
