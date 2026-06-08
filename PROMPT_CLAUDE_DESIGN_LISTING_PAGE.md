# Prompt pour Claude Design - Page Listing Sojori

## Contexte

Tu as déjà créé le design system complet pour **Sojori**, une marketplace de locations courte durée au Maroc (comme Airbnb/Booking.com). Le design actuel utilise:

- **Couleurs**: Gold (#e6b022, #b88914, #f5d572), backgrounds crème (#fbfaf6), cartes blanches
- **Typographie**: Geist (sans-serif moderne), Geist Mono (pour données/prix)
- **Style**: Élégant, minimaliste, avec touches marocaines subtiles
- **Design system déjà en place**: Homepage, navigation, cards, calendrier de disponibilité

## Page actuelle - Ce qui existe

URL de référence: `http://localhost:6001/listings/685aab22b19110002f9421e1`

### Sections déjà implémentées (à garder):

1. **Hero/Header**
   - Titre du listing: "Sojori CFC fibre et parking"
   - Localisation: "Casablanca, Casablanca"
   - Image principale (placeholder gradient pour l'instant)

2. **Description** ✅
   - Texte long descriptif
   - Style: Paragraphe classique

3. **Points forts** ✅
   - 4 cards avec icônes (🏠, 📍, ✨, 🔑)
   - Titre + description courte
   - Bien stylé, à garder tel quel

4. **Équipements** ✅ (nouvellement créé, fonctionne bien)
   - Vue compacte: 8 équipements populaires
   - Vue étendue: Filtres par catégories (Essentiels, Salle de bain, Cuisine, etc.)
   - Icônes + labels
   - Bouton "Afficher/Masquer"
   - **À améliorer visuellement** selon ton style Sojori

5. **Calendrier de disponibilité** ✅
   - 2 mois side-by-side
   - Prix par nuit affichés
   - Weekends différenciés (+55 MAD)
   - Tooltips avec détails
   - Sidebar sticky avec récapitulatif réservation
   - **Très bien fait, à garder tel quel**

## Mission

### Ce qui manque / ce que tu peux proposer

**Laisse libre cours à ta créativité!** Voici des idées (tu peux en ajouter d'autres):

1. **Galerie photos** 📸
   - Actuellement: juste un placeholder gradient
   - Besoin: Galerie élégante avec images du listing
   - Inspiration: Airbnb (grid avec image principale + 4 secondaires), lightbox au clic
   - Les images viennent de l'API: `listing.images[]` (array d'URLs)

2. **Section "À savoir"** ℹ️
   - Check-in/Check-out times
   - Règles de la maison
   - Politique d'annulation
   - Instructions d'accès

3. **Section Localisation** 🗺️
   - Carte interactive (ou placeholder avec adresse)
   - Points d'intérêt à proximité
   - Transports

4. **Section Reviews/Avis** ⭐
   - Note globale (4.8/5)
   - Liste d'avis avec photos voyageurs
   - Catégories de notation (Propreté, Communication, Emplacement, etc.)

5. **Section "Host/Hôte"** 👤
   - Card avec Property Manager
   - Photo, nom, badge vérifié
   - Taux de réponse, temps de réponse
   - Bouton "Contacter l'hôte"

6. **Section "Autres biens similaires"** 🏘️
   - Carousel de 4-6 autres listings
   - Même ville ou même PM
   - Style: Réutiliser les cards de la homepage

7. **Optimisations UX**
   - Sticky header avec prix + bouton "Réserver"
   - Mobile-first responsive
   - Animations subtiles
   - Loading states

8. **Améliorations section Équipements** 🎨
   - Le composant fonctionne mais le design pourrait être plus "Sojori"
   - Plus de spacing, meilleures transitions
   - Peut-être un layout différent pour la vue complète?
   - Ton choix!

## Données disponibles

```typescript
// Exemple de listing object
{
  id: "685aab22b19110002f9421e1",
  title: "Sojori CFC fibre et parking",
  city: "Casablanca",
  neighborhood: "CFC",
  description: "Bienvenue dans un appartement moderne...",
  pricePerNight: 185,
  weekendPrice: 240,
  bedrooms: 2,
  bathrooms: 1,
  maxGuests: 5,
  propertyType: "Apartment",
  images: ["https://...", "https://...", ...],
  rating: 4.8,
  reviewCount: 142,
  checkInTime: "15:00-21:00",
  checkOutTime: "11:00",
  amenities: [...], // Géré par le composant existant
  highlights: [...], // Déjà stylé
  pm: "property-manager-id", // Pour récupérer infos PM
}
```

## Contraintes techniques

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: CSS Modules (`.module.css`)
- **Composants**: Client components (`'use client'`)
- **Design tokens**: Utilise les variables CSS déjà définies:
  ```css
  --p: #e6b022 (gold primary)
  --pd: #b88914 (gold dark)
  --ps: #f5d572 (gold soft)
  --pt: rgba(230,176,34,0.10) (gold transparent)
  --bg: #fbfaf6 (background)
  --card: #fff
  --alt: #f5f3ec (alternative bg)
  --t: #1a1408 (text)
  --t2, --t3, --t4 (text variants)
  --b: #e8e6de (border)
  --sans: Geist
  --mono: 'Geist Mono'
  ```

## Output attendu

Génère un **fichier HTML standalone** avec le design complet de la page listing, incluant:

1. ✅ Les sections existantes (gardées telles quelles ou légèrement améliorées)
2. ✨ Les nouvelles sections que tu proposes
3. 🎨 Tout le CSS inline dans un `<style>` tag
4. 📱 Design responsive (mobile + desktop)
5. 💫 Animations et micro-interactions subtiles
6. 🔧 Commentaires dans le code pour expliquer les sections

**Format**: HTML complet, prêt à être converti en composants React + CSS modules.

## Style de design attendu

- **Élégant et moderne** (comme le reste de Sojori)
- **Spacing généreux** (pas trop chargé)
- **Hiérarchie visuelle claire** (titres, sous-titres, body)
- **Touches marocaines subtiles** (couleurs or, typographie élégante)
- **Inspiré d'Airbnb/Booking** mais avec l'identité Sojori
- **Accessibility**: Bon contraste, labels clairs, keyboard navigation

## Exemples de référence

- Homepage Sojori déjà créée: `design-reference-hifi.html`
- Calendrier existant: Très bien fait, inspiration pour le reste
- Airbnb listing page (pour structure)
- Booking.com listing page (pour infos pratiques)

---

## Go!

Crée-moi une page listing **magnifique, complète et production-ready** qui va faire dire "WOW" aux utilisateurs! 🚀

Fais preuve de créativité tout en restant cohérent avec le design system Sojori existant.

**Tu as carte blanche pour proposer des sections/features auxquelles je n'ai pas pensé!**
