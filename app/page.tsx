'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { DropdownPortal } from '@/components/DropdownPortal';
import { useFeaturedListings } from '@/lib/hooks/useListings';
import { useAvailableCities, useHomepageCities } from '@/lib/hooks/useCities';
import { apiClient, type PropertyManager } from '@/lib/api/client';
import { listingDisplayPrice } from '@/lib/pricing/listingPrice';
import './homepage.css';

export default function HomePage() {
  const searchParams = useSearchParams();

  // Initialize from URL params only (localStorage loaded in useEffect)
  const initialCheckIn = searchParams.get('checkIn') ? new Date(searchParams.get('checkIn')!) : null;
  const initialCheckOut = searchParams.get('checkOut') ? new Date(searchParams.get('checkOut')!) : null;
  const initialGuests = searchParams.get('guests') ? parseInt(searchParams.get('guests')!, 10) : 2;
  const initialCity = searchParams.get('city') || 'Marrakech';

  const [aiPrompt, setAiPrompt] = useState('');
  const [location, setLocation] = useState(initialCity);
  const [guests, setGuests] = useState(initialGuests);
  const [adults, setAdults] = useState(Math.min(initialGuests, 2));
  const [children, setChildren] = useState(Math.max(0, initialGuests - 2));
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | null>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<Date | null>(initialCheckOut);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Refs for dropdown positioning
  const locationTriggerRef = useRef<HTMLDivElement>(null);
  const dateTriggerRef = useRef<HTMLDivElement>(null);
  const guestTriggerRef = useRef<HTMLDivElement>(null);

  // Fetch real data from backend
  const { listings: apiListings, loading: loadingListings } = useFeaturedListings(10);
  const { cities: apiCities, loading: loadingCities } = useAvailableCities();
  const { cities: homepageCities, loading: loadingHomepageCities } = useHomepageCities();

  // Real published Property Managers (no mock). Section hidden if none.
  const [propertyManagers, setPropertyManagers] = useState<PropertyManager[]>([]);
  const [intervalMinPrices, setIntervalMinPrices] = useState<Record<string, number>>({});
  useEffect(() => {
    let active = true;
    apiClient.getPropertyManagers().then((res) => {
      if (active && res.success && Array.isArray(res.data)) {
        setPropertyManagers(res.data);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Production data only — no fake listing fallback
  const featuredListings = apiListings;

  useEffect(() => {
    const loadIntervalPrices = async () => {
      if (!checkIn || !checkOut || featuredListings.length === 0) {
        setIntervalMinPrices({});
        return;
      }
      try {
        const listingIds = featuredListings.map((l) => (l as { _id?: string; id?: string })._id || (l as { id?: string }).id || '');
        const mins = await apiClient.getMinNightlyPrices(
          listingIds,
          checkIn.toISOString().split('T')[0],
          checkOut.toISOString().split('T')[0],
        );
        setIntervalMinPrices(mins);
      } catch {
        setIntervalMinPrices({});
      }
    };
    void loadIntervalPrices();
  }, [checkIn, checkOut, featuredListings]);

  const cardPrice = (listing: (typeof featuredListings)[number]) => {
    const listingId = (listing as { _id?: string; id?: string })._id || (listing as { id?: string }).id || '';
    return listingDisplayPrice(listing, intervalMinPrices[listingId]);
  };

  const cities = apiCities.length > 0
    ? apiCities.map(c => c.displayName)
    : ['Marrakech', 'Casablanca', 'Essaouira', 'Fès', 'Tanger', 'Agadir'];

  const formatDateDisplay = () => {
    if (!checkIn && !checkOut) return 'Dates flexibles';
    if (checkIn && !checkOut) {
      return checkIn.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
    if (checkIn && checkOut) {
      return `${checkIn.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${checkOut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
    }
    return 'Dates flexibles';
  };

  const handleAiSearch = () => {
    const params = new URLSearchParams();
    if (aiPrompt) params.append('q', aiPrompt);
    if (location) params.append('city', location.toLowerCase());
    // Use the live counters (adults + children) instead of the `guests` state,
    // which is only synced when the dropdown "apply" button is clicked.
    params.append('guests', (adults + children).toString());
    params.append('adults', adults.toString());
    params.append('children', children.toString());
    if (infants > 0) params.append('infants', infants.toString());
    if (pets > 0) params.append('pets', pets.toString());
    if (checkIn) params.append('checkIn', checkIn.toISOString().split('T')[0]);
    if (checkOut) params.append('checkOut', checkOut.toISOString().split('T')[0]);
    window.location.href = `/search?${params.toString()}`;
  };

  const handleSuggestionClick = (query: string) => {
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  };

  const handleCarouselNext = () => {
    if (carouselRef.current) {
      const scrollAmount = 400;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Clear search dates when returning to homepage without URL params
  useEffect(() => {
    // If no URL params, reset to default state
    if (!searchParams.get('checkIn') && !searchParams.get('checkOut')) {
      setCheckIn(null);
      setCheckOut(null);
    }
    if (!searchParams.get('guests')) {
      setGuests(2);
    }
    if (!searchParams.get('city')) {
      setLocation('Marrakech');
    }
  }, []); // Run once on mount

  const handleCarouselPrev = () => {
    if (carouselRef.current) {
      const scrollAmount = 400;
      carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent, listingId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Get current wishlist from localStorage
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const isInWishlist = wishlist.includes(listingId);

    if (isInWishlist) {
      // Remove from wishlist
      const updated = wishlist.filter((id: string) => id !== listingId);
      localStorage.setItem('wishlist', JSON.stringify(updated));
      alert('Retiré des favoris');
    } else {
      // Add to wishlist
      wishlist.push(listingId);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      alert('Ajouté aux favoris ❤️');
    }
  };

  return (
    <>
      <Navigation />

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-noise"></div>
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <span className="line"></span>
            MAROC · SÉJOURS PREMIUM
          </div>

          <h1>
            Vivez le Maroc{' '}
            <span className="it">autrement</span>
            <span className="small">
              Riads, villas & appartements triés par des experts locaux. Marrakech, Essaouira, Fès, Casablanca.
            </span>
          </h1>

          {/* AI Search Bar */}
          <div className="ai-search">
            <div className="ai-prompt">
              <div className="ic">✨</div>
              <input
                type="text"
                placeholder="« Riad avec piscine à Marrakech pour 6 personnes »"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              />
            </div>
            <div className="divider"></div>
            <div className="ai-classic">
              <div
                ref={locationTriggerRef}
                className="ai-cell"
                onClick={() => {
                  setShowLocationPicker(!showLocationPicker);
                  setShowGuestPicker(false);
                  setShowDatePicker(false);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="l">Où</div>
                <div className="v">{location}</div>
              </div>
              <div
                ref={dateTriggerRef}
                className="ai-cell"
                onClick={() => {
                  setShowDatePicker(!showDatePicker);
                  setShowLocationPicker(false);
                  setShowGuestPicker(false);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="l">Quand</div>
                <div className="v" style={{ color: checkIn || checkOut ? '#0F1011' : '#9EA0A3' }}>
                  {formatDateDisplay()}
                </div>
              </div>
              <div
                ref={guestTriggerRef}
                className="ai-cell"
                onClick={() => {
                  setShowGuestPicker(!showGuestPicker);
                  setShowLocationPicker(false);
                  setShowDatePicker(false);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="l">Voyageurs</div>
                <div className="v">
                  {adults + children} {adults + children > 1 ? 'voyageurs' : 'voyageur'}
                  {children > 0 && `, ${children} enfant${children > 1 ? 's' : ''}`}
                  {infants > 0 && `, ${infants} bébé${infants > 1 ? 's' : ''}`}
                </div>
              </div>
            </div>
            <button onClick={handleAiSearch} className="ai-go">
              →
            </button>
          </div>

          {/* Dropdown Portals - Rendered outside .ai-search to avoid overflow:hidden */}
          <DropdownPortal
            triggerRef={locationTriggerRef}
            isOpen={showLocationPicker}
            onClose={() => setShowLocationPicker(false)}
            alignment="left"
          >
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E9E3D3',
                borderRadius: '12px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.15)',
                padding: '8px',
                minWidth: '180px',
              }}
            >
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setLocation(city);
                    setShowLocationPicker(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 14px',
                    textAlign: 'left',
                    background: location === city ? '#F5F0E0' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: location === city ? '600' : '500',
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          </DropdownPortal>

          <DropdownPortal
            triggerRef={dateTriggerRef}
            isOpen={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            alignment="center"
          >
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E9E3D3',
                borderRadius: '12px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.15)',
                padding: '16px',
                minWidth: '280px',
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Check-in</div>
                <input
                  type="date"
                  value={checkIn ? checkIn.toISOString().split('T')[0] : ''}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    if (e.target.value) {
                      const date = new Date(e.target.value);
                      setCheckIn(date);
                      if (checkOut && date >= checkOut) {
                        setCheckOut(null);
                      }
                    } else {
                      setCheckIn(null);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E9E3D3',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Check-out</div>
                <input
                  type="date"
                  value={checkOut ? checkOut.toISOString().split('T')[0] : ''}
                  min={checkIn ? new Date(checkIn.getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    if (e.target.value) {
                      setCheckOut(new Date(e.target.value));
                    } else {
                      setCheckOut(null);
                    }
                  }}
                  disabled={!checkIn}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E9E3D3',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    opacity: checkIn ? 1 : 0.5,
                    cursor: checkIn ? 'pointer' : 'not-allowed',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setCheckIn(null);
                    setCheckOut(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #E9E3D3',
                    borderRadius: '8px',
                    background: 'transparent',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Effacer
                </button>
                <button
                  onClick={() => setShowDatePicker(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#0F1011',
                    color: '#FAF7F0',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </DropdownPortal>

          <DropdownPortal
            triggerRef={guestTriggerRef}
            isOpen={showGuestPicker}
            onClose={() => setShowGuestPicker(false)}
            alignment="right"
          >
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E9E3D3',
                borderRadius: '12px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.15)',
                padding: '16px',
                minWidth: '380px',
                maxWidth: '420px',
                position: 'relative',
              }}
            >
              {/* Adultes */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid #EBEBEB' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '16px', color: '#222', marginBottom: '2px' }}>Voyageurs</div>
                  <div style={{ fontSize: '14px', color: '#717171' }}>13 ans et plus</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                    onClick={() => setAdults(Math.min(16, adults + 1))}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid #EBEBEB' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '16px', color: '#222', marginBottom: '2px' }}>Enfants</div>
                  <div style={{ fontSize: '14px', color: '#717171' }}>De 2 à 12 ans</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                    onClick={() => setChildren(Math.min(15, children + 1))}
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

              {/* Bébés */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid #EBEBEB' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '16px', color: '#222', marginBottom: '2px' }}>Bébés</div>
                  <div style={{ fontSize: '14px', color: '#717171' }}>Moins de 2 ans</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

              {/* Animaux */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 0' }}>
                <div style={{ flex: 1, paddingRight: '16px' }}>
                  <div style={{ fontWeight: '600', fontSize: '16px', color: '#222', marginBottom: '2px' }}>Animaux domestiques</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

              <button
                onClick={() => {
                  setGuests(adults + children);
                  setShowGuestPicker(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#222',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '12px',
                }}
              >
                Fermer
              </button>
            </div>
          </DropdownPortal>

          {/* AI Suggestions */}
          <div className="ai-suggestions">
            <button className="ai-sug" onClick={() => handleSuggestionClick('Riad avec piscine médina Marrakech')}>
              <span className="em">🏊</span>Riad avec piscine médina
            </button>
            <button className="ai-sug" onClick={() => handleSuggestionClick('Villa vue Atlas Marrakech')}>
              <span className="em">🏔️</span>Villa vue Atlas
            </button>
            <button className="ai-sug" onClick={() => handleSuggestionClick('Bord de mer Essaouira')}>
              <span className="em">🌊</span>Bord de mer Essaouira
            </button>
            <button className="ai-sug" onClick={() => handleSuggestionClick('Grand groupe 8+ personnes')}>
              <span className="em">👨‍👩‍👧‍👦</span>Grand groupe 8+ personnes
            </button>
            <button className="ai-sug" onClick={() => handleSuggestionClick('Meilleur rapport qualité prix Marrakech')}>
              <span className="em">💰</span>Meilleur rapport qualité/prix
            </button>
          </div>
        </div>

        {/* Hero Stats */}
        <div className="hero-stats">
          <div>
            <span className="hs-num">
              <b>142</b> biens
            </span>{' '}
            · MARRAKECH · ESSAOUIRA · FÈS · CASA
          </div>
          <div>
            <span className="hs-num">
              <b>5</b> PMs vérifiés
            </span>{' '}
            · RÉPONSE {'<'} 2H
          </div>
          <div>
            <span className="hs-num">
              <b>4.8</b> note moyenne
            </span>{' '}
            · 12 847 AVIS
          </div>
        </div>
      </section>

      {/* PROPERTY MANAGERS GRID */}
      {propertyManagers.length > 0 && (
      <section className="section">
        <div className="section-head">
          <div>
            <div className="pretitle">Nos Property Managers</div>
            <h2>
              Partenaires <span className="it">sélectionnés</span>
            </h2>
            <div className="sub">
              Gestionnaires vérifiés, spécialistes du Maroc. Réponse rapide, service impeccable, biens exclusifs.
            </div>
          </div>
        </div>

        {/* Brands Grid */}
        <div className="brands-grid">
          {propertyManagers.map((pm, idx) => (
            <Link
              key={pm.slug || pm.id}
              href={`/pm/${pm.slug}`}
              className={`brand-card ${idx === 0 ? 'featured' : ''} ${idx === 1 ? 'b2' : ''} ${idx === 2 ? 'b3' : ''} ${idx === 3 ? 'b4' : ''} ${idx === 4 ? 'b5' : ''}`}
            >
              <div
                className="bg"
                style={
                  pm.coverUrl
                    ? { backgroundImage: `url(${pm.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : pm.brandColor
                      ? { background: `linear-gradient(135deg, ${pm.brandColor.from}, ${pm.brandColor.to})` }
                      : undefined
                }
              ></div>
              <div className="overlay"></div>
              <div className="grain"></div>
              {pm.verified && <div className={`badge${idx === 0 ? ' gold' : ''}`}>✓ VÉRIFIÉ</div>}
              <div className="content">
                <div className="logo">{pm.logoText || pm.name.slice(0, 2).toUpperCase()}</div>
                <div className="nm">
                  {pm.name.split(' ')[0]} <span className="it">{pm.name.split(' ').slice(1).join(' ')}</span>
                </div>
                <div className="tag">{pm.tagline || pm.description}</div>
                <div className="meta">
                  {pm.rating ? (
                    <>
                      <span className="star">★</span> {pm.rating}
                      <span className="dot"></span>
                    </>
                  ) : null}
                  {pm.listingCount} biens
                  {pm.responseTime ? (
                    <>
                      <span className="dot"></span>
                      {pm.responseTime}
                    </>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      )}

      {/* FEATURED LISTINGS */}
      <section className="section full">
        <div className="section-head" style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 32px' }}>
          <div>
            <div className="pretitle">Sélection Sojori</div>
            <h2>
              Nos coups de <span className="it">cœur</span>
            </h2>
          </div>
          <div className="nav-arrows">
            <button className="nav-arrow" onClick={handleCarouselPrev} aria-label="Précédent">←</button>
            <button className="nav-arrow" onClick={handleCarouselNext} aria-label="Suivant">→</button>
          </div>
        </div>

        {/* Carousel */}
        <div className="car-row" ref={carouselRef}>
          {loadingListings ? (
            <div style={{ padding: '60px', textAlign: 'center', width: '100%', color: 'var(--ink3)' }}>
              Chargement des biens...
            </div>
          ) : (
            featuredListings.map((listing, idx) => {
              // Handle both API and mockup data structures
              const listingId = (listing as any)._id || (listing as any).id;
              const pmData = (listing as any).pm
                ? propertyManagers.find((pm) => pm.slug === (listing as any).pm)
                : (listing as any).pmId
                  ? propertyManagers.find((pm) => pm.id === (listing as any).pmId)
                  : null;

              // Build URL with search params including guest breakdown
              const params = new URLSearchParams();
              if (checkIn) params.append('checkIn', checkIn.toISOString().split('T')[0]);
              if (checkOut) params.append('checkOut', checkOut.toISOString().split('T')[0]);
              params.append('guests', (adults + children).toString());
              params.append('adults', adults.toString());
              params.append('children', children.toString());
              if (infants > 0) params.append('infants', infants.toString());
              if (pets > 0) params.append('pets', pets.toString());
              const listingUrl = `/listings/${listingId}${params.toString() ? `?${params.toString()}` : ''}`;

              return (
                <Link key={listingId} href={listingUrl} className="car-item">
                  <div className={`car-photo ${['', 'b', 'c', 'd'][idx % 4]}`}>
                    <div className="grain"></div>
                    <button
                      className="wish"
                      onClick={(e) => handleWishlistToggle(e, listingId)}
                      aria-label="Ajouter aux favoris"
                    >
                      ♡
                    </button>
                    {pmData && (
                      <div className="pm">
                        <div className="pml">{pmData.logoText}</div>
                        {pmData.name.split(' ')[0]}
                      </div>
                    )}
                    <div className="pages">1/5</div>
                    <div className="gathern exclusive">✦ DIRECT</div>
                  </div>
                  <div className="car-info">
                    <div className="top">
                      <div className="nm">{listing.title}</div>
                      <div className="rating">
                        <span className="star">★</span> {listing.rating || 4.8}
                      </div>
                    </div>
                    <div className="loc">
                      {listing.neighborhood || listing.city}, {listing.city.charAt(0).toUpperCase() + listing.city.slice(1)}
                    </div>
                    <div className="price">
                      <b>{cardPrice(listing)} {listing.currency || 'MAD'}</b>
                      <span className="per">/ nuit</span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* AI MAGIC SECTION */}
      <section className="ai-magic">
        <div className="am-inner">
          <div className="am-text">
            <div className="pretitle">Sojori AI</div>
            <h2>
              Trouvez le bien <span className="it">parfait</span>
            </h2>
            <p>
              Notre IA analyse vos critères et vous recommande les biens les plus adaptés. Recherche conversationnelle,
              insights personnalisés, comparaison intelligente.
            </p>

            <div className="am-tools">
              <div className="am-tool">
                <div className="ic">🔍</div>
                <div className="info">
                  <div className="nm">Recherche naturelle</div>
                  <div className="ds">Décrivez ce que vous cherchez en langage naturel</div>
                </div>
              </div>
              <div className="am-tool">
                <div className="ic">💡</div>
                <div className="info">
                  <div className="nm">Recommandations</div>
                  <div className="ds">Suggestions basées sur vos préférences et historique</div>
                </div>
              </div>
              <div className="am-tool">
                <div className="ic">📊</div>
                <div className="info">
                  <div className="nm">Analyse de marché</div>
                  <div className="ds">Tendances prix, disponibilités, meilleures périodes</div>
                </div>
              </div>
            </div>

            <button className="am-cta" onClick={() => (window.location.href = '/search?ai=true')}>
              <span className="ic">✨</span>
              Essayer Sojori AI
            </button>
          </div>

          {/* AI Chat Mockup */}
          <div className="am-chat">
            <div className="am-chat-head">
              <div className="av">✨</div>
              <div>
                <div className="nm">
                  Sojori AI<small>Assistant intelligent</small>
                </div>
              </div>
            </div>
            <div className="am-chat-body">
              <div className="am-msg u">
                <div className="am-bub">Je cherche un riad avec piscine à Marrakech pour 6 personnes</div>
              </div>
              <div className="am-msg b">
                <div className="am-bub">
                  Parfait ! J'ai trouvé 12 riads correspondant à vos critères. Voici ma sélection :
                </div>
                <div className="am-tool-chip">
                  <div className="ic">🔍</div>
                  RECHERCHE · MARRAKECH · 6 PERS · PISCINE
                </div>
                <div className="am-result">
                  <div className="ph"></div>
                  <div className="info">
                    <div className="nm">Riad de la Bahia</div>
                    <div className="meta">Médina · 8 pers · ★ 4.9</div>
                    <div className="price">189€/nuit</div>
                  </div>
                </div>
              </div>
              <div className="am-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className="am-chat-input">
              <input placeholder="Posez une question..." />
              <div className="send">→</div>
            </div>
          </div>
        </div>
      </section>

      {/* CITIES STRIP - 12 VILLES */}
      <section className="cities-strip">
        <div className="cs-head">
          <div>
            <div className="pretitle">Destinations</div>
            <h2>
              Le Maroc en <span className="it">12 villes</span>.
            </h2>
          </div>
          <div className="ds">
            De la Médina millénaire de Fès aux plages de Tanger, en passant par le bleu de Chefchaouen et les vagues
            d'Essaouira.
          </div>
        </div>

        <div className="cs-grid">
          {loadingHomepageCities ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--ink3)' }}>
              Chargement des villes...
            </div>
          ) : (
            homepageCities.map((city, idx) => {
              const classNames: Record<string, string> = {
                marrakech: 'large',
                casablanca: 'casa',
                essaouira: 'ess',
                fes: 'fes',
                tanger: 'tng',
                agadir: 'fes2',
                chefchaouen: 'chf',
                ouarzazate: 'ouar',
              };
              const cardClass = classNames[city.slug] || ['large', 'casa', 'ess', 'fes', 'chf', 'tng', 'ouar', 'fes2'][idx] || '';
              return (
                <Link
                  key={city.slug}
                  href={city.comingSoon ? '#' : `/search?city=${city.slug}`}
                  className={`cs-card ${cardClass} ${city.comingSoon ? 'coming-soon' : ''}`}
                  onClick={(e) => {
                    if (city.comingSoon) {
                      e.preventDefault();
                    }
                  }}
                  style={{ position: 'relative', cursor: city.comingSoon ? 'default' : 'pointer' }}
                >
                  <div className="bg"></div>
                  <div className="overlay"></div>
                  {city.comingSoon && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'rgba(255,255,255,0.95)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontFamily: 'var(--mono)',
                        fontSize: '10px',
                        fontWeight: '700',
                        letterSpacing: '0.08em',
                        color: 'var(--ink)',
                      }}
                    >
                      BIENTÔT
                    </div>
                  )}
                  <div className="info">
                    <div className="nm">{city.displayName}</div>
                    <div className="ct">
                      {city.comingSoon ? 'BIENTÔT DISPONIBLE' : `${city.listingCount} BIENS`}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="trust-bar">
        <div className="trust-inner">
          <div className="trust-item">
            <div className="em">🛡️</div>
            <div className="nm">Paiement sécurisé</div>
            <div className="ds">Transactions chiffrées · 3D Secure · Garantie Sojori</div>
          </div>
          <div className="trust-item">
            <div className="em">✓</div>
            <div className="nm">Biens vérifiés</div>
            <div className="ds">Photos réelles · Visite sur place · Contrôle qualité</div>
          </div>
          <div className="trust-item">
            <div className="em">💬</div>
            <div className="nm">Support 24/7</div>
            <div className="ds">WhatsApp · Email · Téléphone · Réponse {'<'} 2h</div>
          </div>
          <div className="trust-item">
            <div className="em">🔄</div>
            <div className="nm">Annulation flexible</div>
            <div className="ds">Annulation gratuite · Remboursement rapide</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div className="footer-brand">
                <span className="dot"></span>sojori
              </div>
              <div className="footer-tag">Séjours premium au Maroc · Riads, villas & appartements · Sélection experte</div>
              <div className="footer-social">
                <button className="fs-ic">📘</button>
                <button className="fs-ic">📷</button>
                <button className="fs-ic">✕</button>
                <button className="fs-ic">📺</button>
              </div>
            </div>

            <div className="footer-col">
              <h4>Explorer</h4>
              <ul>
                <li><Link href="/search?city=marrakech">Marrakech</Link></li>
                <li><Link href="/search?city=essaouira">Essaouira</Link></li>
                <li><Link href="/search?city=fes">Fès</Link></li>
                <li><Link href="/search?city=casablanca">Casablanca</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Sojori</h4>
              <ul>
                <li><a href="#">À propos</a></li>
                <li><Link href="/verified-hosts">Property Managers</Link></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Carrières</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Support</h4>
              <ul>
                <li><a href="#">Centre d'aide</a></li>
                <li><a href="mailto:contact@sojori.com">Nous contacter</a></li>
                <li><a href="#">Annulation</a></li>
                <li><a href="#">Confiance & Sécurité</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Légal</h4>
              <ul>
                <li><a href="#">CGU</a></li>
                <li><a href="#">CGV</a></li>
                <li><a href="#">Confidentialité</a></li>
                <li><a href="#">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© 2026 Sojori · Tous droits réservés</div>
            <div>🇫🇷 FRANÇAIS · 🇪🇺 EUR · 🇲🇦 MADE IN MOROCCO</div>
          </div>
        </div>
      </footer>

      {/* AI FAB */}
      <button className="ai-fab" onClick={() => (window.location.href = '/search?ai=true')}>
        Sojori AI<div className="ic">✨</div>
      </button>
    </>
  );
}
