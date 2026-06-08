# 🎉 Intégration NAPS Finalisée - Frontend + Backend

**Date:** 2026-06-01
**Status:** ✅ **PRÊT POUR TESTS**

---

## ✅ Fichiers Créés

### 1. `/lib/utils/cardEncryption.ts` ✅
- Chiffrement RSA-OAEP côté client (Web Crypto API)
- Validation Luhn pour numéro de carte
- Formatage automatique (XXXX XXXX XXXX XXXX)
- Validation CVV et expiration

### 2. `/lib/services/paymentService.ts` ✅
- `getPublicKey()` - Récupération clé RSA
- `createPaymentIntent()` - Création intention de paiement
- `confirmPayment()` - Confirmation avec carte chiffrée
- `processPayment()` - Flux complet (create + confirm)

---

## 🔧 Modifications Requises dans `CheckoutFlow.tsx`

### Étape 1: Ajouter les imports (début du fichier)

Ajouter après les imports existants :

```typescript
import { processPayment } from '@/lib/services/paymentService';
import {
  formatCardNumber,
  formatExpiry,
  validateCardNumber,
  validateCVV,
  validateExpiry
} from '@/lib/utils/cardEncryption';
```

### Étape 2: États déjà ajoutés ✅

Les états suivants sont déjà présents (lignes 47-49) :

```typescript
const [cardNumber, setCardNumber] = useState('');
const [cardCVV, setCardCVV] = useState('');
const [cardHolderName, setCardHolderName] = useState('');
```

### Étape 3: Modifier `handlePayment` (ligne 65)

**REMPLACER** toute la fonction `handlePayment` par :

```typescript
const handlePayment = async () => {
  setProcessing(true);
  setError(null);

  try {
    // 🔐 Validation & paiement sécurisé NAPS (si carte)
    if (paymentMethod === 'card') {
      const cardDigits = cardNumber.replace(/\D/g, '');

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

      // Process payment with NAPS API (encrypted - NO REDIRECT)
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
            checkIn: dateRange.checkIn.toISOString().split('T')[0],
            checkOut: dateRange.checkOut.toISOString().split('T')[0],
            guests: `${guests.adults}`,
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

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Le paiement a échoué');
      }

      // Clear card data from memory (sécurité)
      setCardNumber('');
      setCardCVV('');
      setCardExpiry('');
      setCardHolderName('');

      console.log('✅ [CHECKOUT] Paiement réussi!');
    }

    // Create reservation (après paiement ou si cash/transfer)
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
        status: paymentMethod === 'card' ? 'paid' : 'pending',
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

    // Show confirmation (NO REDIRECT - confirmation directe)
    setReservationNumber(result.data.reservationNumber);
    setCurrentStep(2);
    onComplete(result.data.reservationId);
  } catch (err) {
    console.error('Reservation failed:', err);
    setError(err instanceof Error ? err.message : 'Une erreur est survenue');
  } finally {
    setProcessing(false);
  }
};
```

### Étape 4: Binder les inputs de carte

Trouver les inputs de carte (lignes ~360-400) et ajouter les `value` et `onChange` :

```tsx
{/* Numéro de carte */}
<input
  value={cardNumber}
  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
  maxLength={19}
  style={{ fontFamily: 'var(--mono)', letterSpacing: '0.06em' }}
  placeholder="4242 4242 4242 4242"
/>

{/* Expiration */}
<input
  value={cardExpiry}
  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
  maxLength={5}
  placeholder="MM/YY"
/>

{/* CVV */}
<input
  value={cardCVV}
  onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, ''))}
  maxLength={4}
  style={{ fontFamily: 'var(--mono)' }}
  placeholder="•••"
/>

{/* Titulaire */}
<input
  value={cardHolderName}
  onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
  placeholder="NOM DU TITULAIRE"
/>
```

---

## 🎯 Différences Clés

### AVANT (avec redirection NAPS)
```typescript
// Ligne 109-111 (à SUPPRIMER)
if (result.data.paymentUrl) {
  window.location.href = result.data.paymentUrl;
  return;
}
```

