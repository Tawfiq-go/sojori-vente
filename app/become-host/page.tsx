'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { BecomeHostFormSection } from '@/components/becomeHost/BecomeHostFormSection';
import './become-host.css';

type FormMode = 'pm' | 'owner';

export default function BecomeHostPage() {
  const [formMode, setFormMode] = useState<FormMode | null>(null);

  const openForm = (mode: FormMode) => {
    setFormMode(mode);
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <Navigation />

      <main className="bh-page" style={{ paddingTop: 88, minHeight: '100vh' }}>
        {!formMode && (
          <div id="landing">
            <section className="bh-hero">
              <div className="bh-hero-bg" />
              <div className="bh-hero-inner">
                <div>
                  <div className="bh-hero-eyebrow">
                    <span className="line" />
                    Plateforme professionnelle · Maroc
                  </div>
                  <h1>
                    Gérez vos biens
                    <br />
                    comme une <span className="it">marque</span>.
                  </h1>
                  <p className="bh-hero-sub">
                    Sojori est la plateforme réservée aux <b>Property Managers professionnels</b> au
                    Maroc. Listings, orchestration WhatsApp, pricing dynamique, équipes — tout dans un
                    seul outil. <b>Propriétaire ?</b> On vous met en relation avec un PM expert.
                  </p>
                  <div className="bh-hero-cta-row">
                    <button type="button" className="bh-btn-primary" onClick={() => openForm('pm')}>
                      Rejoindre comme PM Pro →
                    </button>
                    <button type="button" className="bh-btn-ghost" onClick={() => openForm('owner')}>
                      Je suis propriétaire
                    </button>
                  </div>
                  <div className="bh-hero-trust">
                    <div className="bh-htr">
                      <div className="v">142</div>
                      <div className="l">PMs actifs</div>
                    </div>
                    <div className="bh-htr">
                      <div className="v">4 200+</div>
                      <div className="l">Biens gérés</div>
                    </div>
                    <div className="bh-htr">
                      <div className="v">18k/mois</div>
                      <div className="l">Réservations</div>
                    </div>
                  </div>
                </div>

                <div className="bh-hero-visual">
                  <div className="bh-hv-card">
                    <div className="bh-hv-head">
                      <div className="logo">RL</div>
                      <div className="ti">
                        Riad Luxe
                        <small>ORCHESTRATOR · DASHBOARD</small>
                      </div>
                    </div>
                    <div className="bh-hv-stats">
                      <div className="bh-hv-stat">
                        <div className="v gold">12</div>
                        <div className="l">Listings</div>
                      </div>
                      <div className="bh-hv-stat">
                        <div className="v teal">94%</div>
                        <div className="l">Occupation</div>
                      </div>
                      <div className="bh-hv-stat">
                        <div className="v">+38%</div>
                        <div className="l">Revenu YoY</div>
                      </div>
                    </div>
                    <div className="bh-hv-row">
                      <div className="ic">🛬</div>
                      <div className="info">
                        <div className="nm">Arrivée · Mohamed K.</div>
                        <div className="mt">Villa Majorelle · 15:00</div>
                      </div>
                      <span className="badge wa">WA AUTO</span>
                    </div>
                    <div className="bh-hv-row">
                      <div className="ic">🧼</div>
                      <div className="info">
                        <div className="nm">Ménage post-départ</div>
                        <div className="mt">Riad Atlas · assigné Ahmed</div>
                      </div>
                      <span className="badge ok">PLANIFIÉ</span>
                    </div>
                    <div className="bh-hv-row">
                      <div className="ic">💶</div>
                      <div className="info">
                        <div className="nm">Prix optimisé · +220 MAD</div>
                        <div className="mt">Suggestion IA acceptée</div>
                      </div>
                      <span className="badge ok">LIVE</span>
                    </div>
                  </div>
                  <div className="bh-hv-float top">
                    <div className="ic">✨</div>
                    <div>
                      <div className="ti">Concierge IA</div>
                      <div className="ds">répond en 15 min</div>
                    </div>
                  </div>
                  <div className="bh-hv-float bot">
                    <div className="ic">📱</div>
                    <div>
                      <div className="ti">WhatsApp auto</div>
                      <div className="ds">check-in · ménage · avis</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bh-paths">
              <div className="bh-paths-head">
                <div className="pre">Deux profils · une plateforme</div>
                <h2>
                  Vous êtes <span className="it">qui</span> ?
                </h2>
              </div>
              <div className="bh-paths-grid">
                <article className="bh-path-card pm">
                  <div className="bh-path-icon">💼</div>
                  <div className="bh-path-tag">PROPERTY MANAGER PRO</div>
                  <h3>
                    Vous gérez
                    <br />
                    déjà des biens.
                  </h3>
                  <div className="bh-path-list">
                    <div className="bh-path-li">
                      <span className="ck">✓</span>
                      <span>
                        Publiez vos annonces · <b>Sojori les distribue</b> sur Airbnb, Booking et notre
                        marketplace
                      </span>
                    </div>
                    <div className="bh-path-li">
                      <span className="ck">✓</span>
                      <span>
                        Accédez à <b>Orchestrator</b> · le PMS complet (tâches, pricing, channels, équipes)
                      </span>
                    </div>
                    <div className="bh-path-li">
                      <span className="ck">✓</span>
                      <span>
                        <b>Orchestration WhatsApp</b> · check-in, ménage, concierge automatisés
                      </span>
                    </div>
                    <div className="bh-path-li">
                      <span className="ck">✓</span>
                      <span>
                        Connectez-vous avec des <b>propriétaires qualifiés</b> en recherche de gestion
                      </span>
                    </div>
                  </div>
                  <button type="button" className="bh-path-btn" onClick={() => openForm('pm')}>
                    Je suis PM Pro →
                  </button>
                </article>

                <article className="bh-path-card owner">
                  <div className="bh-path-icon">🤝</div>
                  <div className="bh-path-tag">PROPRIÉTAIRE</div>
                  <h3>
                    Vous possédez
                    <br />
                    un ou plusieurs biens.
                  </h3>
                  <div className="bh-path-list">
                    <div className="bh-path-li">
                      <span className="ck">✓</span>
                      <span>
                        Mise en relation avec un <b>PM professionnel partenaire</b> vérifié Sojori
                      </span>
                    </div>
                    <div className="bh-path-li">
                      <span className="ck">✓</span>
                      <span>
                        <b>Maximisez vos revenus</b> locatifs avec des experts du marché marocain
                      </span>
                    </div>
                    <div className="bh-path-li">
                      <span className="ck">✓</span>
                      <span>
                        <b>Déléguez</b> la gestion quotidienne · ménage, accueil, maintenance
                      </span>
                    </div>
                    <div className="bh-path-li">
                      <span className="ck">✓</span>
                      <span>
                        Service de mise en relation · <b>commission sur les premiers revenus</b>
                      </span>
                    </div>
                  </div>
                  <button type="button" className="bh-path-btn" onClick={() => openForm('owner')}>
                    Je suis propriétaire →
                  </button>
                </article>
              </div>
            </section>

            <section className="bh-proof">
              <div className="bh-proof-inner">
                <div className="bh-proof-head">
                  <div className="pre">Ce qui nous différencie</div>
                  <h2>
                    Pas une agence. <span className="it">Une plateforme.</span>
                  </h2>
                  <p className="sub">
                    Là où les autres gèrent à la main, Sojori orchestre. Chaque séjour est piloté
                    automatiquement — vous gardez le contrôle, la techno fait le reste.
                  </p>
                </div>
                <div className="bh-proof-grid">
                  {[
                    { ic: '⚙️', nm: 'Orchestration', ds: 'Chaque réservation génère un plan automatique : relances, assignations staff, deadlines.' },
                    { ic: '📱', nm: 'WhatsApp natif', ds: 'Check-in, ménage, concierge, avis — tout passe par WhatsApp, sans app à installer.' },
                    { ic: '💶', nm: 'Pricing dynamique', ds: "L'IA ajuste vos prix selon le marché local, l'occupation et les événements." },
                    { ic: '✨', nm: 'Concierge IA', ds: 'Un assistant qui répond aux voyageurs et propose vos services 24/7.' },
                  ].map((c) => (
                    <div key={c.nm} className="bh-proof-card">
                      <div className="ic">{c.ic}</div>
                      <div className="nm">{c.nm}</div>
                      <div className="ds">{c.ds}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <footer className="bh-footer">
              <div className="bh-footer-inner">
                <div>
                  <div className="bh-footer-brand">
                    <span className="dot" />
                    sojori
                    <p>La plateforme professionnelle de gestion locative au Maroc.</p>
                  </div>
                </div>
                <div className="bh-footer-links">
                  <div className="bh-fl-col">
                    <h4>Plateforme</h4>
                    <ul>
                      <li><Link href="https://sojori.com/demo">Orchestrator PMS</Link></li>
                      <li>WhatsApp Flows</li>
                      <li>Dynamic Pricing</li>
                      <li>Channel Manager</li>
                    </ul>
                  </div>
                  <div className="bh-fl-col">
                    <h4>Rejoindre</h4>
                    <ul>
                      <li><button type="button" style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0, font: 'inherit' }} onClick={() => openForm('pm')}>PM Professionnel</button></li>
                      <li><button type="button" style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: 0, font: 'inherit' }} onClick={() => openForm('owner')}>Propriétaire</button></li>
                      <li><Link href="https://sojori.com/demo">Demander une démo</Link></li>
                    </ul>
                  </div>
                  <div className="bh-fl-col">
                    <h4>Sojori</h4>
                    <ul>
                      <li><Link href="/">Marketplace</Link></li>
                      <li><Link href="/verified-hosts">Hôtes vérifiés</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bh-footer-bottom">
                <span>© 2026 SOJORI · MADE IN MOROCCO</span>
                <span>FR · EN</span>
              </div>
            </footer>
          </div>
        )}

        {formMode && (
          <BecomeHostFormSection mode={formMode} onBack={() => setFormMode(null)} />
        )}
      </main>
    </>
  );
}
