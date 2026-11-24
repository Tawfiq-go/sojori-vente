'use client'

/**
 * Le panneau de commande d'une landing de service : date, créneau, places, nom et e-mail, puis « Réserver ». Il ne calcule ni n'envoie
 * AUCUN prix : le prix par place affiché vient du catalogue (lu par srv-site), le total vient de la réponse du serveur de commandes, qui
 * y applique la remise de la landing. Le paiement s'ouvre sur le lien que srv-site rend (https seulement). Voir lib/site/commande.ts.
 */
import { type FormEvent, useEffect, useState } from 'react'
import { adresseRetour, cleCommande, codeErreur, corpsFormules, dateDuLien, dateEvenement, encoreRetenue, lienOuvrable, lireCommandeGardee, montantMad, paiementDuLien, premiereDateLibre, retourBanque, totalFormules } from '@/lib/site/commande'
import { mot } from '@/lib/site/texte'
import type { Langue } from '@/lib/site/types'
import { CalendrierDates } from './miseEnPage/CalendrierDates'

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
  /** Aperçu du site : le panneau se montre, rien ne se réserve (bouton inactif, aucun appel). */
  apercu?: boolean
  /** Événement : le téléphone se demande comme WhatsApp (facultatif, pour la confirmation et le suivi). */
  whatsapp?: boolean
  /**
   * Comment on paie (événement) : carte en ligne et/ou sur place. Sur place seul : « Réserver » confirme sans carte ; les deux : le
   * visiteur choisit. Absent : carte en ligne, comme aujourd'hui.
   */
  paiement?: { carte: boolean; surPlace: boolean }
  /** Événement : sa date est FIXE (celle de Services) ; le panneau l'affiche au lieu de la demander, et ne cherche aucun créneau. */
  evenement?: { debut: string; /** Périodique : les dates ouvertes, une seule se réserve par commande. */ dates?: Array<{ date: string; debut: string; restantes: number }> }
  /** Bohème : le panneau en bandeau (calendrier, compteurs, récapitulatif), puis les coordonnées. Événement périodique seulement. */
  bandeau?: boolean
  /** Bohème : la ligne sous le calendrier (« Uniquement le dimanche, jusqu'au 30 mai 2027 »). */
  indication?: string
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

