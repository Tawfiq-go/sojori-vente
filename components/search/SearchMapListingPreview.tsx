'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import styles from './SearchMapListingPreview.module.css';
import type { SearchMapListing } from './SearchResultsMap';

type SearchMapListingPreviewProps = {
  listing: SearchMapListing;
  style?: CSSProperties;
  listingUrl?: string;
  onClose?: () => void;
};

export default function SearchMapListingPreview({
  listing,
  style,
  listingUrl,
  onClose,
}: SearchMapListingPreviewProps) {
  const href = listingUrl || `/listings/${listing.id}`;
  const image = listing.image;
  const priceLabel =
    listing.price > 0
      ? `${Math.round(listing.price).toLocaleString('fr-FR')} ${listing.currency || 'MAD'}`
      : '—';

  return (
    <div className={styles.card} style={style}>
      <Link href={href} className={styles.link}>
        <div className={styles.photo}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={listing.title} className={styles.img} />
          ) : (
            <div className={styles.placeholder} />
          )}
        </div>
        <div className={styles.body}>
          <div className={styles.top}>
            <h3 className={styles.title}>{listing.title}</h3>
            {listing.rating != null && listing.rating > 0 && (
              <span className={styles.rating}>
                ★ {listing.rating.toFixed(1)}
              </span>
            )}
          </div>
          <p className={styles.loc}>
            {[listing.neighborhood, listing.city].filter(Boolean).join(', ')}
          </p>
          <p className={styles.price}>
            <b>{priceLabel}</b>
            <span>/ nuit</span>
          </p>
        </div>
      </Link>
      {onClose && (
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer">
          ×
        </button>
      )}
    </div>
  );
}
