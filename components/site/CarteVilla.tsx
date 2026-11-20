'use client'

/**
 * Le plan d'une villa dans le site du PM : UN point, une zone approximative (cercle), jamais d'autres
 * logements ni d'autres PM. Fond OpenStreetMap. Chargé côté navigateur seulement (Leaflet).
 */
import dynamic from 'next/dynamic'

const Plan = dynamic(() => import('./CarteVillaPlan'), {
  ssr: false,
  loading: () => <div className="villa__plan villa__plan--attente" />,
})

export function CarteVilla({ lat, lng }: { lat: number; lng: number }) {
  return <Plan lat={lat} lng={lng} />
}
