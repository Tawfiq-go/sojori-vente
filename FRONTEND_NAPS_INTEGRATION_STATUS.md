# 🎉 Statut Intégration NAPS Frontend

**Date:** 2026-06-02
**Status:** ✅ **FRONTEND PRÊT - Backend en attente**

---

## ✅ Ce Qui Est Fait (Frontend)

### 1. **Chiffrement RSA Client** ✅
📁 `/lib/utils/cardEncryption.ts`

**Fonctionnalités:**
- Chiffrement RSA-OAEP SHA-256 (Web Crypto API)
- Validation Luhn pour numéro de carte
- Validation CVV (3-4 chiffres)
- Validation expiration (MM/YY)
- Formatage automatique (XXXX XXXX XXXX XXXX)
- Masking carte (******1234)
- Détection marque carte (Visa, Mastercard, Amex, Discover)

**Fonctions disponibles:**
```typescript
encryptCardData(cardData, publicKey) → Promise<string>
validateCardNumber(number) → boolean
validateCVV(cvv) → boolean
validateExpiry(month, year) → boolean
formatCardNumber(value) → string
formatExpiry(value) → string
getCardBrand(number) → string
maskCardNumber(number) → string
```

---

### 2. **Service de Paiement** ✅
📁 `/lib/services/paymentService.ts`

**API disponibles:**
```typescript
getPublicKey() → Promise<string>
  // GET /api/v1/payments/public-key

createPaymentIntent(request) → Promise<PaymentIntent>
  // POST /api/v1/payments/intents

confirmPayment(intentId, cardData) → Promise<ConfirmPaymentResult>
  // POST /api/v1/payments/intents/{id}/confirm

getPaymentIntent(intentId) → Promise<PaymentIntent>
  // GET /api/v1/payments/intents/{id}

processPayment(request, cardData) → Promise<ConfirmPaymentResult>
  // Combine create + confirm
```

**Gestion automatique:**
- Récupération clé publique
- Chiffrement carte
- Détection 3DS (`requiresAction`, `actionUrl`)
- Gestion erreurs

---

### 3. **Page de Retour 3DS** ✅
📁 `/app/checkout/return/page.tsx`

**Fonctionnalités:**
- Récupère `pendingPaymentIntent` du localStorage
- Vérifie statut PaymentIntent
- Poll réservation créée par webhook (5 tentatives, 1s intervalle)
- Affiche confirmation avec numéro réservation
- Gère cas d'erreur
- Gère cas "en cours de traitement" (webhook lent)
- Animation de chargement
- Clear localStorage après succès

**URL de retour:**
```
https://sojori.com/checkout/return
  ?status=success
  &transactionId=txn_naps_456
```

---

### 4. **Documentation Complète** ✅

#### 📄 `NAPS_INTEGRATION_FINAL.md`
- Instructions originales pour intégration sans 3DS
- Code complet pour CheckoutFlow.tsx
- Guide de test
- Flux de sécurité RSA

#### 📄 `NAPS_3DS_ARCHITECTURE.md`
- Architecture complète avec 3D Secure
- Flux détaillé (8 étapes)
- Diagrammes
- Exemples backend webhook
- Gestion métadonnées
- Job de réconciliation

#### 📄 `CHECKOUT_3DS_MODIFICATIONS.md`
- Instructions précises pour modifier CheckoutFlow.tsx
- Code complet de `handlePayment` avec 3DS
- Points clés
- Guide de test

---

## ⏳ Ce Qui Reste à Faire

### Frontend

#### 1. **Appliquer modifications CheckoutFlow.tsx** ⏳
📁 `/components/checkout/CheckoutFlow.tsx`

**Action:** Remplacer fonction `handlePayment` selon `CHECKOUT_3DS_MODIFICATIONS.md`

**Points clés:**
```typescript
// Ajouter gestion 3DS
if (paymentResult.requiresAction && paymentResult.actionUrl) {
  localStorage.setItem('pendingPaymentIntent', paymentResult.data.id);
  window.location.href = paymentResult.actionUrl;
  return;
}

// Ajouter métadonnées complètes dans PaymentIntent
metadata: {
  listingId,
  checkIn,
  checkOut,
  guests,
  children,
  infants,
  baseNights,
  basePrice,
  // ... tout le pricing
}
```

---

### Backend (Prioritaire)

#### 2. **Endpoint: Récupérer Réservation par PaymentIntent** ⏳
📁 `/Users/gouacht/sojori-production/apps/srv-reservations/src/reservations/routes/reservations.ts`

