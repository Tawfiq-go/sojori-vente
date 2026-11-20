'use client'

import { AttributionControl, Circle, MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

/** Zone approximative : le point exact n'est pas montré, seulement un cercle de 600 m autour (règle du produit). */
const RAYON_M = 600

export default function CarteVillaPlan({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      scrollWheelZoom={false}
      attributionControl={false}
      className="villa__plan"
      style={{ height: 360, width: '100%' }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={17}
      />
      <AttributionControl prefix={false} />
      <Circle
        center={[lat, lng]}
        radius={RAYON_M}
        pathOptions={{ color: '#7c927a', fillColor: '#7c927a', fillOpacity: 0.25, weight: 2 }}
      />
    </MapContainer>
  )
}
