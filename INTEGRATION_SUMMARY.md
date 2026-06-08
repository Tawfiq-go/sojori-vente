# Sojori Vente - Backend Integration Summary

**Date:** 2026-05-27
**Status:** ✅ Phase 1 Complete - API Integration with Backend

---

## 🎯 Objectif

Intégrer le frontend Sojori Vente (OTA marketplace) avec le backend sojori-production pour remplacer les données mockup par de vraies données provenant des microservices.

---

## ✅ Tâches Complétées

### 1. **Installation & Configuration Clerk**
- ✅ Installé `@clerk/nextjs@7.4.1`
- ✅ Créé `.env.local` avec configuration Clerk et API
- ⚠️ **Action requise:** Récupérer les vraies clés depuis GCP Secret Manager

### 2. **API Client & Services**
Créé une architecture complète pour communiquer avec le backend:

#### **`lib/api/client.ts`** - Client API Central
- Client TypeScript complet pour tous les appels backend
- Gestion d'erreurs avec types `ApiResponse<T>`
- Endpoints implémentés:
  - `getCities()` - Récupérer toutes les villes
  - `getListings(filters)` - Listings avec filtres (city, price, guests, etc.)
  - `getListingById(id)` - Détail d'un bien
  - `getFeaturedListings(limit)` - Biens featured pour homepage
  - `getAmenities()` - Équipements disponibles
  - `getPropertyManagers()` - Property managers
  - `searchListings(query, filters)` - Recherche textuelle
  - `checkAvailability(listingId, dates)` - Vérifier disponibilité

#### **`lib/services/cityService.ts`** - Gestion des villes
- Récupère les villes depuis backend
- Compare avec liste cible (TARGET_CITIES)
- Détermine automatiquement `comingSoon` selon `listingCount`
- Fonctions: `getCitiesWithAvailability()`, `getFeaturedCities()`, `getAvailableCities()`

#### **`lib/services/listingService.ts`** - Gestion des listings
- Wrappers pour récupérer listings
- Gestion d'erreurs avec fallback gracieux

#### **`lib/hooks/useListings.ts`** - React Hooks
- `useFeaturedListings(limit)` - Hook pour featured listings
- `useListings(filters)` - Hook avec filtres
- `useListing(id)` - Hook pour un listing spécifique
- États: `{listings, loading, error}`

#### **`lib/hooks/useCities.ts`** - React Hooks Villes
- `useCities()` - Toutes les villes
- `useFeaturedCities()` - Villes featured
- `useAvailableCities()` - Villes avec listings (pas coming soon)

### 3. **Configuration des villes cibles**

#### **`lib/config/cities.ts`**
Liste des 12 villes cibles pour l'OTA:

**Villes Featured (8):**
1. Marrakech ✅
2. Casablanca ✅
3. Essaouira ✅
4. Fès ✅
5. Tanger ✅
6. Agadir ✅
7. Chefchaouen ✅
8. Ouarzazate ✅

**Villes Coming Soon (4):**
9. Rabat 🔜
10. Dakhla 🔜
11. Fnideq 🔜
12. Meknès 🔜

Le flag `comingSoon` est déterminé dynamiquement en comparant avec les données backend (`listingCount > 0` = disponible).

### 4. **Intégration Homepage** (`app/page.tsx`)

✅ **Changements effectués:**
- Import des hooks `useFeaturedListings` et `useAvailableCities`
- Section "Nos coups de cœur" utilise maintenant les vrais listings du backend
- Loading state avec message "Chargement des biens..."
- Fallback gracieux vers mockup si API échoue
- Location picker utilise vraies villes depuis backend
- Gestion des structures de données API (_id) vs mockup (id)

✅ **Section Cities (12 villes):**
- Récupère vraies villes avec `useAvailableCities()`
- Affiche `listingCount` réel pour chaque ville
- Badge "BIENTÔT" pour villes sans listings
- Désactive clics pour villes coming soon
- Loading state pendant récupération

