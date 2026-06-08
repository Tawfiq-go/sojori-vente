# 🧪 GUIDE DE TEST E2E - SOJORI VENTE

**Date:** 2026-05-29
**Version:** 1.0
**Flow complet:** DateRangePicker → Checkout → Réservation → Payment NAPS

---

## 🎯 Objectif

Tester le flow complet de réservation de bout en bout avec:
- ✅ Prix dynamiques (API)
- ✅ Blocked dates (vraies réservations)
- ✅ Validation double-booking
- ✅ Création réservation en DB
- ✅ Génération lien paiement NAPS

---

## 📋 Prérequis

### Services actifs
```bash
# Vérifier que les services tournent
kubectl get pods -n production | grep "srv-listing\|srv-reservations"

# Devrait montrer:
# srv-listing-xxx         Running
# srv-reservations-xxx    Running
```

### Frontend local
```bash
cd /Users/gouacht/sojori-vente
pnpm dev

# Ouvrir: http://localhost:6001
```

### Variables d'environnement
```bash
# Vérifier .env.local
NEXT_PUBLIC_API_BASE_URL=https://api.sojori.com
```

---

## 🧪 TEST 1: Prix Dynamiques

### Objectif
Vérifier que les prix viennent bien de l'API et non hardcodés.

### Steps
1. Ouvrir http://localhost:6001/demo-mvp
2. Sélectionner check-in: **15 juin 2026** (lundi)
3. Sélectionner check-out: **20 juin 2026** (samedi)

### Résultat attendu
```
Nuits semaine: 3 nuits × 185 MAD = 555 MAD
Nuits weekend: 2 nuits × 240 MAD = 480 MAD
Sous-total: 1035 MAD
Frais service (10%): 104 MAD
Taxe (3%): 31 MAD
TOTAL: 1170 MAD
```

### Vérification
- ✅ Prix changent selon dates sélectionnées
- ✅ Weekend (ven-sam) = 240 MAD
- ✅ Semaine = 185 MAD
- ✅ Frais calculés automatiquement

### Debug si échec
```bash
# Logs srv-listing
kubectl logs -n production $(kubectl get pods -n production | grep srv-listing | awk '{print $1}') | tail -50

# Chercher: "[publicListings] Got pricing"
```

---

## 🧪 TEST 2: Blocked Dates

### Objectif
Vérifier que les dates réservées sont bien bloquées.

### Steps préparatoires
```bash
# 1. Créer une réservation test via MongoDB
mongo

use srv-reservations-db

db.reservations.insertOne({
  sojoriId: ObjectId("6765ba9c351665002ef47726"),
  reservationNumber: "TEST-2026-0001",
  arrivalDate: ISODate("2026-06-25"),
  departureDate: ISODate("2026-06-30"),
  status: "confirmed",
  paymentStatus: "paid",
  guestFirstName: "Test",
  guestLastName: "Blocked",
  guestEmail: "test@blocked.com",
  phone: "+212600000000",
  adults: 2,
  children: 0,
  nights: 5,
  totalPrice: 1200,
  currency: "MAD",
  channelId: "test",
  source: "test",
  channelName: "Test",
  messages_status: "not_sent",
  staging: false,
  createdAt: new Date()
})
```

### Steps test
1. Ouvrir http://localhost:6001/demo-mvp
2. Observer le calendrier
3. Les dates **25-29 juin** doivent être **grises/bloquées**
4. Essayer de sélectionner 25 juin → doit être impossible

### Résultat attendu
- ✅ Dates 25-29 juin = grisées
- ✅ Impossible de cliquer dessus
- ✅ Tooltip "Indisponible"

### Vérification API directe
```bash
curl "https://api.sojori.com/api/v1/listing/public/listings/6765ba9c351665002ef47726/availability?from=2026-06-01&to=2026-07-01"

# Devrait retourner:
{
  "success": true,
  "data": {
    "blockedDates": ["2026-06-25", "2026-06-26", "2026-06-27", "2026-06-28", "2026-06-29"]
  }
}
```

### Debug si échec
```bash
# Logs srv-listing
kubectl logs -n production $(kubectl get pods -n production | grep srv-listing | awk '{print $1}') | grep "blocked"

# Logs srv-reservations
kubectl logs -n production $(kubectl get pods -n production | grep srv-reservations | awk '{print $1}') | grep "getBlockedDates"
```

---

## 🧪 TEST 3: Validation Double-Booking

