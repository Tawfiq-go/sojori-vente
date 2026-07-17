import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion | Sojori',
  robots: { index: false, follow: false },
};

export default function LoginSsoCallbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
