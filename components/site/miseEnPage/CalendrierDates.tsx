'use client'

/**
 * Le calendrier des dates d'un événement : seules les dates lues par srv-site se choisissent (avec leurs places) ; aucune date n'est
 * calculée ici. Fermé par un clic à côté ou Échap. Lundi d'abord.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { dateCourte, dateLongue, joursDuMois, moisVoisin } from '@/lib/site/commande'
import { mot } from '@/lib/site/texte'
import type { Langue } from '@/lib/site/types'

type Props = { dates: ReadonlyArray<{ date: string; restantes: number }>; choisie: string; onChoisir: (date: string) => void; langue: Langue; indication?: string; desactive?: boolean }

export function CalendrierDates({ dates, choisie, onChoisir, langue, indication, desactive }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const premier = dates[0]?.date.slice(0, 7) ?? ''
  const dernier = dates[dates.length - 1]?.date.slice(0, 7) ?? ''
  const [mois, setMois] = useState((choisie || dates[0]?.date || '').slice(0, 7))
  const boite = useRef<HTMLDivElement>(null)
  const id = useId()
  const loc = langue === 'ar' ? 'ar-MA' : langue
  const restantes = new Map(dates.map((d) => [d.date, d.restantes]))

  useEffect(() => {
    if (choisie) setMois(choisie.slice(0, 7))
  }, [choisie])
  useEffect(() => {
    if (!ouvert) return
    const dehors = (e: MouseEvent) => {
      if (!boite.current?.contains(e.target as Node)) setOuvert(false)
    }
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOuvert(false)
    }
    document.addEventListener('mousedown', dehors)
    document.addEventListener('keydown', touche)
    return () => {
      document.removeEventListener('mousedown', dehors)
      document.removeEventListener('keydown', touche)
    }
  }, [ouvert])

  const titre = mois ? new Date(`${mois}-01T00:00:00Z`).toLocaleDateString(loc, { timeZone: 'UTC', month: 'long', year: 'numeric' }) : ''
  const semaine = Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2023, 0, 2 + i)).toLocaleDateString(loc, { timeZone: 'UTC', weekday: 'narrow' }))
  return (
    <div className="mep-boheme__date" ref={boite}>
      <button type="button" className="mep-boheme__declencheur" aria-haspopup="dialog" aria-expanded={ouvert} aria-controls={id} onClick={() => setOuvert((o) => !o)} disabled={desactive || !dates.length} data-commande="date-periodique">
        {choisie ? dateLongue(choisie, langue) : mot('soireeComplet', langue)}
      </button>
      {ouvert && (
        <div className="mep-boheme__cal" id={id} role="dialog" aria-label={mot('cmdDate', langue)}>
          <div className="mep-boheme__cal-tete">
            <button type="button" onClick={() => setMois(moisVoisin(mois, -1))} disabled={mois <= premier} aria-label={mot('bohMoisAvant', langue)}>
              ‹
            </button>
            <strong aria-live="polite">{titre}</strong>
            <button type="button" onClick={() => setMois(moisVoisin(mois, 1))} disabled={mois >= dernier} aria-label={mot('bohMoisApres', langue)}>
              ›
            </button>
          </div>
          <div className="mep-boheme__cal-semaine" aria-hidden="true">
            {semaine.map((j, i) => (
              <span key={i}>{j}</span>
            ))}
          </div>
          <div className="mep-boheme__cal-grille">
            {joursDuMois(mois).map((d, i) => {
              if (!d) return <span key={`vide-${i}`} />
              const r = restantes.get(d)
              const libre = r !== undefined && r > 0
              return (
                <button
                  key={d}
                  type="button"
                  disabled={!libre}
                  className={`${libre ? 'est-libre' : ''}${d === choisie ? ' est-choisie' : ''}`}
                  aria-pressed={d === choisie}
                  aria-label={r === undefined ? undefined : `${dateCourte(d, langue)} · ${libre ? mot('soireeRestantes', langue).replace('{n}', String(r)) : mot('soireeComplet', langue)}`}
                  title={r === undefined ? undefined : libre ? mot('soireeRestantes', langue).replace('{n}', String(r)) : mot('soireeComplet', langue)}
                  onClick={() => {
                    onChoisir(d)
                    setOuvert(false)
                  }}
                >
                  {Number(d.slice(8))}
                </button>
              )
            })}
          </div>
          {indication && <p>{indication}</p>}
        </div>
      )}
    </div>
  )
}
