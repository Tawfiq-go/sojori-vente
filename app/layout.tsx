import type { Metadata } from 'next';
import { Instrument_Serif } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { clerkAppearance } from '@/lib/clerk/appearance';
import './globals.css';
import './homepage.css';

/** Vercel prod : évite prerender statique (useSearchParams / Clerk sur plusieurs pages). */
export const dynamic = 'force-dynamic';

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Sojori · Séjours Premium au Maroc · Riads, Villas & Appartements',
  description:
    'Découvrez des riads, villas et appartements triés par des experts locaux. Marrakech, Essaouira, Fès, Casablanca. Biens vérifiés, recherche IA, Property Managers sélectionnés.',
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
  authors: [{ name: 'Sojori', url: 'https://sojori.com' }],
  creator: 'Sojori',
  publisher: 'Sojori',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://sojori.com',
    title: 'Sojori · Séjours Premium au Maroc',
    description:
      'Riads, villas & appartements triés par des experts locaux. Marrakech, Essaouira, Fès, Casablanca.',
    siteName: 'Sojori',
    images: [
      {
        url: 'https://sojori.com/og-image.jpg',
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
    images: ['https://sojori.com/og-image.jpg'],
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
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      localization={frFR as Parameters<typeof ClerkProvider>[0]['localization']}
      appearance={clerkAppearance}
      signInUrl="/login"
      signUpUrl="/signup"
      signInForceRedirectUrl="/"
      signUpForceRedirectUrl="/"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <html lang="fr" className={instrumentSerif.variable}>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
