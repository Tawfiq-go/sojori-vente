'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useWishlistStore } from '@/lib/store/useBookingStore';
import { useListings } from '@/lib/hooks/useListings';
import { useAvailableCities } from '@/lib/hooks/useCities';
import { listingDisplayPrice } from '@/lib/pricing/listingPrice';
import SearchNavBar, { formatGuestSummary } from '@/components/search/SearchNavBar';
import SearchFiltersPanel from '@/components/search/SearchFiltersPanel';
import SearchMapPanel from '@/components/search/SearchMapPanel';
import SearchMapSplitView from '@/components/search/SearchMapSplitView';
import MobileFiltersDrawer from '@/components/search/MobileFiltersDrawer';
import type { GuestCounts } from '@/components/search/GuestPicker';
import {
  SEARCH_AMENITY_FILTERS,
  listingMatchesAmenityFilter,
  mergeAmenityCatalog,
  buildAmenityFilterOptions,
} from '@/lib/search/amenityFilters';
import { normalizePropertyType } from '@/lib/search/propertyTypes';
import {
  buildSearchParamsWithFilters,
  countActiveUrlFilters,
  parseFiltersFromSearchParams,
} from '@/lib/search/urlFilters';
import {
  buildPriceHistogram,
  clampPriceRange,
  computePriceBounds,
  isSearchPropertyType,
} from '@/lib/search/priceUtils';
import type { PropertyManager } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import './search.css';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const city = searchParams.get('city');
  const query = searchParams.get('q');
  const guests = searchParams.get('guests');
  const adults = searchParams.get('adults');
  const children = searchParams.get('children');
  const infants = searchParams.get('infants');
  const pets = searchParams.get('pets');
  const aiMode = searchParams.get('ai');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  // Total travelers requested (adults + children) — filter = minimum capacity, not exact match
  const totalGuestsRequested = useMemo(() => {
    const a = adults ? parseInt(adults, 10) : guests ? parseInt(guests, 10) : 0;
    const c = children ? parseInt(children, 10) : 0;
    return a + c;
  }, [adults, children, guests]);

  // Fetch real data from backend
  const { listings: apiListings, loading: loadingListings } = useListings({
    city: city || undefined,
    minGuests: totalGuestsRequested > 0 ? totalGuestsRequested : undefined,
    limit: 100,
  });
  const { cities: apiCities } = useAvailableCities();
  const [propertyManagers, setPropertyManagers] = useState<PropertyManager[]>([]);
  const [intervalMinPrices, setIntervalMinPrices] = useState<Record<string, number>>({});
  const [loadingIntervalPrices, setLoadingIntervalPrices] = useState(false);

  useEffect(() => {
    import('@/lib/api/client').then(({ apiClient }) => {
      apiClient.getPropertyManagers().then((res) => {
        if (res.success && res.data) setPropertyManagers(res.data);
      });
    });
  }, []);

  const listings = apiListings;

  // Wishlist
  const wishlistItems = useWishlistStore((state) => state.items);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  const cardPrice = (listing: (typeof listings)[number]) => {
    const listingId = (listing as any)._id || (listing as any).id;
    return listingDisplayPrice(listing, intervalMinPrices[listingId]);
  };

  useEffect(() => {
    const loadIntervalPrices = async () => {
      if (!checkIn || !checkOut || listings.length === 0) {
        setIntervalMinPrices({});
        setLoadingIntervalPrices(false);
        return;
      }
      setLoadingIntervalPrices(true);
      try {
        const { apiClient } = await import('@/lib/api/client');
        const listingIds = listings.map((l) => (l as any)._id || (l as any).id);
        const mins = await apiClient.getMinNightlyPrices(listingIds, checkIn, checkOut);
        setIntervalMinPrices(mins);
      } catch (error) {
        logger.warn('Interval min price fetch failed:', error);
        setIntervalMinPrices({});
      } finally {
        setLoadingIntervalPrices(false);
      }
    };
    void loadIntervalPrices();
  }, [checkIn, checkOut, listings]);
  const [availableListingIds, setAvailableListingIds] = useState<string[]>([]);
  const [unavailableListingIds, setUnavailableListingIds] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  // Filter state
  const [selectedPMs, setSelectedPMs] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [priceBounds, setPriceBounds] = useState<[number, number]>([0, 5000]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [amenityCatalog, setAmenityCatalog] = useState(SEARCH_AMENITY_FILTERS);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [mapViewMode, setMapViewMode] = useState<'list' | 'split'>('list');
  const urlSyncReady = useRef(false);
  const skipNextUrlParse = useRef(false);

  const guestCounts: GuestCounts = useMemo(
    () => ({
      adults: adults ? parseInt(adults, 10) : guests ? parseInt(guests, 10) : 2,
      children: children ? parseInt(children, 10) : 0,
      infants: infants ? parseInt(infants, 10) : 0,
      pets: pets ? parseInt(pets, 10) : 0,
    }),
    [adults, children, guests, infants, pets],
  );

  useEffect(() => {
    import('@/lib/api/client').then(({ apiClient }) => {
      apiClient.getAmenities(city || undefined).then((res) => {
        if (res.success && res.data?.length) {
          setAmenityCatalog(mergeAmenityCatalog(res.data));
        }
      });
    });
  }, [city]);

  // Hydrate filters from URL (shareable links + back/forward)
  useEffect(() => {
    if (skipNextUrlParse.current) {
      skipNextUrlParse.current = false;
      return;
    }
    const parsed = parseFiltersFromSearchParams(searchParams);
    setSelectedPMs(parsed.pms);
    setSelectedTypes(parsed.types.filter(isSearchPropertyType));
    setSelectedAmenities(parsed.amenities);
    setMinRating(parsed.minRating);
    if (parsed.minPrice != null && parsed.maxPrice != null) {
      setPriceRange(clampPriceRange([parsed.minPrice, parsed.maxPrice], priceBounds));
    }
    urlSyncReady.current = true;
  }, [searchParams]);

  // Push filter state to URL
  useEffect(() => {
    if (!urlSyncReady.current) return;
    skipNextUrlParse.current = true;
    const params = buildSearchParamsWithFilters(searchParams, {
      selectedPMs,
      selectedTypes,
      selectedAmenities,
      minRating,
      priceRange: clampPriceRange(priceRange, priceBounds),
      priceBounds,
    });
    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(`/search?${next}`, { scroll: false });
    }
  }, [
    selectedPMs,
    selectedTypes,
    selectedAmenities,
    minRating,
    priceRange,
    priceBounds,
    router,
    searchParams,
  ]);

  // Check availability when dates are provided
  useEffect(() => {
    const checkAvailability = async () => {
      if (!checkIn || !checkOut || listings.length === 0) {
        // No dates selected, all listings are considered available
        setAvailableListingIds([]);
        setUnavailableListingIds([]);
        setAvailabilityChecked(false);
        return;
      }

      setLoadingAvailability(true);
      setAvailabilityChecked(false);
      try {
        const { apiClient } = await import('@/lib/api/client');
        const listingIds = listings.map((l) => (l as any)._id || (l as any).id);

        const result = await apiClient.checkListingsAvailability(
          listingIds,
          checkIn,
          checkOut
        );

        if (result.success && result.data) {
          setAvailableListingIds(result.data.available);
          setUnavailableListingIds(result.data.unavailable);
        }
        setAvailabilityChecked(true);
      } catch (error) {
        logger.warn('Availability check failed:', error);
        setAvailabilityChecked(true);
      } finally {
        setLoadingAvailability(false);
      }
    };

    checkAvailability();
  }, [checkIn, checkOut, listings]);

  const contextListings = useMemo(() => {
    let pool = listings;
    if (city && apiListings.length === 0) {
      pool = pool.filter((listing) => listing.city.toLowerCase() === city.toLowerCase());
    }
    if (query) {
      const searchTerm = query.toLowerCase();
      pool = pool.filter((listing) => {
        const neighborhood = (listing as any).neighborhood || '';
        return (
          listing.title.toLowerCase().includes(searchTerm) ||
          listing.city.toLowerCase().includes(searchTerm) ||
          neighborhood.toLowerCase().includes(searchTerm)
        );
      });
    }
    return pool;
  }, [listings, city, query, apiListings.length]);

  const totalGuests = totalGuestsRequested || guestCounts.adults + guestCounts.children;

  const facetPool = useMemo(() => {
    if (checkIn && checkOut && availabilityChecked && !loadingAvailability) {
      return contextListings.filter((listing) => {
        const listingId = (listing as any)._id || (listing as any).id;
        const isAvailable = availableListingIds.includes(listingId);
        const canHostGuests = !totalGuests || listing.maxGuests >= totalGuests;
        return isAvailable && canHostGuests;
      });
    }
    if (totalGuests > 0) {
      return contextListings.filter((listing) => listing.maxGuests >= totalGuests);
    }
    return contextListings;
  }, [
    contextListings,
    checkIn,
    checkOut,
    availabilityChecked,
    loadingAvailability,
    availableListingIds,
    totalGuests,
  ]);

  const amenityOptions = useMemo(
    () => buildAmenityFilterOptions(amenityCatalog, facetPool, selectedAmenities),
    [amenityCatalog, facetPool, selectedAmenities],
  );

  const facetPrices = useMemo(
    () => facetPool.map((l) => cardPrice(l)).filter((p) => p > 0),
    [facetPool, intervalMinPrices],
  );

  const priceHistogram = useMemo(() => buildPriceHistogram(facetPrices), [facetPrices]);

  useEffect(() => {
    if (!facetPrices.length) return;
    const bounds = computePriceBounds(facetPrices);
    setPriceBounds(bounds);
    const parsed = parseFiltersFromSearchParams(searchParams);
    // Without explicit URL price filter, follow facet bounds (includes dynamic 10 MAD nights)
    if (parsed.minPrice != null && parsed.maxPrice != null) {
      setPriceRange(clampPriceRange([parsed.minPrice, parsed.maxPrice], bounds));
    } else {
      setPriceRange(bounds);
    }
  }, [facetPrices, searchParams]);

  let filteredListings = contextListings;

  if (selectedPMs.length > 0) {
    filteredListings = filteredListings.filter((listing) => {
      const pmId = (listing as any).pmId || (listing as any)._id;
      return selectedPMs.includes(pmId);
    });
  }

  if (selectedTypes.length > 0) {
    filteredListings = filteredListings.filter((listing) =>
      selectedTypes.includes(normalizePropertyType(listing.propertyType)),
    );
  }

  if (selectedAmenities.length > 0) {
    filteredListings = filteredListings.filter((listing) =>
      selectedAmenities.every((key) =>
        listingMatchesAmenityFilter(listing.amenities, key, amenityCatalog),
      ),
    );
  }

  if (minRating > 0) {
    filteredListings = filteredListings.filter((listing) => (listing.rating || 0) >= minRating);
  }

  filteredListings = filteredListings.filter((listing) => {
    const listingId = (listing as any)._id || (listing as any).id;
    const intervalP =
      checkIn && checkOut ? intervalMinPrices[listingId] : undefined;

    // With dates: prefer interval min price (calendar) over stale base price (RoomType)
    if (checkIn && checkOut && loadingIntervalPrices) {
      const base = listing.basePricePerNight || listing.pricePerNight || 0;
      if (base > priceRange[1]) return false;
      return true;
    }

    const p =
      intervalP != null && intervalP > 0
        ? intervalP
        : cardPrice(listing);

    if (p <= 0) return true;

    // Dynamic pricing can be below slider min (e.g. 10 MAD/night vs base 2163)
    if (intervalP != null && intervalP > 0) {
      return intervalP <= priceRange[1];
    }

    return p >= priceRange[0] && p <= priceRange[1];
  });

  let availableListings: typeof filteredListings = [];
  let unavailableByDate: typeof filteredListings = [];
  let unavailableByGuests: typeof filteredListings = [];

  if (checkIn && checkOut && availabilityChecked && !loadingAvailability) {
    // Dates provided: every night in range must be available (inventory + reservations)
    filteredListings.forEach((listing) => {
      const listingId = (listing as any)._id || (listing as any).id;
      const isAvailable = availableListingIds.includes(listingId);
      const canHostGuests = !totalGuests || listing.maxGuests >= totalGuests;

      if (isAvailable && canHostGuests) {
        availableListings.push(listing);
      } else if (!isAvailable) {
        unavailableByDate.push(listing);
      } else if (!canHostGuests) {
        unavailableByGuests.push(listing);
      }
    });
  } else if (totalGuests > 0) {
    // Only guests filter (no dates): just check capacity
    filteredListings.forEach((listing) => {
      if (listing.maxGuests >= totalGuests) {
        availableListings.push(listing);
      } else {
        unavailableByGuests.push(listing);
      }
    });
  } else {
    // No filters: all listings are available
    availableListings = filteredListings;
  }

  // Final listings to display (available first)
  const displayListings = availableListings;
  const hasUnavailableListings = unavailableByDate.length > 0 || unavailableByGuests.length > 0;

  // Build search display text
  const searchLocation = city
    ? city
        .split(/[\s-]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    : 'Maroc';
  const searchDates = checkIn && checkOut
    ? `${new Date(checkIn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${new Date(checkOut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
    : 'Dates flexibles';

  const searchGuests = formatGuestSummary(guestCounts);

  const buildListingUrl = useCallback(
    (listingId: string) => {
      const params = new URLSearchParams();
      if (checkIn) params.append('checkIn', checkIn);
      if (checkOut) params.append('checkOut', checkOut);
      if (guests) params.append('guests', guests);
      if (adults) params.append('adults', adults);
      if (children) params.append('children', children);
      if (infants) params.append('infants', infants);
      if (pets) params.append('pets', pets);
      const qs = params.toString();
      return `/listings/${listingId}${qs ? `?${qs}` : ''}`;
    },
    [checkIn, checkOut, guests, adults, children, infants, pets],
  );

  const mapListings = useMemo(
    () =>
      displayListings.map((listing) => {
        const listingId = (listing as any)._id || (listing as any).id;
        return {
          id: listingId,
          title: listing.title,
          city: listing.city,
          neighborhood: listing.neighborhood,
          price: cardPrice(listing),
          currency: listing.currency || 'MAD',
          lat: (listing as any).lat,
          lng: (listing as any).lng,
          image: listing.images?.[0],
          rating: listing.rating,
        };
      }),
    [displayListings, intervalMinPrices],
  );

  const resetFilters = useCallback(() => {
    setSelectedPMs([]);
    setSelectedTypes([]);
    setSelectedAmenities([]);
    setMinRating(0);
    setPriceRange(priceBounds);
  }, [priceBounds]);

  const handleFilterChange = useCallback(
    (patch: Partial<import('@/components/search/SearchFiltersPanel').SearchFiltersState>) => {
      if (patch.selectedPMs !== undefined) setSelectedPMs(patch.selectedPMs);
      if (patch.selectedTypes !== undefined) setSelectedTypes(patch.selectedTypes);
      if (patch.selectedAmenities !== undefined) setSelectedAmenities(patch.selectedAmenities);
      if (patch.minRating !== undefined) setMinRating(patch.minRating);
      if (patch.priceRange !== undefined) setPriceRange(patch.priceRange);
    },
    [],
  );

  const activeFilterCount = countActiveUrlFilters(
    {
      pms: selectedPMs,
      types: selectedTypes.filter(isSearchPropertyType),
      amenities: selectedAmenities,
      minRating,
      minPrice: priceRange[0] > priceBounds[0] ? priceRange[0] : null,
      maxPrice: priceRange[1] < priceBounds[1] ? priceRange[1] : null,
    },
    priceRange,
    priceBounds,
  );

  const filtersPanel = (
    <SearchFiltersPanel
      propertyManagers={propertyManagers}
      facetPool={facetPool}
      amenityOptions={amenityOptions}
      resultCount={displayListings.length}
      priceBounds={priceBounds}
      priceHistogram={priceHistogram}
      filters={{
        selectedPMs,
        selectedTypes: selectedTypes.filter(isSearchPropertyType),
        selectedAmenities,
        minRating,
        priceRange,
      }}
      onChange={handleFilterChange}
      onReset={resetFilters}
    />
  );

  const colors = ['', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return (
    <>
      <SearchNavBar
        locationLabel={searchLocation}
        datesLabel={searchDates}
        guestSummary={searchGuests}
        initialGuests={guestCounts}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
      />

      {/* AI BAR - only show if query or AI mode */}
      {(query || aiMode) && (
        <div className="ai-bar">
          <div className="ai-bar-inner">
            <div className="ic">✨</div>
            <div className="copy">
              <div className="pretitle">Sojori AI · votre prompt traduit en filtres</div>
              <div className="prompt">
                « <span className="quoted">{query || 'Recherche AI'}</span> à{' '}
                <span className="quoted">{searchLocation}</span>
                {guests && (
                  <>
                    {' '}
                    pour <span className="quoted">{guests} voyageurs</span>
                  </>
                )}
                 »
              </div>
              <div className="applied">
                <span>Filtres appliqués :</span>
                {city && (
                  <>
                    <b>{city}</b>
                    <span className="dot"></span>
                  </>
                )}
                {guests && (
                  <>
                    <b>{guests}+ voyageurs</b>
                    <span className="dot"></span>
                  </>
                )}
                <b>{filteredListings.length} résultats</b>
              </div>
            </div>
            <button className="edit-prompt">✎ Affiner</button>
            <button className="new-search" onClick={() => (window.location.href = '/')}>
              + Nouvelle
            </button>
          </div>
        </div>
      )}

      {/* LAYOUT — filtres toujours visibles ; liste ou split carte */}
      <div className={`search-layout ${mapViewMode === 'split' ? 'search-layout--map-split' : ''}`}>
        <div className="filters-desktop-wrap">{filtersPanel}</div>

        <MobileFiltersDrawer
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          activeCount={activeFilterCount}
          resultCount={displayListings.length}
        >
          <SearchFiltersPanel
            propertyManagers={propertyManagers}
            facetPool={facetPool}
            amenityOptions={amenityOptions}
            resultCount={displayListings.length}
            priceBounds={priceBounds}
            priceHistogram={priceHistogram}
            variant="drawer"
            hideLiveCount
            filters={{
              selectedPMs,
              selectedTypes: selectedTypes.filter(isSearchPropertyType),
              selectedAmenities,
              minRating,
              priceRange,
            }}
            onChange={handleFilterChange}
            onReset={resetFilters}
          />
        </MobileFiltersDrawer>

        <button
          type="button"
          className="mobile-filter-fab"
          onClick={() => setMobileFiltersOpen(true)}
        >
          ⚙ Filtres
          {activeFilterCount > 0 && <span className="fab-badge">{activeFilterCount}</span>}
        </button>

        {mapViewMode === 'list' && displayListings.length > 0 && (
          <button
            type="button"
            className="mobile-map-fab"
            onClick={() => setMapViewMode('split')}
          >
            🗺 Carte
          </button>
        )}

        {mapViewMode === 'split' ? (
          <SearchMapSplitView
            city={city}
            listings={mapListings}
            activeListingId={hoveredListingId}
            onListingHover={setHoveredListingId}
            onClose={() => setMapViewMode('list')}
            buildListingUrl={buildListingUrl}
          />
        ) : (
          <>
        {/* MAIN RESULTS */}
        <main className="main">
          <div className="main-toolbar">
            <h1>
              <b>{displayListings.length}</b> bien{displayListings.length > 1 ? 's' : ''} disponible{displayListings.length > 1 ? 's' : ''}
              {city && ` à ${city}`}
              {checkIn && checkOut && (
                <span style={{ fontSize: '16px', fontWeight: '400', color: 'var(--ink3)', marginLeft: '8px' }}>
                  · {new Date(checkIn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  {' → '}
                  {new Date(checkOut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </h1>
            <div className="toolbar-actions">
              <div className="view-toggle">
                <button
                  type="button"
                  className={`view-toggle-btn ${mapViewMode === 'list' ? 'on' : ''}`}
                  onClick={() => setMapViewMode('list')}
                >
                  ☰ Liste
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${mapViewMode === 'split' ? 'on' : ''}`}
                  onClick={() => setMapViewMode('split')}
                  disabled={displayListings.length === 0}
                >
                  🗺 Carte
                </button>
              </div>
              <div className="sort">
                Trier par :
                <select>
                  <option>Pertinence</option>
                  <option>Prix croissant</option>
                  <option>Prix décroissant</option>
                  <option>Note</option>
                </select>
              </div>
            </div>
          </div>

          {loadingListings || loadingAvailability ? (
            <div style={{ textAlign: 'center', padding: '80px 32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <h3 style={{ fontSize: '24px', color: 'var(--ink3)' }}>
                {loadingAvailability ? 'Vérification des disponibilités...' : 'Chargement des biens...'}
              </h3>
            </div>
          ) : displayListings.length === 0 && !hasUnavailableListings ? (
            <div style={{ textAlign: 'center', padding: '80px 32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>Aucun bien trouvé</h3>
              <p style={{ color: 'var(--ink3)', marginBottom: '24px' }}>
                Essayez de modifier vos critères de recherche
              </p>
              <Link
                href="/"
                style={{
                  padding: '12px 24px',
                  background: 'var(--gold)',
                  color: 'var(--ink)',
                  borderRadius: '99px',
                  fontWeight: '600',
                  display: 'inline-block',
                }}
              >
                Retour à l'accueil
              </Link>
            </div>
          ) : (
            <>
              {/* Available listings */}
              {displayListings.length > 0 && (
                <div className="results-grid">
                  {displayListings.map((listing, i) => {
                  // Handle both API (_id) and mock (id) data structures
                  const listingId = (listing as any)._id || (listing as any).id;
                  const listingPmId = (listing as any).pmId;
                  const pm = propertyManagers.find((p) => p.id === listingPmId);
                  const colorClass = colors[i % colors.length];
                  const neighborhood = (listing as any).neighborhood || listing.city;

                  const listingUrl = buildListingUrl(listingId);

                  return (
                    <Link
                      key={listingId}
                      href={listingUrl}
                      className="lc"
                      onMouseEnter={() => setHoveredListingId(listingId)}
                      onMouseLeave={() => setHoveredListingId(null)}
                    >
                      <div className={`lc-photo ${colorClass}`}>
                        <div className="grain"></div>
                        <button
                          className={`wish ${wishlistItems.includes(listingId) ? 'on' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            toggleWishlist(listingId);
                          }}
                        >
                          {wishlistItems.includes(listingId) ? '♥' : '♡'}
                        </button>
                        <div className="source-badge">DIRECT</div>
                        {pm && (
                          <div className="pm-badge">
                            <div className="pml">{pm.slug.substring(0, 2).toUpperCase()}</div>
                            {pm.name}
                          </div>
                        )}
                      </div>
                      <div className="lc-info">
                        <div className="top">
                          <div className="nm">{listing.title}</div>
                          <div className="rating">
                            <span className="star">★</span>
                            {listing.rating || 4.8}
                          </div>
                        </div>
                        <div className="loc">
                          {neighborhood}, {listing.city}
                        </div>
                        <div className="meta-row">
                          <span>{listing.bedrooms} chambres</span>
                          <span className="d"></span>
                          <span>{listing.maxGuests} voyageurs</span>
                        </div>
                        <div className="price">
                          <b>{cardPrice(listing)} {listing.currency || 'MAD'}</b>
                          <span className="per">/nuit</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                </div>
              )}

              {/* Unavailable by date - shown below with message */}
              {unavailableByDate.length > 0 && (
                <div style={{ marginTop: '64px' }}>
                  <div style={{
                    padding: '16px 24px',
                    background: '#FFF9E6',
                    border: '1px solid #FFE066',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '24px' }}>📅</span>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                        {unavailableByDate.length} bien{unavailableByDate.length > 1 ? 's' : ''} non disponible{unavailableByDate.length > 1 ? 's' : ''} pour ces dates
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--ink3)' }}>
                        Ces logements sont déjà réservés du {new Date(checkIn!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au {new Date(checkOut!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}. Essayez d'autres dates ou contactez-nous.
                      </div>
                    </div>
                  </div>

                  <div className="results-grid" style={{ opacity: 0.6 }}>
                    {unavailableByDate.map((listing, i) => {
                      const listingId = (listing as any)._id || (listing as any).id;
                      const listingPmId = (listing as any).pmId;
                      const pm = propertyManagers.find((p) => p.id === listingPmId);
                      const colorClass = colors[i % colors.length];
                      const neighborhood = (listing as any).neighborhood || listing.city;

                      return (
                        <div key={listingId} className="lc" style={{ position: 'relative', pointerEvents: 'none' }}>
                          <div className={`lc-photo ${colorClass}`}>
                            <div className="grain"></div>
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(255,255,255,0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: 'var(--ink)',
                              borderRadius: '12px'
                            }}>
                              ✕ Non disponible
                            </div>
                            {pm && (
                              <div className="pm-badge">
                                <div className="pml">{pm.slug.substring(0, 2).toUpperCase()}</div>
                                {pm.name}
                              </div>
                            )}
                          </div>
                          <div className="lc-info">
                            <div className="top">
                              <div className="nm">{listing.title}</div>
                              <div className="rating">
                                <span className="star">★</span>
                                {listing.rating || 4.8}
                              </div>
                            </div>
                            <div className="loc">
                              {neighborhood}, {listing.city}
                            </div>
                            <div className="meta-row">
                              <span>{listing.bedrooms} chambres</span>
                              <span className="d"></span>
                              <span>{listing.maxGuests} voyageurs</span>
                            </div>
                            <div className="price">
                              <b>{cardPrice(listing)} {listing.currency || 'MAD'}</b>
                              <span className="per">/nuit</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Unavailable by guests capacity */}
              {unavailableByGuests.length > 0 && (
                <div style={{ marginTop: '64px' }}>
                  <div style={{
                    padding: '16px 24px',
                    background: '#F0F8FF',
                    border: '1px solid #B0D4F1',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '24px' }}>👥</span>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                        {unavailableByGuests.length} bien{unavailableByGuests.length > 1 ? 's' : ''} avec capacité insuffisante
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--ink3)' }}>
                        Ces logements ne peuvent pas accueillir {totalGuests} voyageur{totalGuests > 1 ? 's' : ''}. Réduisez le nombre de voyageurs ou choisissez un bien plus grand.
                      </div>
                    </div>
                  </div>

                  <div className="results-grid" style={{ opacity: 0.6 }}>
                    {unavailableByGuests.map((listing, i) => {
                      const listingId = (listing as any)._id || (listing as any).id;
                      const listingPmId = (listing as any).pmId;
                      const pm = propertyManagers.find((p) => p.id === listingPmId);
                      const colorClass = colors[i % colors.length];
                      const neighborhood = (listing as any).neighborhood || listing.city;

                      return (
                        <div key={listingId} className="lc" style={{ position: 'relative', pointerEvents: 'none' }}>
                          <div className={`lc-photo ${colorClass}`}>
                            <div className="grain"></div>
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(255,255,255,0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: 'var(--ink)',
                              borderRadius: '12px'
                            }}>
                              Max {listing.maxGuests} voyageurs
                            </div>
                            {pm && (
                              <div className="pm-badge">
                                <div className="pml">{pm.slug.substring(0, 2).toUpperCase()}</div>
                                {pm.name}
                              </div>
                            )}
                          </div>
                          <div className="lc-info">
                            <div className="top">
                              <div className="nm">{listing.title}</div>
                              <div className="rating">
                                <span className="star">★</span>
                                {listing.rating || 4.8}
                              </div>
                            </div>
                            <div className="loc">
                              {neighborhood}, {listing.city}
                            </div>
                            <div className="meta-row">
                              <span>{listing.bedrooms} chambres</span>
                              <span className="d"></span>
                              <span>{listing.maxGuests} voyageurs</span>
                            </div>
                            <div className="price">
                              <b>{cardPrice(listing)} {listing.currency || 'MAD'}</b>
                              <span className="per">/nuit</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {displayListings.length > 12 && (
                <div className="load-more">
                  <div className="info">
                    Affichage de <b>12</b> sur <b>{displayListings.length}</b> résultats
                  </div>
                  <button>Charger plus</button>
                </div>
              )}
            </>
          )}
        </main>

        <SearchMapPanel
          city={city}
          listings={mapListings}
          activeListingId={hoveredListingId}
          onListingHover={setHoveredListingId}
          onOpenSplitView={() => setMapViewMode('split')}
        />
          </>
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            paddingTop: '88px',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>Chargement...</div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
