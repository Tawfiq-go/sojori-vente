'use client'

/** La confirmation. En démonstration, les coordonnées viennent de `sessionStorage` (jamais de l'adresse) ; sans elles, rien n'est inventé. */
import { useEffect, useState } from 'react'
import { mm } from '@/lib/site/moteur-mots'
import type { Langue } from '@/lib/site/types'
import { CLE_DEMO, type Coordonnees } from './Paiement'

export function Confirmation({ langue, typeId, accueil, demo, recap }: { langue: Langue; typeId: string; accueil: string; demo: boolean; recap: React.ReactNode }) {
  const [lu, setLu] = useState<(Coordonnees & { reference: string }) | null | undefined>(undefined)
  useEffect(() => {
    try {
      const brut = sessionStorage.getItem(CLE_DEMO(typeId))
      setLu(brut ? (JSON.parse(brut) as Coordonnees & { reference: string }) : null)
    } catch {
      setLu(null)
    }
  }, [typeId])
  if (lu === undefined) return null
  if (!lu) {
    return (
      <div className="moteur-confirmation">
        <p>{mm('rienARetrouver', langue)}</p>
        <a className="bouton" href={accueil}>
          {mm('retourAccueil', langue)}
        </a>
      </div>
    )
  }
  return (
    <div className="moteur-confirmation">
      <div className="moteur-confirmation__tete">
        <h1>{mm('confirmeTitre', langue, { p: lu.prenom })}</h1>
        <p className="moteur-confirmation__sous">{mm('confirmeSousTitre', langue)}</p>
        <p className="moteur-confirmation__ref">
          {mm('reference', langue)} <b>{lu.reference}</b>
        </p>
        <p>{mm('confirmeMail', langue, { e: lu.email })}</p>
        {demo && <p className="moteur-confirmation__demo">{mm('demoNote', langue)}</p>}
      </div>
      {recap}
      <a className="bouton" href={accueil}>
        {mm('retourAccueil', langue)}
      </a>
    </div>
  )
}
