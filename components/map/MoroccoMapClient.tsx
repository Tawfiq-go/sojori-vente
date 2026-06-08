'use client';

import dynamic from 'next/dynamic';

interface MoroccoMapProps {
  city?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
}

// Leaflet requires window, so we load it client-side only
const MoroccoMapDynamic = dynamic(
  () => import('./MoroccoMap').then((mod) => mod.MoroccoMap),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: '100%',
          height: '450px',
          background: 'var(--paper2)',
          borderRadius: '18px',
          border: '1px solid var(--b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ink3)',
          fontSize: '14px',
        }}
      >
        Chargement de la carte...
      </div>
    ),
  }
);

export function MoroccoMapClient(props: MoroccoMapProps) {
  return <MoroccoMapDynamic {...props} />;
}
