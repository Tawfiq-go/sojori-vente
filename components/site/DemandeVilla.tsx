'use client'

/**
 * La demande d'une villa depuis le site du PM : dates et voyageurs, puis un message WhatsApp prêt à envoyer
 * au numéro du PM. Aucun paiement ni compte Sojori : l'équipe du client répond avec la disponibilité et le
 * prix exact (la page de paiement de la plateforme n'est pas encore à la marque du client).
 */
import { useMemo, useState } from 'react'

export function DemandeVilla({
  whatsapp,
  titre,
  nomSite,
  mots,
  prix,
  devise,
  maxVoyageurs,
}: {
  whatsapp: string | null
  titre: string
  nomSite: string
  mots: { arrivee: string; depart: string; voyageurs: string; demander: string; note: string; parNuit: string; aPartirDe: string }
  prix?: number
  devise: string
  maxVoyageurs?: number
}) {
  const [arrivee, setArrivee] = useState('')
  const [depart, setDepart] = useState('')
  const [voyageurs, setVoyageurs] = useState(2)
  const nuits = useMemo(() => {
    if (!arrivee || !depart) return 0
    const n = Math.round((Date.parse(depart) - Date.parse(arrivee)) / 86_400_000)
    return n > 0 ? n : 0
  }, [arrivee, depart])
  const lien = useMemo(() => {
    if (!whatsapp) return null
    const texte = `${nomSite} — ${titre}\n${arrivee ? `${mots.arrivee} : ${arrivee}\n` : ''}${depart ? `${mots.depart} : ${depart}\n` : ''}${mots.voyageurs} : ${voyageurs}`
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(texte)}`
  }, [whatsapp, nomSite, titre, arrivee, depart, voyageurs, mots])
  return (
    <aside className="villa__demande">
      {prix !== undefined && (
        <p className="villa__prix">
          <span>{mots.aPartirDe}</span> <b>{new Intl.NumberFormat('fr-FR').format(prix)} {devise}</b> <span>{mots.parNuit}</span>
        </p>
      )}
      <label>
        <span>{mots.arrivee}</span>
        <input type="date" value={arrivee} onChange={(e) => setArrivee(e.target.value)} />
      </label>
      <label>
        <span>{mots.depart}</span>
        <input type="date" value={depart} min={arrivee} onChange={(e) => setDepart(e.target.value)} />
      </label>
      <label>
        <span>{mots.voyageurs.charAt(0).toUpperCase() + mots.voyageurs.slice(1)}</span>
        <input type="number" min={1} max={maxVoyageurs ?? 20} value={voyageurs} onChange={(e) => setVoyageurs(Math.max(1, Number(e.target.value) || 1))} />
      </label>
      {prix !== undefined && nuits > 0 && (
        <p className="villa__estimation">
          {nuits} × {new Intl.NumberFormat('fr-FR').format(prix)} {devise}
        </p>
      )}
      {lien && (
        <a className="bouton" href={lien} target="_blank" rel="noopener noreferrer">
          {mots.demander}
        </a>
      )}
      <p className="villa__note">{mots.note}</p>
    </aside>
  )
}
