# Handoff to Claude Design - Sojori OTA V2 Completion

## Status Overview

**Completed:** Homepage (100% matching Hi-Fi design)
**Needed:** 3 additional pages to complete the site

---

## ✅ What's Already Implemented

### Homepage (`/`)
- **Status:** 100% complete, fully matching `docs/design-refs/Sojori OTA V2.html`
- **Features:**
  - Hero section with video background
  - AI Search bar (conversational search) - fully interactive
  - AI suggestions - clickable, navigate to Search
  - Featured listings grid (6 cards) - clickable
  - Featured Property Managers (3 cards) - clickable
  - AI Magic section
  - Cities strip (8 cities: Marrakech, Casablanca, Essaouira, Fès, Chefchaouen, Tanger, Ouarzazate, Agadir) - clickable
  - Trust bar with stats
  - Footer with links

- **Navigation Working:**
  - AI Search → `/search?q=[prompt]&city=[city]&guests=[num]`
  - AI Suggestions → `/search?q=[suggestion]`
  - AI FAB button → `/search?ai=true`
  - City cards → `/search?city=[cityname]`
  - Listing cards → `/listings/[id]`
  - PM cards → `/pm/[slug]`

### Design System
- **CSS Variables:** All tokens from design system implemented (colors, spacing, typography)
- **Components Library:** 11 reusable components in `app/components/`
- **Layout:** Responsive grid system matching Hi-Fi designs

---

## ❌ What Needs to Be Implemented (from Hi-Fi Designs)

### 1. Search Page (`/search`)

**Design Reference:** `docs/design-refs/Sojori OTA Search V2.html`

**Current State:** Basic skeleton exists, needs full implementation

**Required Components:**

#### A. Top Navigation Bar (Sticky)
- Search pills showing active filters (removable)
- Compact search controls
- View toggle (Grid/List/Map)

#### B. AI Translation Bar
- Shows: "Votre recherche: [prompt]" → "Traduit: [structured filters]"
- Gold accent background
- Collapsible

#### C. Main Layout (3-column)
```
┌──────────────┬────────────────────┬──────────┐
│   Filters    │   Results Grid     │   Map    │
│   300px      │   Flexible         │  380px   │
└──────────────┴────────────────────┴──────────┘
```

#### D. Filters Sidebar (300px fixed)
**Filter Groups:**
1. **Prix** (Price Range)
   - Histogram visualization showing distribution
   - Min/Max inputs
   - Range slider

2. **Source** (Pills)
   - Airbnb, Booking.com, Direct, etc.
   - Toggle multiple

3. **Type de bien** (Property Type Pills)
   - Appartement, Villa, Riad, etc.
   - Toggle multiple

4. **Équipements** (Amenities Checkboxes)
   - Piscine, Wifi, Climatisation, Cuisine, etc.
   - Grid layout

5. **Property Managers** (Checkboxes)
   - List of PMs with logos
   - Count of properties per PM

6. **Note minimum** (Rating)
   - Star selector (1-5 stars)

7. **Disponibilité** (Availability)
   - Date range picker
   - "Réservation instantanée" checkbox

#### E. Results Grid
- 3-column grid of listing cards
- Each card shows:
  - Image (with badge for source: Airbnb/Booking/Direct)
  - Price per night
  - Title
  - Location (city, neighborhood)
  - Rating + review count
  - Key amenities (icons)
  - Heart icon (wishlist)

- **Load More** button at bottom

#### F. Map Panel (380px fixed, right side)
- Interactive map with markers
- Markers cluster when zoomed out
- Clicking marker shows listing preview card
- Syncs with results (hover listing → highlight marker)

#### G. No Results State
- Illustration
- "Aucun bien trouvé"
- Suggestions to modify filters

**Mockup Data Needed:**
- Array of 30+ listings with:
  - id, title, city, neighborhood, price, rating, reviews_count
  - images[], amenities[], source (airbnb/booking/direct)
  - coordinates (lat/lng) for map
  - pm_id (property manager)

---

### 2. Listing Detail Page (`/listings/[id]`)

**Design Reference:** `docs/design-refs/Sojori OTA V2.html` (not explicitly shown, needs to be provided)

**Current State:** Basic skeleton exists at `app/listings/[id]/page.tsx`

**Required Sections:**

#### A. Hero Gallery
- Main large image
- Thumbnail grid (4-5 images)
- "Voir toutes les photos" button → lightbox modal
- Share button
- Wishlist heart button

#### B. Header Section
- Property title (large)
- Location breadcrumb (City → Neighborhood)
- Rating + review count
- Host badge (Superhost/Verified)

