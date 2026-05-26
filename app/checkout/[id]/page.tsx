'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { getListingById } from '@/lib/mock/db';
import { use } from 'react';

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
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

      <main style={{ paddingTop: '88px', minHeight: '100vh', background: 'var(--paper2)' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '40px 32px' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '48px', marginBottom: '40px', textAlign: 'center' }}>
            Finaliser votre <span style={{ fontStyle: 'italic', color: 'var(--goldD)' }}>réservation</span>
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '48px' }}>
            <div>
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--b)',
                  borderRadius: '24px',
                  padding: '32px',
                  marginBottom: '24px',
                }}
              >
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '28px', marginBottom: '24px' }}>
                  Vos coordonnées
                </h2>

                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink3)', display: 'block', marginBottom: '8px' }}>
                      PRÉNOM
                    </label>
                    <input
                      type="text"
                      placeholder="Sarah"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--b)',
                        borderRadius: '12px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink3)', display: 'block', marginBottom: '8px' }}>
                      NOM
                    </label>
                    <input
                      type="text"
                      placeholder="Martin"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--b)',
                        borderRadius: '12px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink3)', display: 'block', marginBottom: '8px' }}>
                      EMAIL
                    </label>
                    <input
                      type="email"
                      placeholder="sarah.martin@example.com"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--b)',
                        borderRadius: '12px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink3)', display: 'block', marginBottom: '8px' }}>
                      TÉLÉPHONE
                    </label>
                    <input
                      type="tel"
                      placeholder="+33 6 12 34 56 78"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--b)',
                        borderRadius: '12px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--b)',
                  borderRadius: '24px',
                  padding: '32px',
                }}
              >
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '28px', marginBottom: '24px' }}>Paiement</h2>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink3)', display: 'block', marginBottom: '8px' }}>
                    NUMÉRO DE CARTE
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--b)',
                      borderRadius: '12px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink3)', display: 'block', marginBottom: '8px' }}>
                      EXPIRATION
                    </label>
                    <input
                      type="text"
                      placeholder="MM/AA"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--b)',
                        borderRadius: '12px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink3)', display: 'block', marginBottom: '8px' }}>
                      CVC
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--b)',
                        borderRadius: '12px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>

                <button
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'var(--ink)',
                    color: 'var(--paper)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '700',
                    marginTop: '24px',
                    cursor: 'pointer',
                  }}
                >
                  Confirmer et payer {listing.pricePerNight}€
                </button>
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
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '20px', borderBottom: '1px solid var(--b)' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{listing.title}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--ink3)' }}>
                    {listing.neighborhood}, {listing.city}
                  </p>
                </div>

                <div style={{ padding: '20px', borderBottom: '1px solid var(--b)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px' }}>Arrivée</span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>15 juillet</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px' }}>Départ</span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>22 juillet</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px' }}>Voyageurs</span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>4 adultes</span>
                  </div>
                </div>

                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px' }}>7 nuits × {listing.pricePerNight}€</span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{listing.pricePerNight * 7}€</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--b)',
                      marginTop: '12px',
                    }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: '700' }}>Total</span>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: '24px', color: 'var(--goldD)' }}>
                      {listing.pricePerNight * 7}€
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
