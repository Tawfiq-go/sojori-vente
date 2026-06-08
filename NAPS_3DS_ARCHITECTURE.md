# 🔐 Architecture NAPS avec 3D Secure (3DS)

**Date:** 2026-06-02
**Status:** Architecture définitive pour production

---

## 🚨 Pourquoi Cette Architecture ?

Le paiement 3D Secure peut prendre **1-5 minutes** :
- User redirigé vers page banque
- Attente code SMS / validation app bancaire
- Redirection de retour

❌ **Impossible de garder le contexte (dates, guests, pricing) dans le frontend pendant 5 minutes!**

✅ **Solution : Stocker TOUT dans le PaymentIntent + Webhook backend**

---

## 🏗️ Architecture Complète

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. USER REMPLIT FORMULAIRE CHECKOUT                             │
│    - Dates, guests, pricing                                      │
│    - Nom, email, téléphone                                       │
│    - Numéro carte, CVV, expiration                               │
└────────────────────────────┬─────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. CREATE PAYMENTINTENT (Backend)                                │
│    POST /api/v1/payments/intents                                 │
│                                                                   │
│    ✅ Stocke en DB:                                              │
│    {                                                              │
│      id: "pi_abc123",                                             │
│      status: "requires_payment_method",                           │
│      amount: 150000, // centimes                                  │
│      currency: "504", // MAD                                      │
│      guest: {                                                     │
│        firstName: "Ahmed",                                        │
│        lastName: "Benali",                                        │
│        email: "ahmed@example.com",                                │
│        phone: "+212612345678"                                     │
│      },                                                           │
│      metadata: {                                                  │
│        listingId: "listing_xyz",                                  │
│        checkIn: "2026-07-15",                                     │
│        checkOut: "2026-07-20",                                    │
│        guests: "2",                                               │
│        children: "1",                                             │
│        infants: "0",                                              │
│        baseNights: "5",                                           │
│        basePrice: "1200",                                         │
│        weekendNights: "2",                                        │
│        weekendPrice: "300",                                       │
│        subtotal: "1500",                                          │
│        serviceFee: "150",                                         │
│        tax: "150"                                                 │
│      }                                                            │
│    }                                                              │
└────────────────────────────┬─────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. CONFIRM PAYMENT (Backend)                                     │
│    POST /api/v1/payments/intents/pi_abc123/confirm               │
│    { encryptedCardData: "..." }                                  │
│                                                                   │
│    Backend:                                                       │
│    1. Déchiffre carte avec clé privée GCP                        │
│    2. Appelle NAPS /authorization                                │
│                                                                   │
│    ⚠️ NAPS répond (exemple 3DS):                                 │
│    {                                                              │
│      responseCode: "00",                                          │
│      responseMessage: "3DS_CHALLENGE_REQUIRED",                   │
│      actionUrl: "https://naps.ma/3ds/challenge/xyz123",           │
│      transactionId: "txn_naps_456"                                │
│    }                                                              │
│                                                                   │
│    Backend update DB:                                             │
│    {                                                              │
│      status: "requires_action",                                   │
│      providerData: { transactionId: "txn_naps_456", ... }         │
│    }                                                              │
│                                                                   │
│    Backend renvoie au frontend:                                   │
│    {                                                              │
│      success: false,                                              │
│      requiresAction: true,                                        │
│      actionUrl: "https://naps.ma/3ds/challenge/xyz123"            │
│    }                                                              │
└────────────────────────────┬─────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. FRONTEND REDIRECT (CheckoutFlow.tsx)                          │
│                                                                   │
│    if (paymentResult.requiresAction) {                            │
│      // Sauvegarder PaymentIntent ID dans localStorage            │
│      localStorage.setItem('pendingPaymentIntent', intentId);      │
│                                                                   │
│      // Rediriger vers 3DS challenge                             │
│      window.location.href = paymentResult.actionUrl;              │
│      return;                                                      │
│    }                                                              │
│                                                                   │
│    User part vers page banque (1-5 minutes)...                   │
└────────────────────────────┬─────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ 5. USER VALIDE 3DS (Page Banque)                                │
│    - Entre code SMS                                              │
│    - Valide dans app bancaire                                    │
│    - Attente 30s-5min                                            │
└────────────────────────────┬─────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ 6. NAPS WEBHOOK (Backend) ⚡ CRITIQUE                            │
│    POST https://api.sojori.com/api/v1/payments/webhooks/naps     │
│                                                                   │
│    NAPS envoie:                                                   │
│    {                                                              │
│      transactionId: "txn_naps_456",                               │
│      status: "APPROVED",                                          │
│      responseCode: "00",                                          │
│      authorizationCode: "AUTH123456"                              │
│    }                                                              │
│                                                                   │
│    Backend:                                                       │
│    1. Trouve PaymentIntent par transactionId                     │
│    2. Update status = "succeeded"                                 │
│    3. ⚡ CRÉE LA RÉSERVATION AUTOMATIQUEMENT ⚡                  │
│       (avec données du PaymentIntent.metadata)                    │
│    4. Envoie email confirmation                                   │
│    5. Envoie SMS confirmation                                     │
└────────────────────────────┬─────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ 7. NAPS REDIRIGE USER                                            │
│    https://sojori.com/checkout/return?                            │
│      status=success&                                              │
│      transactionId=txn_naps_456                                   │
└────────────────────────────┬─────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ 8. PAGE DE RETOUR (Frontend)                                    │
│    /checkout/return?status=success&transactionId=...              │
│                                                                   │
│    1. Récupère pendingPaymentIntent du localStorage              │
│    2. Appelle GET /api/v1/payments/intents/{id}                  │
│    3. Vérifie status = "succeeded"                               │
│    4. Récupère reservationId depuis PaymentIntent                │
│    5. Affiche page confirmation                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 Fichiers à Créer/Modifier

