# 🎨 Plan d'Implémentation Hi-Fi - Sojori Marketplace
## Date: 26 Mai 2026

---

## 🎯 Objectif

Transformer le site actuel pour qu'il soit **100% fidèle au design Hi-Fi** avec:
- ✅ **Tous les composants** visuellement identiques
- ✅ **Tous les boutons fonctionnels** (navigation complète)
- ✅ **Images mockup** (placeholder Marrakech themed)
- ✅ **Données mockup** réalistes pour Marrakech
- ✅ **Design pixel-perfect** (couleurs, spacing, animations)

---

## 📋 Inventaire des Composants Hi-Fi à Implémenter

### **1. Navigation & Header**
```typescript
components/Navigation.tsx
├── Logo Sojori (clickable → /)
├── Search bar (inline, avec ⌘K shortcut)
├── Navigation links
│   ├── Explorer (dropdown: Marrakech, Essaouira, Fès, etc.)
│   ├── Property Managers
│   ├── Comment ça marche
│   └── À propos
├── Right side
│   ├── Devenir hôte (button)
│   ├── Langue FR/EN (switcher)
│   ├── Wishlist (heart icon + count)
│   └── User menu (avatar + dropdown)
└── Mobile hamburger menu
```

### **2. Homepage Sections**
```
app/page.tsx
├── Hero Section
│   ├── H1: "Vivez le Maroc autrement"
│   ├── Search bar (dates, guests, ville)
│   ├── AI suggestions pills (5-6 suggestions)
│   └── Background: Image Marrakech + overlay
│
├── Cities Grid (6 villes)
│   ├── Marrakech (image + overlay + count)
│   ├── Casablanca
│   ├── Essaouira
│   ├── Fès
│   ├── Tanger
│   └── Chefchaouen
│
├── Property Managers Section
│   ├── Title + subtitle
│   ├── Grid 5 PMs (cards avec gradient)
│   │   ├── Logo/Icon
│   │   ├── Nom
│   │   ├── Nombre de biens
│   │   ├── Rating ⭐
│   │   └── Badge "Vérifié"
│   └── CTA "Voir tous les PMs"
│
├── Featured Listings (Carousel)
│   ├── 8-10 biens en carousel
│   ├── Card design:
│   │   ├── Image gallery (swipeable)
│   │   ├── Wishlist heart (top right)
│   │   ├── Badge "Recommandé IA" (si applicable)
│   │   ├── Badge "Prix optimal" (si applicable)
│   │   ├── Title + PM logo
│   │   ├── Rating + reviews count
│   │   ├── Location + distance
│   │   ├── Price per night
│   │   └── Availability indicator
│   └── Navigation arrows + dots
│
├── AI Magic Section
│   ├── Split layout (text left, demo right)
│   ├── Left: Features list avec icons
│   │   ├── Recherche conversationnelle
│   │   ├── Recommandations personnalisées
│   │   ├── Comparaison instantanée
│   │   └── Support 24/7
│   ├── Right: Chat mockup demo
│   │   ├── 3-4 messages exemple
│   │   ├── Typing indicator
│   │   └── Gradient background
│   └── CTA "Essayer l'IA"
│
├── Trust Bar
│   ├── 4 trust signals
│   │   ├── 500+ logements
│   │   ├── 50+ Property Managers
│   │   ├── 4.8⭐ moyenne
│   │   └── Paiement sécurisé
│   └── Icons + text inline
│
└── Footer
    ├── Logo + tagline
    ├── Links columns (4)
    │   ├── Explorer
    │   ├── Hôtes
    │   ├── À propos
    │   └── Support
    ├── Social media links
    ├── Language selector
    └── Legal links + © 2026
```

