'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { propertyManagers, getFeaturedListings } from '@/lib/mock/db';
import './homepage.css';

export default function HomePage() {
  const [aiPrompt, setAiPrompt] = useState('');
  const featuredListings = getFeaturedListings();

  return (
    <>
      <Navigation />

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-noise"></div>
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <span className="line"></span>
            MAROC · SÉJOURS PREMIUM
          </div>

          <h1>
            Vivez le Maroc{' '}
            <span className="it">autrement</span>
            <span className="small">
              Riads, villas & appartements triés par des experts locaux. Marrakech, Essaouira, Fès, Casablanca.
            </span>
          </h1>

          {/* AI Search Bar */}
          <div className="ai-search">
            <div className="ai-prompt">
              <div className="ic">✨</div>
              <input
                type="text"
                placeholder="« Riad avec piscine à Marrakech pour 6 personnes »"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>
            <div className="divider"></div>
            <div className="ai-classic">
              <div className="ai-cell">
                <div className="l">Où</div>
                <div className="v muted">Marrakech</div>
              </div>
              <div className="ai-cell">
                <div className="l">Quand</div>
                <div className="v muted">Dates</div>
              </div>
              <div className="ai-cell">
                <div className="l">Voyageurs</div>
                <div className="v muted">2 adultes</div>
              </div>
            </div>
            <Link href="/search" className="ai-go">
              →
            </Link>
          </div>

          {/* AI Suggestions */}
          <div className="ai-suggestions">
            <button className="ai-sug">
              <span className="em">🏊</span>Riad avec piscine médina
            </button>
            <button className="ai-sug">
              <span className="em">🏔️</span>Villa vue Atlas
            </button>
            <button className="ai-sug">
              <span className="em">🌊</span>Bord de mer Essaouira
            </button>
            <button className="ai-sug">
              <span className="em">👨‍👩‍👧‍👦</span>Grand groupe 8+ personnes
            </button>
            <button className="ai-sug">
              <span className="em">💰</span>Meilleur rapport qualité/prix
            </button>
          </div>
        </div>

        {/* Hero Stats */}
        <div className="hero-stats">
          <div>
            <span className="hs-num">
              <b>142</b> biens
            </span>{' '}
            · MARRAKECH · ESSAOUIRA · FÈS · CASA
          </div>
          <div>
            <span className="hs-num">
              <b>5</b> PMs vérifiés
            </span>{' '}
            · RÉPONSE {'<'} 2H
          </div>
          <div>
            <span className="hs-num">
              <b>4.8</b> note moyenne
            </span>{' '}
            · 12 847 AVIS
          </div>
        </div>
      </section>

      {/* PROPERTY MANAGERS GRID */}
      <section className="section">
        <div className="section-head">
          <div>
            <div className="pretitle">Nos Property Managers</div>
            <h2>
              Partenaires <span className="it">sélectionnés</span>
            </h2>
            <div className="sub">
              5 gestionnaires vérifiés, spécialistes du Maroc. Réponse rapide, service impeccable, biens exclusifs.
            </div>
          </div>
        </div>

        {/* Brands Grid */}
        <div className="brands-grid">
          {propertyManagers.map((pm, idx) => (
            <Link
              key={pm.slug}
              href={`/pm/${pm.slug}`}
              className={`brand-card ${idx === 0 ? 'featured' : ''} ${idx === 1 ? 'b2' : ''} ${idx === 2 ? 'b3' : ''} ${idx === 3 ? 'b4' : ''} ${idx === 4 ? 'b5' : ''}`}
            >
              <div className="bg"></div>
              <div className="overlay"></div>
              <div className="grain"></div>
              {idx === 0 && <div className="badge gold">✨ SELECT</div>}
              {pm.verified && idx !== 0 && <div className="badge">✓ VÉRIFIÉ</div>}
              <div className="content">
                <div className="logo">{pm.logo}</div>
                <div className="nm">
                  {pm.name.split(' ')[0]} <span className="it">{pm.name.split(' ').slice(1).join(' ')}</span>
                </div>
                <div className="tag">{pm.description}</div>
                <div className="meta">
                  <span className="star">★</span> {pm.rating}
                  <span className="dot"></span>
                  {pm.reviewCount} avis
                  <span className="dot"></span>
                  {pm.listingCount} biens
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      <section className="section full">
        <div className="section-head" style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 32px' }}>
          <div>
            <div className="pretitle">Sélection Sojori</div>
            <h2>
              Nos coups de <span className="it">cœur</span>
            </h2>
          </div>
          <div className="nav-arrows">
            <button className="nav-arrow">←</button>
            <button className="nav-arrow">→</button>
          </div>
        </div>

        {/* Carousel */}
        <div className="car-row">
          {featuredListings.map((listing, idx) => (
            <Link key={listing.id} href={`/listings/${listing.id}`} className="car-item">
              <div className={`car-photo ${['', 'b', 'c', 'd'][idx % 4]}`}>
                <div className="grain"></div>
                <button className="wish">♡</button>
                <div className="pm">
                  <div className="pml">{propertyManagers.find((pm) => pm.slug === listing.pm)?.logo}</div>
                  {propertyManagers.find((pm) => pm.slug === listing.pm)?.name.split(' ')[0]}
                </div>
                <div className="pages">1/5</div>
                <div className={`gathern ${listing.source}`}>{listing.source === 'exclusive' ? '✦ EXCLUSIF' : listing.source.toUpperCase()}</div>
                {listing.aiMatchPct && listing.aiMatchPct >= 90 && (
                  <div className="ai-badge">{listing.aiMatchPct}% MATCH</div>
                )}
              </div>
              <div className="car-info">
                <div className="top">
                  <div className="nm">{listing.title}</div>
                  <div className="rating">
                    <span className="star">★</span> {listing.rating}
                  </div>
                </div>
                <div className="loc">
                  {listing.neighborhood}, {listing.city.charAt(0).toUpperCase() + listing.city.slice(1)}
                </div>
                <div className="price">
                  <b>{listing.pricePerNight}€</b>
                  <span className="per">/ nuit</span>
                  {listing.originalPrice && <span className="total">{listing.originalPrice}€ avant</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI MAGIC SECTION */}
      <section className="ai-magic">
        <div className="am-inner">
          <div className="am-text">
            <div className="pretitle">Sojori AI</div>
            <h2>
              Trouvez le bien <span className="it">parfait</span>
            </h2>
            <p>
              Notre IA analyse vos critères et vous recommande les biens les plus adaptés. Recherche conversationnelle,
              insights personnalisés, comparaison intelligente.
            </p>

            <div className="am-tools">
              <div className="am-tool">
                <div className="ic">🔍</div>
                <div className="info">
                  <div className="nm">Recherche naturelle</div>
                  <div className="ds">Décrivez ce que vous cherchez en langage naturel</div>
                </div>
              </div>
              <div className="am-tool">
                <div className="ic">💡</div>
                <div className="info">
                  <div className="nm">Recommandations</div>
                  <div className="ds">Suggestions basées sur vos préférences et historique</div>
                </div>
              </div>
              <div className="am-tool">
                <div className="ic">📊</div>
                <div className="info">
                  <div className="nm">Analyse de marché</div>
                  <div className="ds">Tendances prix, disponibilités, meilleures périodes</div>
                </div>
              </div>
            </div>

            <button className="am-cta">
              <span className="ic">✨</span>
              Essayer Sojori AI
            </button>
          </div>

          {/* AI Chat Mockup */}
          <div className="am-chat">
            <div className="am-chat-head">
              <div className="av">✨</div>
              <div>
                <div className="nm">
                  Sojori AI<small>Assistant intelligent</small>
                </div>
              </div>
            </div>
            <div className="am-chat-body">
              <div className="am-msg u">
                <div className="am-bub">Je cherche un riad avec piscine à Marrakech pour 6 personnes</div>
              </div>
              <div className="am-msg b">
                <div className="am-bub">
                  Parfait ! J'ai trouvé 12 riads correspondant à vos critères. Voici ma sélection :
                </div>
                <div className="am-tool-chip">
                  <div className="ic">🔍</div>
                  RECHERCHE · MARRAKECH · 6 PERS · PISCINE
                </div>
                <div className="am-result">
                  <div className="ph"></div>
                  <div className="info">
                    <div className="nm">Riad de la Bahia</div>
                    <div className="meta">Médina · 8 pers · ★ 4.9</div>
                    <div className="price">189€/nuit</div>
                  </div>
                </div>
              </div>
              <div className="am-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className="am-chat-input">
              <input placeholder="Posez une question..." />
              <div className="send">→</div>
            </div>
          </div>
        </div>
      </section>

      {/* CITIES STRIP - 12 VILLES */}
      <section className="cities-strip">
        <div className="cs-head">
          <div>
            <div className="pretitle">Destinations</div>
            <h2>
              Le Maroc en <span className="it">12 villes</span>.
            </h2>
          </div>
          <div className="ds">
            De la Médina millénaire de Fès aux plages de Tanger, en passant par le bleu de Chefchaouen et les vagues
            d'Essaouira.
          </div>
        </div>

        <div className="cs-grid">
          <Link href="/search?city=marrakech" className="cs-card large">
            <div className="bg"></div>
            <div className="overlay"></div>
            <div className="info">
              <div className="nm">Marrakech</div>
              <div className="ct">412 BIENS · DÈS 65€</div>
            </div>
          </Link>

          <Link href="/search?city=casablanca" className="cs-card casa">
            <div className="bg"></div>
            <div className="overlay"></div>
            <div className="info">
              <div className="nm">Casablanca</div>
              <div className="ct">186 BIENS</div>
            </div>
          </Link>

          <Link href="/search?city=essaouira" className="cs-card ess">
            <div className="bg"></div>
            <div className="overlay"></div>
            <div className="info">
              <div className="nm">Essaouira</div>
              <div className="ct">94 BIENS</div>
            </div>
          </Link>

          <Link href="/search?city=fes" className="cs-card fes">
            <div className="bg"></div>
            <div className="overlay"></div>
            <div className="info">
              <div className="nm">Fès</div>
              <div className="ct">128 BIENS</div>
            </div>
          </Link>

          <Link href="/search?city=chefchaouen" className="cs-card chf">
            <div className="bg"></div>
            <div className="overlay"></div>
            <div className="info">
              <div className="nm">Chefchaouen</div>
              <div className="ct">42 BIENS</div>
            </div>
          </Link>

          <Link href="/search?city=tanger" className="cs-card tng">
            <div className="bg"></div>
            <div className="overlay"></div>
            <div className="info">
              <div className="nm">Tanger</div>
              <div className="ct">76 BIENS</div>
            </div>
          </Link>

          <Link href="/search?city=ouarzazate" className="cs-card ouar">
            <div className="bg"></div>
            <div className="overlay"></div>
            <div className="info">
              <div className="nm">Ouarzazate</div>
              <div className="ct">28 BIENS</div>
            </div>
          </Link>

          <Link href="/search?city=agadir" className="cs-card fes2">
            <div className="bg"></div>
            <div className="overlay"></div>
            <div className="info">
              <div className="nm">Agadir</div>
              <div className="ct">64 BIENS</div>
            </div>
          </Link>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="trust-bar">
        <div className="trust-inner">
          <div className="trust-item">
            <div className="em">🛡️</div>
            <div className="nm">Paiement sécurisé</div>
            <div className="ds">Transactions chiffrées · 3D Secure · Garantie Sojori</div>
          </div>
          <div className="trust-item">
            <div className="em">✓</div>
            <div className="nm">Biens vérifiés</div>
            <div className="ds">Photos réelles · Visite sur place · Contrôle qualité</div>
          </div>
          <div className="trust-item">
            <div className="em">💬</div>
            <div className="nm">Support 24/7</div>
            <div className="ds">WhatsApp · Email · Téléphone · Réponse {'<'} 2h</div>
          </div>
          <div className="trust-item">
            <div className="em">🔄</div>
            <div className="nm">Annulation flexible</div>
            <div className="ds">Annulation gratuite · Remboursement rapide</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div className="footer-brand">
                <span className="dot"></span>sojori
              </div>
              <div className="footer-tag">Séjours premium au Maroc · Riads, villas & appartements · Sélection experte</div>
              <div className="footer-social">
                <button className="fs-ic">📘</button>
                <button className="fs-ic">📷</button>
                <button className="fs-ic">✕</button>
                <button className="fs-ic">📺</button>
              </div>
            </div>

            <div className="footer-col">
              <h4>Explorer</h4>
              <ul>
                <li>Marrakech</li>
                <li>Essaouira</li>
                <li>Fès</li>
                <li>Casablanca</li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Sojori</h4>
              <ul>
                <li>À propos</li>
                <li>Property Managers</li>
                <li>Blog</li>
                <li>Carrières</li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Support</h4>
              <ul>
                <li>Centre d'aide</li>
                <li>Nous contacter</li>
                <li>Annulation</li>
                <li>Confiance & Sécurité</li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Légal</h4>
              <ul>
                <li>CGU</li>
                <li>CGV</li>
                <li>Confidentialité</li>
                <li>Cookies</li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© 2026 Sojori · Tous droits réservés</div>
            <div>🇫🇷 FRANÇAIS · 🇪🇺 EUR · 🇲🇦 MADE IN MOROCCO</div>
          </div>
        </div>
      </footer>

      {/* AI FAB */}
      <button className="ai-fab">
        Sojori AI<div className="ic">✨</div>
      </button>
    </>
  );
}
