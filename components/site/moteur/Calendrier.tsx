'use client'
/**
 * Le calendrier de la fiche d'un type (villa) dans le site du PM : deux mois côte à côte (un seul sur téléphone), chaque jour
 * libre porte le prix de sa nuit, les jours occupés sont barrés. On choisit l'arrivée puis le départ ; le séjour part dans
 * l'adresse (GET, aucune donnée personnelle) et la fiche recalcule le prix exact côté serveur : le calendrier n'est qu'un
 * moyen de choisir, jamais la source d'un prix. Couleurs, polices et arrondis : ceux du site du client (variables du thème).
 * Sans JavaScript, la fiche garde ses champs de dates (FormulaireSejour).
 */
import { useMemo, useState } from 'react'
import { mm } from '@/lib/site/moteur-mots'
import type { Langue } from '@/lib/site/types'

export type JourCal = { date: string; libre: boolean; prix: number | null; sejourMin?: number }

const JOUR = 86_400_000
const iso = (d: Date) => d.toISOString().slice(0, 10)
const ajouter = (date: string, n: number) => iso(new Date(Date.parse(`${date}T00:00:00Z`) + n * JOUR))
const locale = (l: Langue) => (l === 'ar' ? 'ar-MA' : l === 'en' ? 'en-GB' : 'fr-FR')

