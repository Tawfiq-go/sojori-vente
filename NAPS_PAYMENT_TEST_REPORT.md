# 🧪 Rapport de Test NAPS - Flux de Paiement

**Date:** 2026-06-01
**Service:** srv-reservations (production)
**Pod:** srv-reservations-59b5d9f76f-97tp7
**Status:** ⚠️ **Bug trouvé - Fix requis**

---

## 📋 Résumé Exécutif

Le système de paiement NAPS avec chiffrement RSA-OAEP a été déployé en production (Phase 1). Un test complet du flux de paiement a révélé **un bug critique** dans l'endpoint `/api/v1/payments/public-key` qui empêche le chiffrement côté client de fonctionner.

---

## 🎯 Ce qui a été testé

### 1. Configuration NAPS Test ✅

**Environnement de test NAPS récupéré:**
- URL Gateway: `https://gwapi.naps.ma:8085/`
- Merchant ID: `1010101`
- Gallery ID: `9999`
- Clés RSA configurées (publique + privée)

**Carte de test NAPS:**
```
Numéro:     5234567890123255
Expiration: 12/25
CVV:        123
Type:       MasterCard
Status:     Approuvé (code 00)
```

### 2. Service Backend ✅

- ✅ Pod `srv-reservations` running (13h uptime)
- ✅ Port-forward fonctionnel (localhost:14004)
- ✅ Health check OK
- ✅ GCP Secret Manager intégré
- ✅ Code de chiffrement/déchiffrement présent

### 3. Script de Test Créé ✅

Script Node.js complet: `test-naps-payment-flow.js`

**Ce que le script teste:**
1. Récupération de la clé publique RSA (`/api/v1/payments/public-key`)
2. Chiffrement des données de carte avec RSA-OAEP SHA-256
3. Création d'un PaymentIntent (`POST /api/v1/payments/intents`)
4. Confirmation du paiement avec carte chiffrée (`POST /api/v1/payments/intents/:id/confirm`)

---

## 🐛 Bug Trouvé

### Symptôme

L'endpoint `/api/v1/payments/public-key` retourne une clé publique vide:

```json
{
  "success": true,
  "data": {
    "publicKey": {},  // ❌ Vide au lieu d'une string PEM
    "algorithm": "RSA-OAEP",
    "hash": "SHA-256"
  }
}
```

### Cause Racine

**Fichier:** `apps/srv-reservations/src/payments/routes/paymentIntents.ts`
**Ligne:** 108

```typescript
router.get('/public-key', async (req, res) => {
  try {
    const publicKey = getPublicKey()  // ❌ MANQUE await
    //                 ^^^^^^^^^^^^^^
    // getPublicKey() est une fonction async qui retourne Promise<string>
    // Sans await, publicKey = Promise { <pending> }
```

### Impact

- ❌ **Critique:** Empêche tout le flux de paiement sécurisé de fonctionner
- ❌ Le frontend ne peut pas chiffrer les données de carte
- ❌ Aucun paiement ne peut être traité avec la méthode sécurisée

---

## 🔧 Solution

### Fix Requis

**Fichier:** `apps/srv-reservations/src/payments/routes/paymentIntents.ts`
**Ligne:** 108

```diff
router.get('/public-key', async (req, res) => {
  try {
-   const publicKey = getPublicKey()
+   const publicKey = await getPublicKey()

    return res.json({
      success: true,
      data: {
        publicKey,
        algorithm: 'RSA-OAEP',
        hash: 'SHA-256',
      },
    })
  } catch (error) {
```

### Étapes pour Déployer le Fix

```bash
# 1. Aller dans le repo backend
cd ~/sojori-production/apps/srv-reservations

# 2. Appliquer le fix
# Éditer src/payments/routes/paymentIntents.ts ligne 108

# 3. Rebuild
pnpm build

# 4. Redéployer
kubectl rollout restart deployment srv-reservations -n production

# 5. Attendre le nouveau pod
kubectl rollout status deployment srv-reservations -n production

# 6. Re-tester
node ~/sojori-vente/test-naps-payment-flow.js http://localhost:14004
```

---

## 📊 Résultats Attendus Après le Fix

Une fois le fix déployé, l'endpoint devrait retourner:

```json
{
  "success": true,
  "data": {
    "publicKey": "-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqh...",
    "algorithm": "RSA-OAEP",
    "hash": "SHA-256"
  }
}
```

Et le script de test devrait afficher:

