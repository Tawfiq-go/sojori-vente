/** La coque de la plateforme Sojori (Clerk, JSON-LD, polices) — chargée À LA DEMANDE par le layout racine : un site de PM ne la charge pas. */
import { SITE_URL } from '@/lib/config/site';
import { Instrument_Serif } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import ThemePreview from '@/components/ThemePreview';
import { frFR } from '@clerk/localizations';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { clerkAppearance } from '@/lib/clerk/appearance';

/** Vercel prod : évite prerender statique (useSearchParams / Clerk sur plusieurs pages). */
export const dynamic = 'force-dynamic';

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  style: ['normal', 'italic'],
});

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Sojori',
  url: 'https://sojori.com',
  sameAs: [
    SITE_URL,
    'https://www.linkedin.com/company/108488739',
    'https://instagram.com/sojoriapp',
  ],
  description:
    "Sojori est une entreprise de technologie hôtelière. sojori.com est sa plateforme de gestion locative pour property managers professionnels ; book.sojori.com est sa marketplace de location courte durée au Maroc (riads, villas, appartements).",
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Sojori',
  url: SITE_URL,
  publisher: {
    '@type': 'Organization',
    name: 'Sojori',
    url: 'https://sojori.com',
  },
};

export function LayoutPlateforme({
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
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
          />
        </head>
        <body>
          <ThemePreview />
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
