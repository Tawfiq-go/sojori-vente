'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PAYMENT_MODE } from '@/lib/config/payment';
import { getPaymentIntent } from '@/lib/services/paymentService';
import { getGuestReservationByNumber } from '@/lib/services/napsRedirectService';

type PageStatus = 'loading' | 'success' | 'error';

function CheckoutReturnPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<PageStatus>('loading');
  const [reservationNumber, setReservationNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reservationFromQuery = searchParams.get('reservationNumber');
    const failed = searchParams.get('status') === 'failed';
    const repauto = searchParams.get('repauto');

    async function verifyRedirectReturn() {
      const reservationNumber =
        reservationFromQuery || localStorage.getItem('pendingReservationNumber');

      if (!reservationNumber) {
        throw new Error('Aucune réservation en attente trouvée');
      }

      if (failed) {
        localStorage.removeItem('pendingReservationNumber');
        const detail = repauto
          ? ` (code NAPS ${repauto})`
          : '';
        throw new Error(`Le paiement a été refusé ou annulé sur la page NAPS${detail}`);
      }

      // Poll: NAPS callback may arrive slightly after browser redirect
      let attempts = 0;
      while (attempts < 8) {
        const reservation = await getGuestReservationByNumber(reservationNumber);
        if (reservation.paymentStatus === 'Paid' || reservation.paymentStatus === 'paid') {
          setReservationNumber(reservation.reservationNumber);
          setStatus('success');
          localStorage.removeItem('pendingReservationNumber');
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }

      localStorage.removeItem('pendingReservationNumber');
      const lastErr = (await getGuestReservationByNumber(reservationNumber)).lastNapsError?.userMessage;
      throw new Error(
        lastErr ||
          'Paiement non confirmé. Le callback NAPS est peut-être en retard ou le 3DS a échoué côté banque.',
      );
    }

    async function verifyApiReturn() {
      const SUCCESS_STATUSES = ['authorized', 'captured', 'succeeded'];
      const intentId =
        searchParams.get('paymentId') || localStorage.getItem('pendingPaymentIntent');

      if (searchParams.get('status') === 'failed') {
        throw new Error(searchParams.get('error') || 'Le paiement a échoué');
      }

      if (!intentId) {
        throw new Error('Aucun paiement en attente trouvé');
      }

      const paymentIntent = await getPaymentIntent(intentId);

      if (SUCCESS_STATUSES.includes(paymentIntent.status)) {
        setReservationNumber('En cours de traitement');
        setStatus('success');
        localStorage.removeItem('pendingPaymentIntent');
        return;
      }

      if (paymentIntent.status === 'failed' || paymentIntent.status === 'cancelled') {
        throw new Error('Le paiement a échoué');
      }

      throw new Error(`Statut inattendu: ${paymentIntent.status}`);
    }

    async function run() {
      try {
        if (PAYMENT_MODE === 'api' && !reservationFromQuery) {
          await verifyApiReturn();
        } else {
          await verifyRedirectReturn();
        }
      } catch (err) {
        console.error('[Checkout Return] Error:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        setStatus('error');
      }
    }

    run();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '64px',
              marginBottom: '1rem',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          >
            ⏳
          </div>
          <h1 style={{ fontSize: '24px', marginBottom: '0.5rem' }}>Vérification du paiement...</h1>
          <p style={{ color: '#666' }}>Veuillez patienter quelques instants.</p>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.95); }
          }
        `}</style>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '64px', marginBottom: '1rem' }}>❌</div>
          <h1 style={{ fontSize: '24px', marginBottom: '1rem', color: '#dc2626' }}>Paiement non confirmé</h1>
          <p style={{ marginBottom: '2rem', color: '#666' }}>{error}</p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  const processing = !reservationNumber || reservationNumber === 'En cours de traitement';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '600px' }}>
        <div style={{ fontSize: '64px', marginBottom: '1rem' }}>✅</div>
        <h1 style={{ fontSize: '32px', marginBottom: '1rem' }}>
          {processing ? 'Paiement accepté' : 'Réservation confirmée !'}
        </h1>

        {!processing && (
          <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <p style={{ color: '#666', marginBottom: '0.5rem' }}>Numéro de réservation :</p>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                padding: '1rem',
                background: '#f5f5f5',
                borderRadius: '8px',
                display: 'inline-block',
                letterSpacing: '0.05em',
              }}
            >
              {reservationNumber}
            </div>
          </div>
        )}

        {processing && (
          <div
            style={{
              marginTop: '2rem',
              marginBottom: '2rem',
              padding: '1rem',
              background: '#fef3c7',
              borderRadius: '8px',
              border: '1px solid #fbbf24',
            }}
          >
            <p style={{ color: '#92400e', margin: 0 }}>
              Votre paiement a été accepté par NAPS. La confirmation finale arrive en quelques
              secondes — vous recevrez un email avec votre numéro de réservation.
            </p>
          </div>
        )}

        <p style={{ marginBottom: '2rem', color: '#666' }}>
          Un email de confirmation vous sera envoyé sous peu.
        </p>

        <button
          onClick={() => router.push('/')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            background: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Retour à l&apos;accueil
        </button>
      </div>
    </div>
  );
}

export default function CheckoutReturnRoute() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Chargement…</div>}>
      <CheckoutReturnPage />
    </Suspense>
  );
}