```
========================================
  ✅ TEST RÉUSSI!
========================================

[1/4] Récupération de la clé publique RSA
✅ Clé publique récupérée (451 caractères)

[2/4] Chiffrement des données de carte
✅ Carte chiffrée (512 caractères)

[3/4] Création du PaymentIntent
✅ PaymentIntent créé: PI_xxxxxxxxxxxxxxxxxxxxx

[4/4] Confirmation du paiement
✅ Paiement confirmé!
```

---

## 🧪 Comment Tester

### Test Automatique

```bash
# Port-forward vers le service
kubectl port-forward -n production svc/srv-reservations 14004:4004 &

# Lancer le script de test
node test-naps-payment-flow.js
```

### Test Manuel (Postman)

**1. GET Public Key**
```
GET http://localhost:14004/api/v1/payments/public-key
```

Devrait retourner la clé RSA en format PEM.

**2. POST Create PaymentIntent**
```
POST http://localhost:14004/api/v1/payments/intents
Content-Type: application/json

{
  "amount": 15000,
  "currency": "504",
  "context": {
    "type": "reservation",
    "referenceId": "TEST_001"
  },
  "guest": {
    "firstName": "Mohamed",
    "lastName": "Alami",
    "email": "test@sojori.com",
    "phone": "+212600000000"
  }
}
```

**3. POST Confirm Payment**
```
POST http://localhost:14004/api/v1/payments/intents/:id/confirm
Content-Type: application/json

{
  "encryptedCardData": "base64_encrypted_card_data_here"
}
```

---

## 📁 Fichiers Créés

| Fichier | Description | Taille |
|---------|-------------|--------|
| `test-naps-payment-flow.js` | Script de test complet du flux NAPS | 250 lignes |
| `NAPS_PAYMENT_TEST_REPORT.md` | Ce rapport | - |

---

## 🔍 Informations Additionnelles

### Architecture Actuelle

```
Frontend (Browser)
  ↓ GET /public-key
Backend (srv-reservations)
  ↓ Fetch from GCP Secret Manager
GCP Secret Manager
  └─ PAYMENT_PUBLIC_KEY (RSA 4096 bits)
```

### Flux de Paiement Complet

```
1. Frontend: GET /public-key
   → Backend: Return RSA public key

2. Frontend: Encrypt card data
   → Browser: RSA-OAEP SHA-256 encryption

3. Frontend: POST /intents
   → Backend: Create PaymentIntent

4. Frontend: POST /intents/:id/confirm
   → Backend: Decrypt card data
   → Backend: Call NAPS /authorization
   → NAPS: Process payment
   → Backend: Return result
```

### Secrets GCP Requis

```bash
# Vérifier que les secrets existent
gcloud secrets list --filter="name:PAYMENT"

# Secrets requis:
# - PAYMENT_PUBLIC_KEY
# - PAYMENT_PRIVATE_KEY
# - NAPS_API_BASE_URL
# - NAPS_CMR
# - NAPS_GALERIE
# - NAPS_PUB_KEY
# - NAPS_PRIV_KEY
```

---

## 🚀 Prochaines Étapes

### Priorité 1: Corriger le Bug ⚠️

1. [ ] Appliquer le fix (await getPublicKey())
2. [ ] Rebuild backend
3. [ ] Redéployer en production
4. [ ] Re-tester avec le script

### Priorité 2: Tester le Flux Complet

5. [ ] Tester récupération clé publique
6. [ ] Tester création PaymentIntent
7. [ ] Tester confirmation paiement avec carte test NAPS
8. [ ] Vérifier logs NAPS

### Priorité 3: Intégration Frontend

9. [ ] Copier `cardEncryption.ts` dans sojori-vente
10. [ ] Créer composant `PaymentForm.tsx`
11. [ ] Intégrer dans la page checkout
12. [ ] Test E2E complet

---

## 📞 Support

**Documentation:**
- Guide NAPS: `docs/payment/NAPS_QUICK_REFERENCE.md`
- Config test: `docs/payment/.private-naps-api-docs/`
- Carte test: `docs/payment/.private-naps-api-docs/Carte_test.xlsx`

**Commandes Utiles:**
```bash
# Logs en temps réel
kubectl logs -n production -l app=srv-reservations -f

# Redémarrer le service
kubectl rollout restart deployment srv-reservations -n production

# Vérifier secrets GCP
kubectl get secret srv-reservations-secrets -n production -o yaml
```

---

**Créé le:** 2026-06-01
**Par:** Claude Code (Sonnet 4.5)
**Status:** Bug identifié, fix requis avant tests complets