### **3. Search Page**
```
app/search/page.tsx
├── Search Header (sticky)
│   ├── Filters summary (dates, guests, ville)
│   ├── Edit search button
│   └── Results count
│
├── Main Layout (3 columns)
│   ├── Left Sidebar (Filters)
│   │   ├── Prix (slider range)
│   │   ├── Type de bien (checkboxes)
│   │   │   ├── Riad
│   │   │   ├── Villa
│   │   │   ├── Appartement
│   │   │   └── Dar
│   │   ├── Chambres (selector)
│   │   ├── Équipements (multi-select)
│   │   │   ├── WiFi
│   │   │   ├── Piscine
│   │   │   ├── Climatisation
│   │   │   ├── Parking
│   │   │   ├── Cuisine
│   │   │   └── + 15 autres
│   │   ├── Note minimum (stars)
│   │   ├── Réservation instantanée (toggle)
│   │   └── Plus de filtres (modal trigger)
│   │
│   ├── Center (Results Grid)
│   │   ├── Toolbar
│   │   │   ├── Sort dropdown
│   │   │   │   ├── Pertinence
│   │   │   │   ├── Prix (croissant)
│   │   │   │   ├── Prix (décroissant)
│   │   │   │   ├── Note
│   │   │   │   └── Nouveautés
│   │   │   ├── View toggle (grid/list)
│   │   │   └── Demander à l'IA button
│   │   │
│   │   ├── Active filters chips (removable)
│   │   │
│   │   ├── Results grid (2 cols)
│   │   │   └── Property cards (same as homepage)
│   │   │
│   │   ├── Pagination
│   │   │   ├── Previous/Next buttons
│   │   │   ├── Page numbers (1-10)
│   │   │   └── "Charger plus" button
│   │   │
│   │   └── Empty state (si 0 résultats)
│   │
│   └── Right Sidebar
│       ├── IA Insights Panel
│       │   ├── 3 insights auto
│       │   │   ├── Prix moyens
│       │   │   ├── Tendances saisonnières
│       │   │   └── Recommandations
│       │   └── "En savoir plus" links
│       │
│       ├── Map Preview
│       │   ├── Mini map with markers
│       │   ├── "Voir sur la carte" CTA
│       │   └── Cluster indicators
│       │
│       └── Compare Tool
│           ├── Selected listings (0-3)
│           ├── Add/Remove buttons
│           └── "Comparer" CTA (when 2+)
│
└── AI Chat Bubble (floating bottom right)
    └── Opens chat panel
```

