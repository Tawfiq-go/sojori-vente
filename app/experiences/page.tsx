'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';

const experiences = [
  {
    id: 1,
    title: 'Cours de cuisine marocaine',
    description: 'Apprenez à préparer un tajine authentique avec un chef local',
    icon: '👨‍🍳',
    price: 450,
    duration: '3 heures',
    city: 'Marrakech',
    rating: 4.9,
    reviews: 127
  },
  {
    id: 2,
    title: 'Balade à dos de chameau',
    description: 'Découvrez le désert d\'Agafay au coucher du soleil',
    icon: '🐫',
    price: 650,
    duration: '4 heures',
    city: 'Marrakech',
    rating: 4.8,
    reviews: 203
  },
  {
    id: 3,
    title: 'Visite guidée Médina',
    description: 'Explorez les souks et monuments historiques',
    icon: '🕌',
    price: 300,
    duration: '2 heures',
    city: 'Fès',
    rating: 4.9,
    reviews: 156
  },
  {
    id: 4,
    title: 'Hammam & Spa traditionnel',
    description: 'Rituel de bien-être marocain complet',
    icon: '💆',
    price: 550,
    duration: '2.5 heures',
    city: 'Marrakech',
    rating: 5.0,
    reviews: 89
  },
  {
    id: 5,
    title: 'Surf à Essaouira',
    description: 'Cours de surf privé sur les plages atlantiques',
    icon: '🏄',
    price: 400,
    duration: '2 heures',
    city: 'Essaouira',
    rating: 4.7,
    reviews: 94
  },
  {
    id: 6,
    title: 'Randonnée Atlas',
    description: 'Trek dans les montagnes de l\'Atlas avec guide berbère',
    icon: '⛰️',
    price: 850,
    duration: 'Journée',
    city: 'Marrakech',
    rating: 4.9,
    reviews: 71
  },
];

export default function ExperiencesPage() {
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
              ✨
            </div>
            <h1 style={{
              fontFamily: 'var(--serif)',
              fontSize: '56px',
              marginBottom: '20px',
              letterSpacing: '-0.02em'
            }}>
              Expériences authentiques
            </h1>
            <p style={{
              fontSize: '18px',
              color: 'var(--ink3)',
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Vivez le Maroc autrement. Activités locales, guides passionnés,
              moments inoubliables.
            </p>
          </div>

          {/* Catégories */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginBottom: '48px',
            flexWrap: 'wrap'
          }}>
            {['Toutes', 'Culinaire', 'Aventure', 'Culture', 'Bien-être', 'Sport'].map((cat) => (
              <button
                key={cat}
                style={{
                  padding: '10px 20px',
                  background: cat === 'Toutes' ? 'var(--ink)' : 'var(--card)',
                  color: cat === 'Toutes' ? 'var(--paper)' : 'var(--ink2)',
                  border: '1px solid var(--b)',
                  borderRadius: '99px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Liste des expériences */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '32px',
            marginBottom: '80px'
          }}>
            {experiences.map((exp) => (
              <div
                key={exp.id}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--b)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
              >
                {/* Image placeholder */}
                <div style={{
                  aspectRatio: '16/10',
                  background: 'linear-gradient(135deg, #fde68a, #c89b3c)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '80px'
                }}>
                  {exp.icon}
                </div>

                {/* Content */}
                <div style={{ padding: '24px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '12px'
                  }}>
                    <h3 style={{
                      fontSize: '20px',
                      fontFamily: 'var(--serif)',
                      marginBottom: '8px'
                    }}>
                      {exp.title}
                    </h3>
                  </div>

                  <p style={{
                    fontSize: '14px',
                    color: 'var(--ink3)',
                    lineHeight: '1.5',
                    marginBottom: '16px'
                  }}>
                    {exp.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    fontSize: '13px',
                    color: 'var(--ink3)',
                    marginBottom: '16px'
                  }}>
                    <div>📍 {exp.city}</div>
                    <div>⏱️ {exp.duration}</div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--b)'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--ink3)', marginBottom: '4px' }}>
                        À partir de
                      </div>
                      <div style={{
                        fontSize: '20px',
                        fontFamily: 'var(--serif)',
                        fontWeight: '600'
                      }}>
                        {exp.price} MAD
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--gold)'
                      }}>
                        ⭐ {exp.rating}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ink3)' }}>
                        {exp.reviews} avis
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{
            textAlign: 'center',
            padding: '60px 32px',
            background: 'var(--card)',
            border: '1px solid var(--b)',
            borderRadius: '24px'
          }}>
            <h2 style={{
              fontFamily: 'var(--serif)',
              fontSize: '36px',
              marginBottom: '16px'
            }}>
              Une expérience sur-mesure ?
            </h2>
            <p style={{
              fontSize: '16px',
              marginBottom: '24px',
              color: 'var(--ink3)',
              maxWidth: '600px',
              margin: '0 auto 24px'
            }}>
              Notre équipe peut organiser des activités privées et personnalisées
              selon vos envies.
            </p>
            <button style={{
              padding: '14px 32px',
              background: 'var(--gold)',
              color: 'var(--ink)',
              borderRadius: '99px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Nous contacter
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
