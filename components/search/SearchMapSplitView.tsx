'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import styles from './SearchMapSplitView.module.css';
import type { SearchMapListing } from './SearchResultsMap';

const SearchResultsMap = dynamic(() => import('./SearchResultsMap'), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Chargement de la carte…</div>,
});

type SearchMapSplitViewProps = {
  city?: string | null;
  listings: SearchMapListing[];
  activeListingId?: string | null;
  onListingHover: (id: string | null) => void;
  onClose: () => void;
  buildListingUrl: (id: string) => string;
};

export default function SearchMapSplitView({
  city,
  listings,
  activeListingId,
  onListingHover,
  onClose,
  buildListingUrl,
}: SearchMapSplitViewProps) {
  const cityLabel = city
    ? city.charAt(0).toUpperCase() + city.slice(1)
    : 'Maroc';

  return (
    <div className={styles.root}>
      <aside className={styles.listCol}>
        <header className={styles.listHead}>
          <div>
            <h2 className={styles.listTitle}>
              {listings.length} bien{listings.length !== 1 ? 's' : ''} · {cityLabel}
            </h2>
            <p className={styles.listSub}>Survolez un bien ou un pin pour voir le détail</p>
          </div>
          <button type="button" className={styles.closeList} onClick={onClose}>
            ☰ Liste
          </button>
        </header>
        <div className={styles.listScroll}>
          {listings.map((listing) => {
            const active = activeListingId === listing.id;
            return (
              <Link
                key={listing.id}
                href={buildListingUrl(listing.id)}
                className={`${styles.row} ${active ? styles.rowActive : ''}`}
                onMouseEnter={() => onListingHover(listing.id)}
                onMouseLeave={() => onListingHover(null)}
              >
                <div className={styles.rowPhoto}>
                  {listing.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.image} alt="" />
                  ) : (
                    <div className={styles.rowPlaceholder} />
                  )}
                </div>
                <div className={styles.rowBody}>
                  <div className={styles.rowTop}>
                    <span className={styles.rowName}>{listing.title}</span>
                    {listing.rating != null && listing.rating > 0 && (
                      <span className={styles.rowRating}>★ {listing.rating.toFixed(1)}</span>
                    )}
                  </div>
                  <span className={styles.rowLoc}>
                    {[listing.neighborhood, listing.city].filter(Boolean).join(', ')}
                  </span>
                  <span className={styles.rowPrice}>
                    <b>
                      {listing.price > 0
                        ? `${Math.round(listing.price).toLocaleString('fr-FR')} ${listing.currency || 'MAD'}`
                        : '—'}
                    </b>
                    / nuit
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </aside>

      <div className={styles.mapCol}>
        <SearchResultsMap
          city={city}
          listings={listings}
          activeListingId={activeListingId}
          onListingHover={onListingHover}
          onListingClick={(id) => {
            window.location.href = buildListingUrl(id);
          }}
          listingUrlBuilder={buildListingUrl}
          interactive
        />
      </div>
    </div>
  );
}
