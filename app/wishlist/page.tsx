'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useWishlistStore } from '@/lib/store/useBookingStore';
import { apiClient, type Listing } from '@/lib/api/client';
import { listingDisplayPrice } from '@/lib/pricing/listingPrice';
import { PriceDisplay } from '@/components/PriceDisplay';

export default function WishlistPage() {
  const wishlistItems = useWishlistStore((state) => state.items);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const [wishlistListings, setWishlistListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (wishlistItems.length === 0) {
        if (active) {
          setWishlistListings([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      const results = await Promise.all(
        wishlistItems.map((id) => apiClient.getListingById(id)),
      );
      if (!active) return;
      setWishlistListings(
        results
          .filter((r) => r.success && r.data)
          .map((r) => r.data!),
      );
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [wishlistItems]);

  const colors = ['', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return (
    <>
      <Navigation />

      <main style={{ paddingTop: '88px', minHeight: '100vh', padding: '120px 32px 80px' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
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
              Mes favoris
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
              Ma <span style={{ fontStyle: 'italic', color: 'var(--rose)' }}>Wishlist</span>
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--ink2)', lineHeight: '1.6', maxWidth: '640px' }}>
              {wishlistListings.length} bien{wishlistListings.length > 1 ? 's' : ''} sauvegardé
              {wishlistListings.length > 1 ? 's' : ''}
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 32px', color: 'var(--ink3)' }}>
              Chargement de vos favoris...
            </div>
          ) : wishlistListings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 32px' }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>♡</div>
              <h3 style={{ fontSize: '24px', marginBottom: '12px', fontWeight: '600' }}>
                Votre wishlist est vide
              </h3>
              <p style={{ color: 'var(--ink3)', marginBottom: '32px', fontSize: '15px' }}>
                Commencez à sauvegarder vos biens préférés pour les retrouver facilement
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
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px',
              }}
            >
              {wishlistListings.map((listing, i) => {
                const listingId = listing._id || (listing as { id?: string }).id || '';
                const colorClass = colors[i % colors.length];
                return (
                  <div key={listingId} style={{ position: 'relative' }}>
                    <Link
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
                          background:
                            colorClass === 'b'
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
                            marginTop: '10px',
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '8px',
                          }}
                        >
                          <PriceDisplay
                            priceInMAD={listingDisplayPrice(listing)}
                            period="nuit"
                            size="small"
                          />
                        </div>
                      </div>
                    </Link>

                    <button
                      onClick={() => removeFromWishlist(listingId)}
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
                        color: 'var(--rose)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      ♥
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