### **4. Listing Detail Page**
```
app/listings/[id]/page.tsx
├── Back button (← Retour aux résultats)
│
├── Gallery Section
│   ├── Main image (large)
│   ├── 4 thumbnails grid
│   ├── "Voir toutes les photos" button (+ count)
│   └── Wishlist heart (top right)
│
├── Main Content (2 columns)
│   ├── Left Column
│   │   ├── Breadcrumbs (Marrakech > Hivernage > Riad)
│   │   │
│   │   ├── Header
│   │   │   ├── Title (H1)
│   │   │   ├── PM logo + name (clickable)
│   │   │   ├── Rating + reviews count
│   │   │   ├── Location (ville, quartier)
│   │   │   └── Share button
│   │   │
│   │   ├── AI Summary Highlight
│   │   │   ├── ✨ Icon
│   │   │   ├── 2-3 lignes résumé IA
│   │   │   └── "Lire l'analyse complète" link
│   │   │
│   │   ├── Quick Facts
│   │   │   ├── 👥 X voyageurs
│   │   │   ├── 🛏️ X chambres
│   │   │   ├── 🛁 X salles de bain
│   │   │   └── 📏 X m²
│   │   │
│   │   ├── Description
│   │   │   ├── Paragraphe complet
│   │   │   ├── "Voir plus" expandable
│   │   │   └── Traduction (si FR→EN)
│   │   │
│   │   ├── Highlights (4 points clés)
│   │   │   └── Icon + titre + description
│   │   │
│   │   ├── Amenities
│   │   │   ├── Categories
│   │   │   │   ├── Essentiel
│   │   │   │   ├── Cuisine
│   │   │   │   ├── Extérieur
│   │   │   │   └── Sécurité
│   │   │   ├── Icons + labels grid
│   │   │   └── "Voir tous les équipements" (modal)
│   │   │
│   │   ├── Sleep Arrangement
│   │   │   └── Bedroom cards (bed types)
│   │   │
│   │   ├── Location
│   │   │   ├── Interactive map
│   │   │   ├── Nearby POIs (list)
│   │   │   │   ├── Restaurants
│   │   │   │   ├── Attractions
│   │   │   │   ├── Transports
│   │   │   │   └── Distances
│   │   │   └── Neighborhood description
│   │   │
│   │   ├── IA Insights Section (large)
│   │   │   ├── 4 insight cards
│   │   │   │   ├── Prix optimal 💰
│   │   │   │   ├── Hôte réactif 👤
│   │   │   │   ├── WiFi rapide 📶
│   │   │   │   └── Flexibilité 🔄
│   │   │   └── Detailed recommendation text
│   │   │
│   │   ├── Reviews Section
│   │   │   ├── Overall rating (large)
│   │   │   ├── Rating breakdown (6 categories)
│   │   │   │   ├── Propreté
│   │   │   │   ├── Communication
│   │   │   │   ├── Arrivée
│   │   │   │   ├── Exactitude
│   │   │   │   ├── Emplacement
│   │   │   │   └── Rapport qualité-prix
│   │   │   ├── AI Themes (3-4 tags)
│   │   │   │   └── Extracted from reviews
│   │   │   ├── Reviews list
│   │   │   │   └── Review card (avatar, name, date, rating, text)
│   │   │   ├── Filters (rating, type, language)
│   │   │   └── Pagination
│   │   │
│   │   ├── House Rules
│   │   │   ├── Check-in/out times
│   │   │   ├── Policies (animaux, fêtes, etc.)
│   │   │   └── Cancellation policy
│   │   │
│   │   └── Similar Listings
│   │       ├── 4-6 biens similaires
│   │       └── Carousel navigation
│   │
│   └── Right Column (Sticky Booking Card)
│       ├── Price per night (large)
│       ├── Rating + reviews (small)
│       │
│       ├── Booking Form
│       │   ├── Date range picker
│       │   ├── Guests selector
│       │   ├── Check availability button
│       │   └── "Prix dynamique activé" badge
│       │
│       ├── Price Breakdown (if dates selected)
│       │   ├── X nuits × Y MAD
│       │   ├── Frais de service
│       │   ├── Taxes
│       │   └── Total (large)
│       │
│       ├── "Réserver" button (primary, large)
│       ├── "Pas de frais de réservation" text
│       │
│       ├── Questions Fréquentes (AI powered)
│       │   ├── 4 questions cliquables
│       │   │   ├── Parking disponible ?
│       │   │   ├── Animaux acceptés ?
│       │   │   ├── WiFi rapide ?
│       │   │   └── Arrivée tardive ok ?
│       │   └── "Poser autre question" button
│       │
│       ├── Contact PM button
│       │
│       └── Report listing link
│
└── AI Chat (floating bubble)
```

### **5. Checkout Page**
```
app/checkout/[id]/page.tsx
├── Progress Steps (sticky header)
│   ├── 1. Bien ✓
│   ├── 2. Voyageur (active)
│   ├── 3. Paiement
│   └── 4. Confirmation
│
├── Main Layout (2 columns)
│   ├── Left Column (Form)
│   │   ├── Section 1: Coordonnées
│   │   │   ├── Prénom
│   │   │   ├── Nom
│   │   │   ├── Email
│   │   │   ├── Téléphone
│   │   │   └── Pays
│   │   │
│   │   ├── Section 2: Message à l'hôte
│   │   │   └── Textarea (optionnel)
│   │   │
│   │   ├── Section 3: Règles de la maison
│   │   │   ├── Checklist (à accepter)
│   │   │   └── Politique d'annulation
│   │   │
│   │   └── Section 4: Paiement
│   │       ├── Payment methods tabs
│   │       │   ├── Carte bancaire
│   │       │   ├── Apple Pay
│   │       │   └── Google Pay
│   │       ├── Card form (si CB)
│   │       │   ├── Numéro (avec brand detection)
│   │       │   ├── Nom
│   │       │   ├── Expiration
│   │       │   └── CVV
│   │       ├── "Paiement sécurisé" badge
│   │       └── "Confirmer et payer" button (large)
│   │
│   └── Right Column (Booking Summary)
│       ├── Listing preview
│       │   ├── Image
│       │   ├── Title
│       │   ├── PM name
│       │   └── Rating
│       │
│       ├── Booking details
│       │   ├── Dates
│       │   ├── Guests
│       │   └── Check-in/out times
│       │
│       ├── Price breakdown
│       │   ├── X nuits × Y MAD
│       │   ├── Réduction (si applicable)
│       │   ├── Frais de service
│       │   ├── Taxes
│       │   └── Total (large, bold)
│       │
│       ├── AI Discount badge (si applicable)
│       │   └── "✨ Prix optimal détecté"
│       │
│       └── Cancellation policy summary
│
└── Trust signals footer
    ├── Paiement sécurisé SSL
    ├── Remboursement garanti
    └── Support 24/7
```

