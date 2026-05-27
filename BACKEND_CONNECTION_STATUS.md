# 🔌 Connexion Backend - Status

**Date:** 2026-05-27
**Frontend:** http://localhost:6001
**Backend:** https://dev.sojori.com (Production)

---

## ✅ Configuration Actuelle

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=https://dev.sojori.com
```

### API Client (lib/api/client.ts)
URLs mises à jour pour correspondre au backend :
- ✅ `GET /api/v1/listing/listings` → Liste de biens
- ✅ `GET /api/v1/listing/listings/by-id/:id` → Détail d'un bien

---

## 🚧 Situation Backend Production

### Endpoints Testés

#### ❌ `/api/v1/listing/listings` (Liste)
```bash
curl -X GET 'https://dev.sojori.com/api/v1/listing/listings?limit=5'
```
**Résultat:**
```json
{
  "success": false,
  "error": "Session expired, please login again",
  "errorMsg": "no refreshToken send",
  "forceLogout": true
}
```
**Status:** ⚠️ **REQUIERT AUTHENTIFICATION** (Passport JWT + roleAllow)

#### ✅ `/api/v1/listing/listings/by-id/:listingId` (Détail)
**Status:** ✅ **PUBLIC** (auth commentée dans le code - ligne 110-113 de index.ts)

#### ✅ `/api/v1/listing/listing-amenities/:listingId`
**Status:** ✅ **PUBLIC** (pas d'auth middleware)

---

## 🔐 Problème: Authentification Requise

Le backend srv-listing utilise **Passport JWT** avec contrôle de rôles :

```typescript
// apps/srv-listing/src/routes/listing/index.ts:40-46
listingsRouter.get(
  '/',
  authenticateJWT,
  roleAllow([Roles.SuperAdmin, Roles.Admin, Roles.Owner, Roles.Worker]),
  getListings,
)
```

**Tous les endpoints nécessitent** :
- Token JWT valide (accessToken + refreshToken)
- Rôle autorisé (SuperAdmin, Admin, Owner, Worker)
- Pas de Clerk - Passport custom Sojori

---

## 💡 Solutions Possibles

### Option 1: Créer Endpoints Publics (RECOMMANDÉ pour OTA)
Créer des routes publiques sans auth pour l'OTA marketplace :

```typescript
// Nouveau fichier: apps/srv-listing/src/routes/publicListings.ts
import express from 'express';

const publicRouter = express.Router();

// GET /api/v1/listing/public/listings
publicRouter.get('/listings', async (req, res) => {
  // Retourne listings filtrés pour OTA (featured, city, etc.)
  // Pas d'auth requise
});

// GET /api/v1/listing/public/cities
publicRouter.get('/cities', async (req, res) => {
  // Retourne liste villes avec compteurs
});

// GET /api/v1/listing/public/property-managers
publicRouter.get('/property-managers', async (req, res) => {
  // Retourne liste PMs vérifiés
});

export default publicRouter;
```

**Monter dans app.ts** :
```typescript
app.use('/api/v1/listing/public', publicRouter);
```

**Avantages** :
- ✅ Séparation claire public vs admin
- ✅ Pas de risque de casser l'admin
- ✅ Contrôle fin des données exposées
- ✅ Performance (pas de middleware auth)

**Frontend changement minimal** :
```typescript
// lib/api/client.ts
const endpoint = `/api/v1/listing/public/listings${query ? `?${query}` : ''}`;
```

---

### Option 2: Utiliser Mockup (Actuel)
**Status:** ✅ **FONCTIONNEL**

Le système utilise graceful fallback :
1. Tente API backend
2. Si erreur → Utilise données mockup
3. Frontend fonctionne à 100%

**Avantages temporaires** :
- ✅ Aucun changement backend requis
- ✅ Développement frontend continue
- ✅ Prototype fonctionnel pour demo

**Inconvénients** :
- ❌ Pas de données réelles
- ❌ Pas de test de charge backend
- ❌ Pas de synchronisation avec MongoDB

---

### Option 3: Intégrer Clerk Backend
Ajouter middleware Clerk dans srv-listing pour guests OTA :

```typescript
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

// Routes OTA guests avec Clerk
listingsRouter.get(
  '/ota/listings',
  ClerkExpressWithAuth(),
  getListingsForOTA
);
```

**Avantages** :
- ✅ Authentification guests OTA
- ✅ Séparation users admin vs guests
- ✅ Réservations trackées par user

**Inconvénients** :
- ❌ Complexité ajoutée
- ❌ Deux systèmes auth (Passport + Clerk)
- ❌ Non nécessaire pour public listings

---

## 🎯 Recommandation

**Pour OTA Marketplace :**
**→ Option 1 : Créer `/api/v1/listing/public/*` endpoints**

**Justification** :
- Marketplace OTA = contenu public (comme Airbnb, Booking.com)
- Guests consultent listings AVANT de se connecter
- Auth requise uniquement pour réservation
- Performance optimale (pas de middleware auth sur lecture)

**Ordre d'implémentation** :
1. ✅ Créer `publicListings.ts` router
2. ✅ Ajouter endpoints GET public
3. ✅ Monter dans app.ts sous `/api/v1/listing/public`
4. ✅ Mettre à jour frontend client.ts
5. ✅ Tester connexion locale
6. ✅ Déployer backend sur GKE
7. ✅ Tester depuis frontend Vercel

---

## 📊 État Actuel du Frontend

| Page | Status | Données |
|------|--------|---------|
| Homepage | ✅ OK | Mockup |
| Search | ✅ OK | Mockup |
| Listing Detail | ✅ OK | Mockup |
| Checkout | ✅ OK | Mockup |
| Profile | ✅ OK | Mockup |

**Prêt à basculer vers backend** dès que endpoints publics créés.

---

## 🚀 Prochaines Actions

### Immédiat (Backend)
1. Créer fichier `apps/srv-listing/src/routes/publicListings.ts`
2. Implémenter GET /listings (featured, city filters)
3. Implémenter GET /cities (with counts)
4. Implémenter GET /property-managers
5. Monter router dans app.ts
6. Tester en local
7. Commit + Push + Deploy GKE

### Après (Frontend)
8. Mettre à jour URLs dans `lib/api/client.ts`
9. Tester connexion localhost → dev.sojori.com
10. Vérifier fallback mockup si backend fail
11. Deploy Vercel

### Futur (Auth Réservations)
12. Intégrer Clerk backend pour POST /reservations
13. Valider token Clerk dans middleware
14. Créer user Guest dans MongoDB
15. Lier réservation à Guest

---

**Status:** ⏸️ En attente création endpoints publics backend
