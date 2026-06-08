'use client';

import { useState } from 'react';
import styles from './AmenitiesSection.module.css';

interface AmenitiesSectionProps {
  propertyType?: string;
  bedrooms?: number;
  maxGuests?: number;
}

// Amenities database inspired by Airbnb/Booking.com
const AMENITIES_CATEGORIES = {
  essentials: {
    title: 'Essentiels',
    icon: '⚡',
    items: [
      { icon: '📶', label: 'WiFi', popular: true },
      { icon: '❄️', label: 'Climatisation', popular: true },
      { icon: '🔥', label: 'Chauffage' },
      { icon: '🍳', label: 'Cuisine', popular: true },
      { icon: '🚿', label: 'Eau chaude' },
      { icon: '🧼', label: 'Savon et shampoing' },
      { icon: '🛏', label: 'Draps et serviettes', popular: true },
    ],
  },
  bedroom: {
    title: 'Chambre et buanderie',
    icon: '🛏',
    items: [
      { icon: '🛏', label: 'Lits confortables' },
      { icon: '👔', label: 'Cintres' },
      { icon: '🧺', label: 'Machine à laver' },
      { icon: '🔌', label: 'Sèche-linge' },
      { icon: '🪟', label: 'Rideaux occultants' },
      { icon: '🔒', label: 'Coffre-fort' },
    ],
  },
  bathroom: {
    title: 'Salle de bain',
    icon: '🚿',
    items: [
      { icon: '💨', label: 'Sèche-cheveux' },
      { icon: '🛁', label: 'Baignoire' },
      { icon: '🚿', label: 'Douche' },
      { icon: '🧴', label: 'Articles de toilette' },
    ],
  },
  kitchen: {
    title: 'Cuisine et salle à manger',
    icon: '🍳',
    items: [
      { icon: '☕', label: 'Machine à café' },
      { icon: '🍽', label: 'Vaisselle et couverts' },
      { icon: '🔪', label: 'Ustensiles de cuisine' },
      { icon: '🥘', label: 'Plaques de cuisson' },
      { icon: '📦', label: 'Réfrigérateur', popular: true },
      { icon: '🌀', label: 'Micro-ondes' },
      { icon: '🔥', label: 'Four' },
      { icon: '🍽', label: 'Table à manger' },
    ],
  },
  entertainment: {
    title: 'Divertissement',
    icon: '📺',
    items: [
      { icon: '📺', label: 'Télévision', popular: true },
      { icon: '📡', label: 'TV câble/satellite' },
      { icon: '🎮', label: 'Console de jeux' },
      { icon: '📚', label: 'Livres et magazines' },
    ],
  },
  outdoor: {
    title: 'Extérieur',
    icon: '🌳',
    items: [
      { icon: '⛳', label: 'Piscine privée' },
      { icon: '🏊', label: 'Piscine partagée' },
      { icon: '🌳', label: 'Jardin' },
      { icon: '🪴', label: 'Terrasse/Balcon', popular: true },
      { icon: '🍖', label: 'Barbecue' },
      { icon: '🪑', label: 'Mobilier d\'extérieur' },
    ],
  },
  services: {
    title: 'Services',
    icon: '🛎',
    items: [
      { icon: '🧹', label: 'Ménage quotidien' },
      { icon: '🔑', label: 'Check-in autonome', popular: true },
      { icon: '🛎', label: 'Conciergerie 24/7' },
      { icon: '🚗', label: 'Parking gratuit', popular: true },
      { icon: '🚕', label: 'Navette aéroport' },
    ],
  },
  safety: {
    title: 'Sécurité',
    icon: '🛡',
    items: [
      { icon: '🔥', label: 'Détecteur de fumée' },
      { icon: '🧯', label: 'Extincteur' },
      { icon: '💊', label: 'Trousse de premiers secours' },
      { icon: '📹', label: 'Caméras de sécurité (extérieur)' },
    ],
  },
};

