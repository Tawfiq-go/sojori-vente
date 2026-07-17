import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ma liste de favoris | Sojori',
  robots: { index: false, follow: false },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
