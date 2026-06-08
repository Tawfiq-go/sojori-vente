'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MOROCCO_MAP_MAX_BOUNDS,
  MOROCCO_MAP_MAX_ZOOM,
  MOROCCO_MAP_MIN_ZOOM,
  cityCenter,
  clampToMoroccoBounds,
  resolveListingCoords,
} from '@/lib/geo/moroccoCities';
import SearchMapListingPreview from './SearchMapListingPreview';
import styles from './SearchResultsMap.module.css';

export type SearchMapListing = {
  id: string;
  title: string;
  city?: string;
  neighborhood?: string;
  price: number;
  currency?: string;
  lat?: number;
  lng?: number;
  image?: string;
  rating?: number;
};

type SearchResultsMapProps = {
  city?: string | null;
  listings: SearchMapListing[];
  activeListingId?: string | null;
  onListingHover?: (id: string | null) => void;
  onListingClick?: (id: string) => void;
  compact?: boolean;
  interactive?: boolean;
  listingUrlBuilder?: (id: string) => string;
};

function createPriceIcon(price: number, currency: string, state: 'default' | 'active' | 'dimmed') {
  const label =
    price > 0
      ? `${Math.round(price).toLocaleString('fr-FR')} ${currency === 'EUR' ? '€' : 'MAD'}`
      : '—';
  const stateClass =
    state === 'active' ? 'search-price-pin-active' : state === 'dimmed' ? 'search-price-pin-dimmed' : '';
  const html = `<div class="search-price-pin ${stateClass}">${label}</div>`;
  return L.divIcon({
    html,
    className: styles.pricePinWrap,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function FitBounds({ points, fitKey }: { points: [number, number][]; fitKey: string }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const moroccoBounds = L.latLngBounds(MOROCCO_MAP_MAX_BOUNDS);
    const clamped = points.map(([lat, lng]) => clampToMoroccoBounds(lat, lng));

    if (clamped.length === 1) {
      map.setView(clamped[0], 13, { animate: false });
      return;
    }

    const bounds = L.latLngBounds(clamped);
    const padded = bounds.pad(0.18);
    const fitTarget = padded.intersects(moroccoBounds) ? padded : L.latLngBounds(clamped);

    map.fitBounds(fitTarget, {
      animate: false,
      maxZoom: 14,
      padding: [24, 24],
    });
    // fitKey = listings/city changed only — never on hover
  }, [map, fitKey]);

  return null;
}

function MapResize({ trigger }: { trigger: string }) {
  const map = useMap();
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      map.invalidateSize({ animate: false });
    });
    return () => window.cancelAnimationFrame(id);
  }, [map, trigger]);
  return null;
}

function MapHoverPreview({
  listing,
  lat,
  lng,
  listingUrl,
}: {
  listing: SearchMapListing | null;
  lat: number;
  lng: number;
  listingUrl?: string;
}) {
  const map = useMap();
  const [previewStyle, setPreviewStyle] = useState<CSSProperties>({ opacity: 0 });

  useEffect(() => {
    if (!listing) {
      setPreviewStyle({ opacity: 0, pointerEvents: 'none' });
      return;
    }

    const update = () => {
      const pt = map.latLngToContainerPoint([lat, lng]);
      setPreviewStyle({
        position: 'absolute',
        left: pt.x,
        top: pt.y,
        transform: 'translate(-50%, calc(-100% - 16px))',
        zIndex: 1000,
        opacity: 1,
        pointerEvents: 'auto',
      });
    };

    update();
    map.on('move zoom resize', update);
    return () => {
      map.off('move zoom resize', update);
    };
  }, [map, listing, lat, lng]);

  if (!listing || typeof document === 'undefined') return null;

  const container = map.getContainer();
  if (!container) return null;

  return createPortal(
    <SearchMapListingPreview listing={listing} style={previewStyle} listingUrl={listingUrl} />,
    container,
  );
}

export default function SearchResultsMap({
  city,
  listings,
  activeListingId,
  onListingHover,
  onListingClick,
  compact = false,
  interactive = true,
  listingUrlBuilder,
}: SearchResultsMapProps) {
  const markers = useMemo(
    () =>
      listings.map((listing) => {
        const coords = resolveListingCoords(listing);
        return { listing, ...coords };
      }),
    [listings],
  );

  const center = cityCenter(city);
  const points = useMemo(
    () => markers.map((m) => clampToMoroccoBounds(m.lat, m.lng) as [number, number]),
    [markers],
  );
  const fitKey = useMemo(
    () =>
      `${city || 'maroc'}|${markers
        .map((m) => `${m.listing.id}:${m.lat.toFixed(5)},${m.lng.toFixed(5)}`)
        .join(';')}`,
    [city, markers],
  );
  const mapKey = `${city || 'maroc'}-${listings.length}-${compact ? 'c' : 'f'}`;

  const activeMarker = markers.find((m) => m.listing.id === activeListingId) || null;

  if (!listings.length) {
    return (
      <div className={`${styles.empty} ${compact ? styles.emptyCompact : ''}`}>
        <span>📍</span>
        <p>Aucun bien à afficher sur la carte</p>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} ${compact ? styles.wrapperCompact : ''}`}>
      <MapContainer
        key={mapKey}
        center={clampToMoroccoBounds(center.lat, center.lng)}
        zoom={12}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        maxBounds={MOROCCO_MAP_MAX_BOUNDS}
        maxBoundsViscosity={1}
        minZoom={MOROCCO_MAP_MIN_ZOOM}
        maxZoom={MOROCCO_MAP_MAX_ZOOM}
        className={styles.map}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />
        <FitBounds points={points} fitKey={fitKey} />
        <MapResize trigger={mapKey} />

        {markers.map(({ listing, lat, lng }) => {
          const pinState: 'default' | 'active' | 'dimmed' = !activeListingId
            ? 'default'
            : activeListingId === listing.id
              ? 'active'
              : 'dimmed';

          return (
            <Marker
              key={listing.id}
              position={[lat, lng]}
              icon={createPriceIcon(listing.price, listing.currency || 'MAD', pinState)}
              zIndexOffset={activeListingId === listing.id ? 1000 : 0}
              eventHandlers={
                interactive
                  ? {
                      mouseover: () => onListingHover?.(listing.id),
                      mouseout: () => onListingHover?.(null),
                      click: () => onListingClick?.(listing.id),
                    }
                  : undefined
              }
            />
          );
        })}

        {interactive && activeMarker && (
          <MapHoverPreview
            listing={activeMarker.listing}
            lat={activeMarker.lat}
            lng={activeMarker.lng}
            listingUrl={listingUrlBuilder?.(activeMarker.listing.id)}
          />
        )}
      </MapContainer>
    </div>
  );
}