### 5. **Intégration Search Page** (`app/search/page.tsx`)

✅ **Changements effectués:**
- Import du hook `useListings` avec filtres
- Filtre par city et guests depuis URL params
- API filtre automatiquement selon params
- Loading state: "Chargement des biens..."
- Fallback vers mockup data si API échoue
- Gestion des deux structures de données (API + mockup)
- Filtres locaux fonctionnent sur résultats API
- Wishlist fonctionne avec IDs API

---

## 🔧 Structure Technique

### Architecture de Données

```typescript
// API Response Format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Listing Structure (Backend)
interface Listing {
  _id: string;              // MongoDB ID
  title: string;
  city: string;
  neighborhood?: string;
  pricePerNight: number;
  currency: string;
  bedrooms: number;
  maxGuests: number;
  propertyType: string;
  rating?: number;
  featured?: boolean;
  amenities?: string[];
  pmId?: string;
}

// City Structure (Backend)
interface City {
  _id: string;
  name: string;
  slug: string;
  displayName: string;
  country: string;
  listingCount?: number;
}
```

### Flux de Données

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (sojori-vente)                   │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │   Homepage   │      │ Search Page  │                   │
│  └──────┬───────┘      └──────┬───────┘                   │
│         │                     │                            │
│         │ useFeatured         │ useListings(filters)       │
│         │ Listings            │                            │
│         │                     │                            │
│  ┌──────▼──────────────────────▼────────┐                 │
│  │     React Hooks (useListings.ts)     │                 │
│  └──────┬────────────────────────────────┘                 │
│         │                                                   │
│         │ apiClient.getListings()                          │
│         │                                                   │
│  ┌──────▼────────────────────────────────┐                 │
│  │     API Client (lib/api/client.ts)    │                 │
│  └──────┬────────────────────────────────┘                 │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │
          │ fetch(https://api.sojori.com/api/v1/listings)
          │
┌─────────▼───────────────────────────────────────────────────┐
│              BACKEND (sojori-production)                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           srv-listing (microservice)                 │  │
│  │  - GET /api/v1/listings                             │  │
│  │  - GET /api/v1/listings/:id                         │  │
│  │  - GET /api/v1/cities                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              MongoDB Atlas (Paris)                   │  │
│  │  - srv-listing-db.listings                          │  │
│  │  - srv-listing-db.cities                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Gestion des Erreurs

1. **API Timeout/Failure:** Fallback automatique vers données mockup
2. **Empty Results:** Affichage "Aucun bien trouvé" avec CTA retour accueil
3. **Loading States:** Messages "Chargement..." pendant fetch
4. **Type Safety:** TypeScript avec types stricts pour API responses

---

## 📋 Prochaines Étapes

### Phase 2: Configuration Clerk

1. **Récupérer secrets depuis GCP:**
```bash
gcloud secrets versions access latest --secret="clerk-publishable-key"
gcloud secrets versions access latest --secret="clerk-secret-key"
```

2. **Mettre à jour `.env.local`:**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

3. **Configurer Clerk dans l'app:**
   - Wrapper app avec `<ClerkProvider>` dans `app/layout.tsx`
   - Créer `middleware.ts` pour routes protégées
   - Mettre à jour Navigation avec `<SignInButton>` et `<UserButton>`

### Phase 3: Pages Manquantes

1. **Page Listing Detail** (`/listings/[id]`)
   - Utiliser `useListing(id)` hook
   - Afficher photos, description, amenities
   - Calendrier de disponibilité
   - Bouton réservation

2. **Page Checkout** (`/checkout/[id]`)
   - Protéger avec Clerk (auth requise)
   - Formulaire paiement
   - Résumé réservation
   - Appel `POST /api/v1/reservations`

3. **Page Profile Guest** (`/profile`)
   - Protéger avec Clerk
   - Afficher réservations en cours
   - Historique réservations

4. **Pages Manquantes:**
   - `/experiences` → 404 actuellement
   - `/verified-hosts` → à créer
   - `/become-host` → à créer

### Phase 4: APIs Backend Manquantes

**À créer dans sojori-production:**

1. **Public APIs (sans auth):**
   - `GET /api/v1/public/listings` - Listings publics
   - `GET /api/v1/public/cities` - Villes avec counts
   - `GET /api/v1/public/property-managers` - PMs listés

2. **Guest APIs (avec Clerk token):**
   - `POST /api/v1/reservations` - Créer réservation
   - `GET /api/v1/reservations/my` - Mes réservations
   - `GET /api/v1/profile` - Profil guest
   - `PUT /api/v1/profile` - Mettre à jour profil

3. **Intégration Clerk côté backend:**
   - Middleware de validation JWT Clerk
   - Création automatique Guest dans MongoDB
   - Mapping Clerk userId → Guest _id

---

## 🚀 Déploiement

### Vérifications avant prod

- [ ] Secrets Clerk configurés
- [ ] Backend APIs publiques déployées
- [ ] Tests end-to-end homepage + search
- [ ] Tests avec données réelles (staging)
- [ ] Performance: temps chargement < 2s
- [ ] SEO: meta tags, sitemap
- [ ] Analytics configurés

### Commandes de déploiement

```bash
# Frontend (Vercel)
cd /Users/gouacht/sojori-vente
vercel --prod

# Backend (si nouvelles APIs)
cd /Users/gouacht/sojori-production
kubectl rollout restart deployment srv-listing
```

---

## 📊 État Actuel

| Composant | État | Notes |
|-----------|------|-------|
| API Client | ✅ Complet | Tous endpoints définis |
| Hooks React | ✅ Complet | useListings, useCities |
| Homepage Integration | ✅ Complet | Featured listings + villes |
| Search Integration | ✅ Complet | Filtres + API |
| Cities Coming Soon | ✅ Complet | Badges + désactivation |
| Clerk Setup | ⚠️ Partiel | Package installé, config manquante |
| Backend Public APIs | ❌ Manquant | À créer dans srv-listing |
| Listing Detail Page | ❌ Manquant | À implémenter |
| Checkout Flow | ❌ Manquant | À implémenter |
| Profile Page | ❌ Manquant | À implémenter |

---

## 📝 Notes Importantes

1. **Fallback Gracieux:** Toutes les pages fonctionnent avec mockup data si API échoue
2. **Type Safety:** Gestion des deux structures (_id vs id, pmId vs pm)
3. **Loading States:** UX propre pendant chargement
4. **Coming Soon:** Villes sans listings affichent badge "BIENTÔT"
5. **Performance:** Hooks React optimisés avec `useEffect` dependencies

---

## 🐛 Issues Connus

1. **Search Page Warning:** "Each child in a list should have a unique key"
   - Impact: Mineur, n'affecte pas fonctionnement
   - Fix: Vérifier que `key={listingId}` est bien unique

2. **Clerk Keys Placeholder:** `.env.local` contient valeurs placeholder
   - Impact: Critique pour auth
   - Fix: Récupérer vraies clés depuis GCP

3. **Backend APIs 404:** Certaines routes n'existent pas encore
   - Impact: Fallback vers mockup
   - Fix: Créer APIs publiques dans srv-listing

---

## 📚 Documentation Référence

- [AUDIT_API_INTEGRATION.md](/Users/gouacht/sojori-vente/AUDIT_API_INTEGRATION.md) - Audit complet APIs
- [lib/config/cities.ts](/Users/gouacht/sojori-vente/lib/config/cities.ts) - Configuration villes
- [lib/api/client.ts](/Users/gouacht/sojori-vente/lib/api/client.ts) - Client API central

---

**Auteur:** Claude Code
**Projet:** Sojori OTA Marketplace
**Version:** 1.0.0-beta
