'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { getListingById } from '@/lib/mock/db';
import { use } from 'react';

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const listing = getListingById(id);

  if (!listing) {
    return (
      <>
        <Navigation />
        <main style={{ paddingTop: '88px', minHeight: '100vh', textAlign: 'center', padding: '100px 32px' }}>
          <h1>Bien non trouvé</h1>
          <Link href="/search" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>
            Retour à la recherche
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />

      <main style={{ paddingTop: '88px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '40px 32px' }}>
          <Link href="/search" style={{ display: 'inline-block', marginBottom: '24px', color: 'var(--ink2)' }}>
            ← Retour
          </Link>

          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '48px', marginBottom: '16px' }}>
            {listing.title}
          </h1>

          <p style={{ fontSize: '16px', color: 'var(--ink3)', marginBottom: '32px' }}>
            {listing.neighborhood}, {listing.city.charAt(0).toUpperCase() + listing.city.slice(1)}
          </p>

          <div
            style={{
              aspectRatio: '16/9',
              background: 'linear-gradient(135deg, #fde68a, #d97706)',
              borderRadius: '24px',
              marginBottom: '40px',
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '60px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '32px', marginBottom: '16px' }}>Description</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--ink2)', marginBottom: '32px' }}>
                {listing.description}
              </p>

              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Points forts</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {listing.highlights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--card)',
                      border: '1px solid var(--b)',
                      borderRadius: '12px',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{h.icon}</span>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{h.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--ink3)' }}>{h.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
                Équipements
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {listing.amenities.map((a, i) => (
                  <div key={i} style={{ fontSize: '14px', color: 'var(--ink2)' }}>
                    ✓ {a}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div
                style={{
                  position: 'sticky',
                  top: '108px',
                  background: 'var(--card)',
                  border: '1px solid var(--b)',
                  borderRadius: '24px',
                  padding: '24px',
                  boxShadow: '0 8px 24px rgba(15,16,17,0.08)',
                }}
              >
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '32px' }}>{listing.pricePerNight}€</span>
                  <span style={{ fontSize: '14px', color: 'var(--ink3)' }}> / nuit</span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink3)', marginBottom: '8px' }}>
                    ARRIVÉE
                  </div>
                  <input
                    type="date"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--b)',
                      borderRadius: '12px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink3)', marginBottom: '8px' }}>
                    DÉPART
                  </div>
                  <input
                    type="date"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--b)',
                      borderRadius: '12px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink3)', marginBottom: '8px' }}>
                    VOYAGEURS
                  </div>
                  <select
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--b)',
                      borderRadius: '12px',
                      fontSize: '14px',
                    }}
                  >
                    <option>2 adultes</option>
                    <option>4 adultes</option>
                    <option>6 adultes</option>
                    <option>8 adultes</option>
                  </select>
                </div>

                <Link
                  href={`/checkout/${listing.id}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '14px',
                    background: 'var(--ink)',
                    color: 'var(--paper)',
                    textAlign: 'center',
                    borderRadius: '12px',
                    fontWeight: '600',
                    marginBottom: '12px',
                  }}
                >
                  Réserver
                </Link>

                <p style={{ fontSize: '12px', color: 'var(--ink3)', textAlign: 'center' }}>
                  Vous ne serez pas débité maintenant
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
