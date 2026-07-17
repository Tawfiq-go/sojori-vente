import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Démo | Sojori',
  robots: { index: false, follow: false },
};

export default function DemoMvpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
