'use client';

import Image from 'next/image';
import styles from './BookingRecapCard.module.css';
import type { PriceBreakdown } from '@/components/calendar';

interface BookingRecapCardProps {
  /** Listing information */
  listing: {
    title: string;
    location: string;
    rating?: number;
    reviewCount?: number;
    imageUrl?: string;
  };
  /** Check-in date */
  checkIn: Date;
  /** Check-out date */
  checkOut: Date;
  /** Number of guests */
  guests: {
    adults: number;
    children?: number;
  };
  /** Price breakdown */
  pricing: PriceBreakdown;
  /** Show detailed pricing breakdown */
  showDetails?: boolean;
}

export default function BookingRecapCard({
  listing,
  checkIn,
  checkOut,
  guests,
  pricing,
  showDetails = true,
}: BookingRecapCardProps) {
  const nights = pricing.baseNights + pricing.weekendNights;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={styles.recap}>
      {/* Listing Info */}
      <div className={styles.listingInfo}>
        {listing.imageUrl && (
          <div className={styles.image}>
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              width={120}
              height={110}
              style={{ objectFit: 'cover', borderRadius: '14px' }}
            />
          </div>
        )}
        {!listing.imageUrl && (
          <div className={styles.imagePlaceholder}>
            <div className={styles.grain} />
          </div>
        )}
        <div className={styles.details}>
          <h3 className={styles.title}>{listing.title}</h3>
          <div className={styles.location}>{listing.location}</div>
          {listing.rating && (
            <div className={styles.rating}>
              <span className={styles.star}>⭐</span>
              {listing.rating} {listing.reviewCount && `(${listing.reviewCount})`}
            </div>
          )}
        </div>
      </div>

      <div className={styles.divider} />

      {/* Dates & Guests */}
      <div className={styles.info}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>📅 Dates</span>
          <span className={styles.infoValue}>
            {formatDate(checkIn)} → {formatDate(checkOut)}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>👥 Voyageurs</span>
          <span className={styles.infoValue}>
            {guests.adults} adultes
            {guests.children ? `, ${guests.children} enfants` : ''}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>🌙 Nuits</span>
          <span className={styles.infoValue}>{nights} nuits</span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Price Breakdown */}
      {showDetails ? (
        <div className={styles.breakdown}>
          {pricing.baseNights > 0 && (
            <div className={styles.bdLine}>
              <span>
                {Math.round(pricing.basePrice / pricing.baseNights)} MAD × {pricing.baseNights} nuits
              </span>
              <span className={styles.value}>{pricing.basePrice} MAD</span>
            </div>
          )}
          {pricing.weekendNights > 0 && (
            <div className={styles.bdLine}>
              <span>
                {Math.round(pricing.weekendPrice / pricing.weekendNights)} MAD × {pricing.weekendNights} nuits (we)
              </span>
              <span className={styles.value}>{pricing.weekendPrice} MAD</span>
            </div>
          )}

          <div className={`${styles.bdLine} ${styles.sub}`}>
            <span>Sous-total</span>
            <span className={styles.value}>{pricing.subtotal} MAD</span>
          </div>

          <div className={styles.bdLine}>
            <span>Frais de service</span>
            <span className={styles.value}>{pricing.serviceFee} MAD</span>
          </div>

          <div className={styles.bdLine}>
            <span>Taxe de séjour</span>
            <span className={styles.value}>{pricing.tax} MAD</span>
          </div>

          <div className={`${styles.bdLine} ${styles.total}`}>
            <span>TOTAL</span>
            <span className={styles.value}>{pricing.total} MAD</span>
          </div>
        </div>
      ) : (
        <div className={`${styles.bdLine} ${styles.total}`}>
          <span>TOTAL</span>
          <span className={styles.value}>{pricing.total} MAD</span>
        </div>
      )}
    </div>
  );
}
