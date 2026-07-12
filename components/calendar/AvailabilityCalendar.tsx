'use client';

import { useState, useMemo } from 'react';
import styles from './AvailabilityCalendar.module.css';

export interface DayPricing {
  date: Date;
  basePrice: number;
  weekendPrice?: number;
  isWeekend: boolean;
  isBlocked: boolean;
  isPast: boolean;
}

export interface DateRange {
  checkIn: Date | null;
  checkOut: Date | null;
}

export interface PriceBreakdown {
  baseNights: number;
  basePrice: number;
  weekendNights: number;
  weekendPrice: number;
  subtotal: number;
  serviceFee: number;
  tax: number;
  total: number;
  nights: number; // Add missing property
}

export interface CalendarDayData {
  date: string;
  available: boolean;
  price: number;
  minStay?: number;
  stopSell?: boolean;
}

interface AvailabilityCalendarProps {
  /** Base price per night (weekday) - fallback if calendarData not provided */
  basePricePerNight: number;
  /** Weekend price per night (optional, defaults to base price) */
  weekendPricePerNight?: number;
  /** Currency code (EUR, MAD, USD, etc.) */
  currency?: string;
  /** Blocked dates (unavailable) - deprecated, use calendarData instead */
  blockedDates?: Date[];
  /** Calendar data from backend with prices and availability */
  calendarData?: CalendarDayData[];
  /** Currently selected date range */
  selectedRange?: DateRange;
  /** Callback when date range changes */
  onRangeChange?: (range: DateRange, pricing: PriceBreakdown | null) => void;
  /** Service fee percentage (default: 10%) */
  serviceFeePercent?: number;
  /** Tax percentage (default: 3%) */
  taxPercent?: number;
}