**À créer:**
```typescript
router.get('/reservations/by-payment/:intentId', async (req, res) => {
  const { intentId } = req.params;

  const paymentIntent = await PaymentIntent.findOne({ id: intentId });
  if (!paymentIntent || !paymentIntent.reservationId) {
    return res.status(404).json({
      success: false,
      error: 'Reservation not found for this payment'
    });
  }

  const reservation = await Reservation.findById(paymentIntent.reservationId);
  return res.json({
    success: true,
    data: reservation
  });
});
```

**Utilisé par:** Page de retour 3DS pour afficher confirmation

---

#### 3. **Webhook NAPS** ⏳ (CRITIQUE)
📁 `/Users/gouacht/sojori-production/apps/srv-reservations/src/payments/routes/webhooks.ts`

**À créer:**
```typescript
router.post('/webhooks/naps', async (req, res) => {
  const { transactionId, status, responseCode, authorizationCode } = req.body;

  // 1. Trouver PaymentIntent par transactionId
  const paymentIntent = await PaymentIntent.findOne({
    'providerData.transactionId': transactionId
  });

  // 2. Update status
  if (status === 'APPROVED' && responseCode === '00') {
    paymentIntent.status = 'succeeded';
    await paymentIntent.save();

    // 3. ⚡ CRÉER RÉSERVATION (avec metadata du PaymentIntent)
    const reservation = await createReservationFromPayment(paymentIntent);

    // 4. Lier réservation au paiement
    paymentIntent.reservationId = reservation._id;
    await paymentIntent.save();

    // 5. Envoyer email confirmation
    await sendConfirmationEmail(paymentIntent.guest.email, reservation);
  }

  return res.json({ success: true });
});
```

**Appelé par:** NAPS après validation 3DS (ou paiement direct)

**URL webhook à configurer dans NAPS:**
```
https://api.sojori.com/api/v1/payments/webhooks/naps
```

---

#### 4. **Service: Créer Réservation depuis PaymentIntent** ⏳
📁 `/Users/gouacht/sojori-production/apps/srv-reservations/src/reservations/services/reservationService.ts`

**À créer:**
```typescript
export async function createReservationFromPayment(
  paymentIntent: PaymentIntent
): Promise<Reservation> {
  const metadata = paymentIntent.metadata;
  const guest = paymentIntent.guest;

  return await Reservation.create({
    listingId: metadata.listingId,
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
      total: paymentIntent.amount / 100,
    },
    payment: {
      method: 'card',
      status: 'paid',
      intentId: paymentIntent.id,
    },
    status: 'confirmed',
  });
}
```

**Utilisé par:** Webhook NAPS + Job de réconciliation

---

#### 5. **Job de Réconciliation** ⏳ (Backup)
📁 `/Users/gouacht/sojori-production/apps/srv-reservations/src/jobs/reconcileOrphanedPayments.ts`

**À créer:**
```typescript
async function reconcileOrphanedPayments() {
  // Trouve PaymentIntents succeeded sans réservation
  const orphanedPayments = await PaymentIntent.find({
    status: 'succeeded',
    reservationId: { $exists: false },
    createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // 30 min
  });

  for (const payment of orphanedPayments) {
    try {
      const reservation = await createReservationFromPayment(payment);
      payment.reservationId = reservation._id;
      await payment.save();

      await sendConfirmationEmail(payment.guest.email, reservation);

      console.log(`✅ [Reconciliation] Created reservation ${reservation.reservationNumber}`);
    } catch (error) {
      console.error(`❌ [Reconciliation] Failed for payment ${payment.id}:`, error);
      await sendSlackAlert(`Manual intervention required: ${payment.id}`);
    }
  }
}

// Lancer toutes les 5 minutes
setInterval(reconcileOrphanedPayments, 5 * 60 * 1000);
```

**But:** Créer réservations manquées (webhook échoué, connexion perdue, etc.)

---

#### 6. **Notification Slack (Optionnel)** ⏳
📁 `/Users/gouacht/sojori-production/apps/srv-reservations/src/notifications/slackService.ts`

**À créer:**
```typescript
export async function sendSlackAlert(message: string) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `⚠️ NAPS Payment Alert: ${message}`
    })
  });
}
```

**Utilité:** Alerter l'équipe en cas de paiement orphelin

---

## 📊 Tableau Récapitulatif

