'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DropdownPortal } from '@/components/DropdownPortal';
import { useAvailableCities } from '@/lib/hooks/useCities';
import GuestPicker, { formatGuestSummary, type GuestCounts } from './GuestPicker';

type SearchNavBarProps = {
  locationLabel: string;
  datesLabel: string;
  guestSummary: string;
  initialGuests: GuestCounts;
  initialCheckIn?: string | null;
  initialCheckOut?: string | null;
};

type OpenPanel = 'where' | 'when' | 'who' | null;

const FALLBACK_CITIES = ['Marrakech', 'Casablanca', 'Essaouira', 'Fès', 'Tanger', 'Agadir'];

function formatCityLabel(raw: string | null | undefined): string {
  if (!raw) return 'Maroc';
  return raw
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export default function SearchNavBar({
  locationLabel,
  datesLabel,
  guestSummary,
  initialGuests,
  initialCheckIn,
  initialCheckOut,
}: SearchNavBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cities: apiCities } = useAvailableCities();

  const locationRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);

  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [location, setLocation] = useState(locationLabel);
  const [guests, setGuests] = useState<GuestCounts>(initialGuests);
  const [checkIn, setCheckIn] = useState(initialCheckIn || '');
  const [checkOut, setCheckOut] = useState(initialCheckOut || '');

  const cities = useMemo(
    () =>
      apiCities.length > 0 ? apiCities.map((c) => c.displayName) : FALLBACK_CITIES,
    [apiCities],
  );

  useEffect(() => {
    setLocation(locationLabel);
  }, [locationLabel]);

  useEffect(() => {
    setGuests(initialGuests);
  }, [initialGuests.adults, initialGuests.children, initialGuests.infants, initialGuests.pets]);

  useEffect(() => {
    setCheckIn(initialCheckIn || '');
    setCheckOut(initialCheckOut || '');
  }, [initialCheckIn, initialCheckOut]);

  const pushSearch = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '') params.delete(k);
      else params.set(k, v);
    }
    router.push(`/search?${params.toString()}`);
  };

  const applyGuests = (g: GuestCounts) => {
    const total = g.adults + g.children;
    pushSearch({
      adults: String(g.adults),
      children: String(g.children),
      infants: g.infants > 0 ? String(g.infants) : undefined,
      pets: g.pets > 0 ? String(g.pets) : undefined,
      guests: String(total),
    });
  };

  const applyLocation = (cityName: string) => {
    setLocation(cityName);
    pushSearch({ city: cityName.toLowerCase() });
    setOpenPanel(null);
  };

  const applyDates = () => {
    pushSearch({
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
    });
    setOpenPanel(null);
  };

  const runSearch = () => {
    const total = guests.adults + guests.children;
    pushSearch({
      city: location && location !== 'Maroc' ? location.toLowerCase() : searchParams.get('city') || undefined,
      adults: String(guests.adults),
      children: String(guests.children),
      infants: guests.infants > 0 ? String(guests.infants) : undefined,
      pets: guests.pets > 0 ? String(guests.pets) : undefined,
      guests: String(total),
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
    });
    setOpenPanel(null);
  };

  const togglePanel = (panel: OpenPanel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };

  const datesDisplay =
    checkIn && checkOut
      ? `${new Date(`${checkIn}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${new Date(`${checkOut}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
      : datesLabel;

  const guestsDisplay = formatGuestSummary(guests);

  return (
    <nav className="search-nav">
      <Link href="/" className="brand">
        <span className="dot" />
        sojori
      </Link>

      <div className="search-pills">
        <div
          className="sp-cell sp-clickable"
          ref={locationRef}
          role="button"
          tabIndex={0}
          onClick={() => togglePanel('where')}
          onKeyDown={(e) => e.key === 'Enter' && togglePanel('where')}
        >
          <div className="l">Où</div>
          <div className="v">{location || formatCityLabel(searchParams.get('city'))}</div>
        </div>

        <div
          className="sp-cell sp-clickable"
          ref={dateRef}
          role="button"
          tabIndex={0}
          onClick={() => togglePanel('when')}
          onKeyDown={(e) => e.key === 'Enter' && togglePanel('when')}
        >
          <div className="l">Quand</div>
          <div className={`v ${!checkIn && !checkOut ? 'muted' : ''}`}>{datesDisplay}</div>
        </div>

        <div
          className="sp-cell sp-clickable"
          ref={guestRef}
          role="button"
          tabIndex={0}
          onClick={() => togglePanel('who')}
          onKeyDown={(e) => e.key === 'Enter' && togglePanel('who')}
        >
          <div className="l">Voyageurs</div>
          <div className="v">{guestsDisplay || guestSummary}</div>
        </div>

        <button type="button" className="go" aria-label="Rechercher" onClick={runSearch}>
          🔍
        </button>
      </div>

      <div className="nav-right">
        <button type="button" className="lang-pill">
          FR
        </button>
        <Link href="/wishlist" className="icon-btn">
          ♡
        </Link>
        <Link href="/login" className="nav-cta">
          Se connecter
        </Link>
      </div>

      <DropdownPortal
        triggerRef={locationRef}
        isOpen={openPanel === 'where'}
        onClose={() => setOpenPanel(null)}
        alignment="left"
      >
        <div className="search-dropdown-panel search-dropdown-cities">
          {cities.map((cityName) => (
            <button
              key={cityName}
              type="button"
              className={`search-dropdown-city ${location === cityName ? 'on' : ''}`}
              onClick={() => applyLocation(cityName)}
            >
              {cityName}
            </button>
          ))}
        </div>
      </DropdownPortal>

      <DropdownPortal
        triggerRef={dateRef}
        isOpen={openPanel === 'when'}
        onClose={() => setOpenPanel(null)}
        alignment="center"
      >
        <div className="search-dropdown-panel">
          <div className="search-dropdown-field">
            <label>Check-in</label>
            <input
              type="date"
              value={checkIn}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && e.target.value >= checkOut) setCheckOut('');
              }}
            />
          </div>
          <div className="search-dropdown-field">
            <label>Check-out</label>
            <input
              type="date"
              value={checkOut}
              min={
                checkIn
                  ? new Date(new Date(`${checkIn}T12:00:00`).getTime() + 86400000)
                      .toISOString()
                      .split('T')[0]
                  : new Date().toISOString().split('T')[0]
              }
              disabled={!checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
          <div className="search-dropdown-actions">
            <button
              type="button"
              className="search-dropdown-secondary"
              onClick={() => {
                setCheckIn('');
                setCheckOut('');
              }}
            >
              Effacer
            </button>
            <button type="button" className="search-dropdown-primary" onClick={applyDates}>
              OK
            </button>
          </div>
        </div>
      </DropdownPortal>

      <DropdownPortal
        triggerRef={guestRef}
        isOpen={openPanel === 'who'}
        onClose={() => setOpenPanel(null)}
        alignment="right"
      >
        <GuestPicker
          value={guests}
          onChange={setGuests}
          onClose={() => {
            applyGuests(guests);
            setOpenPanel(null);
          }}
        />
      </DropdownPortal>
    </nav>
  );
}

export { formatGuestSummary };