#### C. Two-Column Layout
```
┌────────────────────────────┬─────────────┐
│   Main Content (70%)       │  Booking    │
│                            │  Widget     │
│                            │  (sticky)   │
└────────────────────────────┴─────────────┘
```

#### D. Main Content Sections (left column)
1. **À propos** (Description)
   - Full description with "Voir plus" expansion
   - Property highlights (badges)

2. **Équipements** (Amenities Grid)
   - Icons + labels
   - 2-column grid
   - "Voir tous les équipements" modal

3. **Localisation** (Map)
   - Embedded map showing approximate location
   - Neighborhood description
   - Nearby attractions

4. **Avis** (Reviews)
   - Overall rating breakdown (cleanliness, communication, etc.)
   - Individual review cards with:
     - Guest name + avatar
     - Rating
     - Date
     - Comment
   - "Voir tous les avis" button

5. **Hôte** (Host Info)
   - Host photo + name
   - Join date
   - Verified badge
   - Response rate/time
   - "Contacter l'hôte" button

6. **Règles du logement** (House Rules)
   - Check-in/out times
   - Cancellation policy
   - House rules list

7. **Biens similaires** (Similar Listings)
   - Horizontal scroll of 4-6 similar listings
   - Same card format as search results

#### E. Booking Widget (right column, sticky)
- Price display (per night)
- Date picker (check-in/out)
- Guest counter
- Total calculation breakdown:
  - Base price × nights
  - Cleaning fee
  - Service fee
  - Taxes
  - **Total**
- "Réserver" CTA button → `/checkout/[id]`
- "Free cancellation" badge

**Mockup Data Needed:**
- Complete listing object with:
  - All details from search
  - Full description (long text)
  - Complete amenities list (20+ items)
  - Reviews array (10+ reviews)
  - Host object (name, avatar, stats)
  - House rules, policies
  - Pricing breakdown (cleaning_fee, service_fee, tax_rate)
  - Similar listings (4-6 IDs)

---

### 3. Checkout Page (`/checkout/[id]`)

**Design Reference:** Not provided, needs to be created

**Current State:** Basic skeleton exists at `app/checkout/[id]/page.tsx`

**Required Sections:**

#### A. Header
- "Confirmer et payer" title
- Back button → return to listing

#### B. Two-Column Layout
```
┌────────────────────────────┬─────────────┐
│   Checkout Form (60%)      │  Summary    │
│                            │  Card       │
│                            │  (sticky)   │
└────────────────────────────┴─────────────┘
```

#### C. Checkout Form (left column)

1. **Votre voyage** (Trip Details)
   - Dates display (editable link back to listing)
   - Guests count (editable)

2. **Informations du voyageur** (Guest Information)
   - Nom complet
   - Email
   - Téléphone
   - Message pour l'hôte (optional textarea)

3. **Paiement** (Payment - MOCKUP)
   - Card number input (with card type icon detection)
   - Expiration date (MM/YY)
   - CVV
   - Cardholder name
   - Billing address (auto-filled from profile or manual)

   **Mockup Note:** Add disclaimer:
   > ⚠️ **Mode Démo**: Aucun paiement réel ne sera effectué. Utilisez 4242 4242 4242 4242 pour tester.

4. **Politique d'annulation** (Cancellation Policy)
   - Summary of cancellation terms
   - "En savoir plus" link

5. **Conditions générales** (Terms)
   - Checkboxes:
     - [ ] J'accepte les conditions générales de Sojori
     - [ ] J'accepte les règles du logement
     - [ ] Je comprends que cette réservation est une démo

6. **CTA Button**
   - Large gold button: "Confirmer et payer"
   - On click → Success modal or redirect to confirmation page

#### D. Summary Card (right column, sticky)
- Listing image thumbnail
- Listing title
- Rating + reviews
- Dates
- Guests
- **Price Breakdown:**
  - €X × Y nuits
  - Frais de ménage
  - Frais de service
  - Taxes
  - **Total (bold, large)**
- Trust badges (Paiement sécurisé, Annulation gratuite)

