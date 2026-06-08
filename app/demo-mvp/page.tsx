'use client';

import { useState } from 'react';
import DateRangePicker, { type DateRange, type PriceBreakdown } from '@/components/DateRangePicker';
import CheckoutFlow from '@/components/checkout';

export default function DemoMVPPage() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'checkout'>('calendar');
  const [dateRange, setDateRange] = useState<DateRange>({ checkIn: null, checkOut: null });
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);

  const handleDateSelect = (range: DateRange) => {
    setDateRange(range);
  };

  const handlePriceCalculate = (breakdown: PriceBreakdown) => {
    setPriceBreakdown(breakdown);
  };

  const handleReservationComplete = (reservationId: string) => {
    console.log('Reservation completed:', reservationId);
    alert(`Réservation confirmée ! ID: ${reservationId}`);
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      {/* Navigation */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '14px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          background: 'rgba(250, 247, 240, 0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid var(--b)',
          height: '68px',
        }}
      >
        <a
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            fontFamily: 'var(--serif)',
            fontSize: '24px',
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: '-0.025em',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--gold)',
              boxShadow: '0 0 12px var(--gold)',
            }}
          />
          sojori
        </a>
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            color: 'var(--ink3)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Riad de la Bahia · Marrakech
        </span>
        <div
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            background: 'var(--card)',
            border: '1px solid var(--b)',
            borderRadius: '11px',
            padding: '3px',
            gap: '1px',
          }}
        >
          <button
            onClick={() => setActiveTab('calendar')}
            style={{
              padding: '8px 15px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: activeTab === 'calendar' ? 700 : 600,
              color: activeTab === 'calendar' ? 'var(--paper)' : 'var(--ink3)',
              background: activeTab === 'calendar' ? 'var(--ink)' : 'transparent',
              border: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
            }}
          >
            <span style={{ fontSize: '14px' }}>📅</span>Calendrier
          </button>
          <button
            onClick={() => setActiveTab('checkout')}
            style={{
              padding: '8px 15px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: activeTab === 'checkout' ? 700 : 600,
              color: activeTab === 'checkout' ? 'var(--paper)' : 'var(--ink3)',
              background: activeTab === 'checkout' ? 'var(--ink)' : 'transparent',
              border: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
            }}
          >
            <span style={{ fontSize: '14px' }}>💳</span>Checkout · 4 étapes
          </button>
        </div>
      </nav>

      {/* Content */}
      {activeTab === 'calendar' && (
        <DateRangePicker
          listingId="demo-listing-123"
          minNights={3}
          maxNights={30}
          onDateSelect={handleDateSelect}
          onPriceCalculate={handlePriceCalculate}
        />
      )}

      {activeTab === 'checkout' && dateRange.checkIn && dateRange.checkOut && priceBreakdown ? (
        <CheckoutFlow
          listingId="demo-listing-123"
          dateRange={{
            checkIn: dateRange.checkIn,
            checkOut: dateRange.checkOut,
          }}
          guests={{
            adults: 2,
            children: 1,
          }}
          pricing={priceBreakdown}
          onComplete={handleReservationComplete}
        />
      ) : (
        <div
          style={{
            maxWidth: '600px',
            margin: '60px auto',
            padding: '40px 32px',
            textAlign: 'center',
            background: 'var(--card)',
            border: '1px solid var(--b)',
            borderRadius: '22px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '28px',
              fontWeight: 400,
              marginBottom: '12px',
            }}
          >
            Sélectionnez d'abord vos dates
          </h2>
          <p style={{ color: 'var(--ink3)', lineHeight: '1.6', marginBottom: '24px' }}>
            Pour accéder au tunnel de réservation (Checkout), vous devez d'abord sélectionner vos dates d'arrivée et de
            départ dans le calendrier.
          </p>
          <button
            onClick={() => setActiveTab('calendar')}
            style={{
              padding: '14px 24px',
              background: 'var(--ink)',
              color: 'var(--paper)',
              border: 0,
              borderRadius: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ← Retour au calendrier
          </button>
        </div>
      )}
    </div>
  );
}