| Fichier | Status | Priorité | Description |
|---------|--------|----------|-------------|
| `lib/utils/cardEncryption.ts` | ✅ Créé | - | Chiffrement RSA client |
| `lib/services/paymentService.ts` | ✅ Créé | - | API paiements |
| `app/checkout/return/page.tsx` | ✅ Créé | - | Page retour 3DS |
| `NAPS_3DS_ARCHITECTURE.md` | ✅ Créé | - | Doc architecture |
| `CHECKOUT_3DS_MODIFICATIONS.md` | ✅ Créé | - | Instructions modifications |
| `components/checkout/CheckoutFlow.tsx` | ⏳ À modifier | 🔴 Haute | Ajouter gestion 3DS |
| Backend: `/reservations/by-payment/:id` | ⏳ À créer | 🔴 Haute | Endpoint récup réservation |
| Backend: `/webhooks/naps` | ⏳ À créer | 🔴 Critique | Webhook NAPS |
| Backend: `createReservationFromPayment()` | ⏳ À créer | 🔴 Critique | Service création résa |
| Backend: Job réconciliation | ⏳ À créer | 🟡 Moyenne | Backup webhook |
| Backend: Slack alerts | ⏳ À créer | 🟢 Basse | Notifications équipe |

---

## 🧪 Plan de Test

### Phase 1: Sans 3DS (Test Initial)
```bash
# 1. Port-forward backend
kubectl port-forward -n production svc/srv-reservations 14004:4004

# 2. Lancer frontend
cd /Users/gouacht/sojori-vente
pnpm dev

# 3. Tester avec carte test NAPS
http://localhost:6001
→ Sélectionner listing
→ Remplir formulaire
→ Carte: 5234567890123255, 12/25, 123
→ Payer

# 4. Vérifier logs
✅ Validation carte OK
✅ Paiement réussi (no 3DS)
✅ Réservation créée
✅ Affichage confirmation
```

### Phase 2: Avec 3DS (Après Backend)
```bash
# 1. Tester avec carte 3DS (si disponible)
# 2. Vérifier redirect vers page NAPS
# 3. Valider 3DS
# 4. Vérifier webhook crée réservation
# 5. Vérifier redirect vers /checkout/return
# 6. Vérifier affichage confirmation
```

### Phase 3: Tests Edge Cases
```bash
# 1. User ferme onglet pendant 3DS
#    → Job réconciliation crée réservation

# 2. Webhook échoue
#    → Job réconciliation crée réservation
#    → Alert Slack

# 3. Connexion perdue après paiement
#    → Job réconciliation + email confirmation
```

---

## 🔐 Variables d'Environnement

### Frontend `.env.local`
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:14004
NEXT_PUBLIC_API_PAYMENTS_URL=http://localhost:14004/api/v1/payments
```

### Backend (Production)
```bash
# GCP Secret Manager
NAPS_PUBLIC_KEY_SECRET=projects/.../secrets/naps-rsa-public-key
NAPS_PRIVATE_KEY_SECRET=projects/.../secrets/naps-rsa-private-key

# NAPS API
NAPS_API_URL=https://api.naps.ma
NAPS_MERCHANT_ID=...
NAPS_API_KEY=...

# Webhook (optionnel)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

---

## 🚀 Prochaines Étapes

### Immédiat (Frontend)
1. ✅ Appliquer modifications `CheckoutFlow.tsx` selon `CHECKOUT_3DS_MODIFICATIONS.md`
2. ✅ Tester flow sans 3DS avec backend prod

### Urgent (Backend)
1. 🔴 Créer endpoint `/reservations/by-payment/:intentId`
2. 🔴 Créer webhook `/webhooks/naps`
3. 🔴 Créer service `createReservationFromPayment()`
4. 🔴 Tester webhook avec NAPS test environment

### Important (Backend)
5. 🟡 Créer job de réconciliation
6. 🟡 Configurer URL webhook dans NAPS dashboard
7. 🟡 Ajouter alertes Slack

### Tests (Frontend + Backend)
8. 🧪 Test complet sans 3DS
9. 🧪 Test complet avec 3DS
10. 🧪 Test edge cases (connexion perdue, webhook échoué, etc.)

---

## 📞 Support

**Documentation:**
- `NAPS_3DS_ARCHITECTURE.md` - Architecture complète
- `CHECKOUT_3DS_MODIFICATIONS.md` - Instructions CheckoutFlow
- `NAPS_INTEGRATION_FINAL.md` - Guide intégration original

**Carte Test:**
- Numéro: `5234567890123255`
- Expiration: `12/25`
- CVV: `123`

**Logs Backend:**
```bash
kubectl logs -n production -l app=srv-reservations -f | grep -E "PaymentIntent|CardDecryption|Webhook"
```

---

**✅ Frontend prêt - En attente backend webhook + endpoints**
