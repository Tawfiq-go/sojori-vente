# AUDIT COMPLET - Intégration APIs Backend → Frontend OTA

**Date:** 2026-05-27
**Projet:** sojori-vente (OTA Frontend) ↔ sojori-production (Backend)

---

## 📊 TABLE DES MATIÈRES

1. [APIs Existantes](#apis-existantes)
2. [APIs Manquantes](#apis-manquantes)
3. [Plan d'Intégration](#plan-dintégration)
4. [Structure de Données](#structure-de-données)
5. [Authentification](#authentification)

---

## ✅ APIs EXISTANTES (Backend sojori-production)

### **1. LISTINGS (srv-listing)**

#### `GET /listings`
**Endpoint:** `https://api.sojori.com/listing/listings`
**Auth:** JWT (Owner/Worker filtrent par ownerId, Admin/SuperAdmin voient tout)
**Params:**
```typescript
{
  page?: number;           // Pagination
  limit?: number;          // Limite par page (défaut: 20)
  name?: string;           // Recherche par nom (regex)
  city?: string;           // Filtre par ville (regex)
  cityId?: string[];       // Filtre par cityId(s)
  listingId?: string[];    // Filtre par listing IDs
  country?: string;        // Filtre par pays
  unitType?: string[];     // Type de bien (apartment, villa, etc.)
  sortingBy?: string;      // Tri (name asc/desc, date)
  active?: boolean;        // Filtre actif/inactif
  useActiveFilter?: boolean;
  compact?: boolean;       // Mode compact (id + name seulement)
  forCalendar?: boolean;   // Mode minimal pour calendrier
  forListingsOverview?: boolean; // Mode optimisé liste
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  total: number;           // Nombre total de résultats
  data: Listing[];         // Array de listings
}
```

**Fields Listing (mode complet):**
```typescript
interface Listing {
  _id: string;
  name: string;
  city: string;
  country: string;
  ownerId: string;
  ownerName: string;       // Computed via lookup Account
  ownerEmail: string;
  active: boolean;
  staging?: boolean;
  propertyUnit: string;    // "apartment" | "villa" | "house" | "riad"
  channelManager?: string;
  rentalUnitedIds?: string[];
  channexListingId?: string;
  listingImages?: Image[];
  roomTypes?: RoomType[];  // Avec amenities, rooms, config
  listingAmenities?: Amenity[];
  createdAt: Date;
  updatedAt: Date;
}
```

**✅ DISPONIBLE** - Nécessite adaptation pour OTA public

---

#### `GET /listings/:id`
**Endpoint:** `https://api.sojori.com/listing/listings/:id`
**Auth:** JWT
**Response:** Listing complet avec tous les détails

**✅ DISPONIBLE**

---

#### `GET /amenities`
**Endpoint:** `https://api.sojori.com/listing/amenities`
**Auth:** Aucune (public)
**Response:**
```typescript
{
  success: boolean;
  data: Amenity[];
}

interface Amenity {
  _id: string;
  name: string;
  icon?: string;
  category?: string;
}
```

**✅ DISPONIBLE**

---

#### `GET /propertyTypes`
**Endpoint:** `https://api.sojori.com/listing/propertyTypes`
**Auth:** Aucune
**Response:** Liste des types de propriétés

**✅ DISPONIBLE**

---

### **2. RESERVATIONS (srv-reservations)**

#### `POST /reservations`
**Endpoint:** `https://api.sojori.com/reservation/reservations`
**Auth:** JWT
**Body:**
```typescript
{
  listingId: string;
  checkIn: Date;
  checkOut: Date;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: number;
  totalPrice: number;
  channel: "direct" | "sojori-ota";  // Nouveau channel pour OTA
}
```

**✅ DISPONIBLE** - À adapter pour "sojori-ota" channel

---

#### `GET /reservations`
**Endpoint:** `https://api.sojori.com/reservation/reservations`
**Auth:** JWT
**Params:** Filtres par listing, dates, guest

**✅ DISPONIBLE** - Nécessite auth Guest

---

### **3. USER (srv-user)**

#### `POST /auth/login`
**Endpoint:** `https://api.sojori.com/user/auth/login`
**Body:**
```typescript
{
  email: string;
  password: string;
}
```

**⚠️ PROBLÈME:** Vérifie l'origine (dashboard.sojori.com ou partners.sojori.com)
**❌ BLOQUE** les connexions depuis sojori.com (OTA)

**Solution:** Utiliser Clerk pour auth Guest + webhook sync vers srv-user

---

## ❌ APIs MANQUANTES

### **1. PUBLIC LISTINGS API (sans auth)**

**Nécessaire pour:**
- Homepage OTA (biens featured)
- Page Search (filtrage par ville, type, amenities)
- Page Listing détail (vue publique)

**Endpoint à créer:**
```
GET /public/listings
GET /public/listings/:id
```

**Params:**
```typescript
{
  city?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  amenities?: string[];      // Filter by amenity IDs
  featured?: boolean;        // Pour homepage
  limit?: number;
  page?: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  total: number;
  data: PublicListing[];     // Version publique sans données owner
}

interface PublicListing {
  id: string;
  title: string;
  description: string;
  city: string;
  neighborhood: string;
  propertyType: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  amenities: string[];
  coordinates: { lat: number; lng: number };
  pmName: string;            // Property Manager name (public)
  pmLogo: string;
  featured: boolean;
  instantBook: boolean;
}
```

**⚠️ CRITIQUE:** Actuellement `/listings` requiert JWT et filtre par ownerId (Owner/Worker)

---

### **2. CITIES API**

**Endpoint à créer:**
```
GET /public/cities
```

**Response:**
```typescript
{
  success: boolean;
  data: City[];
}

interface City {
  id: string;
  name: string;
  slug: string;
  country: string;
  listingCount: number;      // Nombre de biens disponibles
  featuredImage?: string;
  coordinates: { lat: number; lng: number };
}
```

**✅ WORKAROUND:** Pour l'instant, utiliser liste hardcodée frontend:
```typescript
const cities = ['Marrakech', 'Casablanca', 'Essaouira', 'Fès', 'Tanger', 'Agadir'];
```

---

### **3. PROPERTY MANAGERS PUBLIC API**

**Endpoint à créer:**
```
GET /public/property-managers
GET /public/property-managers/:slug
```

**Response:**
```typescript
{
  success: boolean;
  data: PublicPM[];
}

interface PublicPM {
  id: string;
  slug: string;
  name: string;
  logo: string;
  description: string;
  listingCount: number;
  rating: number;
  reviewCount: number;
  responseTime: string;
  verified: boolean;
}
```

**⚠️ ACTUELLEMENT:** Données Owner dans `accounts` collection, non exposées publiquement

---

### **4. AVAILABILITY / CALENDAR API**

**Endpoint à créer:**
```
GET /public/listings/:id/availability
```

**Params:**
```typescript
{
  startDate: Date;
  endDate: Date;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    listingId: string;
    calendar: DayAvailability[];
  }
}

interface DayAvailability {
  date: Date;
  available: boolean;
  price: number;            // Prix dynamique si activé
  minStay?: number;
}
```

**⚠️ CRITIQUE:** srv-calendar existe mais nécessite auth Admin/SuperAdmin

---

### **5. REVIEWS API**

**Endpoint à créer:**
```
GET /public/listings/:id/reviews
POST /reviews              # Auth Guest uniquement
```

**⚠️ PAS TROUVÉ:** Système de reviews n'existe pas dans backend actuel

---

### **6. GUEST PROFILE API**

**Endpoint à créer:**
```
GET /guest/profile         # Auth Guest (Clerk)
PUT /guest/profile
GET /guest/reservations
```

**⚠️ ACTUELLEMENT:** srv-user gère uniquement Owner/Worker/Admin/SuperAdmin

---

## 🎯 PLAN D'INTÉGRATION

### **PHASE 1: Setup Initial** (1-2 jours)

1. **Installer Clerk sur sojori-vente**
   ```bash
   cd /Users/gouacht/sojori-vente
   pnpm add @clerk/nextjs
   ```

2. **Récupérer secrets Clerk depuis GCP**
   ```bash
   gcloud secrets versions access latest --secret="clerk-publishable-key"
   gcloud secrets versions access latest --secret="clerk-secret-key"
   ```

3. **Créer `.env.local`**
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...
   NEXT_PUBLIC_API_URL=https://api.sojori.com
   ```

4. **Configurer Clerk middleware + providers**

---

### **PHASE 2: Créer Public APIs Backend** (2-3 jours)

#### A. Nouveau service: `srv-public-api`

Créer un nouveau microservice dédié à l'OTA, sans auth JWT pour les routes publiques.

**Structure:**
```
apps/srv-public-api/
├── src/
│   ├── routes/
│   │   ├── listings/
│   │   │   ├── getListings.ts       # Public, no auth
│   │   │   ├── getListingById.ts
│   │   │   └── getAvailability.ts
│   │   ├── cities/
│   │   │   └── getCities.ts
│   │   ├── pms/
│   │   │   ├── getPropertyManagers.ts
│   │   │   └── getPMById.ts
│   │   └── guest/                   # Auth Clerk required
│   │       ├── getProfile.ts
│   │       ├── updateProfile.ts
│   │       └── getReservations.ts
│   ├── middleware/
│   │   └── clerkAuth.ts             # Clerk JWT verification
│   └── index.ts
└── Dockerfile
```

**Endpoints:**
```
Public (no auth):
  GET  /public/listings
  GET  /public/listings/:id
  GET  /public/listings/:id/availability
  GET  /public/cities
  GET  /public/property-managers
  GET  /public/property-managers/:slug

Guest (Clerk auth):
  GET  /guest/profile
  PUT  /guest/profile
  GET  /guest/reservations
  POST /guest/reservations              # Créer réservation
```

---

#### B. Ou adapter `srv-listing` avec routes publiques

**Option 2:** Ajouter routes publiques à srv-listing existant

**Modifier:** `apps/srv-listing/src/routes/index.ts`
```typescript
// Routes publiques sans auth
router.use('/public/listings', publicListingsRoute);  // Nouveau
router.use('/public/cities', publicCitiesRoute);      // Nouveau

// Routes protégées existantes (inchangées)
router.use('/listings', authenticateJWT, listingRoute);
```

**Avantages:**
- Réutilise modèles et logique existants
- Pas de nouveau service à déployer

**Inconvénients:**
- Mélange logique interne (PM/Admin) et publique (Guest/OTA)

---

### **PHASE 3: Webhook Clerk → srv-user** (1 jour)

Synchroniser les comptes Guest Clerk avec srv-user.

**Créer webhook endpoint:**
```
POST /user/webhooks/clerk
```

**Events à gérer:**
- `user.created` → Créer Account avec role=Guest
- `user.updated` → Mettre à jour Account
- `user.deleted` → Soft delete Account

**Schema Account:**
```typescript
// Ajouter nouveau rôle dans srv-user
type Role = 'SuperAdmin' | 'Admin' | 'Owner' | 'Worker' | 'Guest';  // ✅ Nouveau

interface Account {
  _id: ObjectId;
  role: Role;
  clerkUserId?: string;   // ✅ Nouveau champ pour Guests
  email: string;
  firstName?: string;
  lastName?: string;
  // ... autres champs
}
```

---

### **PHASE 4: Frontend OTA - Intégration APIs** (3-4 jours)

#### A. Créer API client
```typescript
// lib/api/client.ts
import { auth } from '@clerk/nextjs';

export async function apiClient(endpoint: string, options?: RequestInit) {
  const { getToken } = auth();
  const token = await getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response.json();
}
```

#### B. Remplacer mockup data par vraies APIs

**Homepage:**
```typescript
// app/page.tsx
import { apiClient } from '@/lib/api/client';

export default async function HomePage() {
  // Remplacer getFeaturedListings() mockup
  const { data: featuredListings } = await apiClient('/public/listings?featured=true&limit=10');

  // Remplacer propertyManagers mockup
  const { data: propertyManagers } = await apiClient('/public/property-managers');

  return <div>...</div>;
}
```

**Page Search:**
```typescript
// app/search/page.tsx
const SearchContent = () => {
  const searchParams = useSearchParams();
  const city = searchParams.get('city');

  const { data: listings, isLoading } = useSWR(
    `/public/listings?city=${city}&limit=20`,
    apiClient
  );

  return <div>{/* Render listings */}</div>;
};
```

---

### **PHASE 5: Checkout & Réservations** (2-3 jours)

#### Protéger routes checkout avec Clerk
```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/checkout(.*)',
  '/account(.*)',
  '/reservations(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});
```

#### Créer réservation
```typescript
// app/checkout/[id]/actions.ts
'use server';

import { auth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api/client';

export async function createReservation(data: CreateReservationInput) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  return apiClient('/guest/reservations', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      channel: 'sojori-ota',
    }),
  });
}
```

---

## 📋 CHECKLIST COMPLÈTE

### Backend (sojori-production)

- [ ] Créer `srv-public-api` OU adapter `srv-listing` avec routes `/public/*`
- [ ] Endpoint `GET /public/listings` (sans auth)
- [ ] Endpoint `GET /public/listings/:id`
- [ ] Endpoint `GET /public/listings/:id/availability`
- [ ] Endpoint `GET /public/cities`
- [ ] Endpoint `GET /public/property-managers`
- [ ] Endpoint `GET /public/property-managers/:slug`
- [ ] Ajouter rôle `Guest` dans srv-user
- [ ] Webhook `POST /user/webhooks/clerk`
- [ ] Endpoint `GET /guest/profile` (auth Clerk)
- [ ] Endpoint `PUT /guest/profile`
- [ ] Endpoint `GET /guest/reservations`
- [ ] Endpoint `POST /guest/reservations` (créer résa OTA)
- [ ] Déployer sur GKE
- [ ] Configurer ingress/routing

### Frontend (sojori-vente)

- [ ] Installer `@clerk/nextjs`
- [ ] Récupérer secrets Clerk depuis GCP
- [ ] Configurer `.env.local`
- [ ] Setup `ClerkProvider` dans layout
- [ ] Setup middleware auth
- [ ] Créer `lib/api/client.ts`
- [ ] Remplacer mockup data homepage par API
- [ ] Remplacer mockup data search par API
- [ ] Remplacer mockup data PM page par API
- [ ] Remplacer mockup data listing detail par API
- [ ] Implémenter checkout avec auth Guest
- [ ] Page account Guest
- [ ] Page mes réservations
- [ ] Gestion wishlist (peut rester local ou sync avec backend)
- [ ] Tests E2E parcours complet

---

## 🚀 PRIORISATION

**SPRINT 1 (MVP - 1 semaine):**
1. Setup Clerk frontend ✅
2. Créer routes publiques listings (sans auth)
3. Intégrer homepage avec vraies APIs
4. Intégrer page search avec vraies APIs

**SPRINT 2 (Checkout - 1 semaine):**
1. Webhook Clerk → srv-user
2. Endpoint guest reservations
3. Page checkout fonctionnelle
4. Confirmation email

**SPRINT 3 (Finitions - 3-4 jours):**
1. Page account Guest
2. Mes réservations
3. Reviews (si temps)
4. Tests & optimisations

---

## 💡 RECOMMANDATIONS

1. **Utiliser Redis cache** pour `/public/listings` (haute fréquence)
2. **CDN** pour images listings
3. **Rate limiting** sur APIs publiques
4. **Monitoring** Sentry + logs Kubernetes
5. **Tests de charge** avant mise en prod

---

## 📞 CONTACTS & RESSOURCES

- **Backend API:** `https://api.sojori.com`
- **Clerk Dashboard:** [clerk.com](https://dashboard.clerk.com)
- **GCP Secret Manager:** `gcloud secrets list`
- **Kubernetes:** `kubectl get pods -n production`

---

**Dernière mise à jour:** 2026-05-27
**Statut:** 🟡 En attente de validation plan
