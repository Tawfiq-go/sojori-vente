'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

/** NAPS failURL landing — redirects to checkout return with failed status. */
export default function PaymentFailPage() {
  const params = useParams();
  const reservationNumber = params.reservationNumber as string;

  useEffect(() => {
    if (!reservationNumber) return;
    const target = `/checkout/return?status=failed&reservationNumber=${encodeURIComponent(reservationNumber)}`;
    window.location.replace(target);
  }, [reservationNumber]);

  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Retour paiement…</p>
    </main>
  );
}
