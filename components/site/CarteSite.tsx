'use client'

/**
 * La carte des logements du site d'un PM : la carte de la recherche de sojori-vente (Leaflet,
 * regroupement, bornée au Maroc), chargée côté navigateur seulement. Un clic ouvre la page logement.
 */
import dynamic from 'next/dynamic'
import type { SearchMapListing } from '@/components/search/SearchResultsMap'

const SearchResultsMap = dynamic(() => import('@/components/search/SearchResultsMap'), { ssr: false })

export function CarteSite({ logements, suffixe }: { logements: SearchMapListing[]; suffixe: string }) {
  return (
    <div className="carte__cadre">
      <SearchResultsMap listings={logements} listingUrlBuilder={(id) => `/listings/${id}${suffixe}`} />
    </div>
  )
}
