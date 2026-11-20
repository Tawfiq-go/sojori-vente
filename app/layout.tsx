import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/config/site';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { headers } from 'next/headers';
import './globals.css';
import './themes.css';
import './homepage.css';

/** Vercel prod : évite prerender statique (useSearchParams / Clerk sur plusieurs pages). */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Sojori · Séjours Premium au Maroc · Riads, Villas & Appartements',
  description:
    'Découvrez des riads, villas et appartements triés par des experts locaux. Marrakech, Essaouira, Fès, Casablanca. Biens vérifiés, recherche IA, Property Managers sélectionnés.',
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.svg',
  },
  keywords: [
    'Maroc',
    'séjour Maroc',
    'riad Marrakech',
    'villa Essaouira',
    'appartement Casablanca',
    'location vacances Maroc',
    'Sojori',
    'property management Maroc',
  ],
  authors: [{ name: 'Sojori', url: SITE_URL }],
  creator: 'Sojori',
  publisher: 'Sojori',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    title: 'Sojori · Séjours Premium au Maroc',
    description:
      'Riads, villas & appartements triés par des experts locaux. Marrakech, Essaouira, Fès, Casablanca.',
    siteName: 'Sojori',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Sojori - Séjours Premium au Maroc',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sojori · Séjours Premium au Maroc',
    description: 'Riads, villas & appartements triés par des experts locaux.',
    images: [`${SITE_URL}/og-image.jpg`],
    creator: '@sojori',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Organization JSON-LD volontairement minimal — l'entité "Sojori" canonique vit sur
// sojori.com (logiciel B2B). book.sojori.com n'est qu'un produit rattaché
// (marketplace grand public), référencé ici via sameAs plutôt que dupliqué en detail
// (adresse/contactPoint complets restent uniquement sur sojori.com).
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Site d'un PM (domaine du client ou aperçu) : aucune trace de la plateforme — ni Clerk, ni JSON-LD « Sojori »,
  // ni police de la plateforme. Posé par le middleware (`x-site-pm`).
  if ((await headers()).get('x-site-pm') === '1') {
    return (
      <html lang="fr">
        <body>
          <CurrencyProvider>{children}</CurrencyProvider>
        </body>
      </html>
    );
  }
  const { LayoutPlateforme } = await import('@/components/LayoutPlateforme');
  return <LayoutPlateforme>{children}</LayoutPlateforme>;
}
