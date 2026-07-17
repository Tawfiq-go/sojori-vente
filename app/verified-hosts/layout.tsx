import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hôtes vérifiés | Property managers professionnels au Maroc | Sojori',
  description:
    'Découvrez les property managers vérifiés par Sojori : biens contrôlés, réponses rapides et service professionnel au Maroc.',
  alternates: { canonical: 'https://sojori.com/verified-hosts' },
};

export default function VerifiedHostsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