### 1. Backend : Webhook NAPS

`/Users/gouacht/sojori-production/apps/srv-reservations/src/payments/routes/webhooks.ts`

```typescript
import express from 'express';
import { PaymentIntent } from '../models/PaymentIntent';
import { createReservationFromPayment } from '../../reservations/services/reservationService';
import { sendConfirmationEmail } from '../../notifications/emailService';

const router = express.Router();

/**
 * NAPS Webhook - Called when payment status changes
 * CRITICAL: This creates the reservation automatically!
 */
router.post('/webhooks/naps', async (req, res) => {
  try {
    const { transactionId, status, responseCode, authorizationCode } = req.body;

    console.log('[NAPS Webhook] Received:', { transactionId, status, responseCode });

    // Find PaymentIntent by NAPS transactionId
    const paymentIntent = await PaymentIntent.findOne({
      'providerData.transactionId': transactionId,
    });

    if (!paymentIntent) {
      console.error('[NAPS Webhook] PaymentIntent not found:', transactionId);
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update PaymentIntent status
    if (status === 'APPROVED' && responseCode === '00') {
      paymentIntent.status = 'succeeded';
      paymentIntent.providerData = {
        ...paymentIntent.providerData,
        authorizationCode,
        finalStatus: status,
        completedAt: new Date(),
      };
      await paymentIntent.save();

      console.log('[NAPS Webhook] Payment succeeded:', paymentIntent.id);

      // ⚡ CREATE RESERVATION AUTOMATICALLY
      try {
        const reservation = await createReservationFromPayment(paymentIntent);

        // Link reservation to payment
        paymentIntent.reservationId = reservation._id;
        await paymentIntent.save();

        console.log('✅ [NAPS Webhook] Reservation created:', reservation.reservationNumber);

        // Send confirmation email
        await sendConfirmationEmail(paymentIntent.guest.email, {
          reservationNumber: reservation.reservationNumber,
          checkIn: paymentIntent.metadata.checkIn,
          checkOut: paymentIntent.metadata.checkOut,
          total: paymentIntent.amount / 100,
        });

      } catch (reservationError) {
        console.error('❌ [NAPS Webhook] Failed to create reservation:', reservationError);
        // Payment succeeded but reservation failed - will be handled by reconciliation job
      }

    } else if (status === 'DECLINED' || status === 'FAILED') {
      paymentIntent.status = 'failed';
      paymentIntent.providerData = {
        ...paymentIntent.providerData,
        finalStatus: status,
        failedAt: new Date(),
      };
      await paymentIntent.save();

      console.log('[NAPS Webhook] Payment failed:', paymentIntent.id);
    }

    return res.json({ success: true });

  } catch (error) {
    console.error('[NAPS Webhook] Error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
```

