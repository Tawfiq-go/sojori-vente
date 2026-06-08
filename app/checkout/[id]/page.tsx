'use client';

import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import CheckoutFlow from '@/components/checkout';
import { useListing } from '@/lib/hooks/useListings';
import type { PriceBreakdown } from '@/components/DateRangePicker';

export default function CheckoutPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get listing data
  const { listing, loading: listingLoading } = useListing(id);

  // Parse URL params
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const guestsParam = searchParams.get('guests');
  const pricingParam = searchParams.get('pricing');

  if (!checkInParam || !checkOutParam || !pricingParam) {
    return (
      <>
        <Navigation />
        <main style={{ minHeight: '100vh', textAlign: 'center', paddingTop: '100px', paddingRight: '32px', paddingBottom: '100px', paddingLeft: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '32px', marginBottom: '16px' }}>
            Informations de réservation manquantes
          </h1>
          <p style={{ color: 'var(--ink3)', marginBottom: '32px' }}>
            Veuillez sélectionner vos dates depuis la page du bien.
          </p>
          <button
            onClick={() => router.push(`/listings/${id}`)}
            style={{
              padding: '14px 28px',
              background: 'var(--ink)',
              color: 'var(--paper)',
              border: 0,
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            ← Retour au bien
          </button>
        </main>
      </>
    );
  }

  // Parse dates and pricing
  const checkIn = new Date(checkInParam);
  const checkOut = new Date(checkOutParam);
  const guests = parseInt(guestsParam || '2', 10);

  // Normalize pricing into the full PriceBreakdown shape. The listing page may
  // emit a simplified breakdown (nights/basePrice/cleaningFee/serviceFee/total),
  // so fill any missing fields to avoid NaN / empty values in the recap.
  const rawPricing = JSON.parse(pricingParam) as Record<string, number | undefined>;
  const nightsFromDates = Math.max(
    1,
    Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  );
  const baseNights = rawPricing.baseNights ?? rawPricing.nights ?? nightsFromDates;
  const basePrice = rawPricing.basePrice ?? 0;
  const weekendNights = rawPricing.weekendNights ?? 0;
  const weekendPrice = rawPricing.weekendPrice ?? 0;
  const serviceFee = rawPricing.serviceFee ?? 0;
  const tax = rawPricing.tax ?? 0;
  const subtotal = rawPricing.subtotal ?? basePrice + weekendPrice;
  const total = rawPricing.total ?? subtotal + serviceFee + tax;
  const pricing: PriceBreakdown = {
    baseNights,
    basePrice,
    weekendNights,
    weekendPrice,
    subtotal,
    serviceFee,
    tax,
    total,
  };

  const handleReservationComplete = (reservationId: string) => {
    console.log('Reservation completed:', reservationId);
    // Don't redirect - let CheckoutFlow show the confirmation step
    // The confirmation screen has its own "Retour à l'accueil" button
  };

  const handleCancel = () => {
    router.push(`/listings/${id}`);
  };

  if (listingLoading) {
    return (
      <>
        <Navigation />
        <main style={{ minHeight: '100vh', textAlign: 'center', paddingTop: '100px', paddingRight: '32px', paddingBottom: '100px', paddingLeft: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ color: 'var(--ink3)' }}>Chargement du bien...</h2>
        </main>
      </>
    );
  }

  if (!listing) {
    return (
      <>
        <Navigation />
        <main style={{ minHeight: '100vh', textAlign: 'center', paddingTop: '100px', paddingRight: '32px', paddingBottom: '100px', paddingLeft: '32px' }}>
          <h1>Bien non trouvé</h1>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main style={{ paddingTop: '88px', minHeight: '100vh', background: 'var(--paper)' }}>
        <CheckoutFlow
          listingId={id}
          dateRange={{
            checkIn,
            checkOut,
          }}
          guests={{
            adults: guests,
            children: 0,
          }}
          pricing={pricing}
          onComplete={handleReservationComplete}
          onCancel={handleCancel}
        />
      </main>
    </>
  );
}