### **6. AI Components (Transverses)**
```
components/ai/
├── AIBubble.tsx (floating bottom right, toutes pages)
│   ├── ✨ Icon
│   ├── Pulse animation
│   └── Opens AI Chat on click
│
├── AIChat.tsx (panel overlay)
│   ├── Header
│   │   ├── ✨ Assistant IA
│   │   ├── Status (en ligne)
│   │   └── Close button
│   ├── Messages list
│   │   ├── User messages (right, blue)
│   │   ├── AI messages (left, violet gradient)
│   │   ├── Typing indicator
│   │   └── Scroll to bottom
│   ├── Quick replies (pills)
│   └── Input
│       ├── Textarea
│       ├── Emoji picker
│       └── Send button
│
├── AIInsights.tsx (sidebar, search page)
│   ├── Title "IA Insights"
│   ├── 3 insight cards
│   │   ├── Icon
│   │   ├── Title
│   │   ├── Value/metric
│   │   └── Description
│   └── "Actualiser" button
│
├── AIBadge.tsx (on property cards)
│   ├── "Recommandé IA · 95%"
│   ├── Gradient background violet
│   └── Tooltip explanation
│
└── AIQuestionsPanel.tsx (listing sidebar)
    ├── Title "Questions fréquentes"
    ├── 4 question buttons
    │   └── Opens chat with pre-filled answer
    └── "Poser autre question" CTA
```

### **7. UI Components Library**
```
components/ui/
├── Button.tsx
│   ├── Variants: primary, secondary, ghost, danger
│   ├── Sizes: sm, md, lg
│   ├── States: default, hover, active, disabled, loading
│   └── Icons: left, right, only
│
├── Input.tsx
│   ├── Types: text, email, tel, number, password
│   ├── States: default, focus, error, disabled
│   ├── Label + helper text
│   └── Icons: left, right
│
├── Select.tsx
│   ├── Custom dropdown
│   ├── Search filter (if >10 options)
│   ├── Multi-select support
│   └── Custom option rendering
│
├── Checkbox.tsx / Radio.tsx
│   ├── States: unchecked, checked, indeterminate, disabled
│   └── Label support
│
├── Badge.tsx
│   ├── Colors: primary, ai, success, warning, danger, neutral
│   ├── Sizes: sm, md, lg
│   └── Dot indicator variant
│
├── Card.tsx
│   ├── Variants: flat, elevated, outlined
│   ├── Hover effect (optional)
│   ├── Padding presets
│   └── Header/Body/Footer slots
│
├── Modal.tsx
│   ├── Overlay (dimmed background)
│   ├── Close on ESC
│   ├── Close on outside click
│   ├── Sizes: sm, md, lg, xl, full
│   ├── Header with close button
│   └── Footer with actions
│
├── Toast.tsx
│   ├── Types: success, error, info, warning
│   ├── Auto-dismiss (configurable)
│   ├── Action button (optional)
│   └── Position: top-right, top-center, etc.
│
├── Tooltip.tsx
│   ├── Positions: top, bottom, left, right
│   ├── Trigger: hover, click, focus
│   └── Arrow indicator
│
├── Skeleton.tsx
│   ├── Variants: text, circle, rect, custom
│   ├── Animation: pulse, wave
│   └── Multiple lines support
│
├── Avatar.tsx
│   ├── Sizes: xs, sm, md, lg, xl
│   ├── Image fallback (initials)
│   ├── Status indicator dot
│   └── Group overlap variant
│
├── Tabs.tsx
│   ├── Horizontal / Vertical
│   ├── Underline / Pills / Cards variants
│   └── Keyboard navigation
│
├── Accordion.tsx
│   ├── Single / Multiple expansion
│   ├── Animated expand/collapse
│   └── Icon rotation
│
└── Progress.tsx
    ├── Linear / Circular
    ├── Determinate / Indeterminate
    └── Label + percentage
```

