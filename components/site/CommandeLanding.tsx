'use client'

/**
 * Le panneau de commande d'une landing de service : date, créneau, places, nom et e-mail, puis « Réserver ». Il ne calcule ni n'envoie
 * AUCUN prix : le prix par place affiché vient du catalogue (lu par srv-site), le total vient de la réponse du serveur de commandes, qui
 * y applique la remise de la landing. Le paiement s'ouvre sur le lien que srv-site rend (https seulement). Voir lib/site/commande.ts.
 */
import { type FormEvent, useEffect, useState } from 'react'
import { codeErreur, lienOuvrable, montantMad } from '@/lib/site/commande'
import { mot } from '@/lib/site/texte'
import type { Langue } from '@/lib/site/types'

type Creneau = { debut: string; fin?: string; restant: number | null; disponible: boolean }
/** `jeton` : la preuve, rendue à la création, que cette commande est la nôtre ; le paiement l'exige (jamais l'identifiant seul). */
type Commande = { commandeId: string; numero: string; totalCentimes: number; devise: string; retenueJusquA: string | null; jeton: string; statut?: string }

type Props = {
  slug: string
  pageId: string
  langue: Langue
  /** Le prix d'une place (centimes, TTC) lu dans le catalogue, et le même avec la remise de la landing : de l'AFFICHAGE seulement. */
  prixCentimes?: number
  prixOffreCentimes?: number
  devise: string
  /**
   * Soirée : les formules (indice dans `miseEnPage.formules`, nom, prix du catalogue pour l'AFFICHAGE). Le visiteur en choisit une ;
   * seul l'INDICE part au serveur, qui retrouve la prestation dans la landing publiée. Un lien `#reserver-f<indice>` la présélectionne.
   */
  formules?: Array<{ indice: number; nom: string; prixCentimes?: number; par?: 'personne' | 'table'; id?: string }>
  /** Événement : le téléphone se demande comme WhatsApp (facultatif, pour la confirmation et le suivi). */
  whatsapp?: boolean
  /**
   * Comment on paie (événement) : carte en ligne et/ou sur place. Sur place seul : « Réserver » confirme sans carte ; les deux : le
   * visiteur choisit. Absent : carte en ligne, comme aujourd'hui.
   */
  paiement?: { carte: boolean; surPlace: boolean }
}

const api = (slug: string, pageId: string, suite: string) => `/api/site-commande/${encodeURIComponent(slug)}/${encodeURIComponent(pageId)}/${suite}`

/** Ce que les routes du relais rendent : `success`, `data` (créneaux, commande, lien) ou `error` (code stable). */
type Reponse = { success?: boolean; error?: string; data?: { creneaux?: unknown; reservation?: string; lienPaiement?: unknown } & Partial<Commande> }

async function appeler(url: string, init?: RequestInit): Promise<{ ok: boolean; statut: number; donnees: Reponse }> {
  try {
    const r = await fetch(url, { cache: 'no-store', ...init })
    const corps = (await r.json().catch(() => ({}))) as Reponse
    return { ok: r.ok && corps?.success === true, statut: r.status, donnees: corps }
  } catch {
    return { ok: false, statut: 0, donnees: {} }
  }
}