### APRÈS (sans redirection)
```typescript
// Paiement sécurisé directement via API
const paymentResult = await processPayment(...);
if (!paymentResult.success) {
  throw new Error(paymentResult.error);
}
// Puis création réservation
// Puis affichage confirmation (setCurrentStep(2))
```

---

## 🔐 Flux de Sécurité

```
1. Utilisateur entre les données de carte
   ↓
2. Validation côté client (Luhn, CVV, expiration)
   ↓
3. Fetch clé publique RSA depuis backend (/api/v1/payments/public-key)
   ↓
4. Chiffrement RSA-OAEP SHA-256 dans le browser (Web Crypto API)
   ↓
5. Envoi données chiffrées au backend
   ↓
6. Backend déchiffre avec clé privée GCP Secret Manager
   ↓
7. Backend appelle NAPS /authorization
   ↓
8. Réponse paiement (success/error)
   ↓
9. Si success: création réservation + affichage confirmation
   ↓
10. Clear données carte de la mémoire browser
```

**✅ AUCUNE REDIRECTION - Tout se passe dans la même page**

---

## 🧪 Comment Tester

### 1. Port-forward backend

```bash
kubectl port-forward -n production svc/srv-reservations 14004:4004
```

### 2. Variables d'environnement

Vérifier `.env.local` :
```bash
NEXT_PUBLIC_API_PAYMENTS_URL=http://localhost:14004/api/v1/payments
NEXT_PUBLIC_API_BASE_URL=http://localhost:14004
```

### 3. Lancer le frontend

```bash
pnpm dev
```

### 4. Tester le flux

1. Aller sur `http://localhost:6001`
2. Sélectionner un listing
3. Choisir dates + guests
4. Cliquer "Réserver"
5. Remplir formulaire voyageur
6. Remplir formulaire carte :
   ```
   Numéro: 5234 5678 9012 3255
   Expiration: 12/25
   CVV: 123
   Titulaire: TEST USER
   ```
7. Cliquer "Payer"
8. Observer les logs console :
   - ✅ Validation carte OK
   - 🔵 Résultat paiement
   - ✅ Paiement réussi
   - 🔵 Envoi réservation
   - Affichage confirmation

### 5. Vérifier logs backend

```bash
kubectl logs -n production -l app=srv-reservations -f | grep -E "PaymentIntent|CardDecryption"
```

Devrait afficher :
```
[CardDecryption GCP] Decryption successful
[PaymentIntent] Card decrypted: {"cardNumberMasked":"523456******3255"...}
[PaymentIntent] Confirming with NAPS
```

---

## 📁 Fichiers Modifiés/Créés

| Fichier | Status | Description |
|---------|--------|-------------|
| `lib/utils/cardEncryption.ts` | ✅ Créé | Chiffrement RSA client |
| `lib/services/paymentService.ts` | ✅ Créé | API paiements |
| `components/checkout/CheckoutFlow.tsx` | ⏳ À modifier | Intégration formulaire |
| `.env.local` | ⏳ À vérifier | Variables API |

---

## ⚠️ Points Importants

1. **Pas de redirection** : Le paiement se fait en AJAX, pas de `window.location.href`
2. **Sécurité** : Les données de carte ne sont jamais stockées, seulement en mémoire le temps du paiement
3. **Clear après paiement** : `setCardNumber(''), setCardCVV(''), etc.` après succès
4. **Validation stricte** : Luhn + CVV + expiration AVANT l'envoi
5. **Logs détaillés** : Console pour debug pendant développement

---

## 🚀 Statut

### Backend ✅
- RSA encryption/decryption fonctionnel
- GCP Secret Manager intégré
- PaymentIntent API opérationnel
- Logs détaillés ajoutés

### Frontend ⏳
- Fichiers créés (`cardEncryption.ts` + `paymentService.ts`)
- `CheckoutFlow.tsx` à modifier (voir instructions ci-dessus)
- Variables d'environnement à vérifier

---

**Next step:** Modifier `CheckoutFlow.tsx` selon les instructions ci-dessus, puis tester avec la carte NAPS.
