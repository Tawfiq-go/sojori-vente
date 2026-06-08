'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { apiClient, type PropertyManager } from '@/lib/api/client';

export default function VerifiedHostsPage() {
  const [propertyManagers, setPropertyManagers] = useState<PropertyManager[]>([]);

  useEffect(() => {
    let active = true;
    apiClient.getPropertyManagers().then((res) => {
      if (active && res.success && Array.isArray(res.data)) {
        setPropertyManagers(res.data);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const avgRating =
    propertyManagers.length > 0
      ? (
          propertyManagers.reduce((s, pm) => s + (pm.rating || 0), 0) /
          propertyManagers.length
        ).toFixed(1)
      : '—';

  return (
    <>
      <Navigation />

      <main style={{ paddingTop: '88px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '60px 32px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              display: 'inline-block',
              animation: 'fadeIn 0.6s ease-out'
            }}>
              ✓
            </div>
            <h1 style={{
              fontFamily: 'var(--serif)',
              fontSize: '56px',
              marginBottom: '20px',
              letterSpacing: '-0.02em'
            }}>
              Hôtes vérifiés Sojori
            </h1>
            <p style={{
              fontSize: '18px',
              color: 'var(--ink3)',
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Tous nos hôtes sont rigoureusement sélectionnés et vérifiés.
              Qualité garantie, service impeccable, confiance totale.
            </p>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginBottom: '80px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '32px',
              background: 'var(--card)',
              border: '1px solid var(--b)',
              borderRadius: '16px'
            }}>
              <div style={{ fontSize: '40px', fontFamily: 'var(--serif)', marginBottom: '8px' }}>
                {propertyManagers.length}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--ink3)' }}>Hôtes vérifiés</div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '32px',
              background: 'var(--card)',
              border: '1px solid var(--b)',
              borderRadius: '16px'
            }}>
              <div style={{ fontSize: '40px', fontFamily: 'var(--serif)', marginBottom: '8px' }}>{avgRating}</div>
              <div style={{ fontSize: '14px', color: 'var(--ink3)' }}>Note moyenne</div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '32px',
              background: 'var(--card)',
              border: '1px solid var(--b)',
              borderRadius: '16px'
            }}>
              <div style={{ fontSize: '40px', fontFamily: 'var(--serif)', marginBottom: '8px' }}>100%</div>
              <div style={{ fontSize: '14px', color: 'var(--ink3)' }}>Satisfaction clients</div>
            </div>
          </div>

          {/* Nos critères de vérification */}
          <div style={{ marginBottom: '80px' }}>
            <h2 style={{
              fontFamily: 'var(--serif)',
              fontSize: '36px',
              marginBottom: '32px',
              textAlign: 'center'
            }}>
              Nos critères de vérification
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {[
                { icon: '🏠', title: 'Propriété vérifiée', desc: 'Inspection physique de chaque bien' },
                { icon: '📄', title: 'Documents légaux', desc: 'Licence touristique et assurances' },
                { icon: '⭐', title: 'Note minimum', desc: 'Minimum 4.5/5 sur 6 mois' },
                { icon: '🛡️', title: 'Service client', desc: 'Disponibilité 24/7 garantie' },
                { icon: '✨', title: 'Qualité premium', desc: 'Standards Sojori respectés' },
                { icon: '💬', title: 'Avis vérifiés', desc: 'Retours clients authentiques' },
              ].map((criteria, i) => (
                <div key={i} style={{
                  padding: '24px',
                  background: 'var(--card)',
                  border: '1px solid var(--b)',
                  borderRadius: '16px',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>{criteria.icon}</div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    {criteria.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--ink3)', lineHeight: '1.5' }}>
                    {criteria.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Liste des hôtes */}
          <div>
            <h2 style={{
              fontFamily: 'var(--serif)',
              fontSize: '36px',
              marginBottom: '32px',
              textAlign: 'center'
            }}>
              Nos hôtes partenaires
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              {propertyManagers.map((pm) => (
                <Link
                  href={`/pm/${pm.slug}`}
                  key={pm.slug || pm.id}
                  style={{
                    display: 'block',
                    padding: '32px',
                    background: 'var(--card)',
                    border: '1px solid var(--b)',
                    borderRadius: '16px',
                    transition: 'all 0.2s',
                    textDecoration: 'none'
                  }}
                >
                  {pm.coverUrl ? (
                    <div style={{
                      height: '140px',
                      margin: '-32px -32px 16px',
                      borderTopLeftRadius: '16px',
                      borderTopRightRadius: '16px',
                      background: `url(${pm.coverUrl}) center/cover no-repeat`
                    }} />
                  ) : (
                    <div style={{
                      width: '64px',
                      height: '64px',
                      margin: '0 auto 16px',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#fff',
                      background: pm.brandColor
                        ? `linear-gradient(135deg, ${pm.brandColor.from}, ${pm.brandColor.to})`
                        : 'linear-gradient(135deg, #e8c87a, #c89b3c)'
                    }}>
                      {pm.logoText || pm.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <h3 style={{
                    fontSize: '20px',
                    fontFamily: 'var(--serif)',
                    marginBottom: '12px',
                    textAlign: 'center'
                  }}>
                    {pm.name}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--ink3)',
                    marginBottom: '16px',
                    lineHeight: '1.5',
                    textAlign: 'center'
                  }}>
                    {pm.tagline || pm.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--b)'
                  }}>
                    <div style={{ fontSize: '13px', color: 'var(--ink3)' }}>
                      {pm.listingCount} biens
                    </div>
                    {pm.rating ? (
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gold)' }}>
                        ⭐ {pm.rating}
                      </div>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{
            marginTop: '80px',
            textAlign: 'center',
            padding: '60px 32px',
            background: 'linear-gradient(135deg, #fde68a, #c89b3c)',
            borderRadius: '24px'
          }}>
            <h2 style={{
              fontFamily: 'var(--serif)',
              fontSize: '36px',
              marginBottom: '16px',
              color: 'var(--ink)'
            }}>
              Vous êtes hôte ?
            </h2>
            <p style={{
              fontSize: '16px',
              marginBottom: '24px',
              color: 'var(--ink2)',
              maxWidth: '600px',
              margin: '0 auto 24px'
            }}>
              Rejoignez notre réseau d'hôtes vérifiés et bénéficiez de notre expertise.
            </p>
            <Link
              href="/become-host"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: 'var(--ink)',
                color: 'var(--paper)',
                borderRadius: '99px',
                fontSize: '15px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              Devenir hôte Sojori
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
