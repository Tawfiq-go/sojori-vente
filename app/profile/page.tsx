'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { CountryPhoneSelector } from '@/components/checkout/CountryPhoneSelector';
import { buildBookingProfilePayload } from '@/lib/clerk/bookingProfile';
import { syncBookingProfileToClerk } from '@/lib/clerk/syncBookingProfile';

type ReservationRow = {
  _id: string;
  reservationNumber: string;
  arrivalDate: string;
  departureDate: string;
  status: string;
  totalPrice?: number;
  listing?: { name?: string; cityName?: string };
};

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [activeTab, setActiveTab] = useState<'reservations' | 'wishlist' | 'settings'>('reservations');
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState('+212');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !user?.id) return;
    const unsafe = user.unsafeMetadata as Record<string, string | undefined>;
    if (unsafe.phoneCountryCode) setPhoneCountry(unsafe.phoneCountryCode);
    if (unsafe.phone) setPhone(String(unsafe.phone).replace(unsafe.phoneCountryCode || '', ''));
    if (unsafe.nationality) setNationality(unsafe.nationality);

    setLoadingReservations(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/reservation/by-user/${user.id}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.reservations) setReservations(data.reservations);
      })
      .catch(() => {})
      .finally(() => setLoadingReservations(false));
  }, [isSignedIn, user?.id]);

  if (!isLoaded) {
    return (
      <>
        <Navigation />
        <main style={{ paddingTop: '88px', minHeight: '100vh', textAlign: 'center', padding: '100px 32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ color: 'var(--ink3)' }}>Chargement...</h2>
        </main>
      </>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        <Navigation />
        <main style={{ paddingTop: '88px', minHeight: '100vh', textAlign: 'center', padding: '100px 32px' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔒</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '48px', marginBottom: '16px' }}>
            Connexion requise
          </h1>
          <p style={{ color: 'var(--ink3)', marginBottom: '32px', fontSize: '15px' }}>
            Connectez-vous pour accéder à votre profil et vos réservations
          </p>
          <Link
            href="/login"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'var(--ink)',
              color: 'var(--paper)',
              borderRadius: '99px',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Se connecter
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />

      <main style={{ paddingTop: '88px', minHeight: '100vh', background: 'var(--paper2)' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '40px 32px' }}>
          {/* Header */}
          <div style={{ marginBottom: '48px' }}>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--rose)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ width: '24px', height: '1px', background: 'currentColor' }}></div>
              Mon Compte
            </div>
            <h1
              style={{
                margin: '0 0 12px',
                fontFamily: 'var(--serif)',
                fontSize: '56px',
                fontWeight: '400',
                letterSpacing: '-0.035em',
              }}
            >
              Bonjour, <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>{user?.firstName || 'Voyageur'}</span>
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--ink2)', lineHeight: '1.6' }}>
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '32px',
              borderBottom: '1px solid var(--b)',
              paddingBottom: '0',
            }}
          >
            {[
              { id: 'reservations' as const, label: 'Mes réservations', icon: '📅' },
              { id: 'wishlist' as const, label: 'Mes favoris', icon: '♥' },
              { id: 'settings' as const, label: 'Paramètres', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: activeTab === tab.id ? 'var(--ink)' : 'var(--ink3)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === 'reservations' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
                Vos réservations ({loadingReservations ? '…' : reservations.length})
              </h2>

              {loadingReservations ? (
                <p style={{ color: 'var(--ink3)' }}>Chargement…</p>
              ) : reservations.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '80px 32px',
                    background: 'var(--card)',
                    borderRadius: '24px',
                    border: '1px solid var(--b)',
                  }}
                >
                  <div style={{ fontSize: '64px', marginBottom: '24px' }}>🏖️</div>
                  <h3 style={{ fontSize: '24px', marginBottom: '12px', fontWeight: '600' }}>
                    Aucune réservation
                  </h3>
                  <p style={{ color: 'var(--ink3)', marginBottom: '32px', fontSize: '15px' }}>
                    Explorez nos biens et réservez votre prochain séjour au Maroc
                  </p>
                  <Link
                    href="/search"
                    style={{
                      display: 'inline-block',
                      padding: '12px 24px',
                      background: 'var(--gold)',
                      color: 'var(--ink)',
                      borderRadius: '99px',
                      fontWeight: '600',
                      fontSize: '14px',
                    }}
                  >
                    Découvrir les biens
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                  {reservations.map((reservation) => (
                    <div
                      key={reservation._id}
                      style={{
                        background: 'var(--card)',
                        border: '1px solid var(--b)',
                        borderRadius: '20px',
                        padding: '24px',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: '24px',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: '#16a34a',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            letterSpacing: '0.05em',
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {reservation.status} · {reservation.reservationNumber}
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                          {reservation.listing?.name || 'Séjour Sojori'}
                        </h3>
                        <div style={{ display: 'flex', gap: '24px', fontSize: '14px', flexWrap: 'wrap' }}>
                          <div>
                            <span style={{ color: 'var(--ink3)' }}>Arrivée:</span>{' '}
                            <strong>{new Date(reservation.arrivalDate).toLocaleDateString('fr-FR')}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--ink3)' }}>Départ:</span>{' '}
                            <strong>{new Date(reservation.departureDate).toLocaleDateString('fr-FR')}</strong>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {reservation.totalPrice != null && (
                          <div
                            style={{
                              fontSize: '28px',
                              fontWeight: '700',
                              marginBottom: '8px',
                              fontFamily: 'var(--serif)',
                            }}
                          >
                            {reservation.totalPrice} MAD
                          </div>
                        )}
                        <Link
                          href={`/checkout/return?reservation=${reservation.reservationNumber}`}
                          style={{
                            display: 'inline-block',
                            padding: '10px 20px',
                            background: 'var(--ink)',
                            color: 'var(--paper)',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: '600',
                          }}
                        >
                          Voir détails
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
                Vos biens favoris
              </h2>
              <div
                style={{
                  textAlign: 'center',
                  padding: '80px 32px',
                  background: 'var(--card)',
                  borderRadius: '24px',
                  border: '1px solid var(--b)',
                }}
              >
                <div style={{ fontSize: '64px', marginBottom: '24px' }}>♡</div>
                <h3 style={{ fontSize: '24px', marginBottom: '12px', fontWeight: '600' }}>
                  Votre wishlist est vide
                </h3>
                <p style={{ color: 'var(--ink3)', marginBottom: '32px', fontSize: '15px' }}>
                  Sauvegardez vos biens préférés pour les retrouver facilement
                </p>
                <Link
                  href="/search"
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: 'var(--rose)',
                    color: '#fff',
                    borderRadius: '99px',
                    fontWeight: '600',
                    fontSize: '14px',
                  }}
                >
                  Explorer les biens
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
                Paramètres du compte
              </h2>
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--b)',
                  borderRadius: '20px',
                  padding: '32px',
                }}
              >
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                    Informations personnelles
                  </h3>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink3)', marginBottom: '8px' }}>
                        NOM COMPLET
                      </div>
                      <div style={{ fontSize: '15px' }}>{user?.fullName || 'Non renseigné'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink3)', marginBottom: '8px' }}>
                        EMAIL
                      </div>
                      <div style={{ fontSize: '15px' }}>{user?.primaryEmailAddress?.emailAddress}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink3)', marginBottom: '8px' }}>
                        TÉLÉPHONE (optionnel)
                      </div>
                      <div style={{ display: 'flex', gap: '8px', maxWidth: '420px' }}>
                        <CountryPhoneSelector value={phoneCountry} onChange={setPhoneCountry} />
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="612345678"
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: '1px solid var(--b)',
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink3)', marginBottom: '8px' }}>
                        NATIONALITÉ (optionnel)
                      </div>
                      <input
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value.toUpperCase())}
                        placeholder="MA, FR…"
                        maxLength={2}
                        style={{
                          width: '120px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid var(--b)',
                        }}
                      />
                    </div>
                    {profileMessage && (
                      <p style={{ fontSize: '13px', color: 'var(--ink2)' }}>{profileMessage}</p>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--b)',
                    paddingTop: '24px',
                  }}
                >
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                    Actions
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={savingProfile}
                      onClick={async () => {
                        setSavingProfile(true);
                        setProfileMessage(null);
                        try {
                          await syncBookingProfileToClerk(
                            buildBookingProfilePayload({
                              phone: phone ? `${phoneCountry}${phone}` : undefined,
                              phoneCountryCode: phoneCountry,
                              country: nationality,
                              nationality,
                              source: 'settings',
                            }),
                          );
                          setProfileMessage('Profil enregistré — synchronisation backend via webhook.');
                        } catch {
                          setProfileMessage('Erreur lors de la sauvegarde.');
                        } finally {
                          setSavingProfile(false);
                        }
                      }}
                      style={{
                        padding: '10px 20px',
                        background: 'var(--ink)',
                        color: 'var(--paper)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {savingProfile ? 'Enregistrement…' : 'Enregistrer téléphone / nationalité'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                          window.location.href = '/';
                        }
                      }}
                      style={{
                        padding: '10px 20px',
                        background: 'transparent',
                        color: 'var(--rose)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: '1px solid var(--rose)',
                        cursor: 'pointer',
                      }}
                    >
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
