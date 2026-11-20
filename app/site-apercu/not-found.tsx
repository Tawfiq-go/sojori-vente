import type { Metadata } from 'next';
import { metaNeutre } from '@/lib/site/meta';

export const metadata: Metadata = metaNeutre();

/**
 * La page « introuvable » d'un site de PM : neutre (français, sobre, aucune marque de la plateforme) — le thème du
 * site n'est pas connu ici. Le retour mène à l'accueil du même site.
 */
export default function SiteIntrouvable() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px',
        background: '#fff',
        color: '#141617',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: 13, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#7c927a' }}>404</p>
        <h1 style={{ margin: '12px 0 20px', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 500 }}>Page introuvable</h1>
      </div>
    </main>
  );
}