### 2. Backend : Service de Création Réservation

`/Users/gouacht/sojori-production/apps/srv-reservations/src/reservations/services/reservationService.ts`

```typescript
import { Reservation } from '../models/Reservation';
import { PaymentIntent } from '../../payments/models/PaymentIntent';

/**
 * Create reservation from PaymentIntent data
 * Used by webhook when payment succeeds
 */
export async function createReservationFromPayment(
  paymentIntent: PaymentIntent
): Promise<Reservation> {
  const metadata = paymentIntent.metadata;
  const guest = paymentIntent.guest;

  const reservation = await Reservation.create({
    listingId: paymentIntent.context.referenceId,
    checkIn: metadata.checkIn,
    checkOut: metadata.checkOut,
    guests: {
      adults: parseInt(metadata.guests),
      children: parseInt(metadata.children || '0'),
      infants: parseInt(metadata.infants || '0'),
    },
    traveler: {
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
    },
    pricing: {
      baseNights: parseFloat(metadata.baseNights),
      basePrice: parseFloat(metadata.basePrice),
      weekendNights: parseFloat(metadata.weekendNights || '0'),
      weekendPrice: parseFloat(metadata.weekendPrice || '0'),
      subtotal: parseFloat(metadata.subtotal),
      serviceFee: parseFloat(metadata.serviceFee),
      tax: parseFloat(metadata.tax),
      total: paymentIntent.amount / 100, // Convert cents to MAD
    },
    payment: {
      method: 'card',
      status: 'paid',
      intentId: paymentIntent.id,
    },
    status: 'confirmed',
  });

  console.log(`✅ [ReservationService] Created reservation ${reservation.reservationNumber}`);

  return reservation;
}
```

### 3. Frontend : Page de Retour 3DS

