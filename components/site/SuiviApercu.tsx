'use client'
/**
 * Ce que tout aperçu d'un site PM ajoute à la page, sans toucher au rendu public :
 *  - `sojori:chemin` (vers le tableau de bord) : l'adresse où l'on se trouve dans le cadre. Le tableau de bord s'en
 *    sert pour RENOUVELER le lien d'aperçu (15 min) sans ramener le client à l'accueil, et pour « Ouvrir en plein écran »
 *    sur la page courante.
 *  - le bandeau « Mode essai » : l'aperçu est privé, rien n'est envoyé ni débité (Tawfiq, 21/11/2026 : le client teste
 *    tout le parcours avant le DNS).
 * Le même composant sert les trois onglets (Site web, Moteur de réservation, Landing pages) : un seul comportement.
 */
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { origineAdmise } from './AnnotationApercu'

const ORIGINES = ['https://app.sojori.com', 'https://admin.sojori.com']

export function SuiviApercu({ mots }: { mots: { essai: string; detail: string } }) {
  const chemin = usePathname()
  const requete = useSearchParams().toString()
  useEffect(() => {
    if (window.parent === window) return
    const message = { type: 'sojori:chemin', chemin, requete }
    for (const o of [...ORIGINES, window.location.origin]) if (origineAdmise(o, window.location.origin)) window.parent.postMessage(message, o)
  }, [chemin, requete])
  return (
    <div className="bandeau-essai" role="status" aria-live="polite">
      <strong>{mots.essai}</strong>
      <span>{mots.detail}</span>
    </div>
  )
}
