import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Créer un compte | Sojori',
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