export default function AmenitiesSection({ propertyType, bedrooms, maxGuests }: AmenitiesSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Determine which amenities are available based on property type
  const getAvailableAmenities = () => {
    const available: { [key: string]: boolean } = {};

    // Essentials - always available
    AMENITIES_CATEGORIES.essentials.items.forEach(item => {
      available[item.label] = true;
    });

    // Bedroom - based on bedrooms count
    if (bedrooms && bedrooms > 0) {
      AMENITIES_CATEGORIES.bedroom.items.forEach(item => {
        available[item.label] = true;
      });
    }

    // Bathroom - always available
    AMENITIES_CATEGORIES.bathroom.items.forEach(item => {
      available[item.label] = Math.random() > 0.3; // 70% chance
    });

    // Kitchen - for apartments, villas, riads
    if (propertyType?.toLowerCase().includes('apartment') ||
        propertyType?.toLowerCase().includes('villa') ||
        propertyType?.toLowerCase().includes('riad')) {
      AMENITIES_CATEGORIES.kitchen.items.forEach(item => {
        available[item.label] = Math.random() > 0.2; // 80% chance
      });
    }

    // Entertainment
    AMENITIES_CATEGORIES.entertainment.items.forEach(item => {
      available[item.label] = Math.random() > 0.4; // 60% chance
    });

    // Outdoor - for villas and riads
    if (propertyType?.toLowerCase().includes('villa') ||
        propertyType?.toLowerCase().includes('riad')) {
      available['Piscine privée'] = true;
      available['Jardin'] = true;
      available['Terrasse/Balcon'] = true;
    } else if (propertyType?.toLowerCase().includes('apartment')) {
      available['Piscine partagée'] = Math.random() > 0.5;
      available['Terrasse/Balcon'] = Math.random() > 0.3;
    }

    // Services - always some available
    AMENITIES_CATEGORIES.services.items.forEach(item => {
      available[item.label] = Math.random() > 0.3; // 70% chance
    });

    // Safety - always available
    AMENITIES_CATEGORIES.safety.items.forEach(item => {
      available[item.label] = true;
    });

    return available;
  };

  const availableAmenities = getAvailableAmenities();

  // Count total amenities
  const totalCount = Object.values(availableAmenities).filter(Boolean).length;

  // Get popular amenities (first 8)
  const getPopularAmenities = () => {
    const popular: any[] = [];
    Object.entries(AMENITIES_CATEGORIES).forEach(([key, category]) => {
      category.items.forEach(item => {
        if (item.popular && availableAmenities[item.label]) {
          popular.push({ ...item, category: category.title });
        }
      });
    });
    return popular.slice(0, 8);
  };

  const popularAmenities = getPopularAmenities();

  // Filter amenities by selected category
  const getFilteredAmenities = () => {
    if (!selectedCategory) return null;

    const category = Object.entries(AMENITIES_CATEGORIES).find(
      ([key, cat]) => cat.title === selectedCategory
    );

    if (!category) return null;

    return category[1].items.filter(item => availableAmenities[item.label]);
  };

  const filteredAmenities = getFilteredAmenities();

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Équipements proposés</h3>

      {/* Popular amenities grid (Airbnb style) */}
      {!showAll && (
        <>
          <div className={styles.grid}>
            {popularAmenities.map((amenity, idx) => (
              <div key={idx} className={styles.amenityCard}>
                <span className={styles.icon}>{amenity.icon}</span>
                <span className={styles.label}>{amenity.label}</span>
              </div>
            ))}
          </div>

          <button
            className={styles.showAllButton}
            onClick={() => setShowAll(true)}
          >
            Afficher les {totalCount} équipements
          </button>
        </>
      )}

      {/* Full amenities view with categories (Booking.com style) */}
      {showAll && (
        <div className={styles.fullView}>
          {/* Category filters */}
          <div className={styles.categoryFilters}>
            <button
              className={`${styles.categoryButton} ${!selectedCategory ? styles.active : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              <span>🏠</span>
              <span>Tous ({totalCount})</span>
            </button>
            {Object.entries(AMENITIES_CATEGORIES).map(([key, category]) => {
              const count = category.items.filter(item => availableAmenities[item.label]).length;
              if (count === 0) return null;

              return (
                <button
                  key={key}
                  className={`${styles.categoryButton} ${selectedCategory === category.title ? styles.active : ''}`}
                  onClick={() => setSelectedCategory(category.title)}
                >
                  <span>{category.icon}</span>
                  <span>{category.title} ({count})</span>
                </button>
              );
            })}
          </div>

          {/* Amenities list */}
          <div className={styles.amenitiesList}>
            {selectedCategory ? (
              // Show filtered category
              <div className={styles.categorySection}>
                <h4 className={styles.categoryTitle}>
                  {AMENITIES_CATEGORIES[Object.keys(AMENITIES_CATEGORIES).find(
                    key => AMENITIES_CATEGORIES[key as keyof typeof AMENITIES_CATEGORIES].title === selectedCategory
                  ) as keyof typeof AMENITIES_CATEGORIES]?.icon} {selectedCategory}
                </h4>
                <div className={styles.grid}>
                  {filteredAmenities?.map((amenity, idx) => (
                    <div key={idx} className={styles.amenityCard}>
                      <span className={styles.icon}>{amenity.icon}</span>
                      <span className={styles.label}>{amenity.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Show all categories
              Object.entries(AMENITIES_CATEGORIES).map(([key, category]) => {
                const items = category.items.filter(item => availableAmenities[item.label]);
                if (items.length === 0) return null;

                return (
                  <div key={key} className={styles.categorySection}>
                    <h4 className={styles.categoryTitle}>
                      {category.icon} {category.title}
                    </h4>
                    <div className={styles.grid}>
                      {items.map((amenity, idx) => (
                        <div key={idx} className={styles.amenityCard}>
                          <span className={styles.icon}>{amenity.icon}</span>
                          <span className={styles.label}>{amenity.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            className={styles.showLessButton}
            onClick={() => setShowAll(false)}
          >
            Masquer les équipements
          </button>
        </div>
      )}
    </div>
  );
}
