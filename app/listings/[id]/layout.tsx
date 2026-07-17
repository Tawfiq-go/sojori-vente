import type { Metadata } from 'next';
import { apiClient } from '@/lib/api/client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const res = await apiClient.getListingById(id);
  if (!res.success || !res.data) {
    return {};
  }
  const listing = res.data;
  const title = `${listing.title} — ${listing.city} | Sojori`;
  const description = (
    listing.description ||
    `${listing.propertyType} à ${listing.city}, ${listing.bedrooms} chambres, jusqu'à ${listing.maxGuests} voyageurs.`
  ).slice(0, 160);
  const url = `https://sojori.com/listings/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: listing.images?.[0] ? [listing.images[0]] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: listing.images?.[0] ? [listing.images[0]] : undefined,
    },
  };
}

export default function ListingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