export function Calendrier({
  jours,
  devise,
  langue,
  action,
  aujourdhui,
  valeurs,
  maxVoyageurs = 12,
  libelle,
}: {
  jours: JourCal[]
  devise: string
  langue: Langue
  action: string
  aujourdhui: string
  valeurs: { checkIn?: string; checkOut?: string; adults?: string }
  maxVoyageurs?: number
  libelle: string
}) {
  const parDate = useMemo(() => new Map(jours.map((j) => [j.date, j])), [jours])
  // Le premier mois montré : celui du séjour demandé, sinon celui de la première nuit libre (pas deux mois fermés à l'ouverture).
  const premierLibre = jours.find((j) => j.libre && j.date >= aujourdhui)?.date
  const premier = (valeurs.checkIn && valeurs.checkIn >= aujourdhui ? valeurs.checkIn : (premierLibre ?? aujourdhui)).slice(0, 7)
  const [mois, setMois] = useState(premier)
  const [arrivee, setArrivee] = useState(valeurs.checkIn && parDate.has(valeurs.checkIn) ? valeurs.checkIn : '')
  const [depart, setDepart] = useState(valeurs.checkOut && valeurs.checkIn ? valeurs.checkOut : '')
  const [survol, setSurvol] = useState('')
  const [adultes, setAdultes] = useState(String(Math.min(Math.max(Number(valeurs.adults) || 2, 1), maxVoyageurs)))
  const nombre = new Intl.NumberFormat(locale(langue), { maximumFractionDigits: 0 })
  const moisLong = new Intl.DateTimeFormat(locale(langue), { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const jourCourt = new Intl.DateTimeFormat(locale(langue), { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const dernier = jours.length ? jours[jours.length - 1].date.slice(0, 7) : premier

  /** Les nuits de [de, a[ sont-elles toutes libres ? */
  const nuitsLibres = (de: string, a: string) => {
    for (let d = de; d < a; d = ajouter(d, 1)) if (!parDate.get(d)?.libre) return false
    return true
  }
  const nuits = arrivee && depart ? Math.round((Date.parse(depart) - Date.parse(arrivee)) / JOUR) : 0
  const minimum = arrivee ? (parDate.get(arrivee)?.sejourMin ?? 1) : 1

  const choisir = (date: string) => {
    const j = parDate.get(date)
    const encours = arrivee && !depart
    // Départ : après l'arrivée, nuits libres, séjour minimum respecté ; le jour du départ peut être occupé.
    if (encours && date > arrivee && nuitsLibres(arrivee, date) && Math.round((Date.parse(date) - Date.parse(arrivee)) / JOUR) >= minimum) {
      setDepart(date)
      return
    }
    if (!j?.libre || date < aujourdhui) return
    setArrivee(date)
    setDepart('')
  }

  const enJeu = depart || survol
  const dansSelection = (date: string) => Boolean(arrivee && enJeu && date > arrivee && date < enJeu && (depart || nuitsLibres(arrivee, enJeu)))

  const grille = (cle: string) => {
    const debut = new Date(Date.parse(`${cle}-01T00:00:00Z`))
    const decalage = (debut.getUTCDay() + 6) % 7 // lundi en premier
    const nb = new Date(Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth() + 1, 0)).getUTCDate()
    const cases: (string | null)[] = [...Array(decalage).fill(null), ...Array.from({ length: nb }, (_, i) => `${cle}-${String(i + 1).padStart(2, '0')}`)]
    const noms = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale(langue), { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + i))))
    return (
      <div className="cal__mois" key={cle}>
        <h3 className="cal__titre">{moisLong.format(debut)}</h3>
        <div className="cal__semaine" aria-hidden="true">
          {noms.map((n, i) => (
            <span key={i}>{n}</span>
          ))}
        </div>
        <div className="cal__jours" role="grid">
          {cases.map((date, i) => {
            if (!date) return <span key={`v${i}`} />
            const j = parDate.get(date)
            const passe = date < aujourdhui
            const libre = Boolean(j?.libre) && !passe
            const estDepart = Boolean(arrivee && !depart && date > arrivee && nuitsLibres(arrivee, date) && Math.round((Date.parse(date) - Date.parse(arrivee)) / JOUR) >= minimum)
            const actif = libre || estDepart
            const classes = ['cal__jour', libre ? 'cal__jour--libre' : 'cal__jour--ferme', date === arrivee || date === depart ? 'cal__jour--borne' : '', dansSelection(date) ? 'cal__jour--dans' : ''].filter(Boolean).join(' ')
            return (
              <button
                type="button"
                key={date}
                className={classes}
                disabled={!actif}
                aria-pressed={date === arrivee || date === depart}
                aria-label={`${jourCourt.format(new Date(Date.parse(`${date}T00:00:00Z`)))}${libre && j?.prix ? `, ${nombre.format(j.prix)} ${devise}` : ''}, ${libre ? mm('jourLibre', langue) : mm('jourOccupe', langue)}`}
                onClick={() => choisir(date)}
                onMouseEnter={() => arrivee && !depart && setSurvol(date)}
                onMouseLeave={() => setSurvol('')}
              >
                <span className="cal__num">{Number(date.slice(8))}</span>
                {libre && j?.prix ? <span className="cal__prix">{nombre.format(j.prix)}</span> : null}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const deux = (cle: string) => {
    const d = new Date(Date.parse(`${cle}-01T00:00:00Z`))
    d.setUTCMonth(d.getUTCMonth() + 1)
    return iso(d).slice(0, 7)
  }
  const reculer = () => {
    const d = new Date(Date.parse(`${mois}-01T00:00:00Z`))
    d.setUTCMonth(d.getUTCMonth() - 1)
    const m = iso(d).slice(0, 7)
    if (m >= aujourdhui.slice(0, 7)) setMois(m)
  }
  const avancer = () => {
    if (deux(mois) < dernier) setMois(deux(mois))
  }

  return (
    <form className="cal" action={action} method="get">
      <div className="cal__haut">
        <button type="button" className="cal__fleche" onClick={reculer} disabled={mois <= aujourdhui.slice(0, 7)} aria-label={mm('moisPrecedent', langue)}>
          ‹
        </button>
        <p className="cal__aide" aria-live="polite">
          {arrivee && depart
            ? `${jourCourt.format(new Date(Date.parse(`${arrivee}T00:00:00Z`)))} → ${jourCourt.format(new Date(Date.parse(`${depart}T00:00:00Z`)))} · ${nuits} ${mm(nuits > 1 ? 'nuits' : 'nuit', langue)}`
            : arrivee
              ? minimum > 1
                ? mm('sejourMinimum', langue, { n: minimum })
                : mm('arriveeDepart', langue)
              : mm('choisirDates', langue)}
        </p>
        <button type="button" className="cal__fleche" onClick={avancer} disabled={deux(mois) >= dernier} aria-label={mm('moisSuivant', langue)}>
          ›
        </button>
      </div>
      <div className="cal__mois-deux">
        {grille(mois)}
        <div className="cal__second">{grille(deux(mois))}</div>
      </div>
      <input type="hidden" name="checkIn" value={arrivee} />
      <input type="hidden" name="checkOut" value={depart} />
      <div className="cal__bas">
        <label className="cal__voyageurs">
          <span>{mm('voyageurs', langue)}</span>
          <select name="adults" value={adultes} onChange={(e) => setAdultes(e.target.value)}>
            {Array.from({ length: maxVoyageurs }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        {(arrivee || depart) && (
          <button
            type="button"
            className="cal__effacer"
            onClick={() => {
              setArrivee('')
              setDepart('')
            }}
          >
            {mm('effacer', langue)}
          </button>
        )}
        <button className="bouton" type="submit" disabled={!arrivee || !depart}>
          {libelle}
        </button>
      </div>
    </form>
  )
}
