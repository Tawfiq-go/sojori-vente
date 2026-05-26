'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { listings } from '@/lib/mock/db';

export default function SearchPage() {
  return (
    <>
      <Navigation />

      <main style={{ paddingTop: '88px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '40px 32px' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '48px', marginBottom: '32px' }}>
            Explorer les <span style={{ fontStyle: 'italic', color: 'var(--goldD)' }}>biens</span>
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                style={{
                  display: 'block',
                  background: 'var(--card)',
                  border: '1px solid var(--b)',
                  borderRadius: '16px',
                  padding: '16px',
                  transition: 'transform 0.2s',
                }}
              >
                <div
                  style={{
                    aspectRatio: '4/3',
                    background: 'linear-gradient(135deg, #fde68a, #d97706)',
                    borderRadius: '12px',
                    marginBottom: '12px',
                  }}
                />
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{listing.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--ink3)', marginBottom: '8px' }}>
                  {listing.neighborhood}, {listing.city}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700' }}>{listing.pricePerNight}€/nuit</span>
                  <span style={{ fontSize: '12px', color: 'var(--gold)' }}>★ {listing.rating}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
