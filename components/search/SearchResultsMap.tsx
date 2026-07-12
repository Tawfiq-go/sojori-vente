'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MutableRefObject } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
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

type ResolvedMarker = {
  listing: SearchMapListing;
  lat: number;
  lng: number;
  approximate: boolean;
};

type ClusterBucket = {
  id: string;
  lat: number;
  lng: number;
  markers: ResolvedMarker[];
};

function formatPrice(price: number, currency: string) {
  if (!(price > 0)) return '—';
  return `${Math.round(price).toLocaleString('fr-FR')} ${currency === 'EUR' ? '€' : 'MAD'}`;
}

/** Stable price pill — state classes are toggled on the DOM, never via new DivIcon. */
function createPriceIcon(price: number, currency: string) {
  const html = `<div class="search-price-pin">${formatPrice(price, currency)}</div>`;
  return L.divIcon({
    html,
    className: styles.pricePinWrap,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  });
}

function createClusterIcon(count: number) {
  const html = `<div class="search-cluster-pin"><span>${count}</span></div>`;
  return L.divIcon({
    html,
    className: styles.clusterPinWrap,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  });
}

/** Fan out pins that share nearly-identical GPS (Booking/Airbnb spiderfy). */
function spiderfyCloseMarkers(markers: ResolvedMarker[]): ResolvedMarker[] {
  const groups = new Map<string, ResolvedMarker[]>();
  for (const m of markers) {
    const key = `${m.lat.toFixed(4)},${m.lng.toFixed(4)}`;
    const list = groups.get(key) || [];
    list.push(m);
    groups.set(key, list);
  }

  const out: ResolvedMarker[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      out.push(group[0]);
      continue;
    }
    const radius = 0.00028 * Math.max(1, Math.sqrt(group.length));
    group.forEach((m, i) => {
      const angle = (2 * Math.PI * i) / group.length - Math.PI / 2;
      out.push({
        ...m,
        lat: m.lat + radius * Math.cos(angle),
        lng: m.lng + radius * Math.sin(angle),
      });
    });
  }
  return out;
}

function clusterByGrid(markers: ResolvedMarker[], zoom: number): {
  singles: ResolvedMarker[];
  clusters: ClusterBucket[];
} {
  // Show individual price pills once zoomed in enough (Airbnb-style).
  if (zoom >= 13 || markers.length <= 1) {
    return { singles: spiderfyCloseMarkers(markers), clusters: [] };
  }

  const cell =
    zoom >= 12 ? 0.018 : zoom >= 11 ? 0.03 : zoom >= 10 ? 0.05 : zoom >= 8 ? 0.1 : 0.2;

  const buckets = new Map<string, ResolvedMarker[]>();
  for (const m of markers) {
    const key = `${Math.floor(m.lat / cell)},${Math.floor(m.lng / cell)}`;
    const list = buckets.get(key) || [];
    list.push(m);
    buckets.set(key, list);
  }

  const singles: ResolvedMarker[] = [];
  const clusters: ClusterBucket[] = [];

  for (const [key, group] of buckets) {
    if (group.length === 1) {
      singles.push(group[0]);
      continue;
    }
    const lat = group.reduce((s, m) => s + m.lat, 0) / group.length;
    const lng = group.reduce((s, m) => s + m.lng, 0) / group.length;
    clusters.push({ id: `c-${key}`, lat, lng, markers: group });
  }

  return { singles: spiderfyCloseMarkers(singles), clusters };
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
      padding: [28, 28],
    });
  }, [map, fitKey, points]);

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

function MapZoomTracker({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMap();
  useEffect(() => {
    onZoom(map.getZoom());
  }, [map, onZoom]);
  useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
  });
  return null;
}

function MapClickDismiss({ onDismiss }: { onDismiss: () => void }) {
  useMapEvents({
    click: () => onDismiss(),
  });
  return null;
}

function MapHoverPreview({
  listing,
  lat,
  lng,
  listingUrl,
  onClose,
}: {
  listing: SearchMapListing;
  lat: number;
  lng: number;
  listingUrl?: string;
  onClose: () => void;
}) {
  const map = useMap();
  const [previewStyle, setPreviewStyle] = useState<CSSProperties>({ opacity: 0 });

  useEffect(() => {
    const update = () => {
      const size = map.getSize();
      const pt = map.latLngToContainerPoint([lat, lng]);
      const cardW = 280;
      const cardH = 260;
      let left = pt.x;
      let top = pt.y - 20;
      // Keep card inside map viewport (Airbnb-like).
      left = Math.min(Math.max(left, cardW / 2 + 8), size.x - cardW / 2 - 8);
      top = Math.min(Math.max(top, cardH + 8), size.y - 12);
      setPreviewStyle({
        position: 'absolute',
        left,
        top,
        transform: 'translate(-50%, -100%)',
        zIndex: 1200,
        opacity: 1,
        pointerEvents: 'auto',
      });
    };

    update();
    map.on('move zoom resize', update);
    return () => {
      map.off('move zoom resize', update);
    };
  }, [map, lat, lng]);

  if (typeof document === 'undefined') return null;
  const container = map.getContainer();
  if (!container) return null;

  return createPortal(
    <SearchMapListingPreview
      listing={listing}
      style={previewStyle}
      listingUrl={listingUrl}
      onClose={onClose}
    />,
    container,
  );
}