### Objectif
Vérifier qu'on ne peut pas réserver des dates déjà prises.

### Steps
1. Sélectionner dates: **25 juin → 30 juin** (dates bloquées du TEST 2)
2. Remplir formulaire voyageur:
   - Prénom: Jean
   - Nom: Dupont
   - Email: jean@test.com
   - Tél: +212612345678
3. Cliquer "Payer"

### Résultat attendu
```
❌ Erreur: "Ces dates ne sont plus disponibles"
Code: DATES_NOT_AVAILABLE
Message: "Une autre réservation vient d'être faite pour ces dates"
```

### Vérification
- ✅ Message d'erreur rouge
- ✅ Réservation PAS créée
- ✅ User reste sur page checkout

### Debug si échec
```bash
kubectl logs -n production $(kubectl get pods -n production | grep srv-reservations | awk '{print $1}') | grep "Double-booking"
```

---

## 🧪 TEST 4: Création Réservation Réussie

### Objectif
Créer une vraie réservation et vérifier qu'elle apparaît en DB.

### Steps
1. Sélectionner dates **LIBRES**: **15 juin → 20 juin**
2. Remplir formulaire:
   - Prénom: **Jean**
   - Nom: **Dupont**
   - Email: **jean@test.com**
   - Tél: **+212612345678**
3. Choisir paiement: **"Payer plus tard"**
4. Cliquer "Payer 1170 MAD"

### Résultat attendu
```
✅ Confirmation:
Numéro réservation: SOJORI-2026-XXXX
Status: Confirmée
Email envoyé à jean@test.com
```

### Vérification en DB
```bash
mongo srv-reservations-db

db.reservations.find({
  guestEmail: "jean@test.com"
}).sort({ createdAt: -1 }).limit(1).pretty()

# Devrait montrer:
# - reservationNumber: SOJORI-2026-XXXX
# - status: "confirmed"
# - paymentStatus: "unpaid"
# - arrivalDate: 2026-06-15
# - departureDate: 2026-06-20
# - totalPrice: 1170
```

### Debug si échec
```bash
kubectl logs -n production $(kubectl get pods -n production | grep srv-reservations | awk '{print $1}') | grep "GUEST_RESERVATION"
```

---

## 🧪 TEST 5: Paiement NAPS (Card)

### Objectif
Tester génération lien NAPS et redirect.

### Steps
1. Sélectionner dates: **22 juin → 27 juin**
2. Remplir formulaire voyageur
3. Choisir paiement: **"Carte bancaire"**
4. Cliquer "Payer"

### Résultat attendu
```
1. Réservation créée (status: pending)
2. Redirect vers URL NAPS:
   https://test.naps.ma/payment/XXXXXX
3. Page NAPS s'ouvre avec formulaire CB
```

### Carte de test NAPS
```
Numéro: 5457 8400 0000 0125
Expiration: 12/25
CVV: 123
3D Secure code: 123456
```

### Vérification
- ✅ Redirect automatique vers NAPS
- ✅ Formulaire de paiement s'affiche
- ✅ Peut entrer carte de test
- ✅ Après paiement → redirect vers `/reservations/:id/success`

### Vérification DB après paiement
```bash
mongo srv-reservations-db

db.reservations.find({
  guestEmail: "jean@test.com"
}).sort({ createdAt: -1 }).limit(1).pretty()

# Après callback NAPS:
# - status: "confirmed"
# - paymentStatus: "paid"
# - paymentLink: "https://test.naps.ma/..."
```

### Debug si échec
```bash
# Vérifier génération lien NAPS
kubectl logs -n production $(kubectl get pods -n production | grep srv-reservations | awk '{print $1}') | grep "NAPS payment link"

# Vérifier callback NAPS
kubectl logs -n production $(kubectl get pods -n production | grep srv-reservations | awk '{print $1}') | grep "naps/callback"
```

---

## 🧪 TEST 6: API Directe (cURL)

### 6.1 Test Availability API

```bash
curl -X GET "https://api.sojori.com/api/v1/listing/public/listings/6765ba9c351665002ef47726/availability?from=2026-06-01&to=2026-12-01"
```

**Résultat attendu:**
```json
{
  "success": true,
  "data": {
    "listingId": "6765ba9c351665002ef47726",
    "listingName": "Riad de la Bahia",
    "blockedDates": ["2026-06-25", "2026-06-26", ...],
    "minNights": 3,
    "maxNights": 30
  }
}
```

### 6.2 Test Pricing API