---

## 🎨 Design System Complet

### **Couleurs (CSS Variables)**
```css
:root {
  /* Primary - Or Sojori */
  --color-primary: #e6b022;
  --color-primary-dark: #b88914;
  --color-primary-light: #f5d572;
  --color-primary-soft: #fef6e0;

  /* AI - Violet */
  --color-ai: #8b5cf6;
  --color-ai-light: #a78bfa;
  --color-ai-soft: #f3f0ff;

  /* Surfaces */
  --color-bg: #fbfaf6;
  --color-card: #ffffff;
  --color-alt: #f5f3ec;
  --color-border: #e8e6de;
  --color-overlay: rgba(26, 20, 8, 0.6);

  /* Text */
  --color-text: #1a1408;
  --color-text-secondary: #4a4539;
  --color-text-tertiary: #78746a;
  --color-text-inverse: #ffffff;

  /* Semantic */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Semantic Soft */
  --color-success-soft: #d1fae5;
  --color-warning-soft: #fef3c7;
  --color-error-soft: #fee2e2;
  --color-info-soft: #dbeafe;
}
```

### **Typography**
```css
:root {
  /* Font Families */
  --font-sans: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-mono: 'Geist Mono', 'Courier New', monospace;

  /* Font Sizes */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */

  /* Line Heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;

  /* Font Weights */
  --weight-light: 300;
  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  --weight-extrabold: 800;
}
```

### **Spacing Scale**
```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### **Border Radius**
```css
:root {
  --radius-none: 0;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
}
```

### **Shadows**
```css
:root {
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.15);
}
```

### **Transitions**
```css
:root {
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-bounce: 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### **Animations**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes pulseGold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(230, 176, 34, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(230, 176, 34, 0); }
}

