'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { useListing, useBlockedDates, useCalendarData, useListingAmenities, useListingRules, useListingReviews, useNearbyPOIs } from '@/lib/hooks/useListings';
import { AvailabilityCalendar } from '@/components/calendar';
import type { DateRange, PriceBreakdown } from '@/components/calendar';
import { MoroccoMap } from '@/components/map';
import { PriceDisplay } from '@/components/PriceDisplay';
import { apiClient, type Listing } from '@/lib/api/client';
import { listingDisplayPrice } from '@/lib/pricing/listingPrice';
import { logger } from '@/lib/utils/logger';
import styles from './listing.module.css';

export default function ListingPage() {
  const router = useRouter();
  // Use the navigation hooks (stable, non-suspending) instead of use(params)/
  // use(searchParams). Calling use() on the route promises suspends on client
  // navigation and shifts the Hooks order ("change in the order of Hooks").
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const searchParams = useSearchParams();
  const resolvedSearchParams: Record<string, string | undefined> = {
    checkIn: searchParams.get('checkIn') ?? undefined,
    checkOut: searchParams.get('checkOut') ?? undefined,
    guests: searchParams.get('guests') ?? undefined,
    adults: searchParams.get('adults') ?? undefined,
    children: searchParams.get('children') ?? undefined,
    infants: searchParams.get('infants') ?? undefined,
    pets: searchParams.get('pets') ?? undefined,
  };

  // Fetch from API
  const { listing: apiListing, loading } = useListing(id);
  const { blockedDates, loading: loadingBlocked } = useBlockedDates(id);
  const { calendarData, loading: loadingCalendar } = useCalendarData(id, 3); // Get 3 months of calendar data
  const { amenities: apiAmenities, loading: loadingAmenities } = useListingAmenities(id);
  const { rules: apiRules, info: apiInfo, loading: loadingRules } = useListingRules(id);
  const { reviews: apiReviewsAll, loading: loadingReviews } = useListingReviews(id, 10);
  const apiReviews = apiReviewsAll.slice(0, 10); // Limit to 10 reviews
  const { pois: apiPOIs, loading: loadingPOIs } = useNearbyPOIs(id);

  // Convert S3 URLs to GCP Storage URLs (backend hasn't migrated yet)
  const convertToGCPUrl = (url: string): string => {
    if (!url) return url;
    if (url.includes('sojori.s3.eu-west-3.amazonaws.com')) {
      return url.replace(
        'https://sojori.s3.eu-west-3.amazonaws.com',
        'https://storage.googleapis.com/seraphic-vertex-474520-b8-listings-images'
      );
    }
    return url;
  };

  let listing = apiListing;

  // Convert image URLs
  if (listing?.images) {
    listing = {
      ...listing,
      images: listing.images.map(convertToGCPUrl)
    };
  }

  // Enrich listing with smart defaults
  if (listing?.description) {
    listing = { ...listing, description: listing.description.trim() };
  }

  if (listing && (!listing.description || listing.description.trim().length < 20)) {
    const cityName = listing.city?.charAt(0).toUpperCase() + listing.city?.slice(1) || 'Maroc';
    const propertyType = listing.propertyType || 'hébergement';
    const neighborhood = listing.neighborhood || listing.city;

    listing = {
      ...listing,
      description: `Découvrez ce magnifique ${propertyType} situé à ${neighborhood}, ${cityName}. Idéal pour ${listing.maxGuests || 4} voyageurs, cet espace ${listing.bedrooms ? `dispose de ${listing.bedrooms} chambres` : 'spacieux'} offre tout le confort moderne pour un séjour inoubliable. Profitez d'un emplacement privilégié pour explorer la région et vivre une expérience authentique marocaine.`,
    };
  }

  // Initialize from URL params
  const initialCheckInStr = resolvedSearchParams.checkIn as string | undefined;
  const initialCheckOutStr = resolvedSearchParams.checkOut as string | undefined;
  const initialGuests = resolvedSearchParams.guests ? parseInt(resolvedSearchParams.guests as string, 10) : 2;
  const initialAdults = resolvedSearchParams.adults ? parseInt(resolvedSearchParams.adults as string, 10) : Math.min(initialGuests, 2);
  const initialChildren = resolvedSearchParams.children ? parseInt(resolvedSearchParams.children as string, 10) : Math.max(0, initialGuests - 2);
  const initialInfants = resolvedSearchParams.infants ? parseInt(resolvedSearchParams.infants as string, 10) : 0;
  const initialPets = resolvedSearchParams.pets ? parseInt(resolvedSearchParams.pets as string, 10) : 0;

  // Convert URL param strings to Date objects
  const initialCheckIn = initialCheckInStr ? new Date(initialCheckInStr) : null;
  const initialCheckOut = initialCheckOutStr ? new Date(initialCheckOutStr) : null;

  // Booking state
  const [dateRange, setDateRange] = useState<DateRange>({
    checkIn: initialCheckIn,
    checkOut: initialCheckOut,
  });
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [guests, setGuests] = useState(initialGuests);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [infants, setInfants] = useState(initialInfants);
  const [pets, setPets] = useState(initialPets);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showSubnav, setShowSubnav] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Basic');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [intervalMinPrice, setIntervalMinPrice] = useState<number | null>(null);
  const [similarListings, setSimilarListings] = useState<Listing[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);

  const selectedNights =
    priceBreakdown != null
      ? (priceBreakdown.nights ??
        (priceBreakdown.baseNights ?? 0) + (priceBreakdown.weekendNights ?? 0))
      : 0;

  const displayNightlyPrice = (() => {
    if (priceBreakdown && selectedNights > 0 && priceBreakdown.subtotal > 0) {
      return Math.round(priceBreakdown.subtotal / selectedNights);
    }
    if (listing) {
      return listingDisplayPrice(listing, intervalMinPrice);
    }
    return 0;
  })();

  useEffect(() => {
    if (!dateRange.checkIn || !dateRange.checkOut || !id) {
      setIntervalMinPrice(null);
      return;
    }
    let active = true;
    const checkIn = dateRange.checkIn.toISOString().split('T')[0];
    const checkOut = dateRange.checkOut.toISOString().split('T')[0];
    apiClient.getMinNightlyPrice(id, checkIn, checkOut).then((min) => {
      if (active) setIntervalMinPrice(min);
    });
    return () => {
      active = false;
    };
  }, [dateRange.checkIn, dateRange.checkOut, id]);

  // Authoritative pricing from backend (Inventory calendar), aligned with checkout
  useEffect(() => {
    if (!dateRange.checkIn || !dateRange.checkOut || !id) {
      setPriceBreakdown(null);
      return;
    }
    let active = true;
    const checkIn = dateRange.checkIn.toISOString().split('T')[0];
    const checkOut = dateRange.checkOut.toISOString().split('T')[0];
    setPricingLoading(true);
    apiClient
      .getListingPricing(id, checkIn, checkOut, adults + children)
      .then((res) => {
        if (!active || !res.success || !res.data) return;
        const data = res.data;
        setPriceBreakdown({
          baseNights: data.baseNights ?? data.nights,
          basePrice: data.basePrice,
          weekendNights: data.weekendNights ?? 0,
          weekendPrice: data.weekendPrice ?? 0,
          subtotal: data.subtotal,
          serviceFee: data.serviceFee,
          tax: data.tax,
          total: data.total,
          nights: data.nights,
        });
      })
      .catch((err) => {
        logger.warn('[LISTING] Pricing API failed', err);
      })
      .finally(() => {
        if (active) setPricingLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dateRange.checkIn, dateRange.checkOut, id, adults, children]);

  useEffect(() => {
    if (!listing?.city) return;
    let active = true;
    apiClient.getListings({ city: listing.city }).then((res) => {
      if (!active || !res.success || !res.data) return;
      setSimilarListings(
        res.data.filter((l) => (l._id || (l as { id?: string }).id) !== id).slice(0, 2),
      );
    });
    return () => {
      active = false;
    };
  }, [listing?.city, id]);

  // Update page title
  useEffect(() => {
    if (listing) {
      document.title = `${listing.title} · ${listing.city} · Sojori`;
    }
  }, [listing]);

  // Sticky subnav on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowSubnav(window.scrollY > 420);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update selected category when amenities load
  useEffect(() => {
    if (apiAmenities.length > 0 && selectedCategory === 'Basic') {
      // Keep Basic if it exists, otherwise use first available
      const hasBasic = apiAmenities.some((a) => a.SojoriSubcategory?.[0]?.en === 'Basic');
      if (!hasBasic) {
        const firstCategory = apiAmenities[0]?.SojoriSubcategory?.[0]?.en;
        if (firstCategory) setSelectedCategory(firstCategory);
      }
    }
  }, [apiAmenities, selectedCategory]);

  // Handle booking redirect to checkout
  const handleBooking = async () => {
    logger.debug('[BOOKING] Réserver clicked', {
      dateRange,
      guests: { adults, children, infants, pets },
      priceBreakdown,
    });

    // Validation des dates
    if (!dateRange.checkIn || !dateRange.checkOut) {
      logger.warn('[BOOKING] Dates manquantes');
      alert('Veuillez sélectionner des dates d\'arrivée et de départ.');
      return;
    }

    const checkIn = dateRange.checkIn.toISOString().split('T')[0];
    const checkOut = dateRange.checkOut.toISOString().split('T')[0];

    let pricing = priceBreakdown;
    try {
      const res = await apiClient.getListingPricing(id, checkIn, checkOut, adults + children);
      if (res.success && res.data) {
        const data = res.data;
        pricing = {
          baseNights: data.baseNights ?? data.nights,
          basePrice: data.basePrice,
          weekendNights: data.weekendNights ?? 0,
          weekendPrice: data.weekendPrice ?? 0,
          subtotal: data.subtotal,
          serviceFee: data.serviceFee,
          tax: data.tax,
          total: data.total,
          nights: data.nights,
        };
      }
    } catch (err) {
      logger.warn('[BOOKING] Pricing API fallback to local breakdown', err);
    }

    if (!pricing) {
      alert('Impossible de calculer le prix pour ces dates. Réessayez dans un instant.');
      return;
    }

    // Construire l'URL de checkout avec tous les paramètres
    const checkoutParams = new URLSearchParams({
      checkIn,
      checkOut,
      guests: (adults + children).toString(),
      pricing: JSON.stringify(pricing),
    });

    const checkoutUrl = `/checkout/${id}?${checkoutParams.toString()}`;
    logger.debug('[BOOKING] Redirection vers:', checkoutUrl);

    router.push(checkoutUrl);
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <main style={{ minHeight: '100vh', textAlign: 'center', paddingTop: '100px', paddingRight: '32px', paddingBottom: '100px', paddingLeft: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ color: 'var(--ink3)' }}>Chargement du bien...</h2>
        </main>
      </>
    );
  }

  if (!listing) {
    return (
      <>
        <Navigation />
        <main style={{ minHeight: '100vh', textAlign: 'center', paddingTop: '100px', paddingRight: '32px', paddingBottom: '100px', paddingLeft: '32px' }}>
          <h1>Bien non trouvé</h1>
          <Link href="/search" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>
            Retour à la recherche
          </Link>
        </main>
      </>
    );
  }

  // Map categories from API to display icons
  const categoryIcons: Record<string, string> = {
    'Basic': '⚡',
    'Kitchen & Dining': '🍳',
    'Bedroom & Laundry': '🛏',
    'Bathroom': '🚿',
    'Heating & Cooling': '❄️',
    'Internet & Office': '📶',
    'Entertainment': '📺',
    'Outdoor & View': '🌳',
    'Parking & Transport': '🚗',
    'Home Safety': '🛡',
    'Accessibility': '♿',
    'Cleaning & Disinfection': '🧼',
    'Family Friendly': '👶',
    'Pet-Friendly': '🐾',
    'Location': '📍',
    'Services': '🛎',
    'Wellness & Spa': '🧖',
    'Sports & Activities': '⛳',
    'Building': '🏢',
  };

  // Map API amenities to display format with fallback to mock data
  const amenitiesData = apiAmenities.length > 0
    ? apiAmenities.map((amenity) => {
        const category = amenity.SojoriSubcategory?.[0]?.en || 'General';
        return {
          icon: categoryIcons[category] || amenity.iconUrl || '✓',
          label: amenity.name?.FR || amenity.name?.en || 'Équipement',
          category: category,
          isBasic: false, // API doesn't provide this, can be enhanced later
        };
      })
    : [
        { icon: '📶', label: 'Wi-Fi fibre 200 Mb/s', category: 'Internet & Office', isBasic: true },
        { icon: '🚗', label: 'Parking privé sécurisé', category: 'Parking & Transport', isBasic: true },
        { icon: '❄', label: 'Climatisation', category: 'Heating & Cooling', isBasic: true },
        { icon: '📺', label: 'TV 4K · Netflix', category: 'Entertainment', isBasic: true },
        { icon: '🍳', label: 'Cuisine équipée', category: 'Kitchen & Dining', isBasic: true },
        { icon: '🧺', label: 'Lave-linge', category: 'Bedroom & Laundry', isBasic: true },
        { icon: '☕', label: 'Machine Nespresso', category: 'Kitchen & Dining', isBasic: true },
        { icon: '🛗', label: 'Ascenseur', category: 'Building', isBasic: true },
        { icon: '🧖', label: 'Sèche-cheveux', category: 'Bathroom', isBasic: true },
        { icon: '🏊', label: 'Piscine', category: 'Outdoor & View', disabled: true },
      ];

  // Group by category
  const amenitiesByCategory = amenitiesData.reduce((acc: Record<string, any[]>, amenity) => {
    const cat = amenity.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(amenity);
    return acc;
  }, {});

  // Build categories list with counts
  const categories = [
    { key: 'Tous', label: 'Tous', icon: '⭐', count: amenitiesData.length },
    ...Object.entries(amenitiesByCategory).map(([cat, items]) => ({
      key: cat,
      label: cat,
      icon: categoryIcons[cat] || '📦',
      count: items.length,
    })),
  ];

  // Default to first category with items (Basic preferred), or first available
  const defaultCategory = categories.find((c) => c.key === 'Basic')?.key ||
                         categories.find((c) => c.count > 0 && c.key !== 'Tous')?.key ||
                         'Tous';

  const filteredAmenities =
    selectedCategory === 'Tous'
      ? amenitiesData
      : amenitiesData.filter((a) => a.category === selectedCategory);

  return (
    <>
      <Navigation />

      {/* ─── SEARCH CONTEXT BAR ─── */}
      {(initialCheckIn || initialCheckOut || initialGuests > 2) && (
        <div style={{
          padding: '12px 48px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          gap: '32px',
          alignItems: 'center',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <div style={{ opacity: 0.9 }}>🔍 Votre recherche :</div>
          {initialCheckIn && initialCheckOut && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📅</span>
              <span>
                {new Date(initialCheckIn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' → '}
                {new Date(initialCheckOut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
          {adults + children > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👥</span>
              <span>{adults + children} voyageur{adults + children > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* ─── STICKY SUBNAV ─── */}
      <div className={`${styles.subnav} ${showSubnav ? styles.on : ''}`}>
        <a href="#photos" className={styles.on}>
          Photos
        </a>
        <a href="#amenities">Équipements</a>
        <a href="#calendar">Disponibilités</a>
        <a href="#location">Emplacement</a>
        <a href="#reviews">Avis</a>
        <div className={styles.priceMini}>
          <PriceDisplay priceInMAD={displayNightlyPrice} period="nuit" size="small" />
          <button className={styles.book} onClick={handleBooking}>Réserver</button>
        </div>
      </div>

      <div className={styles.wrap}>
        {/* ─── TITLE ─── */}
        <div className={styles.titleRow} id="photos">
          <div className={styles.titleBlock}>
            <h1>{listing.title}</h1>
            <div className={styles.titleMeta}>
              {(listing.rating ?? 0) > 0 && (listing.reviewCount ?? 0) > 0 && (
                <span className={styles.star}>
                  <span className={styles.s}>★</span> {(listing.rating ?? 0).toFixed(1)}{' '}
                  <span style={{ color: 'var(--ink3)', fontWeight: 500 }}>
                    · {listing.reviewCount} avis
                  </span>
                </span>
              )}
              <span className={styles.dot}></span>
              <span className={styles.loc}>
                {listing.city} · {listing.neighborhood}
              </span>
              <span className={styles.dot}></span>
              <span className={styles.verified}>✓ VÉRIFIÉ SOJORI</span>
            </div>
          </div>
          <div className={styles.titleActions}>
            <button className={styles.titleAct}>↗ Partager</button>
            <button className={styles.titleAct}>♡ Enregistrer</button>
          </div>
        </div>

        {/* ─── GALLERY ─── */}
        {listing.images && listing.images.length > 0 ? (
          <div className={styles.gallery}>
            <div
              className={`${styles.g} ${styles.main}`}
              style={{
                backgroundImage: `url(${listing.images[0]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className={styles.grain}></div>
              <span className={styles.tag360}>⊹ VISITE 360°</span>
            </div>
            {listing.images[1] && (
              <div
                className={`${styles.g} ${styles.b}`}
                style={{
                  backgroundImage: `url(${listing.images[1]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className={styles.grain}></div>
              </div>
            )}
            {listing.images[2] && (
              <div
                className={`${styles.g} ${styles.c}`}
                style={{
                  backgroundImage: `url(${listing.images[2]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className={styles.grain}></div>
              </div>
            )}
            {listing.images[3] && (
              <div
                className={`${styles.g} ${styles.d}`}
                style={{
                  backgroundImage: `url(${listing.images[3]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className={styles.grain}></div>
              </div>
            )}
            {listing.images[4] && (
              <div
                className={`${styles.g} ${styles.e}`}
                style={{
                  backgroundImage: `url(${listing.images[4]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className={styles.grain}></div>
                <span className={styles.allPhotos}>
                  ⊞ Voir les {listing.images.length} photos
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.gallery} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
            minHeight: '400px'
          }}>
            <div style={{
              textAlign: 'center',
              color: '#666',
              fontSize: '18px'
            }}>
              📷 Pas de photo disponible
            </div>
          </div>
        )}

        {/* ─── CONTENT ─── */}
        <div className={styles.content}>
          <div className={styles.mainCol}>
            {/* FACTS */}
            <div className={styles.facts}>
              <div className={styles.fact}>
                <div className={styles.ic}>👥</div>
                <div>
                  <div className={styles.v}>{listing.maxGuests} voyageurs</div>
                  <div className={styles.l}>Capacité</div>
                </div>
              </div>
              <div className={styles.fact}>
                <div className={styles.ic}>🛏</div>
                <div>
                  <div className={styles.v}>{listing.bedrooms} chambres</div>
                  <div className={styles.l}>{listing.bedrooms} lits doubles</div>
                </div>
              </div>
              <div className={styles.fact}>
                <div className={styles.ic}>🛁</div>
                <div>
                  <div className={styles.v}>{listing.bathrooms} SDB</div>
                  <div className={styles.l}>Douche italienne</div>
                </div>
              </div>
              <div className={styles.fact}>
                <div className={styles.ic}>📐</div>
                <div>
                  <div className={styles.v}>95 m²</div>
                  <div className={styles.l}>+ balcon</div>
                </div>
              </div>
            </div>

            {/* HOST */}
            {(() => {
              const pm = (listing as any).propertyManager;
              const pmName = pm?.name || 'Sojori Stays';
              const pmLogo = pm?.logoText || 'SJ';
              const hasReviews = (listing.rating ?? 0) > 0 && (listing.reviewCount ?? 0) > 0;
              return (
                <div className={styles.hostInline}>
                  <div className={styles.logo}>{pmLogo}</div>
                  <div className={styles.info}>
                    <div className={styles.eyebrow}>
                      GÉRÉ PAR{pm?.verified ? ' · HÔTE VÉRIFIÉ' : ''}
                    </div>
                    <div className={styles.nm}>{pmName}</div>
                    <div className={styles.meta}>
                      {hasReviews && (
                        <>
                          <span className={styles.star}>★ {listing.rating}</span> ·{' '}
                          {listing.reviewCount} avis
                        </>
                      )}
                      {pm?.responseTime
                        ? `${hasReviews ? ' · ' : ''}répond en ${pm.responseTime}`
                        : ''}
                    </div>
                  </div>
                  {pm?.slug ? (
                    <a className={styles.contact} href={`/pm/${pm.slug}`}>
                      Voir le profil
                    </a>
                  ) : (
                    <button className={styles.contact}>Contacter</button>
                  )}
                </div>
              );
            })()}

            {/* DESCRIPTION */}
            <section className={styles.sec}>
              <h2>
                Un pied-à-terre <span className={styles.it}>moderne</span> à {listing.neighborhood || listing.city.charAt(0).toUpperCase() + listing.city.slice(1)}.
              </h2>
              <p className={styles.desc}>
                {listing.description}
                <span className={styles.more}>Lire la suite ↓</span>
              </p>
            </section>

            {/* HIGHLIGHTS */}
            <section className={styles.sec}>
              <h2>
                Points <span className={styles.it}>forts</span>
              </h2>
              <div className={styles.highlights}>
                <div className={styles.hl}>
                  <div className={styles.ic}>🏠</div>
                  <div>
                    <div className={styles.nm}>Logement entier</div>
                    <div className={styles.ds}>Vous avez l'appartement rien que pour vous</div>
                  </div>
                </div>
                <div className={styles.hl}>
                  <div className={styles.ic}>📍</div>
                  <div>
                    <div className={styles.nm}>Emplacement premium</div>
                    <div className={styles.ds}>{listing.neighborhood || listing.city.charAt(0).toUpperCase() + listing.city.slice(1)} · au cœur de la ville</div>
                  </div>
                </div>
                <div className={styles.hl}>
                  <div className={styles.ic}>✨</div>
                  <div>
                    <div className={styles.nm}>Ménage professionnel</div>
                    <div className={styles.ds}>Équipe Sojori · standards hôteliers garantis</div>
                  </div>
                </div>
                <div className={styles.hl}>
                  <div className={styles.ic}>🔑</div>
                  <div>
                    <div className={styles.nm}>Arrivée autonome</div>
                    <div className={styles.ds}>Boîte à clés sécurisée · check-in 24/7</div>
                  </div>
                </div>
              </div>
            </section>

            {/* AMENITIES */}
            <section className={styles.sec} id="amenities">
              <h2>
                <span className={styles.it}>Équipements</span>
              </h2>
              <div className={styles.amCats}>
                {categories.map((cat) => (
                  <span
                    key={cat.key}
                    className={`${styles.amCat} ${selectedCategory === cat.key ? styles.on : ''}`}
                    onClick={() => setSelectedCategory(cat.key)}
                  >
                    {cat.icon} {cat.label}
                    {cat.count > 0 && ` · ${cat.count}`}
                  </span>
                ))}
              </div>
              <div className={styles.amGrid}>
                {filteredAmenities.map((amenity, i) => (
                  <div key={i} className={`${styles.am} ${amenity.disabled ? styles.off : ''}`}>
                    <span className={styles.ic}>{amenity.icon}</span>
                    {amenity.label}
                  </div>
                ))}
              </div>
              <button className={styles.amToggle}>Afficher les 28 équipements →</button>
            </section>

            {/* À SAVOIR */}
            <section className={styles.sec}>
              <h2>
                À <span className={styles.it}>savoir</span>
              </h2>
              <div className={styles.know}>
                <div className={styles.knowCol}>
                  <h4>
                    <span className={styles.ic}>🕐</span>Arrivée & départ
                  </h4>
                  <div className={styles.knowLi}>
                    <span className={styles.b}>↘</span>Check-in : {listing.checkInTime || '15h00 → 21h00'}
                  </div>
                  <div className={styles.knowLi}>
                    <span className={styles.b}>↗</span>Check-out : {listing.checkOutTime || 'avant 11h00'}
                  </div>
                  <div className={styles.knowLi}>
                    <span className={styles.b}>🔑</span>Arrivée autonome · boîte à clés
                  </div>
                  <div className={styles.knowLi}>
                    <span className={styles.b}>🕓</span>Late check-out possible (payant)
                  </div>
                </div>
                <div className={styles.knowCol}>
                  <h4>
                    <span className={styles.ic}>📋</span>Règlement
                  </h4>
                  {apiRules.length > 0 ? (
                    apiRules.map((rule, idx) => (
                      <div key={idx} className={styles.knowLi}>
                        <span className={styles.b}>📋</span>{rule}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className={styles.knowLi}>
                        <span className={styles.b}>🚭</span>Non-fumeur
                      </div>
                      <div className={styles.knowLi}>
                        <span className={styles.b}>🎉</span>Pas de fêtes ni événements
                      </div>
                      <div className={styles.knowLi}>
                        <span className={styles.b}>🐾</span>Animaux non admis
                      </div>
                      <div className={styles.knowLi}>
                        <span className={styles.b}>🔇</span>Calme après 23h
                      </div>
                    </>
                  )}
                </div>
                <div className={styles.knowCol}>
                  <h4>
                    <span className={styles.ic}>↩</span>Annulation
                  </h4>
                  <div className={styles.knowLi}>
                    <span className={styles.b}>✓</span>Gratuite jusqu'à 5 jours avant
                  </div>
                  <div className={styles.knowLi}>
                    <span className={styles.b}>½</span>50% remboursé ensuite
                  </div>
                  <div className={styles.knowLi}>
                    <span className={styles.b}>⚡</span>Remboursement automatique
                  </div>
                </div>
              </div>
            </section>

            {/* LOCATION */}
            <section className={styles.sec} id="location">
              <h2>
                <span className={styles.it}>Emplacement</span>
              </h2>
              <MoroccoMap
                city={listing.city}
                neighborhood={listing.neighborhood}
                lat={listing.location?.lat}
                lng={listing.location?.lng}
              />
              <div className={styles.poiGrid}>
                {apiPOIs.length > 0 ? (
                  apiPOIs.map((poi, idx) => (
                    <div key={idx} className={styles.poi}>
                      <span className={styles.ic}>{poi.icon}</span>
                      <span className={styles.nm}>{poi.name}</span>
                      <span className={styles.d}>{poi.distance}</span>
                    </div>
                  ))
                ) : (
                  // Fallback mockup data if no real POIs available
                  <>
                    <div className={styles.poi}>
                      <span className={styles.ic}>🚊</span>
                      <span className={styles.nm}>Tramway CFC</span>
                      <span className={styles.d}>2 MIN À PIED</span>
                    </div>
                    <div className={styles.poi}>
                      <span className={styles.ic}>🍽</span>
                      <span className={styles.nm}>Restaurants & cafés</span>
                      <span className={styles.d}>3 MIN À PIED</span>
                    </div>
                    <div className={styles.poi}>
                      <span className={styles.ic}>🏖</span>
                      <span className={styles.nm}>Corniche Aïn Diab</span>
                      <span className={styles.d}>12 MIN EN VOITURE</span>
                    </div>
                    <div className={styles.poi}>
                      <span className={styles.ic}>🕌</span>
                      <span className={styles.nm}>Mosquée Hassan II</span>
                      <span className={styles.d}>15 MIN EN VOITURE</span>
                    </div>
                    <div className={styles.poi}>
                      <span className={styles.ic}>🛍</span>
                      <span className={styles.nm}>Morocco Mall</span>
                      <span className={styles.d}>10 MIN EN VOITURE</span>
                    </div>
                    <div className={styles.poi}>
                      <span className={styles.ic}>✈️</span>
                      <span className={styles.nm}>Aéroport Mohammed V</span>
                      <span className={styles.d}>30 MIN EN VOITURE</span>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* AVAILABILITY CALENDAR */}
            <section className={styles.sec} id="availability">
              <h2>
                <span className={styles.it}>Disponibilités</span> & Réservation
              </h2>
              <AvailabilityCalendar
                basePricePerNight={listing.basePricePerNight || listing.pricePerNight || 0}
                currency={listing.currency || 'MAD'}
                blockedDates={blockedDates}
                calendarData={calendarData}
                selectedRange={dateRange}
                onRangeChange={(range, pricing) => {
                  setDateRange(range);
                  if (pricing) {
                    setPriceBreakdown(pricing);
                  } else {
                    setPriceBreakdown(null);
                  }
                }}
              />
            </section>

            {/* REVIEWS */}
            {(listing.reviewCount > 0 || apiReviews.length > 0) && (
              <section className={styles.sec} id="reviews">
                <h2>
                  {apiReviews.length > 0 ? apiReviews.length : listing.reviewCount} <span className={styles.it}>avis</span>
                </h2>
                <div className={styles.revSummary}>
                  <div className={styles.bigRate}>
                    <div className={styles.v}>
                      {apiReviews.length > 0
                        ? (apiReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / apiReviews.length).toFixed(1)
                        : listing.rating?.toFixed(1)}
                    </div>
                    <div className={styles.stars}>★★★★★</div>
                    <div className={styles.ct}>{apiReviews.length > 0 ? apiReviews.length : listing.reviewCount} AVIS</div>
                  </div>
                <div className={styles.revBars}>
                  <div className={styles.revBar}>
                    <span className={styles.lbl}>Propreté</span>
                    <span className={styles.track}>
                      <span className={styles.fill} style={{ width: '98%' }}></span>
                    </span>
                    <span className={styles.v}>4.9</span>
                  </div>
                  <div className={styles.revBar}>
                    <span className={styles.lbl}>Communication</span>
                    <span className={styles.track}>
                      <span className={styles.fill} style={{ width: '96%' }}></span>
                    </span>
                    <span className={styles.v}>4.8</span>
                  </div>
                  <div className={styles.revBar}>
                    <span className={styles.lbl}>Emplacement</span>
                    <span className={styles.track}>
                      <span className={styles.fill} style={{ width: '94%' }}></span>
                    </span>
                    <span className={styles.v}>4.7</span>
                  </div>
                  <div className={styles.revBar}>
                    <span className={styles.lbl}>Qualité/prix</span>
                    <span className={styles.track}>
                      <span className={styles.fill} style={{ width: '92%' }}></span>
                    </span>
                    <span className={styles.v}>4.6</span>
                  </div>
                </div>
              </div>
              <div className={`${styles.revList} ${showAllReviews ? styles.scrollMode : ''}`}>
                {apiReviews.length > 0 ? (
                  (showAllReviews ? apiReviews : apiReviews.slice(0, 2)).map((review, idx) => {
                    // Parse reviewText if it's JSON
                    let displayText = 'Excellent séjour !';
                    let displayRating = review.rating;

                    try {
                      const parsed = JSON.parse(review.reviewText);
                      // Extract message from JSON if available
                      displayText = parsed.Message || parsed.message || 'Excellent séjour !';
                      // Use rating from JSON if available
                      if (parsed.Rating) displayRating = parsed.Rating;
                    } catch {
                      // If not JSON, use as-is (or use review.reviewText if available)
                      displayText = review.reviewText || 'Excellent séjour !';
                    }

                    return (
                      <div key={review.id} className={styles.rev}>
                        <div className={styles.revH}>
                          <div className={`${styles.av} ${idx % 2 === 1 ? styles.c2 : ''}`}>
                            {review.guestName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className={styles.nm}>{review.guestName}</div>
                            <div className={styles.date}>
                              {new Date(review.date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }).toUpperCase()}
                              {' · '}
                              <span style={{
                                background: review.platform === 'Airbnb' ? '#FF5A5F' : '#003580',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 600
                              }}>
                                {review.platform}
                              </span>
                            </div>
                          </div>
                          {displayRating && <div className={styles.rt}>{displayRating.toFixed(1)}</div>}
                        </div>
                        <p className={styles.txt}>{displayText}</p>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className={styles.rev}>
                      <div className={styles.revH}>
                        <div className={styles.av}>YB</div>
                        <div>
                          <div className={styles.nm}>Youssef B.</div>
                          <div className={styles.date}>MAI 2026</div>
                        </div>
                        <div className={styles.rt}>5.0</div>
                      </div>
                      <p className={styles.txt}>
                        Appartement impeccable, exactement comme sur les photos. Le parking sécurisé est un vrai
                        plus à Casa. Communication parfaite avec l'équipe Sojori, check-in fluide. Je recommande
                        vivement.
                      </p>
                    </div>
                    <div className={styles.rev}>
                      <div className={styles.revH}>
                        <div className={`${styles.av} ${styles.c2}`}>EM</div>
                        <div>
                          <div className={styles.nm}>Emma L.</div>
                          <div className={styles.date}>AVRIL 2026</div>
                        </div>
                        <div className={styles.rt}>4.8</div>
                      </div>
                      <p className={styles.txt}>
                        Très bon séjour pour un déplacement pro. Wi-Fi ultra rapide, idéal pour le télétravail.
                        Quartier calme et bien desservi. Petit bémol sur la literie un peu ferme, mais rien de
                        grave.
                      </p>
                    </div>
                  </>
                )}
              </div>
              {apiReviews.length > 2 && (
                <button
                  className={styles.revAll}
                  onClick={() => setShowAllReviews(!showAllReviews)}
                >
                  {showAllReviews
                    ? `Voir moins ↑`
                    : `Lire les ${apiReviews.length} avis →`
                  }
                </button>
              )}
              {apiReviews.length === 0 && listing.reviewCount > 0 && (
                <button className={styles.revAll}>
                  Lire les {listing.reviewCount} avis →
                </button>
              )}
              </section>
            )}

            {/* SIMILAR */}
            {similarListings.length > 0 && (
            <section className={styles.sec} style={{ borderBottom: 0 }}>
              <h2>
                Autres biens <span className={styles.it}>Sojori Stays</span>
              </h2>
              <div className={styles.simRow}>
                {similarListings.map((sim, idx) => {
                  const simId = sim._id || (sim as { id?: string }).id || '';
                  const price = listingDisplayPrice(sim);
                  return (
                <Link key={simId} href={`/listings/${simId}`} className={styles.sim}>
                  <div className={`${styles.ph} ${idx === 1 ? styles.b : ''}`}>
                    <span className={styles.pm}>
                      <span className={styles.l}>SJ</span>Sojori
                    </span>
                    <span className={styles.wish}>♡</span>
                  </div>
                  <div className={styles.nm}>{sim.title}</div>
                  <div className={styles.lc}>{sim.neighborhood || sim.city}, {sim.city}</div>
                  <div className={styles.pr}>
                    <b>{price} {sim.currency || 'MAD'}</b>
                    <span className={styles.per}> / nuit</span>
                  </div>
                </Link>
                  );
                })}
              </div>
            </section>
            )}
          </div>

          {/* ─── BOOKING CARD ─── */}
          <div className={styles.bookCol} id="calendar">
            <div className={styles.bookCard}>
              <div className={styles.bookPrice}>
                <PriceDisplay
                  priceInMAD={displayNightlyPrice}
                  period="nuit"
                  size="large"
                  showOriginal={true}
                />
                {listing.weekendPrice && listing.weekendPrice > displayNightlyPrice && (
                  <span className={styles.strike}>{listing.weekendPrice} MAD</span>
                )}
              </div>
              <div className={styles.bookRate}>
                {(listing.rating ?? 0) > 0 && (listing.reviewCount ?? 0) > 0 && (
                  <>
                    <span className={styles.star}>★ {(listing.rating ?? 0).toFixed(1)}</span> ·{' '}
                    {listing.reviewCount} avis ·{' '}
                  </>
                )}
                annulation gratuite
              </div>

              <div className={styles.bookDates}>
                <div className={styles.bookD} onClick={() => {
                  document.getElementById('availability')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}>
                  <div className={styles.l}>Arrivée</div>
                  <div className={styles.v}>
                    {dateRange.checkIn
                      ? new Date(dateRange.checkIn).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : 'Ajouter'}
                  </div>
                </div>
                <div className={styles.bookD} onClick={() => {
                  document.getElementById('availability')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}>
                  <div className={styles.l}>Départ</div>
                  <div className={styles.v}>
                    {dateRange.checkOut
                      ? new Date(dateRange.checkOut).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : 'Ajouter'}
                  </div>
                </div>
              </div>
              <div className={styles.bookGuests} onClick={() => setShowGuestPicker(true)}>
                <div>
                  <div className={styles.l}>Voyageurs</div>
                  <div className={styles.v}>
                    {adults + children} {adults + children > 1 ? 'voyageurs' : 'voyageur'}
                    {children > 0 && ` (${children} enfant${children > 1 ? 's' : ''})`}
                  </div>
                </div>
                <span className={styles.chev}>▾</span>
              </div>

              {priceBreakdown && selectedNights > 0 && (
                <div className={styles.bookAvail}>
                  {selectedNights} {selectedNights > 1 ? 'nuits' : 'nuit'}
                  {pricingLoading ? ' · calcul…' : ''}
                </div>
              )}

              {priceBreakdown && selectedNights > 0 ? (
                <div className={styles.bookLines}>
                  <div className={styles.bookLine}>
                    <span className={styles.u}>
                      {Math.round(priceBreakdown.subtotal / selectedNights)} MAD × {selectedNights}{' '}
                      {selectedNights > 1 ? 'nuits' : 'nuit'}
                    </span>
                    <span className={styles.v}>{priceBreakdown.subtotal.toFixed(0)} MAD</span>
                  </div>
                  <div className={styles.bookLine}>
                    <span className={styles.u}>Frais de service</span>
                    <span className={styles.v}>{priceBreakdown.serviceFee.toFixed(0)} MAD</span>
                  </div>
                  <div className={styles.bookLine}>
                    <span className={styles.u}>Taxe de séjour</span>
                    <span className={styles.v}>{priceBreakdown.tax.toFixed(0)} MAD</span>
                  </div>
                  <div className={`${styles.bookLine} ${styles.total}`}>
                    <span>Total</span>
                    <span className={styles.v}>{priceBreakdown.total.toFixed(0)} MAD</span>
                  </div>
                </div>
              ) : (
                <div className={styles.bookLines}>
                  <div className={styles.bookLine}>
                    <span className={styles.u}>Sélectionnez des dates</span>
                    <span className={styles.v}>—</span>
                  </div>
                </div>
              )}

              <button className={styles.bookCta} onClick={handleBooking}>Réserver</button>
              <button className={styles.bookAi}>
                <span className={styles.ic}>✨</span>Demander à Sojori AI sur ce bien
              </button>
              <div className={styles.bookFoot}>
                <b>Aucun montant prélevé</b> à cette étape
              </div>
              <div className={styles.bookCancel}>
                <span className={styles.ic}>↩</span>
                <div>
                  <b>Annulation gratuite</b> jusqu'au 10 juin · remboursement automatique
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── GUEST PICKER MODAL ─── */}
      {showGuestPicker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowGuestPicker(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 8px 28px rgba(0,0,0,0.28)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Adultes */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 0', borderBottom: '1px solid #EBEBEB' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '16px', color: '#222', marginBottom: '2px' }}>Voyageurs</div>
                <div style={{ fontSize: '14px', color: '#717171' }}>13 ans et plus</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => setAdults(Math.max(1, adults - 1))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: adults > 1 ? '1px solid #B0B0B0' : '1px solid #EBEBEB',
                    background: 'white',
                    color: adults > 1 ? '#222' : '#EBEBEB',
                    fontSize: '18px',
                    cursor: adults > 1 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '300',
                  }}
                  disabled={adults <= 1}
                >
                  −
                </button>
                <div style={{ fontSize: '16px', fontWeight: '400', minWidth: '24px', textAlign: 'center', color: '#222' }}>
                  {adults}
                </div>
                <button
                  onClick={() => setAdults(Math.min(listing.maxGuests || 16, adults + 1))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1px solid #B0B0B0',
                    background: 'white',
                    color: '#222',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '300',
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Enfants */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 0', borderBottom: '1px solid #EBEBEB' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '16px', color: '#222', marginBottom: '2px' }}>Enfants</div>
                <div style={{ fontSize: '14px', color: '#717171' }}>De 2 à 12 ans</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => setChildren(Math.max(0, children - 1))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: children > 0 ? '1px solid #B0B0B0' : '1px solid #EBEBEB',
                    background: 'white',
                    color: children > 0 ? '#222' : '#EBEBEB',
                    fontSize: '18px',
                    cursor: children > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '300',
                  }}
                  disabled={children <= 0}
                >
                  −
                </button>
                <div style={{ fontSize: '16px', fontWeight: '400', minWidth: '24px', textAlign: 'center', color: '#222' }}>
                  {children}
                </div>
                <button
                  onClick={() => {
                    if (adults + children < (listing.maxGuests || 16)) {
                      setChildren(children + 1);
                    }
                  }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: adults + children < (listing.maxGuests || 16) ? '1px solid #B0B0B0' : '1px solid #EBEBEB',
                    background: 'white',
                    color: adults + children < (listing.maxGuests || 16) ? '#222' : '#EBEBEB',
                    fontSize: '18px',
                    cursor: adults + children < (listing.maxGuests || 16) ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '300',
                  }}
                  disabled={adults + children >= (listing.maxGuests || 16)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Bébés */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 0', borderBottom: '1px solid #EBEBEB' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '16px', color: '#222', marginBottom: '2px' }}>Bébés</div>
                <div style={{ fontSize: '14px', color: '#717171' }}>Moins de 2 ans</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => setInfants(Math.max(0, infants - 1))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: infants > 0 ? '1px solid #B0B0B0' : '1px solid #EBEBEB',
                    background: 'white',
                    color: infants > 0 ? '#222' : '#EBEBEB',
                    fontSize: '18px',
                    cursor: infants > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '300',
                  }}
                  disabled={infants <= 0}
                >
                  −
                </button>
                <div style={{ fontSize: '16px', fontWeight: '400', minWidth: '24px', textAlign: 'center', color: '#222' }}>
                  {infants}
                </div>
                <button
                  onClick={() => setInfants(Math.min(5, infants + 1))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: infants < 5 ? '1px solid #B0B0B0' : '1px solid #EBEBEB',
                    background: 'white',
                    color: infants < 5 ? '#222' : '#EBEBEB',
                    fontSize: '18px',
                    cursor: infants < 5 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '300',
                  }}
                  disabled={infants >= 5}
                >
                  +
                </button>
              </div>
            </div>

            {/* Animaux domestiques */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 0', borderBottom: '1px solid #EBEBEB' }}>
              <div style={{ flex: 1, paddingRight: '16px' }}>
                <div style={{ fontWeight: '600', fontSize: '16px', color: '#222', marginBottom: '2px' }}>Animaux domestiques</div>
                <div style={{ fontSize: '14px', color: '#717171', textDecoration: 'underline', cursor: 'pointer' }}>
                  Vous voyagez avec un animal d'assistance ?
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => setPets(Math.max(0, pets - 1))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: pets > 0 ? '1px solid #B0B0B0' : '1px solid #EBEBEB',
                    background: 'white',
                    color: pets > 0 ? '#222' : '#EBEBEB',
                    fontSize: '18px',
                    cursor: pets > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '300',
                  }}
                  disabled={pets <= 0}
                >
                  −
                </button>
                <div style={{ fontSize: '16px', fontWeight: '400', minWidth: '24px', textAlign: 'center', color: '#222' }}>
                  {pets}
                </div>
                <button
                  onClick={() => setPets(Math.min(5, pets + 1))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: pets < 5 ? '1px solid #B0B0B0' : '1px solid #EBEBEB',
                    background: 'white',
                    color: pets < 5 ? '#222' : '#EBEBEB',
                    fontSize: '18px',
                    cursor: pets < 5 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '300',
                  }}
                  disabled={pets >= 5}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ marginTop: '16px', fontSize: '14px', color: '#222', lineHeight: '20px' }}>
              Ce logement peut accueillir jusqu'à {listing.maxGuests || 16} voyageurs, sans compter les bébés. Les animaux ne sont pas admis.
            </div>

            <button
              onClick={() => {
                setGuests(adults + children);
                setShowGuestPicker(false);
              }}
              style={{
                width: '100%',
                padding: '14px',
                background: '#222',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '24px',
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ─── AI FAB ─── */}
      <button className={styles.aiFab}>
        Demander à l'IA <span className={styles.ic}>✨</span>
      </button>

    </>
  );
}