`/Users/gouacht/sojori-vente/app/checkout/return/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getPaymentIntent } from '@/lib/services/paymentService';

export default function CheckoutReturnPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [reservationNumber, setReservationNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyPayment() {
      try {
        // Get pending PaymentIntent from localStorage
        const intentId = localStorage.getItem('pendingPaymentIntent');
        if (!intentId) {
          throw new Error('No pending payment found');
        }

        // Fetch PaymentIntent status from backend
        const paymentIntent = await getPaymentIntent(intentId);

        console.log('[Checkout Return] PaymentIntent status:', paymentIntent.status);

        if (paymentIntent.status === 'succeeded') {
          // Payment succeeded!

          // Get reservation (created by webhook)
          // Wait a bit if not yet created (webhook can take 1-2 seconds)
          let attempts = 0;
          while (attempts < 5) {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/guest/reservations/by-payment/${intentId}`
            );

            if (response.ok) {
              const data = await response.json();
              setReservationNumber(data.data.reservationNumber);
              setStatus('success');

              // Clear localStorage
              localStorage.removeItem('pendingPaymentIntent');
              return;
            }

            // Wait 1 second and retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
          }

          // If we get here, webhook might have failed - show manual intervention message
          setStatus('success');
          setReservationNumber('En cours de traitement');

        } else if (paymentIntent.status === 'failed') {
          throw new Error('Le paiement a échoué');
        } else if (paymentIntent.status === 'requires_action') {
          // Still pending 3DS (shouldn't happen, but handle it)
          throw new Error('Le paiement est en attente de validation');
        }

      } catch (err) {
        console.error('[Checkout Return] Error:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        setStatus('error');
      }
    }

    verifyPayment();
  }, []);

  if (status === 'loading') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '1rem' }}>⏳</div>
        <h1>Vérification du paiement...</h1>
        <p>Veuillez patienter quelques instants.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '1rem' }}>❌</div>
        <h1>Erreur</h1>
        <p>{error}</p>
        <button onClick={() => router.push('/')}>Retour à l'accueil</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '1rem' }}>✅</div>
      <h1>Réservation Confirmée!</h1>
      {reservationNumber && (
        <div style={{ marginTop: '2rem' }}>
          <p>Numéro de réservation:</p>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            padding: '1rem',
            background: '#f5f5f5',
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            {reservationNumber}
          </div>
        </div>
      )}
      <p style={{ marginTop: '2rem' }}>
        Un email de confirmation a été envoyé à votre adresse.
      </p>
      <button
        onClick={() => router.push('/')}
        style={{ marginTop: '2rem', padding: '12px 24px', fontSize: '16px' }}
      >
        Retour à l'accueil
      </button>
    </div>
  );
}
```

### 4. Frontend : Modifier CheckoutFlow.tsx

Modifier la fonction `handlePayment` pour gérer le cas `requiresAction`:

```typescript
const handlePayment = async () => {
  setProcessing(true);
  setError(null);

  try {
    if (paymentMethod === 'card') {
      // ... validation code ...

      // Process payment
      const paymentResult = await processPayment(...);

      // ⚠️ HANDLE 3DS REDIRECT
      if (paymentResult.requiresAction && paymentResult.actionUrl) {
        console.log('🔵 [CHECKOUT] 3DS challenge required, redirecting...');

        // Save PaymentIntent ID for return page
        localStorage.setItem('pendingPaymentIntent', paymentResult.data?.id || '');

        // Redirect to 3DS challenge page
        window.location.href = paymentResult.actionUrl;
        return; // Stop here, webhook will handle reservation creation
      }

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Le paiement a échoué');
      }

      // Clear card data
      setCardNumber('');
      setCardCVV('');
      setCardExpiry('');
      setCardHolderName('');

      console.log('✅ [CHECKOUT] Payment succeeded (no 3DS)');
    }

    // Create reservation (only if no 3DS redirect)
    const response = await fetch(`/api/v1/guest/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentIntentId: paymentResult.data?.id,
        listingId,
        // ... rest of data
      }),
    });

    // ... handle response ...

  } catch (err) {
    console.error('Payment failed:', err);
    setError(err instanceof Error ? err.message : 'Une erreur est survenue');
  } finally {
    setProcessing(false);
  }
};
```

---

## 🔑 Points Critiques

### 1. **Webhook est OBLIGATOIRE**
   - Le frontend ne peut PAS attendre 5 minutes pendant 3DS
   - Le webhook backend crée la réservation automatiquement
   - Le frontend vérifie juste le résultat au retour

### 2. **Toutes les données dans PaymentIntent.metadata**
   - Dates, guests, pricing, listingId
   - Permet de recréer la réservation depuis le webhook
   - Aucune dépendance sur session frontend

### 3. **localStorage pour continuité**
   - Sauvegarde `pendingPaymentIntent` avant redirect 3DS
   - Permet de retrouver le paiement au retour
   - Fallback si l'user ferme l'onglet (réconciliation job)

### 4. **Job de Réconciliation (backup)**
   - Toutes les 5 minutes
   - Trouve PaymentIntents `succeeded` sans `reservationId`
   - Crée la réservation manquante
   - Envoie email

---

## 🧪 Tests

### Sans 3DS (paiement direct)
```bash
# Test avec carte sans 3DS
5234567890123255
12/25
123
```

### Avec 3DS (simulation)
```bash
# NAPS test environment - force 3DS challenge
# (carte spécifique pour tester 3DS)
```

---

## 📊 Statuts PaymentIntent

| Status | Description | Action Frontend | Action Backend |
|--------|-------------|-----------------|----------------|
| `requires_payment_method` | Créé, pas encore confirmé | Attente carte | - |
| `requires_action` | 3DS challenge requis | Redirect vers actionUrl | Attente webhook |
| `succeeded` | Paiement validé | Afficher confirmation | Créer réservation |
| `failed` | Paiement échoué | Afficher erreur | - |

---

**Prochaine étape:** Implémenter le webhook backend + page de retour frontend.
