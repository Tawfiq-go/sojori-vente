'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { apiClient, type PropertyManager, type Listing } from '@/lib/api/client';
import { listingDisplayPrice } from '@/lib/pricing/listingPrice';

export default function PMPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [pm, setPm] = useState<PropertyManager | null>(null);
  const [pmListings, setPmListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiClient.getPropertyManagerBySlug(slug).then((res) => {
      if (!active) return;
      if (res.success && res.data?.propertyManager) {
        setPm(res.data.propertyManager);
        setPmListings(Array.isArray(res.data.listings) ? res.data.listings : []);
      } else {
        setPm(null);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navigation />
        <main style={{ paddingTop: '88px', minHeight: '100vh', textAlign: 'center', padding: '120px 32px', color: 'var(--ink3)' }}>
          Chargement…
        </main>
      </>
    );
  }

  if (!pm) {
    return (
      <>
        <Navigation />
        <main style={{ paddingTop: '88px', minHeight: '100vh', textAlign: 'center', padding: '120px 32px' }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '48px', marginBottom: '24px' }}>
            Property Manager introuvable
          </h1>
          <Link href="/" style={{ color: 'var(--gold)', fontWeight: '600' }}>
            Retour à l'accueil
          </Link>
        </main>
      </>
    );
  }

  const brandFrom = pm.brandColor?.from || '#e8c87a';
  const brandTo = pm.brandColor?.to || '#c89b3c';
  const colors = ['', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return (
    <>
      <Navigation />

      <main style={{ paddingTop: '88px', minHeight: '100vh' }}>
        {/* Hero Section */}
        <section
          style={{
            background: pm.coverUrl
              ? `linear-gradient(135deg, ${brandFrom}cc, ${brandTo}cc), url(${pm.coverUrl}) center/cover no-repeat`
              : `linear-gradient(135deg, ${brandFrom}, ${brandTo})`,
            padding: '80px 32px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 50%)',
              mixBlendMode: 'overlay',
            }}
          ></div>
          <div style={{ maxWidth: '1320px', margin: '0 auto', position: 'relative' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                padding: '6px 14px',
                borderRadius: '99px',
                fontSize: '11px',
                fontFamily: 'var(--mono)',
                fontWeight: '700',
                color: '#fff',
                letterSpacing: '0.06em',
                marginBottom: '24px',
              }}
            >
              {pm.verified && '✓ VÉRIFIÉ'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '24px',
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--mono)',
                  fontSize: '42px',
                  fontWeight: '800',
                  color: brandTo,
                  border: '3px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                }}
              >
                {pm.logoText || pm.name.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <h1
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: '56px',
                    fontWeight: '400',
                    letterSpacing: '-0.03em',
                    color: '#fff',
                    margin: '0 0 8px',
                    textShadow: '0 2px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  {pm.name}
                </h1>
                <p
                  style={{
                    fontSize: '18px',
                    color: 'rgba(255,255,255,0.9)',
                    margin: 0,
                    fontWeight: '500',
                  }}
                >
                  {pm.tagline || pm.description}
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '32px',
                padding: '24px 32px',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              {pm.rating ? (
                <>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: 'rgba(255,255,255,0.7)',
                        letterSpacing: '0.06em',
                        marginBottom: '4px',
                      }}
                    >
                      NOTE MOYENNE
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff' }}>
                      ★ {pm.rating}
                    </div>
                  </div>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                </>
              ) : null}

              <div>
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: 'rgba(255,255,255,0.7)',
                    letterSpacing: '0.06em',
                    marginBottom: '4px',
                  }}
                >
                  BIENS
                </div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff' }}>
                  {pmListings.length}
                </div>
              </div>

              {pm.responseTime ? (
                <>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: 'rgba(255,255,255,0.7)',
                        letterSpacing: '0.06em',
                        marginBottom: '4px',
                      }}
                    >
                      RÉPONSE
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff' }}>
                      {pm.responseTime}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {/* Gallery (uploaded PM photos) */}
        {pm.images && pm.images.length > 1 && (
          <section style={{ padding: '40px 32px 0', maxWidth: '1320px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {pm.images.slice(0, 8).map((img, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: '4/3',
                    borderRadius: '14px',
                    background: `url(${img}) center/cover no-repeat`,
                    border: '1px solid var(--b)',
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Listings Section */}
        <section style={{ padding: '80px 32px', maxWidth: '1320px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px' }}>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--gold)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ width: '24px', height: '1px', background: 'currentColor' }}></div>
              Portfolio
            </div>
            <h2
              style={{
                margin: '0 0 12px',
                fontFamily: 'var(--serif)',
                fontSize: '48px',
                fontWeight: '400',
                letterSpacing: '-0.035em',
              }}
            >
              Tous les <span style={{ fontStyle: 'italic', color: 'var(--goldD)' }}>biens</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--ink2)', lineHeight: '1.6', maxWidth: '640px' }}>
              {pmListings.length} biens disponibles gérés par {pm.name}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
            }}
          >
            {pmListings.map((listing, i) => {
              const colorClass = colors[i % colors.length];
              const listingId = listing._id || (listing as any).id;
              const cover = listing.images?.[0];
              return (
                <Link
                  key={listingId}
                  href={`/listings/${listingId}`}
                  style={{
                    display: 'block',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '4/3',
                      borderRadius: '18px',
                      overflow: 'hidden',
                      marginBottom: '12px',
                      background: cover
                        ? `url(${cover}) center/cover no-repeat`
                        : colorClass === 'b'
                          ? 'linear-gradient(135deg, #a5f3fc, #0e7490)'
                          : colorClass === 'c'
                            ? 'linear-gradient(135deg, #c4b5fd, #7c3aed)'
                            : colorClass === 'd'
                              ? 'linear-gradient(135deg, #fda4af, #dc2626)'
                              : colorClass === 'e'
                                ? 'linear-gradient(135deg, #86efac, #15803d)'
                                : colorClass === 'f'
                                  ? 'linear-gradient(135deg, #fcd34d, #a16207)'
                                  : colorClass === 'g'
                                    ? 'linear-gradient(135deg, #93c5fd, #1d4ed8)'
                                    : colorClass === 'h'
                                      ? 'linear-gradient(135deg, #f0abfc, #a21caf)'
                                      : 'linear-gradient(135deg, #fde68a, #d97706)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 50%)',
                        mixBlendMode: 'overlay',
                      }}
                    ></div>
                    <button
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px',
                        color: 'var(--ink2)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      ♡
                    </button>
                    {(listing as any).source === 'exclusive' && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          padding: '4px 9px',
                          background: 'linear-gradient(135deg, #1c4f3a, #0a3526)',
                          color: '#fff',
                          borderRadius: '99px',
                          fontFamily: 'var(--mono)',
                          fontSize: '9.5px',
                          fontWeight: '800',
                          letterSpacing: '0.06em',
                        }}
                      >
                        ✦ EXCLUSIF
                      </div>
                    )}
                  </div>

                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '10px',
                        marginBottom: '2px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          letterSpacing: '-0.01em',
                          lineHeight: '1.3',
                          flex: 1,
                        }}
                      >
                        {listing.title}
                      </div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontFamily: 'var(--mono)',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ color: 'var(--gold)' }}>★</span>
                        {listing.rating}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--ink3)',
                        marginBottom: '3px',
                        letterSpacing: '-0.005em',
                      }}
                    >
                      {listing.neighborhood}, {listing.city}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '4px',
                        fontFamily: 'var(--mono)',
                        fontSize: '10.5px',
                        color: 'var(--ink3)',
                        fontWeight: '600',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {listing.bedrooms > 0 ? (
                        <>
                          <span>{listing.bedrooms} chambres</span>
                          <span
                            style={{
                              width: '3px',
                              height: '3px',
                              borderRadius: '50%',
                              background: 'var(--ink4)',
                            }}
                          ></span>
                        </>
                      ) : null}
                      <span>{listing.maxGuests} voyageurs</span>
                    </div>
                    <div
                      style={{
                        marginTop: '10px',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '8px',
                      }}
                    >
                      {(() => {
                        const price = listingDisplayPrice(listing);
                        return price > 0 ? (
                          <>
                            <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.01em' }}>
                              {price} {listing.currency || 'MAD'}
                            </span>
                            <span style={{ color: 'var(--ink3)', fontSize: '13px', fontWeight: '500' }}>
                              /nuit
                            </span>
                          </>
                        ) : (
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gold)' }}>
                            Voir les disponibilités
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