@keyframes pulseAI {
  0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

---

## 🖼️ Images Mockup Strategy

### **Source des Images**
Utiliser **placeholder services** pour images réalistes:

```typescript
// lib/images.ts
const UNSPLASH_BASE = 'https://images.unsplash.com/photo-';
const PLACEHOLDER_BASE = 'https://placehold.co/';

// Marrakech themed images (Unsplash IDs)
export const MARRAKECH_IMAGES = {
  riad: [
    `${UNSPLASH_BASE}1597504853460?w=800&h=600`, // Riad courtyard
    `${UNSPLASH_BASE}1591825729070?w=800&h=600`, // Riad interior
    `${UNSPLASH_BASE}1558098329?w=800&h=600`,    // Moroccan tiles
  ],
  villa: [
    `${UNSPLASH_BASE}1602343168775?w=800&h=600`, // Modern villa
    `${UNSPLASH_BASE}1564013799919?w=800&h=600`, // Pool villa
  ],
  city: [
    `${UNSPLASH_BASE}1597211833712?w=1200&h=800`, // Marrakech skyline
    `${UNSPLASH_BASE}1591786186533?w=1200&h=800`, // Medina
    `${UNSPLASH_BASE}1551632625?w=1200&h=800`,    // Jemaa el-Fna
  ],
};

// Fallback to solid color placeholders
export function getPlaceholder(width: number, height: number, type: 'riad' | 'villa' | 'city') {
  const colors = {
    riad: 'e6b022/ffffff',  // Gold/white
    villa: '8b5cf6/ffffff', // Violet/white
    city: '3b82f6/ffffff',  // Blue/white
  };
  return `${PLACEHOLDER_BASE}${width}x${height}/${colors[type]}/png?text=${type}`;
}
```

### **Images Required (par type)**
- **Homepage Hero**: 1 grande image Marrakech (1920×1080)
- **Cities**: 6 images villes (400×300 each)
- **PMs Logos**: 5 placeholders colorés (100×100)
- **Featured Listings**: 10 sets de 5 images chacun (800×600)
- **Listing Detail**: 1 set de 8-12 images (1200×800)
- **User Avatars**: Placeholders initiales (40×40 à 80×80)

---

## 📦 Données Mockup Structure

### **Mock Data Files**
```
lib/mock/
├── cities.ts         # 6 villes Maroc
├── propertyManagers.ts  # 5 PMs
├── listings.ts       # 30-50 biens Marrakech
├── reviews.ts        # 100+ avis
├── amenities.ts      # Liste 30+ équipements
└── ai-responses.ts   # Réponses IA pré-écrites
```

### **Exemple: Listing Mockup**
```typescript
// lib/mock/listings.ts
export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'rl-001',
    title: 'Riad de la Bahia - Authentique & Luxueux',
    slug: 'riad-bahia-marrakech-hivernage',
    type: 'riad',

    propertyManager: {
      id: 'pm-01',
      name: 'Riad Luxe',
      logo: '/mock/pm-logos/riad-luxe.png',
      verified: true,
      rating: 4.9,
      properties: 12,
    },

    location: {
      city: 'Marrakech',
      neighborhood: 'Hivernage',
      address: 'Avenue Echouhada, Hivernage',
      coordinates: { lat: 31.6295, lng: -7.9811 },
      nearbyPOIs: [
        { name: 'Jemaa el-Fna', distance: 1.2, type: 'attraction' },
        { name: 'Jardin Majorelle', distance: 2.5, type: 'attraction' },
        { name: 'Gare Routière', distance: 0.8, type: 'transport' },
      ],
    },

    images: [
      MARRAKECH_IMAGES.riad[0],
      MARRAKECH_IMAGES.riad[1],
      // ... +10 images
    ],

    pricing: {
      basePrice: 185,
      currency: 'MAD',
      cleaningFee: 50,
      serviceFee: 20,
      taxRate: 0.14,
    },

    capacity: {
      guests: 6,
      bedrooms: 3,
      beds: 4,
      bathrooms: 2,
      surface: 180, // m²
    },

    amenities: [
      'wifi', 'pool', 'ac', 'heating', 'kitchen',
      'parking', 'terrace', 'tv', 'washer', 'safe',
      // ... +20
    ],

    sleepArrangement: [
      { room: 'Chambre 1', beds: [{ type: 'king', count: 1 }] },
      { room: 'Chambre 2', beds: [{ type: 'queen', count: 1 }] },
      { room: 'Chambre 3', beds: [{ type: 'twin', count: 2 }] },
    ],

    rating: {
      overall: 4.92,
      breakdown: {
        cleanliness: 4.9,
        communication: 5.0,
        checkIn: 4.8,
        accuracy: 4.9,
        location: 4.95,
        value: 4.9,
      },
      count: 127,
    },

    reviews: [...], // refs to reviews.ts

    houseRules: {
      checkIn: { from: '15:00', to: '22:00' },
      checkOut: '11:00',
      cancellationPolicy: 'flexible',
      smoking: false,
      pets: false,
      events: false,
      children: true,
    },

    aiInsights: {
      recommended: true,
      matchScore: 95,
      priceOptimal: true,
      hostResponsive: true,
      wifiQuality: 'excellent',
      flexibility: 'high',
      summary: 'Ce riad authentique offre...',
      themes: ['Authentique', 'Bien situé', 'Hôte réactif'],
    },

    availability: {
      instantBook: true,
      minNights: 2,
      maxNights: 30,
      advanceNotice: 1, // days
    },

    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2026-05-20T14:30:00Z',
  },
  // ... +29 autres listings
];
```

---

## ⚙️ Configuration Next.js Optimale

### **next.config.ts**
```typescript
import type { NextConfig } from 'next';

const config: NextConfig = {
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    domains: ['images.unsplash.com', 'placehold.co'],
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Performance
  compress: true,
  poweredByHeader: false,

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default config;
```

---

## 🚀 Ordre d'Implémentation

### **Sprint 1: Foundation (Jour 1-2)**
1. ✅ Setup composants UI de base (Button, Input, Card, Modal)
2. ✅ Créer design system complet (globals.css)
3. ✅ Mock data structure (30 listings Marrakech)
4. ✅ Navigation component complète
5. ✅ Footer component

### **Sprint 2: Homepage (Jour 2-3)**
6. ✅ Hero section avec search
7. ✅ Cities grid (6 villes)
8. ✅ Property Managers section
9. ✅ Featured listings carousel
10. ✅ AI Magic section
11. ✅ Trust bar

### **Sprint 3: Search Page (Jour 3-4)**
12. ✅ Filters sidebar (tous les filtres)
13. ✅ Results grid avec property cards
14. ✅ Sort & view options
15. ✅ AI Insights sidebar
16. ✅ Pagination
17. ✅ Empty states

### **Sprint 4: Listing Detail (Jour 4-5)**
18. ✅ Gallery component
19. ✅ Listing header & info
20. ✅ Amenities section
21. ✅ Location & map
22. ✅ Reviews section
23. ✅ Booking card (sticky)
24. ✅ AI Insights large section
25. ✅ AI Questions panel

### **Sprint 5: Checkout (Jour 5-6)**
26. ✅ Progress steps
27. ✅ Contact form
28. ✅ Payment form
29. ✅ Booking summary sidebar
30. ✅ Confirmation page

### **Sprint 6: AI Components (Jour 6)**
31. ✅ AI Chat component
32. ✅ AI Bubble floating
33. ✅ AI Badges & insights
34. ✅ Context-aware responses

### **Sprint 7: Polish (Jour 7)**
35. ✅ Responsive mobile complete
36. ✅ Animations & transitions
37. ✅ Loading states & skeletons
38. ✅ Error handling
39. ✅ Navigation complete (tous les liens)
40. ✅ Testing E2E

---

## ✅ Checklist de Validation

### **Design Fidelity**
- [ ] Couleurs exactes (palette Hi-Fi)
- [ ] Typographie identique (Geist, Instrument Serif, Geist Mono)
- [ ] Spacing conforme (8px grid)
- [ ] Border radius conformes
- [ ] Shadows identiques
- [ ] Animations présentes

### **Components**
- [ ] Tous les composants UI créés (20+)
- [ ] Navigation complète fonctionnelle
- [ ] Footer avec tous les liens
- [ ] Modals fonctionnels
- [ ] Tooltips présents
- [ ] Toasts implémentés

### **Pages**
- [ ] Homepage 100% conforme Hi-Fi
- [ ] Search page avec tous les filtres
- [ ] Listing detail complet
- [ ] Checkout flow complet
- [ ] Success page
- [ ] 404 page custom

### **Navigation**
- [ ] Tous les boutons cliquables
- [ ] Logo → homepage
- [ ] Search → /search
- [ ] Listings → /listings/[id]
- [ ] Wishlist toggle fonctionne
- [ ] User menu dropdown
- [ ] Mobile hamburger menu
- [ ] Breadcrumbs corrects

### **IA Integration**
- [ ] AI bubble sur toutes les pages
- [ ] AI chat fonctionnel (mockup)
- [ ] AI insights automatiques
- [ ] AI badges sur listings
- [ ] AI questions panel
- [ ] Réponses contextuelles

### **Images & Data**
- [ ] Images mockup Marrakech themed
- [ ] 30+ listings Marrakech
- [ ] 5 Property Managers
- [ ] 100+ reviews mockées
- [ ] Avatars placeholders

### **Responsive**
- [ ] Mobile breakpoints corrects
- [ ] Touch targets 44px+
- [ ] Hamburger menu mobile
- [ ] Images responsive
- [ ] Grid adapt à mobile
- [ ] Sticky elements ajustés

### **Performance**
- [ ] Images optimized (Next/Image)
- [ ] Lazy loading
- [ ] Code splitting
- [ ] Lighthouse >90

---

## 🎯 Résultat Final Attendu

Un site **100% fonctionnel** avec:
- ✅ Design **pixel-perfect** vs Hi-Fi
- ✅ **Toute la navigation** opérationnelle
- ✅ **30 listings** Marrakech avec vraies infos mockées
- ✅ **IA intégrée** sur toutes les pages (mockup intelligent)
- ✅ **Images placeholder** thème Marrakech
- ✅ **Responsive mobile** complet
- ✅ **Performance optimisée** (Lighthouse 90+)

**Temps estimé total**: 7 jours (1 dev full-time)

---

**Prêt à commencer l'implémentation!** 🚀
