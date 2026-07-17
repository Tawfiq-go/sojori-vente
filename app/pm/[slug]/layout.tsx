import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/config/site';
import { apiClient } from '@/lib/api/client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await apiClient.getPropertyManagerBySlug(slug);
  if (!res.success || !res.data) {
    return {};
  }
  const { propertyManager, listings } = res.data;
  const title = `${propertyManager.name} — Property Manager | Sojori`;
  const description = (
    propertyManager.tagline ||
    propertyManager.description ||
    `Property manager vérifié sur Sojori, ${listings.length} biens.`
  ).slice(0, 160);
  const url = `${SITE_URL}/pm/${slug}`;
  const image = propertyManager.coverUrl || propertyManager.images?.[0];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: image ? [image] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function PropertyManagerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
