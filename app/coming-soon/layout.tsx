import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sojori · Bientôt disponible',
  description: 'Sojori prépare une nouvelle expérience pour vos séjours premium au Maroc.',
  robots: { index: false, follow: false },
};

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