export default function AvailabilityCalendar({
  basePricePerNight,
  weekendPricePerNight,
  currency = 'MAD',
  blockedDates = [],
  calendarData = [],
  selectedRange,
  onRangeChange,
  serviceFeePercent = 10,
  taxPercent = 3,
}: AvailabilityCalendarProps) {
  // Start from next month if we're past the 20th of current month
  const getInitialMonth = () => {
    const now = new Date();
    const dayOfMonth = now.getDate();

    // If it's past the 20th, start from next month to avoid showing mostly past dates
    if (dayOfMonth >= 20) {
      return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const [currentMonth, setCurrentMonth] = useState(getInitialMonth());
  const [localRange, setLocalRange] = useState<DateRange>({
    checkIn: selectedRange?.checkIn || null,
    checkOut: selectedRange?.checkOut || null,
  });

  const weekendPrice = weekendPricePerNight || basePricePerNight;

  // Create a Map of calendar data by date for fast lookup
  const calendarDataMap = useMemo(() => {
    const map = new Map<string, CalendarDayData>();
    calendarData.forEach(day => {
      map.set(day.date, day);
    });
    return map;
  }, [calendarData]);

  // Generate calendar data for current month and next month
  const { months, blockedDatesSet } = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startOfNextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

    // Build blocked dates from both sources:
    // 1. Legacy blockedDates prop
    // 2. calendarData where available === false OR stopSell === true
    const blocked = new Set(
      blockedDates.map((d) => toDateKey(d instanceof Date ? d : new Date(d))),
    );

    calendarData.forEach(day => {
      // Logique: dispo si available === true ET stopSell === false
      const isBlocked = !day.available || day.stopSell === true;
      if (isBlocked) {
        blocked.add(day.date);
      }
    });

    return {
      months: [startOfMonth, startOfNextMonth],
      blockedDatesSet: blocked,
    };
  }, [currentMonth, blockedDates, calendarData]);

  const calculatePricingForRange = (range: DateRange): PriceBreakdown | null => {
    if (!range.checkIn || !range.checkOut) return null;

    let baseNights = 0;
    let weekendNights = 0;
    let baseTotal = 0;
    let weekendTotal = 0;

    const current = new Date(range.checkIn);
    current.setHours(0, 0, 0, 0);
    const checkOut = new Date(range.checkOut);
    checkOut.setHours(0, 0, 0, 0);

    while (current < checkOut) {
      const dateStr = toDateKey(current);
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      const calendarDay = calendarDataMap.get(dateStr);
      const nightly =
        calendarDay?.price && calendarDay.price > 0
          ? calendarDay.price
          : isWeekend
            ? weekendPrice
            : basePricePerNight;

      if (isWeekend) {
        weekendNights++;
        weekendTotal += nightly;
      } else {
        baseNights++;
        baseTotal += nightly;
      }
      current.setDate(current.getDate() + 1);
    }

    const nights = baseNights + weekendNights;
    const subtotal = baseTotal + weekendTotal;
    const serviceFee = Math.round(subtotal * (serviceFeePercent / 100));
    const tax = Math.round(subtotal * (taxPercent / 100));
    const total = subtotal + serviceFee + tax;

    return {
      baseNights,
      basePrice: baseTotal,
      weekendNights,
      weekendPrice: weekendTotal,
      subtotal,
      serviceFee,
      tax,
      total,
      nights,
    };
  };

  // Calculate price breakdown from per-day calendar prices (not flat base rate)
  const pricing = useMemo((): PriceBreakdown | null => {
    return calculatePricingForRange(localRange);
  }, [localRange, basePricePerNight, weekendPrice, calendarDataMap, serviceFeePercent, taxPercent]);

  const handleDayClick = (date: Date, isBlocked: boolean, isPast: boolean) => {
    if (isBlocked || isPast) return;

    const newRange = { ...localRange };

    if (!localRange.checkIn || (localRange.checkIn && localRange.checkOut)) {
      // Start new selection
      newRange.checkIn = date;
      newRange.checkOut = null;
    } else {
      // Complete selection
      if (date > localRange.checkIn) {
        newRange.checkOut = date;
      } else {
        // Clicked before check-in, restart
        newRange.checkIn = date;
        newRange.checkOut = null;
      }
    }

    setLocalRange(newRange);
    const newPricing = calculatePricingForRange(newRange);
    onRangeChange?.(newRange, newPricing);
  };

  const handleClear = () => {
    const newRange = { checkIn: null, checkOut: null };
    setLocalRange(newRange);
    onRangeChange?.(newRange, null);
  };

  const handlePrevMonth = () => {
    const now = new Date();
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);

    // Don't allow going to past months
    if (prevMonth.getMonth() < now.getMonth() && prevMonth.getFullYear() <= now.getFullYear()) {
      return;
    }

    setCurrentMonth(prevMonth);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Check if we can go to previous month
  const canGoPrevious = () => {
    const now = new Date();
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    return prevMonth.getFullYear() > now.getFullYear() ||
           (prevMonth.getFullYear() === now.getFullYear() && prevMonth.getMonth() >= now.getMonth());
  };

  const isInRange = (date: Date): boolean => {
    if (!localRange.checkIn || !localRange.checkOut) return false;
    return date > localRange.checkIn && date < localRange.checkOut;
  };

  const isCheckIn = (date: Date): boolean => {
    return localRange.checkIn?.toDateString() === date.toDateString();
  };

  const isCheckOut = (date: Date): boolean => {
    return localRange.checkOut?.toDateString() === date.toDateString();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.calendarCard}>
        <div className={styles.currencyBadge}>
          Prix affichés en <strong>{currency}</strong>
        </div>

        <div className={styles.nav}>
          <button
            type="button"
            onClick={handlePrevMonth}
            className={styles.navButton}
            disabled={!canGoPrevious()}
            aria-label="Mois précédent"
          >
            ←
          </button>
          <div className={styles.monthsContainer}>
            {months.map((month, idx) => (
              <MonthGrid
                key={idx}
                month={month}
                basePricePerNight={basePricePerNight}
                weekendPricePerNight={weekendPrice}
                blockedDatesSet={blockedDatesSet}
                calendarDataMap={calendarDataMap}
                onDayClick={handleDayClick}
                isInRange={isInRange}
                isCheckIn={isCheckIn}
                isCheckOut={isCheckOut}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            className={styles.navButton}
            aria-label="Mois suivant"
          >
            →
          </button>
        </div>

        <div className={styles.legend}>
          <div className={styles.legItem}>
            <div className={`${styles.swatch} ${styles.swatchAvail}`} />
            <span>Disponible</span>
          </div>
          <div className={styles.legItem}>
            <div className={`${styles.swatch} ${styles.swatchSel}`} />
            <span>Sélectionné</span>
          </div>
          <div className={styles.legItem}>
            <div className={`${styles.swatch} ${styles.swatchRange}`} />
            <span>Séjour</span>
          </div>
          <div className={styles.legItem}>
            <div className={`${styles.swatch} ${styles.swatchBlocked}`} />
            <span>Indisponible</span>
          </div>
        </div>
      </div>

      {/* Booking Recap Sidebar */}
      <div className={styles.recap}>
        <h3 className={styles.recapTitle}>Votre séjour</h3>

        {localRange.checkIn || localRange.checkOut ? (
          <>
            <div className={styles.datesDisplay}>
              <span>{localRange.checkIn ? formatDate(localRange.checkIn) : '---'}</span>
              <span className={styles.arrow}>→</span>
              <span>{localRange.checkOut ? formatDate(localRange.checkOut) : '---'}</span>
            </div>

            {pricing && (
              <>
                <div className={styles.nights}>
                  {pricing.baseNights + pricing.weekendNights} nuits
                </div>

                <div className={styles.breakdown}>
                  {pricing.nights > 0 && (
                    <div className={styles.bdLine}>
                      <span>
                        {Math.round(pricing.subtotal / pricing.nights)} {currency} × {pricing.nights}{' '}
                        {pricing.nights > 1 ? 'nuits' : 'nuit'}
                      </span>
                      <span className={styles.value}>{pricing.subtotal} {currency}</span>
                    </div>
                  )}

                  <div className={`${styles.bdLine} ${styles.sub}`}>
                    <span>Sous-total</span>
                    <span className={styles.value}>{pricing.subtotal} {currency}</span>
                  </div>

                  <div className={styles.bdLine}>
                    <span>Frais de service ({serviceFeePercent}%)</span>
                    <span className={styles.value}>{pricing.serviceFee} {currency}</span>
                  </div>

                  <div className={styles.bdLine}>
                    <span>Taxe de séjour ({taxPercent}%)</span>
                    <span className={styles.value}>{pricing.tax} {currency}</span>
                  </div>

                  <div className={`${styles.bdLine} ${styles.total}`}>
                    <span>TOTAL</span>
                    <span className={styles.value}>{pricing.total} {currency}</span>
                  </div>
                </div>

                <button type="button" className={styles.recapCta}>
                  Réserver · {pricing.total} {currency}
                </button>
              </>
            )}

            <button type="button" onClick={handleClear} className={styles.clearButton}>
              Effacer les dates
            </button>
          </>
        ) : (
          <div className={`${styles.datesDisplay} ${styles.empty}`}>
            Sélectionnez vos dates
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MonthGrid Component
// ═══════════════════════════════════════════════════════════════

interface MonthGridProps {
  month: Date;
  basePricePerNight: number;
  weekendPricePerNight: number;
  blockedDatesSet: Set<string>;
  calendarDataMap: Map<string, CalendarDayData>;
  onDayClick: (date: Date, isBlocked: boolean, isPast: boolean) => void;
  isInRange: (date: Date) => boolean;
  isCheckIn: (date: Date) => boolean;
  isCheckOut: (date: Date) => boolean;
}

function MonthGrid({
  month,
  basePricePerNight,
  weekendPricePerNight,
  blockedDatesSet,
  calendarDataMap,
  onDayClick,
  isInRange,
  isCheckIn,
  isCheckOut,
}: MonthGridProps) {
  const monthName = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const days = generateMonthDays(month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className={styles.month}>
      <div className={styles.monthTitle}>{monthName}</div>

      <div className={styles.dow}>
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {days.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className={styles.dayEmpty} />;
          }

          const dateStr = toDateKey(day);
          const isBlocked = blockedDatesSet.has(dateStr);
          const isPast = day < today;
          const isWeekend = day.getDay() === 5 || day.getDay() === 6;
          const calendarDay = calendarDataMap.get(dateStr);
          const price = calendarDay?.price || (isWeekend ? weekendPricePerNight : basePricePerNight);
          const rounded = Math.round(price);
          const priceClass = priceDigitClass(rounded);

          const dayClasses = [
            styles.day,
            isWeekend && styles.weekend,
            isBlocked && styles.blocked,
            isPast && styles.past,
            isInRange(day) && styles.range,
            isCheckIn(day) && styles.checkin,
            isCheckOut(day) && styles.checkout,
          ]
            .filter(Boolean)
            .join(' ');

          const title =
            !isBlocked && !isPast
              ? `${formatDate(day)} · ${formatCellPrice(rounded)} MAD${isWeekend ? ' (week-end)' : ''}`
              : undefined;

          return (
            <button
              key={dateStr}
              type="button"
              className={dayClasses}
              title={title}
              disabled={isBlocked || isPast}
              onClick={() => onDayClick(day, isBlocked, isPast)}
            >
              <span className={styles.num}>{day.getDate()}</span>
              {!isBlocked && !isPast && (
                <span className={`${styles.price} ${priceClass}`}>{formatCellPrice(rounded)}</span>
              )}
              {isCheckIn(day) && <span className={styles.endpointBadge}>ARRIVÉE</span>}
              {isCheckOut(day) && <span className={styles.endpointBadge}>DÉPART</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Compact cell label that still shows up to 6 digits without blowing the layout. */
function formatCellPrice(price: number): string {
  const n = Math.round(price);
  if (n >= 1_000_000) return `${Math.round(n / 1000)}k`;
  // Narrow no-break space for thousands (fr) — keeps 125000 → 125 000 readable
  return n.toLocaleString('fr-FR').replace(/\u202f/g, '\u202f');
}

function priceDigitClass(price: number): string {
  const digits = String(Math.round(Math.abs(price))).length;
  if (digits >= 6) return styles.priceXl;
  if (digits >= 5) return styles.priceLg;
  if (digits >= 4) return styles.priceMd;
  return '';
}

function generateMonthDays(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);

  // Adjust for Monday start (getDay() returns 0 for Sunday)
  let firstDayOfWeek = firstDay.getDay();
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday = 0

  const days: (Date | null)[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }

  for (let date = 1; date <= lastDay.getDate(); date++) {
    days.push(new Date(year, monthIndex, date));
  }

  return days;
}

function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