```bash
curl -X GET "https://api.sojori.com/api/v1/listing/public/listings/6765ba9c351665002ef47726/pricing?checkIn=2026-06-15&checkOut=2026-06-20&guests=2"
```

**Résultat attendu:**
```json
{
  "success": true,
  "data": {
    "baseNights": 3,
    "basePrice": 555,
    "weekendNights": 2,
    "weekendPrice": 480,
    "subtotal": 1035,
    "serviceFee": 104,
    "tax": 31,
    "total": 1170
  }
}
```

### 6.3 Test Create Reservation API

```bash
curl -X POST "https://api.sojori.com/api/v1/guest/reservations" \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "6765ba9c351665002ef47726",
    "checkIn": "2026-07-01",
    "checkOut": "2026-07-05",
    "guests": {
      "adults": 2,
      "children": 0,
      "infants": 0
    },
    "traveler": {
      "firstName": "Test",
      "lastName": "API",
      "email": "test@api.com",
      "phone": "+212600000000"
    },
    "pricing": {
      "baseNights": 3,
      "basePrice": 555,
      "weekendNights": 1,
      "weekendPrice": 240,
      "subtotal": 795,
      "serviceFee": 80,
      "tax": 24,
      "total": 899
    },
    "payment": {
      "method": "later"
    }
  }'
```

**Résultat attendu:**
```json
{
  "success": true,
  "data": {
    "reservationId": "...",
    "reservationNumber": "SOJORI-2026-XXXX",
    "status": "confirmed",
    "paymentStatus": "unpaid",
    "paymentUrl": null
  }
}
```

---

## 📊 Checklist Complète

### Backend APIs
- [ ] GET /availability retourne blockedDates
- [ ] GET /pricing calcule correctement base + weekend
- [ ] POST /guest/reservations crée réservation
- [ ] Double-booking validation fonctionne
- [ ] NAPS link généré si method=card
- [ ] Callback NAPS met à jour paymentStatus

### Frontend
- [ ] DateRangePicker appelle /availability au load
- [ ] DateRangePicker appelle /pricing quand dates sélectionnées
- [ ] Dates bloquées sont grises/non cliquables
- [ ] CheckoutFlow appelle /guest/reservations
- [ ] Erreur affichée si dates indisponibles
- [ ] Confirmation affiche vrai numéro réservation
- [ ] Redirect NAPS si method=card

### Database
- [ ] Réservation créée dans MongoDB
- [ ] reservationNumber format SOJORI-YYYY-XXXX
- [ ] status = confirmed ou pending
- [ ] paymentStatus = unpaid
- [ ] paymentLink rempli si NAPS

---

## 🐛 Troubleshooting

### Problème: Blocked dates vides
```bash
# Vérifier que srv-reservations est accessible depuis srv-listing
kubectl exec -n production $(kubectl get pods -n production | grep srv-listing | awk '{print $1}') -- curl -s http://srv-reservations:4004/health
```

### Problème: Prix toujours 0
```bash
# Vérifier env var NEXT_PUBLIC_API_BASE_URL
echo $NEXT_PUBLIC_API_BASE_URL

# Dans browser console:
console.log(process.env.NEXT_PUBLIC_API_BASE_URL)
```

### Problème: NAPS link pas généré
```bash
# Vérifier secrets GCP
kubectl get secret naps-secrets -n production -o yaml | grep apiKey

# Vérifier logs NAPS
kubectl logs -n production $(kubectl get pods -n production | grep srv-reservations | awk '{print $1}') | grep MXGateway
```

### Problème: Double-booking pas détecté
```bash
# Vérifier query MongoDB
mongo srv-reservations-db --eval 'db.reservations.find({sojoriId: ObjectId("6765ba9c351665002ef47726"), status: {$in: ["confirmed", "pending"]}}).count()'
```

---

## ✅ Critères de Succès

**Le test E2E est réussi si:**

1. ✅ Prix dynamiques affichés (pas 185/240 hardcodé)
2. ✅ Dates réservées sont bloquées visuellement
3. ✅ Impossible de réserver dates bloquées (erreur 409)
4. ✅ Réservation créée en MongoDB avec vrai numéro
5. ✅ Link NAPS généré si paiement card
6. ✅ Redirect NAPS fonctionne
7. ✅ Callback NAPS met à jour status

---

**Créé le:** 2026-05-29
**Par:** Claude Code (Sonnet 4.5)
**Temps estimé:** 30-45 minutes pour tests complets

🧪 **Happy testing!**
