'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

/** NAPS successURL landing — redirects to checkout return (merchant domain www.sojori.com). */
export default function ThankYouPage() {
  const params = useParams();
  const reservationNumber = params.reservationNumber as string;

  useEffect(() => {
    if (!reservationNumber) return;
    const target = `/checkout/return?reservationNumber=${encodeURIComponent(reservationNumber)}`;
    window.location.replace(target);
  }, [reservationNumber]);

  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Paiement en cours de validation…</p>
    </main>
  );
}
