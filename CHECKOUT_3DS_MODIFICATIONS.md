# Modifications CheckoutFlow.tsx pour 3D Secure

**Date:** 2026-06-02

---

## 🎯 Objectif

Modifier `CheckoutFlow.tsx` pour gérer:
1. Redirect vers page 3DS si NAPS le demande
2. Sauvegarde PaymentIntent ID dans localStorage
3. Stockage de toutes les métadonnées dans PaymentIntent (pas juste payment)

---

## 📝 Modifications Requises

### 1. Modifier la fonction `handlePayment`

**Trouver la section de traitement du paiement carte** (actuellement lignes ~65-127 selon `NAPS_INTEGRATION_FINAL.md`)

**REMPLACER** par:

```typescript
const handlePayment = async () => {
  setProcessing(true);
  setError(null);

  try {
    // 🔐 Validation & paiement sécurisé NAPS (si carte)
    if (paymentMethod === 'card') {
      const cardDigits = cardNumber.replace(/\D/g, '');

      // Validation carte
      if (!validateCardNumber(cardDigits)) {
        throw new Error('Numéro de carte invalide');
      }

      if (!validateCVV(cardCVV)) {
        throw new Error('CVV invalide');
      }

      const [month, year] = cardExpiry.split('/');
      if (!validateExpiry(month, year)) {
        throw new Error('Date d\'expiration invalide');
      }

      if (!cardHolderName.trim()) {
        throw new Error('Nom du titulaire requis');
      }

      console.log('✅ [CHECKOUT] Validation carte OK, traitement du paiement...');

      // Process payment with NAPS API (encrypted)
      const paymentResult = await processPayment(
        {
          amount: Math.round(pricing.total * 100), // Convert to cents
          currency: '504', // MAD
          context: {
            type: 'reservation',
            referenceId: listingId,
          },
          guest: {
            firstName: data.traveler?.firstName || '',
            lastName: data.traveler?.lastName || '',
            email: data.traveler?.email || '',
            phone: `${phoneCountry}${data.traveler?.phone}` || '',
          },
          metadata: {
            // ⚠️ CRITICAL: Store ALL reservation data here for webhook
            listingId,
            checkIn: dateRange.checkIn.toISOString().split('T')[0],
            checkOut: dateRange.checkOut.toISOString().split('T')[0],
            guests: `${guests.adults}`,
            children: `${guests.children || 0}`,
            infants: `${guests.infants || 0}`,
            // Pricing breakdown
            baseNights: `${pricing.baseNights || 0}`,
            basePrice: `${pricing.basePrice || 0}`,
            weekendNights: `${pricing.weekendNights || 0}`,
            weekendPrice: `${pricing.weekendPrice || 0}`,
            subtotal: `${pricing.subtotal || pricing.basePrice || 0}`,
            serviceFee: `${pricing.serviceFee || 0}`,
            tax: `${pricing.tax || 0}`,
          },
        },
        {
          number: cardDigits,
          cvv: cardCVV,
          expiryMonth: month,
          expiryYear: year,
          holderName: cardHolderName,
        }
      );

      console.log('🔵 [CHECKOUT] Résultat paiement:', paymentResult);

      // ⚠️ HANDLE 3DS REDIRECT
      if (paymentResult.requiresAction && paymentResult.actionUrl) {
        console.log('🔵 [CHECKOUT] 3DS challenge required, redirecting to:', paymentResult.actionUrl);

        // Save PaymentIntent ID for return page
        if (paymentResult.data?.id) {
          localStorage.setItem('pendingPaymentIntent', paymentResult.data.id);
          console.log('💾 [CHECKOUT] Saved PaymentIntent ID to localStorage:', paymentResult.data.id);
        }

        // Clear card data from memory (sécurité)
        setCardNumber('');
        setCardCVV('');
        setCardExpiry('');
        setCardHolderName('');

        // Redirect to 3DS challenge page (NAPS hosted page)
        window.location.href = paymentResult.actionUrl;
        return; // Stop here - webhook will handle reservation creation
      }

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Le paiement a échoué');
      }

      // Clear card data from memory (sécurité)
      setCardNumber('');
      setCardCVV('');
      setCardExpiry('');
      setCardHolderName('');

      console.log('✅ [CHECKOUT] Paiement réussi (no 3DS)!');

      // ⚠️ Only create reservation if NO 3DS redirect
      // (If 3DS, webhook will create reservation)

      // Create reservation
      const checkInStr = dateRange.checkIn.toISOString().split('T')[0];
      const checkOutStr = dateRange.checkOut.toISOString().split('T')[0];

      const payload = {
        paymentIntentId: paymentResult.data?.id, // Link to payment
        listingId,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        guests: {
          adults: guests.adults,
          children: guests.children || 0,
          infants: guests.infants || 0,
        },
        traveler: {
          firstName: data.traveler?.firstName,
          lastName: data.traveler?.lastName,
          email: data.traveler?.email,
          phone: `${phoneCountry}${data.traveler?.phone}`,
        },
        pricing: {
          baseNights: pricing.baseNights || 0,
          basePrice: pricing.basePrice || 0,
          weekendNights: pricing.weekendNights || 0,
          weekendPrice: pricing.weekendPrice || 0,
          subtotal: pricing.subtotal || pricing.basePrice || 0,
          serviceFee: pricing.serviceFee || 0,
          tax: pricing.tax || 0,
          total: pricing.total || 0,
        },
        payment: {
          method: 'card',
          status: 'paid',
          intentId: paymentResult.data?.id,
        },
      };

      console.log('🔵 [CHECKOUT] Envoi réservation:', payload);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/guest/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('🔵 [CHECKOUT] Réponse API:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Failed to create reservation');
      }

      // Show confirmation
      setReservationNumber(result.data.reservationNumber);
      setCurrentStep(2);
      onComplete(result.data.reservationId);

    } else {
      // ⚠️ CASH/TRANSFER: Create reservation with pending payment
      const checkInStr = dateRange.checkIn.toISOString().split('T')[0];
      const checkOutStr = dateRange.checkOut.toISOString().split('T')[0];

      const payload = {
        listingId,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        guests: {
          adults: guests.adults,
          children: guests.children || 0,
          infants: guests.infants || 0,
        },
        traveler: {
          firstName: data.traveler?.firstName,
          lastName: data.traveler?.lastName,
          email: data.traveler?.email,
          phone: `${phoneCountry}${data.traveler?.phone}`,
        },
        pricing: {
          baseNights: pricing.baseNights || 0,
          basePrice: pricing.basePrice || 0,
          weekendNights: pricing.weekendNights || 0,
          weekendPrice: pricing.weekendPrice || 0,
          subtotal: pricing.subtotal || pricing.basePrice || 0,
          serviceFee: pricing.serviceFee || 0,
          tax: pricing.tax || 0,
          total: pricing.total || 0,
        },
        payment: {
          method: paymentMethod,
          status: 'pending',
        },
      };

      console.log('🔵 [CHECKOUT] Envoi réservation (cash/transfer):', payload);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/guest/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('🔵 [CHECKOUT] Réponse API:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Failed to create reservation');
      }

      // Show confirmation
      setReservationNumber(result.data.reservationNumber);
      setCurrentStep(2);
      onComplete(result.data.reservationId);
    }

  } catch (err) {
    console.error('Checkout failed:', err);
    setError(err instanceof Error ? err.message : 'Une erreur est survenue');
  } finally {
    setProcessing(false);
  }
};
```

