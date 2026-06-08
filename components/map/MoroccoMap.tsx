'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MOROCCO_MAP_MAX_BOUNDS,
  MOROCCO_MAP_MAX_ZOOM,
  MOROCCO_MAP_MIN_ZOOM,
  CITY_COORDS,
  normalizeCityKey,
  clampToMoroccoBounds,
} from '@/lib/geo/moroccoCities';
import styles from './MoroccoMap.module.css';

interface MoroccoMapProps {
  city?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
}

// Custom marker icon (gold pin style Sojori)
const createCustomIcon = () => {
  const iconHtml = `
    <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path
        d="M20 2 C10 2 2 10 2 20 C2 30 20 48 20 48 C20 48 38 30 38 20 C38 10 30 2 20 2 Z"
        fill="#a89a72"
        filter="url(#shadow)"
      />
      <circle cx="20" cy="18" r="8" fill="white"/>
      <circle cx="20" cy="18" r="4" fill="#a89a72"/>
    </svg>
  `;

  return new L.DivIcon({
    html: iconHtml,
    className: styles.customMarker,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
  });
};

// Component to recenter map without animation
function MapRecenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return;

    let cancelled = false;
    const run = () => {
      if (cancelled || !map?.getContainer?.()) return;
      try {
        map.invalidateSize({ animate: false });
        map.setView([lat, lng], zoom, { animate: false });
      } catch {
        // Map not ready
      }
    };

    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(run);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
    };
  }, [lat, lng, zoom, map]);

  return null;
}

export function MoroccoMap({
  city = 'casablanca',
  neighborhood,
  lat,
  lng,
  zoom = 13
}: MoroccoMapProps) {
  // Use provided coordinates or lookup by city name
  const cityKey = normalizeCityKey(city);
  const coords = lat && lng
    ? (() => {
        const [clat, clng] = clampToMoroccoBounds(lat, lng);
        return { lat: clat, lng: clng };
      })()
    : CITY_COORDS[cityKey] || CITY_COORDS.casablanca;

  const mapKey = `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`;
  const customIcon = createCustomIcon();

  return (
    <div className={styles.wrapper}>
      <MapContainer
        key={mapKey}
        center={[coords.lat, coords.lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        className={styles.mapContainer}
        style={{ height: '100%', width: '100%' }}
        maxBounds={MOROCCO_MAP_MAX_BOUNDS}
        maxBoundsViscosity={1}
        minZoom={MOROCCO_MAP_MIN_ZOOM}
        maxZoom={MOROCCO_MAP_MAX_ZOOM}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <Marker position={[coords.lat, coords.lng]} icon={customIcon}>
          <Popup className={styles.popup}>
            <div className={styles.popupContent}>
              <div className={styles.cityName}>{city}</div>
              {neighborhood && (
                <div className={styles.neighborhood}>{neighborhood}</div>
              )}
            </div>
          </Popup>
        </Marker>

        <MapRecenter lat={coords.lat} lng={coords.lng} zoom={zoom} />
      </MapContainer>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.pin}>📍</span>
        <span className={styles.text}>Emplacement approximatif</span>
      </div>
    </div>
  );
}