function PriceMarker({
  marker,
  highlight,
  interactive,
  onHover,
  onSelect,
}: {
  marker: ResolvedMarker;
  highlight: 'default' | 'active' | 'dimmed';
  interactive: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const icon = useMemo(
    () => createPriceIcon(marker.listing.price, marker.listing.currency || 'MAD'),
    [marker.listing.price, marker.listing.currency],
  );

  useEffect(() => {
    const el = markerRef.current?.getElement();
    const pin = el?.querySelector('.search-price-pin');
    if (!pin) return;
    pin.classList.toggle('search-price-pin-active', highlight === 'active');
    pin.classList.toggle('search-price-pin-dimmed', highlight === 'dimmed');
  }, [highlight]);

  useEffect(() => {
    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, []);

  return (
    <Marker
      ref={markerRef}
      position={[marker.lat, marker.lng]}
      icon={icon}
      zIndexOffset={highlight === 'active' ? 1000 : 0}
      eventHandlers={
        interactive
          ? {
              mouseover: () => {
                if (clearTimer.current) clearTimeout(clearTimer.current);
                onHover(marker.listing.id);
              },
              mouseout: () => {
                if (clearTimer.current) clearTimeout(clearTimer.current);
                // Debounce so moving between nearby pins / list doesn't flicker.
                clearTimer.current = setTimeout(() => onHover(null), 140);
              },
              click: (e) => {
                L.DomEvent.stopPropagation(e.originalEvent);
                onSelect(marker.listing.id);
              },
            }
          : undefined
      }
    />
  );
}

function MapRefCapture({ mapRef }: { mapRef: MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);
  return null;
}

function ClusterMarker({
  cluster,
  interactive,
  onClick,
}: {
  cluster: ClusterBucket;
  interactive: boolean;
  onClick: (cluster: ClusterBucket) => void;
}) {
  const icon = useMemo(() => createClusterIcon(cluster.markers.length), [cluster.markers.length]);
  return (
    <Marker
      position={[cluster.lat, cluster.lng]}
      icon={icon}
      zIndexOffset={200}
      eventHandlers={
        interactive
          ? {
              click: (e) => {
                L.DomEvent.stopPropagation(e.originalEvent);
                onClick(cluster);
              },
            }
          : undefined
      }
    />
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
  const [zoom, setZoom] = useState(12);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const resolved = useMemo(
    () =>
      listings.map((listing) => {
        const coords = resolveListingCoords(listing);
        return { listing, ...coords };
      }),
    [listings],
  );

  const center = cityCenter(city);
  const points = useMemo(
    () => resolved.map((m) => clampToMoroccoBounds(m.lat, m.lng) as [number, number]),
    [resolved],
  );
  const fitKey = useMemo(
    () =>
      `${city || 'maroc'}|${resolved
        .map((m) => `${m.listing.id}:${m.lat.toFixed(4)},${m.lng.toFixed(4)}`)
        .join(';')}`,
    [city, resolved],
  );
  // Stable key — remounting on every length change caused flicker.
  const mapKey = `${city || 'maroc'}-${compact ? 'c' : 'f'}`;

  const { singles, clusters } = useMemo(
    () => clusterByGrid(resolved, zoom),
    [resolved, zoom],
  );

  const highlightId = selectedId || activeListingId || null;

  const selectedMarker = useMemo(() => {
    if (!selectedId) return null;
    return (
      singles.find((m) => m.listing.id === selectedId) ||
      resolved.find((m) => m.listing.id === selectedId) ||
      null
    );
  }, [selectedId, singles, resolved]);

  const handleHover = useCallback(
    (id: string | null) => {
      onListingHover?.(id);
    },
    [onListingHover],
  );

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId((prev) => (prev === id ? null : id));
      onListingHover?.(id);
      onListingClick?.(id);
    },
    [onListingClick, onListingHover],
  );

  const handleClusterClick = useCallback((cluster: ClusterBucket) => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = L.latLngBounds(cluster.markers.map((m) => [m.lat, m.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.35), { animate: true, maxZoom: 15, padding: [40, 40] });
  }, []);

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
        <MapRefCapture mapRef={mapRef} />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />
        <FitBounds points={points} fitKey={fitKey} />
        <MapResize trigger={mapKey} />
        <MapZoomTracker onZoom={setZoom} />
        {interactive && <MapClickDismiss onDismiss={() => setSelectedId(null)} />}

        {clusters.map((cluster) => (
          <ClusterMarker
            key={cluster.id}
            cluster={cluster}
            interactive={interactive}
            onClick={handleClusterClick}
          />
        ))}

        {singles.map((marker) => {
          const pinState: 'default' | 'active' | 'dimmed' = !highlightId
            ? 'default'
            : highlightId === marker.listing.id
              ? 'active'
              : 'dimmed';

          return (
            <PriceMarker
              key={marker.listing.id}
              marker={marker}
              highlight={pinState}
              interactive={interactive}
              onHover={handleHover}
              onSelect={handleSelect}
            />
          );
        })}

        {interactive && selectedMarker && (
          <MapHoverPreview
            listing={selectedMarker.listing}
            lat={selectedMarker.lat}
            lng={selectedMarker.lng}
            listingUrl={listingUrlBuilder?.(selectedMarker.listing.id)}
            onClose={() => setSelectedId(null)}
          />
        )}
      </MapContainer>
    </div>
  );
}