---

## 🔑 Points Clés

### 1. Métadonnées Complètes dans PaymentIntent
```typescript
metadata: {
  listingId,           // Pour retrouver le listing
  checkIn: "2026-07-15",
  checkOut: "2026-07-20",
  guests: "2",
  children: "1",
  infants: "0",
  // Pricing complet
  baseNights: "5",
  basePrice: "1200",
  weekendNights: "2",
  weekendPrice: "300",
  subtotal: "1500",
  serviceFee: "150",
  tax: "150"
}
```

**Pourquoi ?** Le webhook backend a besoin de toutes ces données pour créer la réservation après validation 3DS.

### 2. Détection 3DS et Redirect
```typescript
if (paymentResult.requiresAction && paymentResult.actionUrl) {
  // Save PaymentIntent ID
  localStorage.setItem('pendingPaymentIntent', paymentResult.data.id);

  // Clear card data (sécurité)
  setCardNumber('');
  setCardCVV('');
  // ...

  // Redirect to NAPS 3DS page
  window.location.href = paymentResult.actionUrl;
  return; // STOP HERE
}
```

**Pourquoi ?** Le user part vers la page banque. Le webhook créera la réservation après validation.

### 3. Fallback Sans 3DS
```typescript
// Si pas de requiresAction, création réservation normale
const payload = {
  paymentIntentId: paymentResult.data?.id, // Lien vers paiement
  listingId,
  checkIn,
  checkOut,
  // ...
};

await fetch('/api/v1/guest/reservations', {
  method: 'POST',
  body: JSON.stringify(payload),
});
```

**Pourquoi ?** Si pas de 3DS, paiement immédiat → on crée directement la réservation.

---

## 🧪 Tests

### Test Sans 3DS
```bash
# Carte test NAPS sans 3DS
5234567890123255
12/25
123

# Résultat attendu:
# - paymentResult.success = true
# - paymentResult.requiresAction = false
# - Création réservation immédiate
# - Affichage confirmation
```

### Test Avec 3DS (simulation)
```bash
# Carte test avec 3DS (si disponible dans NAPS test env)
# Sinon, tester en production avec vraie carte

# Résultat attendu:
# - paymentResult.requiresAction = true
# - paymentResult.actionUrl = "https://naps.ma/3ds/..."
# - Redirect vers page 3DS
# - User valide
# - NAPS appelle webhook
# - Webhook crée réservation
# - Redirect vers /checkout/return
# - Affichage confirmation
```

---

## ⚠️ Points d'Attention

1. **localStorage peut être vidé** → Job de réconciliation backup
2. **Webhook peut échouer** → Job de réconciliation backup
3. **User peut fermer onglet** → Job de réconciliation retrouve paiement et crée réservation
4. **Variables d'environnement** → Vérifier `.env.local`:
   ```bash
   NEXT_PUBLIC_API_BASE_URL=http://localhost:14004
   NEXT_PUBLIC_API_PAYMENTS_URL=http://localhost:14004/api/v1/payments
   ```

---

**Prochaine étape:** Implémenter webhook backend + endpoint `/api/v1/guest/reservations/by-payment/{intentId}`