export function CommandeLanding({ slug, pageId, langue, prixCentimes: prixPrincipal, prixOffreCentimes: offrePrincipal, devise, formules, apercu, whatsapp, paiement, evenement, bandeau, indication }: Props) {
  const surPlacePossible = paiement?.surPlace === true
  const cartePossible = paiement ? paiement.carte : true
  const [surPlace, setSurPlace] = useState(surPlacePossible && !cartePossible)
  const [formule, setFormule] = useState<number | undefined>(formules?.[0]?.indice)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [quantite, setQuantite] = useState(1)
  // Événement : un compteur par formule (2 adultes, 1 enfant) dans UNE réservation ; chaque formule désignée par son identifiant.
  const compteurs = evenement !== undefined && formules !== undefined && formules.length > 0 && formules.every((f) => f.id !== undefined)
  const premiere = formules?.[0]?.id
  const enBandeau = bandeau === true && compteurs && evenement?.dates !== undefined
  const [quantites, setQuantites] = useState<Record<string, number>>(compteurs && premiere ? { [premiere]: 1 } : {})
  const [date, setDate] = useState('')
  // Événement périodique : la date choisie (à part de `date`, qu'un changement de formule remet à zéro).
  const [dateChoisie, setDateChoisie] = useState(premiereDateLibre(evenement?.dates))
  const [creneaux, setCreneaux] = useState<Creneau[] | null>(null)
  const [creneau, setCreneau] = useState('')
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState('')
  const [commande, setCommande] = useState<Commande | null>(null)
  // Retour de la banque : `fail` (paiement non abouti, on peut réessayer) ou `ok` (confirmation en cours : seule la banque confirme).
  // Bandeau : les places d'abord, les coordonnées ensuite (un seul envoi, au second bouton).
  const [coordonnees, setCoordonnees] = useState(false)
  const [retour, setRetour] = useState<'ok' | 'fail' | null>(null)
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
      const choisieParLien = formules.find((f) => f.indice === i)
      if (!choisieParLien) return
      setFormule(i)
      // Compteurs : la formule choisie compte au moins une place, les autres gardent les leurs.
      const id = choisieParLien.id
      if (id) setQuantites((q) => ({ ...q, [id]: Math.max(1, q[id] ?? 0) }))
      setCreneaux(null)
      setCreneau('')
      setDate('')
      document.getElementById('reserver')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    lire()
    window.addEventListener('hashchange', lire)
    return () => window.removeEventListener('hashchange', lire)
  }, [formules])

  // Une carte de date de la page mène à `#reserver-d<date>` : la date est choisie, le panneau vient à l'écran.
  useEffect(() => {
    const lire = () => {
      const date = dateDuLien(window.location.hash, evenement?.dates)
      if (!date) return
      setDateChoisie(date)
      document.getElementById('reserver')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    lire()
    window.addEventListener('hashchange', lire)
    return () => window.removeEventListener('hashchange', lire)
  }, [evenement?.dates])

  // Le visiteur revient de la banque : on relit la commande gardée dans l'onglet, puis l'adresse redevient propre (recharger ne rejoue rien).
  useEffect(() => {
    if (apercu || !retourBanque(window.location.search)) return
    const apres = window.setTimeout(() => {
      const r = retourBanque(window.location.search)
      if (!r) return
      let brut: string | null = null
      try {
        brut = window.sessionStorage.getItem(cleCommande(slug, pageId))
        if (r === 'ok') window.sessionStorage.removeItem(cleCommande(slug, pageId))
      } catch {
        // Stockage refusé par le navigateur : le message s'affiche quand même, sans la commande.
      }
      const gardee = lireCommandeGardee(brut)
      setRetour(r)
      if (gardee && (r === 'ok' || encoreRetenue(gardee))) setCommande(gardee)
      window.history.replaceState(null, '', window.location.pathname)
    }, 0)
    return () => window.clearTimeout(apres)
  }, [apercu, slug, pageId])

  // Le panneau change de hauteur (formulaire puis récapitulatif) : on y amène le visiteur une fois le message affiché, jamais avant.
  useEffect(() => {
    if (retour) document.querySelector('.offre__commande')?.scrollIntoView({ block: 'center' })
  }, [retour])

  // « Réservation sans paiement » ou « avec paiement » (cartes de la page) : le mode est choisi, le panneau vient à l'écran.
  useEffect(() => {
    const lire = () => {
      const mode = paiementDuLien(window.location.hash)
      if (!mode || (mode === 'sur_place' ? !surPlacePossible : !cartePossible)) return
      setSurPlace(mode === 'sur_place')
      document.getElementById('reserver')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    lire()
    window.addEventListener('hashchange', lire)
    return () => window.removeEventListener('hashchange', lire)
  }, [surPlacePossible, cartePossible])

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
    if (occupe || apercu) return
    if (enBandeau && !coordonnees) {
      setErreur('')
      if (!corpsFormules(quantites) || !dateChoisie) return dire('VALIDATION')
      setCoordonnees(true)
      return
    }
    const choixFormules = compteurs ? corpsFormules(quantites) : null
    if (compteurs && !choixFormules) return dire('VALIDATION')
    setOccupe(true)
    setErreur('')
    // Seulement qui, combien, quand : aucun prix, aucun identifiant de service, aucun propriétaire.
    const r = await appeler(api(slug, pageId, 'commande'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client: { nom, email, ...(telephone ? { telephone } : {}) }, ...(choixFormules ?? { quantite }), ...(evenement?.dates ? { date: dateChoisie } : date ? { date } : {}), ...(creneau ? { creneau } : {}), ...(!compteurs && choixEnvoye !== undefined ? { formule: choixEnvoye } : {}), ...(surPlace ? { paiement: 'sur_place' } : {}) }),
    })
    setOccupe(false)
    if (!r.ok) return dire(r.donnees?.error)
    setRetour(null)
    setCommande(r.donnees.data as Commande)
  }

  async function payer() {
    if (!commande || occupe) return
    setOccupe(true)
    setErreur('')
    const r = await appeler(api(slug, pageId, `commande/${commande.commandeId}/paiement`), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jeton: commande.jeton, retour: adresseRetour(window.location) }) })
    setOccupe(false)
    const lien = r.donnees?.data?.lienPaiement
    if (!r.ok || !lienOuvrable(lien)) return dire(r.donnees?.error ?? 'paiement_indisponible')
    try {
      const { commandeId, numero, totalCentimes, devise: monnaie, retenueJusquA, jeton } = commande
      window.sessionStorage.setItem(cleCommande(slug, pageId), JSON.stringify({ commandeId, numero, totalCentimes, devise: monnaie, retenueJusquA, jeton }))
    } catch {
      // Sans stockage, le paiement s'ouvre quand même ; au retour, le message s'affiche sans la commande.
    }
    window.location.assign(lien)
  }

  const heure = commande?.retenueJusquA ? new Date(commande.retenueJusquA).toLocaleTimeString(langue === 'ar' ? 'ar-MA' : langue, { hour: '2-digit', minute: '2-digit' }) : ''

  const alerteEchec = (suite: string) => (
    <div role="alert" className="offre__commande-erreur" data-commande="retour-echec">
      <strong>{mot('cmdRetourEchecTitre', langue)}</strong>
      <p>{suite}</p>
    </div>
  )

  if (commande)
    return (
      <div className="offre__commande" dir={dir} data-commande="recap">
        <h2>{mot(evenement ? 'cmdTitreEvenement' : 'cmdTitre', langue)}</h2>
        <p>
          <strong>{commande.numero}</strong>
        </p>
        {retour === 'fail' && alerteEchec(mot('cmdRetourEchec', langue))}
        {retour === 'ok' && (
          <p role="status" data-commande="retour-ok">
            {mot('cmdRetourOk', langue)}
          </p>
        )}
        <p className="offre__commande-total">
          {mot('cmdTotal', langue)} : <strong>{montantMad(commande.totalCentimes, commande.devise, langue)}</strong>
        </p>
        {commande.statut === 'validee' ? (
          <p data-commande="sur-place">{mot('cmdSurPlaceConfirme', langue)}</p>
        ) : (
          retour !== 'ok' &&
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
        {commande.statut !== 'validee' && retour !== 'ok' && (
          <button type="button" className="bouton" onClick={payer} disabled={occupe}>
            {occupe ? mot('cmdEnCours', langue) : mot(retour === 'fail' ? 'cmdReessayer' : 'cmdPayer', langue)}
          </button>
        )}
      </div>
    )

  // Payé, mais l'onglet n'a plus la commande : le message seul, jamais un formulaire qui inviterait à payer deux fois.
  if (retour === 'ok')
    return (
      <div className="offre__commande" dir={dir} data-commande="retour-ok">
        <h2>{mot(evenement ? 'cmdTitreEvenement' : 'cmdTitre', langue)}</h2>
        <p role="status">{mot('cmdRetourOk', langue)}</p>
      </div>
    )

  const total = compteurs ? totalFormules(formules ?? [], quantites) : null
  const alerte = erreur && (
    <p role="alert" className="offre__commande-erreur">
      {erreur}
    </p>
  )
  const champs = (
    <>
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
    </>
  )
  const modesPaiement = surPlacePossible && cartePossible && (
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
  )

  if (enBandeau && formules)
    return (
      <form className="offre__commande offre__commande--bandeau" dir={dir} onSubmit={reserver} data-commande="formulaire">
        <h2 className="mep-boheme__invisible">{mot('cmdTitreEvenement', langue)}</h2>
        {retour === 'fail' && alerteEchec(mot('cmdRetourRefaire', langue))}
        <div className="mep-boheme__champs">
          <div className="mep-boheme__champ">
            <span>{mot('cmdDate', langue)}</span>
            <CalendrierDates dates={evenement?.dates ?? []} choisie={dateChoisie} onChoisir={setDateChoisie} langue={langue} indication={indication} />
          </div>
          {formules.map((f) => {
            const id = f.id as string
            const n = quantites[id] ?? 0
            const poser = (v: number) => setQuantites((q) => ({ ...q, [id]: Math.max(0, Math.min(20, v)) }))
            return (
              <div key={id} className="mep-boheme__champ">
                <span>{f.nom}</span>
                <div className="mep-boheme__pas">
                  <button type="button" onClick={() => poser(n - 1)} disabled={n < 1} aria-label={`${mot('cmdMoins', langue)} : ${f.nom}`}>
                    −
                  </button>
                  <output aria-live="polite">{n}</output>
                  <button type="button" onClick={() => poser(n + 1)} disabled={n > 19} aria-label={`${mot('cmdPlus', langue)} : ${f.nom}`}>
                    +
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        {coordonnees && (
          <div className="mep-boheme__coordonnees" data-commande="coordonnees">
            <p>{mot('bohCoordonnees', langue)}</p>
            <div>{champs}</div>
            {modesPaiement}
          </div>
        )}
        {alerte}
        <div className="mep-boheme__bas">
          <div>
            <span>{mot('bohRecap', langue)}</span>
            <p>
              {formules
                .filter((f) => (quantites[f.id as string] ?? 0) > 0)
                .map((f) => `${quantites[f.id as string]} × ${f.nom}${f.prixCentimes !== undefined ? ` (${montantMad(f.prixCentimes, devise, langue)})` : ''}`)
                .join(' + ')}
            </p>
          </div>
          {!!total && (
            <p className="mep-boheme__total" data-commande="total">
              <span>{mot('cmdTotal', langue)}</span> <strong>{montantMad(total, devise, langue)}</strong>
            </p>
          )}
          <button type="submit" className="mep-boheme__bouton mep-boheme__bouton--grand" disabled={occupe || apercu}>
            {occupe ? mot('cmdEnCours', langue) : mot(coordonnees ? (surPlace ? 'cmdEnvoyer' : 'bohContinuer') : surPlace ? 'bohSansBouton' : 'bohAvecBouton', langue)}
            <span className="mep-boheme__fleche" aria-hidden="true">
              →
            </span>
          </button>
        </div>
      </form>
    )

  const unite = prixOffreCentimes !== undefined && prixCentimes !== undefined && prixOffreCentimes < prixCentimes ? prixOffreCentimes : prixCentimes
  return (
    <form className="offre__commande" dir={dir} onSubmit={reserver} data-commande="formulaire">
      <h2>{mot(evenement ? 'cmdTitreEvenement' : 'cmdTitre', langue)}</h2>
      {retour === 'fail' && alerteEchec(mot('cmdRetourRefaire', langue))}
      {compteurs && formules && (
        <fieldset data-commande="compteurs">
          <legend>{mot('cmdPlaces', langue)}</legend>
          {formules.map((f) => {
            const id = f.id as string
            const n = quantites[id] ?? 0
            const poser = (v: number) => setQuantites((q) => ({ ...q, [id]: Math.max(0, Math.min(20, v)) }))
            return (
              <div key={id} className="offre__commande-compteur">
                <span>
                  {f.nom}
                  {f.prixCentimes !== undefined && (
                    <small>
                      {montantMad(f.prixCentimes, devise, langue)} {mot(f.par === 'table' ? 'cmdPrixTable' : 'evtPar_personne', langue)}
                    </small>
                  )}
                </span>
                <div>
                  <button type="button" onClick={() => poser(n - 1)} disabled={n < 1} aria-label={`${mot('cmdMoins', langue)} : ${f.nom}`}>
                    −
                  </button>
                  <output aria-live="polite">{n}</output>
                  <button type="button" onClick={() => poser(n + 1)} disabled={n > 19} aria-label={`${mot('cmdPlus', langue)} : ${f.nom}`}>
                    +
                  </button>
                </div>
              </div>
            )
          })}
        </fieldset>
      )}
      {!compteurs && formules && formules.length > 0 && (
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
      {!compteurs && unite !== undefined && (
        <p className="offre__commande-prix">
          {prixOffreCentimes !== undefined && prixCentimes !== undefined && prixOffreCentimes < prixCentimes && <s>{montantMad(prixCentimes, devise, langue)}</s>} <strong>{montantMad(unite, devise, langue)}</strong> {mot(choisie?.par === 'table' ? 'cmdPrixTable' : 'cmdPrixUnite', langue)}
        </p>
      )}
      {evenement?.dates ? (
        <label>
          {mot('cmdDate', langue)}
          <select required value={dateChoisie} onChange={(e) => setDateChoisie(e.target.value)} data-commande="date-periodique">
            {!dateChoisie && <option value="">{mot('soireeComplet', langue)}</option>}
            {evenement.dates.map((d) => (
              <option key={d.date} value={d.date} disabled={d.restantes < 1}>
                {`${dateEvenement(d.debut, langue)} · ${d.restantes < 1 ? mot('soireeComplet', langue) : mot('soireeRestantes', langue).replace('{n}', String(d.restantes))}`}
              </option>
            ))}
          </select>
        </label>
      ) : evenement ? (
        <p className="offre__commande-note" data-commande="date-evenement">
          {dateEvenement(evenement.debut, langue)}
        </p>
      ) : (
        <label>
          {mot('cmdDate', langue)}
          <input type="date" required value={date} onChange={(e) => void choisirDate(e.target.value)} />
        </label>
      )}
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
      {!compteurs && (
        <label>
          {mot('cmdQuantite', langue)}
          <input type="number" min={1} max={20} step={1} required value={quantite} onChange={(e) => setQuantite(Math.max(1, Math.min(20, Math.trunc(Number(e.target.value)) || 1)))} />
        </label>
      )}
      {champs}
      {alerte}
      {modesPaiement}
      {surPlacePossible && !cartePossible && <p className="offre__commande-note">{mot('cmdSurPlaceSeul', langue)}</p>}
      {compteurs && !!total && (
        <p className="offre__commande-total" data-commande="total">
          {mot('cmdTotal', langue)} : <strong>{montantMad(total, devise, langue)}</strong>
        </p>
      )}
      {apercu && <p className="offre__commande-note">{mot('cmdApercu', langue)}</p>}
      <button type="submit" className="bouton" disabled={occupe || apercu || (compteurs && !total)}>
        {occupe ? mot('cmdEnCours', langue) : mot('cmdEnvoyer', langue)}
      </button>
    </form>
  )
}
