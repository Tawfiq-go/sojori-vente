import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paiement | Sojori',
  robots: { index: false, follow: false },
};

export default function CheckoutReturnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
