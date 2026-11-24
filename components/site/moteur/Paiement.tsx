'use client'

/**
 * Coordonnées et paiement, dans le cadre du client. Mode `demo` (brouillon du site, interrupteur éteint) : le devis
 * est réel, mais ni réservation, ni débit, ni e-mail — aucun appel d'écriture ; les coordonnées restent dans
 * `sessionStorage` du navigateur le temps de l'écran suivant, jamais dans l'adresse. Mode `ferme` (site publié,
 * réservation en ligne pas encore ouverte) : pas de formulaire, la demande part par WhatsApp au numéro du client.
 */
import { useState, type FormEvent } from 'react'
import { mm } from '@/lib/site/moteur-mots'
import type { Langue } from '@/lib/site/types'

export type Coordonnees = { prenom: string; nom: string; email: string; telephone: string; arrivee: string }

export const CLE_DEMO = (typeId: string) => `moteur-demo:${typeId}`

export function Paiement({
  langue,
  mode,
  typeId,
  total,
  suite,
  retour,
  lienWhatsapp,
  ligne,
}: {
  langue: Langue
  mode: 'demo' | 'ferme' | 'ligne'
  typeId: string
  total: string
  /** La page de confirmation (séjour compris, sans donnée personnelle). */
  suite: string
  retour: string
  lienWhatsapp: string | null
  /** Mode `ligne` : de quoi créer la réservation (le serveur relit le prix, jamais envoyé d'ici). */
  ligne?: { slug: string; checkIn: string; checkOut: string; adults: number }
}) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  if (mode === 'ferme') {
    return (
      <div className="moteur-paiement">
        <p className="moteur-paiement__note">{mm('fermeNote', langue)}</p>
        {lienWhatsapp && (
          <a className="bouton" href={lienWhatsapp} target="_blank" rel="noopener noreferrer">
            {mm('envoyerDemande', langue)}
          </a>
        )}
        <p>
          <a href={retour}>← {mm('retour', langue)}</a>
        </p>
      </div>
    )
  }
  async function payer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!ligne) return
    const f = new FormData(e.currentTarget)
    const lire = (k: string) => String(f.get(k) ?? '').trim()
    setEnvoi(true)
    setErreur(null)
    try {
      const r = await fetch(`/api/site-reservation/${encodeURIComponent(ligne.slug)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          typeId,
          checkIn: ligne.checkIn,
          checkOut: ligne.checkOut,
          adults: ligne.adults,
          prenom: lire('prenom'),
          nom: lire('nom'),
          email: lire('email'),
          telephone: lire('telephone'),
          ...(lire('arrivee') ? { arrivee: lire('arrivee') } : {}),
        }),
      })
      const j = (await r.json().catch(() => null)) as { success?: boolean; paymentUrl?: string; code?: string } | null
      if (r.ok && j?.success && typeof j.paymentUrl === 'string' && j.paymentUrl.startsWith('https://')) {
        window.location.assign(j.paymentUrl)
        return
      }
      const cle = ['MOTEUR_FERME', 'UNPAID_RESERVATION_EXISTS', 'INDISPONIBLE', 'VALIDATION'].includes(j?.code ?? '') ? j?.code : 'autre'
      setErreur(mm(`erreur_${cle}` as 'erreur_autre', langue))
    } catch {
      setErreur(mm('erreur_autre', langue))
    }
    setEnvoi(false)
  }
  function valider(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const lire = (k: string) => String(f.get(k) ?? '').trim()
    const c: Coordonnees = { prenom: lire('prenom'), nom: lire('nom'), email: lire('email'), telephone: lire('telephone'), arrivee: lire('arrivee') }
    setEnvoi(true)
    try {
      const reference = `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      sessionStorage.setItem(CLE_DEMO(typeId), JSON.stringify({ ...c, reference }))
    } catch {
      // Stockage du navigateur indisponible : l'écran suivant dira qu'il n'a rien à montrer.
    }
    window.location.assign(suite)
  }
  const enLigne = mode === 'ligne' && Boolean(ligne)
  return (
    <form className="moteur-paiement" onSubmit={enLigne ? payer : valider}>
      <section>
        <h2>{mm('coordonnees', langue)}</h2>
        <div className="moteur-champs">
          <label>
            <span>{mm('prenom', langue)}</span>
            <input name="prenom" required autoComplete="given-name" />
          </label>
          <label>
            <span>{mm('nom', langue)}</span>
            <input name="nom" required autoComplete="family-name" />
          </label>
          <label>
            <span>{mm('email', langue)}</span>
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            <span>{mm('telephone', langue)}</span>
            <input name="telephone" type="tel" required autoComplete="tel" />
          </label>
          <label className="moteur-champs__large">
            <span>{mm('heureArrivee', langue)}</span>
            <input name="arrivee" type="time" />
          </label>
        </div>
      </section>
      <section>
        <h2>{mm('paiement', langue)}</h2>
        <div className="moteur-paiement__mode">
          <span className="moteur-paiement__radio" aria-hidden="true" />
          <div>
            <strong>{mm('carte', langue)}</strong>
            <p>{enLigne ? mm('carteRedirection', langue) : mm('demoCarte', langue)}</p>
          </div>
        </div>
      </section>
      {erreur && (
        <p className="moteur-alerte" role="alert">
          {erreur}
        </p>
      )}
      <button className="bouton" type="submit" disabled={envoi}>
        {envoi && enLigne ? mm('enCours', langue) : enLigne ? `${mm('payerCarte', langue)} · ${total}` : mm('confirmerPayer', langue, { p: total })}
      </button>
      <p className="villa__note">{mm('conditions', langue)}</p>
      <p>
        <a href={retour}>← {mm('retour', langue)}</a>
      </p>
    </form>
  )
}
