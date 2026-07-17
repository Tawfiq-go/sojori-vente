import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/config/site';

export const metadata: Metadata = {
  title: 'Hôtes vérifiés | Property managers professionnels au Maroc | Sojori',
  description:
    'Découvrez les property managers vérifiés par Sojori : biens contrôlés, réponses rapides et service professionnel au Maroc.',
  alternates: { canonical: `${SITE_URL}/verified-hosts` },
};

export default function VerifiedHostsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
