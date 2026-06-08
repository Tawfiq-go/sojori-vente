'use client';

import dynamic from 'next/dynamic';
import styles from './SearchMapPanel.module.css';
import type { SearchMapListing } from './SearchResultsMap';

const SearchResultsMap = dynamic(() => import('./SearchResultsMap'), {
  ssr: false,
  loading: () => (
    <div className={styles.mapLoading}>
      <span>Chargement de la carte…</span>
    </div>
  ),
});

type SearchMapPanelProps = {
  city?: string | null;
  listings: SearchMapListing[];
  activeListingId?: string | null;
  onListingHover?: (id: string | null) => void;
  onOpenSplitView?: () => void;
};

export default function SearchMapPanel({
  city,
  listings,
  activeListingId,
  onListingHover,
  onOpenSplitView,
}: SearchMapPanelProps) {
  const count = listings.length;
  const cityLabel = (city || 'Maroc').toUpperCase();

  return (
    <aside className={styles.panel}>
      <div className={styles.head}>
        <div className={styles.ic}>📍</div>
        <div className={styles.nm}>Carte</div>
      </div>

      <div className={styles.mini}>
        <div className={styles.label}>
          📍 {cityLabel} · {count} bien{count !== 1 ? 's' : ''}
        </div>
        <div
          className={styles.mapSlot}
          onMouseEnter={() => {
            if (activeListingId) return;
          }}
        >
          <SearchResultsMap
            city={city}
            listings={listings}
            activeListingId={activeListingId}
            onListingHover={onListingHover}
            compact
            interactive={false}
          />
        </div>
        <button
          type="button"
          className={styles.expand}
          onClick={onOpenSplitView}
          disabled={count === 0}
        >
          Ouvrir la carte →
        </button>
      </div>
    </aside>
  );
}