#### E. Success Modal / Confirmation
After clicking "Confirmer et payer":
- Success checkmark animation
- "Réservation confirmée !" title
- Booking reference number (mockup: #SJ-XXXX)
- Summary of booking
- "Voir ma réservation" button
- "Retour à l'accueil" button

**Mockup Data Needed:**
- Listing summary (title, image, rating)
- Pricing (same as booking widget)
- Mock payment processor responses
- Mock booking confirmation (reference number, confirmation email simulation)

---

## 📁 Project Structure

```
/Users/gouacht/sojori-vente/
├── app/
│   ├── page.tsx                    ✅ Homepage - COMPLETE
│   ├── homepage.css                ✅ Homepage styles - COMPLETE
│   ├── globals.css                 ✅ Global styles - COMPLETE
│   ├── layout.tsx                  ✅ Root layout - COMPLETE
│   │
│   ├── search/
│   │   └── page.tsx                ❌ Needs full implementation
│   │
│   ├── listings/
│   │   └── [id]/
│   │       └── page.tsx            ❌ Needs full implementation
│   │
│   ├── checkout/
│   │   └── [id]/
│   │       └── page.tsx            ❌ Needs full implementation
│   │
│   ├── pm/
│   │   └── [slug]/
│   │       └── page.tsx            ⚠️ Needs implementation (lower priority)
│   │
│   └── components/
│       ├── Button.tsx              ✅ Available
│       ├── Input.tsx               ✅ Available
│       ├── Card.tsx                ✅ Available
│       └── ... (8 more)            ✅ Available
│
├── docs/design-refs/
│   ├── Sojori OTA V2.html          ✅ Homepage design (source of truth)
│   └── Sojori OTA Search V2.html   ✅ Search page design (source of truth)
│
├── public/
│   └── ... (images, icons)
│
└── tailwind.config.ts              ✅ Custom tokens configured
```

---

## 🎨 Design Requirements

**Critical:** All implementations must be **100% matching the Hi-Fi designs** from Claude Design.

- Use existing CSS variables (--gold, --ai, --paper, etc.)
- Match spacing, typography, colors exactly
- Maintain responsive behavior
- Keep design system consistency

**Design Tokens Already Configured:**
- Colors: gold, ai (purple), green, blue, orange, paper, ink
- Spacing: xs (4px) to 6xl (96px)
- Typography: Instrument Sans for all text
- Border radius: sm (8px), DEFAULT (12px), lg (16px)

---

## 📊 Mockup Data Structure Examples

### Listing Object (for Search & Detail pages)
```typescript
interface Listing {
  id: string;
  title: string;
  description: string; // full description for detail page
  city: string; // "Marrakech"
  neighborhood: string; // "Médina"
  coordinates: { lat: number; lng: number };
  price_per_night: number; // in EUR
  rating: number; // 4.8
  reviews_count: number;
  source: 'airbnb' | 'booking' | 'direct';
  images: string[]; // array of image URLs
  amenities: string[]; // ["Piscine", "Wifi", "Climatisation", ...]
  property_type: string; // "Riad", "Appartement", etc.
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  pm_id: string; // property manager ID
  host: {
    name: string;
    avatar: string;
    joined_date: string;
    is_superhost: boolean;
    response_rate: number; // 98
    response_time: string; // "dans l'heure"
  };
  house_rules: string[];
  check_in_time: string; // "15h00"
  check_out_time: string; // "11h00"
  cancellation_policy: string;
  cleaning_fee: number;
  service_fee_percent: number; // 12
  tax_rate: number; // 10
}
```

### Property Manager Object
```typescript
interface PropertyManager {
  id: string;
  slug: string; // for URL
  name: string;
  logo: string;
  description: string;
  properties_count: number;
  avg_rating: number;
  specialties: string[]; // ["Riads de luxe", "Médina"]
}
```

### Review Object
```typescript
interface Review {
  id: string;
  guest_name: string;
  guest_avatar: string;
  rating: number;
  date: string; // ISO format
  comment: string;
  ratings_breakdown?: {
    cleanliness: number;
    communication: number;
    checkin: number;
    accuracy: number;
    location: number;
    value: number;
  };
}
```

---

## 🚀 Implementation Priority

1. **Search Page** (highest priority - core functionality)
2. **Listing Detail Page** (second - needed for booking flow)
3. **Checkout Page** (third - completes booking flow)
4. PM Detail Pages (lower priority - nice to have)

---

## 💬 Notes from Development

- Homepage took ~2 hours to implement with Hi-Fi design
- Main challenges were grid layouts and positioning
- All interactive elements working with URL parameters
- Next.js 16.2.6 with Turbopack (CSS bundling has known issues, documented)
- Project uses pnpm workspace
- Git repo: https://github.com/Tawfiq-go/sojori-vente

---

## ✨ Request to Claude Design

Please provide complete Hi-Fi designs for the 3 missing pages:

1. **Search Page** - matching `Sojori OTA Search V2.html` exactly
2. **Listing Detail Page** - full property detail view
3. **Checkout Page** - booking confirmation and payment mockup

Include:
- Complete HTML/CSS implementation
- All interactive states (hover, active, disabled)
- Responsive behavior notes
- Mockup data structure if different from above

**Goal:** Reach 100% design completion matching Claude Design's vision for Sojori OTA V2.