export function CommandeLanding({ slug, pageId, langue, prixCentimes: prixPrincipal, prixOffreCentimes: offrePrincipal, devise, formules, whatsapp, paiement }: Props) {
  const surPlacePossible = paiement?.surPlace === true
  const cartePossible = paiement ? paiement.carte : true
  const [surPlace, setSurPlace] = useState(surPlacePossible && !cartePossible)
  const [formule, setFormule] = useState<number | undefined>(formules?.[0]?.indice)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [date, setDate] = useState('')
  const [creneaux, setCreneaux] = useState<Creneau[] | null>(null)
  const [creneau, setCreneau] = useState('')
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState('')
  const [commande, setCommande] = useState<Commande | null>(null)
  const dir = langue === 'ar' ? 'rtl' : 'ltr'

  const dire = (code: unknown) => setErreur(mot(`cmdErreur_${codeErreur(code)}` as never, langue))
  const choisie = formules?.find((f) => f.indice === formule)
  // Une formule n'est jamais remisée : son prix est celui du catalogue. Sans formule, la prestation principale (et sa remise).
  const prixCentimes = formules?.length ? choisie?.prixCentimes : prixPrincipal
  const prixOffreCentimes = formules?.length ? undefined : offrePrincipal
  // Ce qui part au serveur : l'IDENTIFIANT de la prestation pour une formule d'événement (jamais sa position, qui peut changer entre
  // l'affichage et la commande), sinon l'indice d'une formule posée dans la page.
  const choixEnvoye = choisie?.id ?? (formules?.length && formule !== undefined ? formule : undefined)
  const avecFormule = choixEnvoye !== undefined ? `&formule=${choixEnvoye}` : ''

  // Un bouton « Choisir » d'une carte de formule mène à `#reserver-f<indice>` : la formule est présélectionnée, le panneau vient à l'écran.
  useEffect(() => {
    if (!formules?.length) return
    const lire = () => {
      const m = /^#reserver-f([0-5])$/.exec(window.location.hash)
      if (!m) return
      const i = Number(m[1])
      if (!formules.some((f) => f.indice === i)) return
      setFormule(i)
      setCreneaux(null)
      setCreneau('')
      setDate('')
      document.getElementById('reserver')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    lire()
    window.addEventListener('hashchange', lire)
    return () => window.removeEventListener('hashchange', lire)
  }, [formules])

  async function choisirDate(v: string) {
    setDate(v)
    setCreneau('')
    setCreneaux(null)
    setErreur('')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return
    const r = await appeler(`${api(slug, pageId, 'creneaux')}?date=${v}${avecFormule}`)
    if (!r.ok) return dire(r.donnees?.error)
    const liste = r.donnees?.data?.creneaux
    // Une prestation sans créneau (instantanée, sur demande) renvoie une liste vide : aucun choix à faire.
    setCreneaux(Array.isArray(liste) && r.donnees?.data?.reservation === 'sur_creneau' ? (liste as Creneau[]) : [])
  }

  async function reserver(e: FormEvent) {
    e.preventDefault()
    if (occupe) return
    setOccupe(true)
    setErreur('')
    // Seulement qui, combien, quand : aucun prix, aucun identifiant de service, aucun propriétaire.
    const r = await appeler(api(slug, pageId, 'commande'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client: { nom, email, ...(telephone ? { telephone } : {}) }, quantite, ...(date ? { date } : {}), ...(creneau ? { creneau } : {}), ...(choixEnvoye !== undefined ? { formule: choixEnvoye } : {}), ...(surPlace ? { paiement: 'sur_place' } : {}) }),
    })
    setOccupe(false)
    if (!r.ok) return dire(r.donnees?.error)
    setCommande(r.donnees.data as Commande)
  }

  async function payer() {
    if (!commande || occupe) return
    setOccupe(true)
    setErreur('')
    const r = await appeler(api(slug, pageId, `commande/${commande.commandeId}/paiement`), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jeton: commande.jeton }) })
    setOccupe(false)
    const lien = r.donnees?.data?.lienPaiement
    if (!r.ok || !lienOuvrable(lien)) return dire(r.donnees?.error ?? 'paiement_indisponible')
    window.location.assign(lien)
  }

  const heure = commande?.retenueJusquA ? new Date(commande.retenueJusquA).toLocaleTimeString(langue === 'ar' ? 'ar-MA' : langue, { hour: '2-digit', minute: '2-digit' }) : ''

  if (commande)
    return (
      <div className="offre__commande" dir={dir} data-commande="recap">
        <h2>{mot('cmdTitre', langue)}</h2>
        <p>
          <strong>{commande.numero}</strong>
        </p>
        <p className="offre__commande-total">
          {mot('cmdTotal', langue)} : <strong>{montantMad(commande.totalCentimes, commande.devise, langue)}</strong>
        </p>
        {commande.statut === 'validee' ? (
          <p data-commande="sur-place">{mot('cmdSurPlaceConfirme', langue)}</p>
        ) : (
          heure && (
            <p>
              {mot('cmdRetenue', langue)} {heure}
            </p>
          )
        )}
        {erreur && (
          <p role="alert" className="offre__commande-erreur">
            {erreur}
          </p>
        )}
        {commande.statut !== 'validee' && (
          <button type="button" className="bouton" onClick={payer} disabled={occupe}>
            {occupe ? mot('cmdEnCours', langue) : mot('cmdPayer', langue)}
          </button>
        )}
      </div>
    )

  const unite = prixOffreCentimes !== undefined && prixCentimes !== undefined && prixOffreCentimes < prixCentimes ? prixOffreCentimes : prixCentimes
  return (
    <form className="offre__commande" dir={dir} onSubmit={reserver} data-commande="formulaire">
      <h2>{mot('cmdTitre', langue)}</h2>
      {formules && formules.length > 0 && (
        <fieldset className="offre__commande-formules">
          <legend>{mot('cmdFormule', langue)}</legend>
          {formules.map((f) => (
            <label key={f.indice} className="offre__commande-creneau">
              <input
                type="radio"
                name="formule"
                value={f.indice}
                checked={formule === f.indice}
                onChange={() => {
                  setFormule(f.indice)
                  setCreneaux(null)
                  setCreneau('')
                  setDate('')
                }}
                required
              />
              {f.nom}
              {f.prixCentimes !== undefined ? ` · ${montantMad(f.prixCentimes, devise, langue)}` : ''}
            </label>
          ))}
        </fieldset>
      )}
      {unite !== undefined && (
        <p className="offre__commande-prix">
          {prixOffreCentimes !== undefined && prixCentimes !== undefined && prixOffreCentimes < prixCentimes && <s>{montantMad(prixCentimes, devise, langue)}</s>} <strong>{montantMad(unite, devise, langue)}</strong> {mot(choisie?.par === 'table' ? 'cmdPrixTable' : 'cmdPrixUnite', langue)}
        </p>
      )}
      <label>
        {mot('cmdDate', langue)}
        <input type="date" required value={date} onChange={(e) => void choisirDate(e.target.value)} />
      </label>
      {creneaux && creneaux.length === 0 && date && <p className="offre__commande-note">{mot('cmdAucunCreneau', langue)}</p>}
      {creneaux && creneaux.length > 0 && (
        <fieldset>
          <legend>{mot('cmdCreneau', langue)}</legend>
          {creneaux.map((c) => (
            <label key={c.debut} className="offre__commande-creneau">
              <input type="radio" name="creneau" value={c.debut} disabled={!c.disponible} checked={creneau === c.debut} onChange={() => setCreneau(c.debut)} required />
              {c.debut}
              {c.fin ? `-${c.fin}` : ''}
            </label>
          ))}
        </fieldset>
      )}
      <label>
        {mot('cmdQuantite', langue)}
        <input type="number" min={1} max={20} step={1} required value={quantite} onChange={(e) => setQuantite(Math.max(1, Math.min(20, Math.trunc(Number(e.target.value)) || 1)))} />
      </label>
      <label>
        {mot('cmdNom', langue)}
        <input type="text" required maxLength={120} autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} />
      </label>
      <label>
        {mot('cmdEmail', langue)}
        <input type="email" required maxLength={254} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        {mot(whatsapp ? 'cmdWhatsapp' : 'cmdTel', langue)}
        <input type="tel" maxLength={30} autoComplete="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
      </label>
      {erreur && (
        <p role="alert" className="offre__commande-erreur">
          {erreur}
        </p>
      )}
      {surPlacePossible && cartePossible && (
        <fieldset className="offre__commande-formules">
          <legend>{mot('cmdModePaiement', langue)}</legend>
          <label className="offre__commande-creneau">
            <input type="radio" name="paiement" checked={!surPlace} onChange={() => setSurPlace(false)} />
            {mot('cmdPayerEnLigne', langue)}
          </label>
          <label className="offre__commande-creneau">
            <input type="radio" name="paiement" checked={surPlace} onChange={() => setSurPlace(true)} />
            {mot('cmdPayerSurPlace', langue)}
          </label>
        </fieldset>
      )}
      {surPlacePossible && !cartePossible && <p className="offre__commande-note">{mot('cmdSurPlaceSeul', langue)}</p>}
      <button type="submit" className="bouton" disabled={occupe}>
        {occupe ? mot('cmdEnCours', langue) : mot('cmdEnvoyer', langue)}
      </button>
    </form>
  )
}
