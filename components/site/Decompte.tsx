'use client'

/**
 * Le décompte d'une offre : jours, heures, minutes, secondes jusqu'à `finUtc` (un instant UTC calculé par srv-site :
 * aucun fuseau à gérer ici). Rendu après le montage (l'heure du visiteur n'est pas celle du serveur) ; à zéro, il
 * annonce la fin sans recharger la page. Aucun appel réseau, aucun cookie.
 */
import { useSyncExternalStore } from 'react'
import { reste } from '@/lib/site/offre'

type Libelles = { j: string; h: string; m: string; s: string; fin: string }

/** Un tic par seconde ; côté serveur (et avant le montage) l'heure n'est pas connue : rien n'est affiché. */
const sAbonner = (tic: () => void) => {
  const id = setInterval(tic, 1000)
  return () => clearInterval(id)
}
const maintenantClient = () => Math.floor(Date.now() / 1000) * 1000

export function Decompte({ finUtc, libelles }: { finUtc: string; libelles: Libelles }) {
  const fin = Date.parse(finUtc)
  const maintenant = useSyncExternalStore(sAbonner, maintenantClient, () => null)
  // Avant le montage : l'emplacement est réservé (pas de saut de page).
  if (maintenant === null) return <div className="offre__decompte" aria-hidden="true" />
  const r = reste(fin, maintenant)
  if (!r) return <p className="offre__decompte offre__decompte--fin">{libelles.fin}</p>
  const unites: Array<[number, string]> = [
    [r.j, libelles.j],
    [r.h, libelles.h],
    [r.m, libelles.m],
    [r.s, libelles.s],
  ]
  return (
    <div className="offre__decompte" role="timer" aria-live="off">
      {unites.map(([n, l]) => (
        <div key={l} className="offre__unite">
          <strong>{String(n).padStart(2, '0')}</strong>
          <span>{l}</span>
        </div>
      ))}
    </div>
  )
}
