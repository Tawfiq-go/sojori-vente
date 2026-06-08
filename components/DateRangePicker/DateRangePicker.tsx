'use client';

import { useState, useEffect } from 'react';
import type { DateRange, DateRangePickerProps, PriceBreakdown } from './types';
import { logger } from '@/lib/utils/logger';
import styles from './DateRangePicker.module.css';

const BASE_PRICE = 1200;
const WEEKEND_PRICE = 1500;

export default function DateRangePicker({
  listingId,
  minNights = 3,
  maxNights = 30,
  onDateSelect,
  onPriceCalculate,
}: DateRangePickerProps) {
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch availability from API
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        // Get availability for next 6 months
        const sixMonthsLater = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000);
        const fromDate = today.toISOString().split('T')[0];
        const toDate = sixMonthsLater.toISOString().split('T')[0];

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/listing/public/listings/${listingId}/availability?from=${fromDate}&to=${toDate}`
        );
        const data = await res.json();
        if (data.success && data.data) {
          // Parse blocked dates from API
          const blocked: Date[] = [];
          if (data.data.blockedDates && Array.isArray(data.data.blockedDates)) {
            data.data.blockedDates.forEach((dateStr: string) => {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                blocked.push(date);
              }
            });
          }
          setBlockedDates(blocked);
        }
      } catch (error) {
        logger.warn('Error fetching availability:', error);
        // Continue with empty blocked dates on error
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  // Calculate price breakdown via API
  useEffect(() => {
    if (checkin && checkout && onPriceCalculate) {
      const fetchPricing = async () => {
        try {
          const checkInStr = checkin.toISOString().split('T')[0];
          const checkOutStr = checkout.toISOString().split('T')[0];

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/listing/public/listings/${listingId}/pricing?checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=2`
          );
          const data = await response.json();

          if (data.success && data.data) {
            onPriceCalculate({
              baseNights: data.data.baseNights,
              basePrice: data.data.basePrice,
              weekendNights: data.data.weekendNights,
              weekendPrice: data.data.weekendPrice,
              subtotal: data.data.subtotal,
              serviceFee: data.data.serviceFee,
              tax: data.data.tax,
              total: data.data.total,
            });
          } else {
            logger.warn('[DateRangePicker] Pricing API returned no data');
          }
        } catch (error) {
          logger.warn('Error fetching pricing:', error);
        }
      };

      fetchPricing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkin, checkout]);

  // Notify parent of date selection
  useEffect(() => {
    onDateSelect({ checkIn: checkin, checkOut: checkout });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkin, checkout]);

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().slice(0, 10);
    const checkinStr = checkin?.toISOString().slice(0, 10);
    const checkoutStr = checkout?.toISOString().slice(0, 10);

    if (!checkin || (checkin && checkout)) {
      // Start new selection
      setCheckin(date);
      setCheckout(null);
    } else if (dateStr > checkinStr!) {
      // Set checkout
      setCheckout(date);
    } else {
      // Reset if clicked before checkin
      setCheckin(date);
      setCheckout(null);
    }
  };

  const clearDates = () => {
    setCheckin(null);
    setCheckout(null);
  };

  const isDateBlocked = (date: Date): boolean => {
    return blockedDates.some(
      (blocked) => blocked.toISOString().slice(0, 10) === date.toISOString().slice(0, 10)
    );
  };

  const isDatePast = (date: Date): boolean => {
    return date < today;
  };

  const isDateWeekend = (date: Date): boolean => {
    const dow = date.getDay();
    return dow === 5 || dow === 6;
  };

  const isDateInRange = (date: Date): boolean => {
    if (!checkin || !checkout) return false;
    return date > checkin && date < checkout;
  };

  const renderMonth = (monthOffset: number) => {
    const month = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1);
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    const firstDay = new Date(year, monthNum, 1);
    const lastDay = new Date(year, monthNum + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Convert to Monday = 0
    let startDow = (firstDay.getDay() + 6) % 7;

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startDow; i++) {
      days.push(null);
    }

    // Add days of month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, monthNum, d));
    }

    return (
      <div className={styles.month}>
        <div className={styles.monthTitle}>
          {month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </div>
        <div className={styles.dow}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className={styles.grid}>
          {days.map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} />;
            }

            const isPast = isDatePast(date);
            const isBlocked = isDateBlocked(date);
            const isWeekend = isDateWeekend(date);
            const isCheckin =
              checkin && date.toISOString().slice(0, 10) === checkin.toISOString().slice(0, 10);
            const isCheckout =
              checkout && date.toISOString().slice(0, 10) === checkout.toISOString().slice(0, 10);
            const inRange = isDateInRange(date);

            const price = isWeekend ? WEEKEND_PRICE : BASE_PRICE;

            let className = styles.day;
            if (isPast) className += ` ${styles.past}`;
            else if (isBlocked) className += ` ${styles.blocked}`;
            else if (isCheckin) className += ` ${styles.checkin}`;
            else if (isCheckout) className += ` ${styles.checkout}`;
            else if (inRange) className += ` ${styles.range}`;
            else if (isWeekend) className += ` ${styles.weekend}`;

            return (
              <div
                key={i}
                className={className}
                onClick={() => !isPast && !isBlocked && handleDateClick(date)}
              >
                <span className={styles.num}>{date.getDate()}</span>
                {!isPast && !isBlocked && <span className={styles.price}>{price}</span>}
                {!isPast && !isBlocked && (
                  <div className={styles.tip}>
                    <div className={styles.tDate}>
                      {date.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </div>
                    <div className={styles.tRow}>
                      <span>Base</span>
                      <span className={styles.v}>{BASE_PRICE} MAD</span>
                    </div>
                    {isWeekend && (
                      <div className={styles.tRow}>
                        <span>Weekend</span>
                        <span className={styles.v}>+{WEEKEND_PRICE - BASE_PRICE} MAD</span>
                      </div>
                    )}
                    <div className={`${styles.tRow} ${styles.total}`}>
                      <span>Nuit</span>
                      <span className={styles.v}>{price} MAD</span>
                    </div>
                  </div>
                )}
                {isCheckin && <div className={styles.endpointBadge}>Arrivée</div>}
                {isCheckout && <div className={styles.endpointBadge}>Départ</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const nights = checkin && checkout ? Math.round((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.main}>
        <div className={styles.head}>
          <h1>
            Sélectionnez vos <span className={styles.it}>dates</span>
          </h1>
          <p className={styles.sub}>
            Disponibilités en temps réel · prix par nuit · cliquez l'arrivée puis le départ
          </p>
        </div>

        <div className={styles.constraints}>
          <span className={styles.constraint}>⚠ Minimum {minNights} nuits</span>
          <span className={styles.constraint}>🔄 Départ samedi privilégié</span>
          <span className={styles.constraint}>💰 Tarifs weekend majorés</span>
        </div>

        <div className={styles.card}>
          <div className={styles.nav}>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
              ‹
            </button>
            <span className={styles.navLabel}>
              {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()} —{' '}
              {new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                .toUpperCase()}
            </span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
              ›
            </button>
          </div>

          <div className={styles.months}>
            {renderMonth(0)}
            {renderMonth(1)}
          </div>

          <div className={styles.legend}>
            <span className={styles.leg}>
              <span className={`${styles.sw} ${styles.swAvail}`} />
              Disponible
            </span>
            <span className={styles.leg}>
              <span className={`${styles.sw} ${styles.swSel}`} />
              Arrivée / Départ
            </span>
            <span className={styles.leg}>
              <span className={`${styles.sw} ${styles.swRange}`} />
              Séjour
            </span>
            <span className={styles.leg}>
              <span className={`${styles.sw} ${styles.swBlocked}`} />
              Indisponible
            </span>
          </div>
        </div>
      </div>

      <div className={styles.recap}>
        <h3>Récapitulatif</h3>
        <div className={`${styles.datesDisplay} ${!checkin ? styles.empty : ''}`}>
          {checkin && checkout ? (
            <>
              <span>{checkin.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
              <span className={styles.arrow}>→</span>
              <span>
                {checkout.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} 2026
              </span>
            </>
          ) : checkin ? (
            <>
              <span>{checkin.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
              <span className={styles.arrow}>→</span>
              <span style={{ color: 'var(--ink4)' }}>Départ ?</span>
            </>
          ) : (
            <span>Choisissez vos dates</span>
          )}
        </div>
        <div className={styles.nights}>
          {nights > 0 ? `${nights} nuit${nights > 1 ? 's' : ''}` : '— nuits'}
        </div>
        {!checkin || !checkout ? (
          <div className={styles.bdLine} style={{ color: 'var(--ink4)' }}>
            <span>Sélectionnez des dates</span>
            <span className={styles.v}>—</span>
          </div>
        ) : (
          <div>{/* Price breakdown will be rendered by parent */}</div>
        )}
        <button className={styles.cta} disabled={!checkin || !checkout || nights < minNights}>
          {nights > 0 && nights < minNights
            ? `Minimum ${minNights} nuits (${nights} choisie${nights > 1 ? 's' : ''})`
            : 'Réserver maintenant'}
        </button>
        {checkin && (
          <button className={styles.clear} onClick={clearDates}>
            ✕ Effacer les dates
          </button>
        )}
      </div>
    </div>
  );
}
