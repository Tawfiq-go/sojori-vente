'use client'

/**
 * L'espace IA du site d'un PM (Tawfiq, 28/10/2026 : « un espace AI si demandé, conversation et
 * voix ») : une bulle qui répond aux visiteurs sur les logements du PM et mène à la réservation.
 * Réservation directe de Sojori, bornée à ce PM, par `/api/site-assistant/<geste>`. Texte + micro
 * (dictée) ; les réponses lues à voix haute en option. Rien ne s'affiche si le PM n'est pas abonné
 * à Réservation directe ou si la bulle est éteinte (srv-agents le dit à l'ouverture).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type CibleAssistant,
  type ClicAssistant,
  type ReponseAssistant,
  montant,
  nouvelleSession,
} from '@/lib/site/assistant'
import { mot } from '@/lib/site/texte'
import type { Langue } from '@/lib/site/types'

type Ligne =
  | { de: 'moi'; texte: string }
  | { de: 'ia'; r: ReponseAssistant }
  | { de: 'clic'; c: ClicAssistant }

const CLE_SESSION = 'sojori-assistant-session'
const CLE_VOIX = 'sojori-assistant-voix'

function lireStockage(cle: string): string | null {
  try {
    return window.sessionStorage.getItem(cle)
  } catch {
    return null
  }
}
function ecrireStockage(cle: string, v: string) {
  try {
    window.sessionStorage.setItem(cle, v)
  } catch {
    /* navigation privée : la valeur vaut pour la page */
  }
}

async function appeler<T>(geste: string, corps?: Record<string, string>, query?: string): Promise<T> {
  const r = await fetch(`/api/site-assistant/${geste}${query ? `?${query}` : ''}`, {
    method: corps ? 'POST' : 'GET',
    headers: corps ? { 'content-type': 'application/json' } : undefined,
    body: corps ? JSON.stringify(corps) : undefined,
  })
  const j = (await r.json().catch(() => null)) as { success?: boolean; data?: T } | null
  if (!r.ok || !j?.success || !j.data) throw new Error(String(r.status))
  return j.data
}

function enBase64(b: Blob): Promise<string> {
  return new Promise((ok, ko) => {
    const lecteur = new FileReader()
    lecteur.onload = () => ok(String(lecteur.result).split(',')[1] ?? '')
    lecteur.onerror = () => ko(lecteur.error)
    lecteur.readAsDataURL(b)
  })
}

export function AssistantSite({
  cible,
  langue,
  whatsapp,
  suffixe,
}: {
  cible: CibleAssistant
  langue: Langue
  /** Le numéro du PM (bloc contact), proposé quand l'assistant ne peut pas répondre. */
  whatsapp?: string | null
  /** Ajouté aux liens des logements (`?pm=<slug>` dans l'aperçu, comme les blocs du site). */
  suffixe: string
}) {
  const [actif, setActif] = useState(false)
  const [dictee, setDictee] = useState(false)
  const [ouvert, setOuvert] = useState(false)
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [saisie, setSaisie] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [ecoute, setEcoute] = useState(false)
  // Le choix « lire à voix haute » de l'onglet ; la bulle ne s'affiche qu'après l'état (client seul).
  const [voix, setVoix] = useState(() => typeof window !== 'undefined' && lireStockage(CLE_VOIX) === 'oui')
  const session = useRef('')
  const enregistreur = useRef<MediaRecorder | null>(null)
  const fil = useRef<HTMLDivElement | null>(null)
  const champ = 'slug' in cible ? { slug: cible.slug } : { jeton: cible.jeton }

  useEffect(() => {
    session.current = lireStockage(CLE_SESSION) || nouvelleSession()
    ecrireStockage(CLE_SESSION, session.current)
    const q = new URLSearchParams(champ).toString()
    appeler<{ actif: boolean; dictee: boolean }>('etat', undefined, q)
      .then((e) => {
        setActif(e.actif)
        setDictee(e.dictee)
      })
      .catch(() => setActif(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, ['slug' in cible ? cible.slug : cible.jeton])

  useEffect(() => {
    fil.current?.scrollTo({ top: fil.current.scrollHeight, behavior: 'smooth' })
  }, [lignes, enCours])

  const lireAVoixHaute = useCallback(
    async (texte: string) => {
      if (!voix || !texte) return
      try {
        const s = await appeler<{ audio: string; mimeType: string }>('parler', {
          session: session.current,
          texte,
          langue,
          ...champ,
        })
        void new Audio(`data:${s.mimeType};base64,${s.audio}`).play()
      } catch {
        /* la réponse reste écrite */
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [voix, langue],
  )

  const envoyer = async (texteBrut: string) => {
    const texte = texteBrut.trim().slice(0, 1000)
    if (!texte || enCours) return
    setSaisie('')
    setLignes((l) => [...l, { de: 'moi', texte }])
    setEnCours(true)
    try {
      const r = await appeler<ReponseAssistant>('message', { session: session.current, texte, ...champ })
      setLignes((l) => [...l, { de: 'ia', r }])
      void lireAVoixHaute(r.reponse)
    } catch {
      setLignes((l) => [
        ...l,
        {
          de: 'ia',
          r: { reponse: mot('assistantErreur', langue), question: null, logements: [], devis: null, carte: null, indisponible: true },
        },
      ])
    } finally {
      setEnCours(false)
    }
  }

  const cliquer = async (demandeId: string, geste: 'valider' | 'refuser') => {
    setEnCours(true)
    try {
      const c = await appeler<ClicAssistant>('clic', { session: session.current, demandeId, geste, ...champ })
      setLignes((l) => [...l, { de: 'clic', c }])
      if (c.lienPaiement && /^https:\/\//.test(c.lienPaiement)) window.location.assign(c.lienPaiement)
    } catch {
      setLignes((l) => [...l, { de: 'clic', c: { phrase: mot('assistantErreur', langue), etat: 'echec', lienPaiement: null } }])
    } finally {
      setEnCours(false)
    }
  }

  const dicter = async () => {
    if (ecoute) {
      enregistreur.current?.stop()
      return
    }
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true })
      const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported(t))
      const rec = new MediaRecorder(flux, type ? { mimeType: type, audioBitsPerSecond: 32_000 } : undefined)
      const morceaux: Blob[] = []
      rec.ondataavailable = (e) => morceaux.push(e.data)
      rec.onstop = async () => {
        flux.getTracks().forEach((p) => p.stop())
        setEcoute(false)
        const blob = new Blob(morceaux, { type: rec.mimeType })
        if (!blob.size) return
        setEnCours(true)
        try {
          const t = await appeler<{ texte: string }>('transcrire', {
            session: session.current,
            audio: await enBase64(blob),
            mimeType: rec.mimeType,
            ...champ,
          })
          setEnCours(false)
          await envoyer(t.texte)
        } catch {
          setEnCours(false)
        }
      }
      enregistreur.current = rec
      rec.start()
      setEcoute(true)
      window.setTimeout(() => rec.state === 'recording' && rec.stop(), 60_000)
    } catch {
      setEcoute(false)
    }
  }

  if (!actif) return null

  const lienLogement = (id: string) => `/listings/${encodeURIComponent(id)}${suffixe}`

  return (
    <div className={`assistant-site${ouvert ? ' assistant-site--ouvert' : ''}`} data-sans-annotation>
      {ouvert && (
        <section className="assistant-site__panneau" role="dialog" aria-label={mot('assistantTitre', langue)}>
          <header className="assistant-site__entete">
            <strong>{mot('assistantTitre', langue)}</strong>
            <button
              type="button"
              className="assistant-site__voix"
              aria-pressed={voix}
              title={mot('assistantLire', langue)}
              aria-label={mot('assistantLire', langue)}
              onClick={() => {
                setVoix(!voix)
                ecrireStockage(CLE_VOIX, voix ? 'non' : 'oui')
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
                {voix ? (
                  <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <path d="m16 9 5 6m0-6-5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                )}
              </svg>
            </button>
            <button type="button" className="assistant-site__fermer" onClick={() => setOuvert(false)} aria-label={mot('assistantFermer', langue)}>
              ×
            </button>
          </header>
          <div className="assistant-site__fil" ref={fil} aria-live="polite">
            <p className="assistant-site__bulle assistant-site__bulle--ia">{mot('assistantAccueil', langue)}</p>
            {lignes.map((l, i) =>
              l.de === 'moi' ? (
                <p key={i} className="assistant-site__bulle assistant-site__bulle--moi">
                  {l.texte}
                </p>
              ) : l.de === 'clic' ? (
                <p key={i} className="assistant-site__bulle assistant-site__bulle--ia">
                  {l.c.phrase}
                  {l.c.lienPaiement && (
                    <a className="assistant-site__action" href={l.c.lienPaiement}>
                      {mot('assistantPayer', langue)}
                    </a>
                  )}
                </p>
              ) : (
                <div key={i} className="assistant-site__reponse">
                  {l.r.reponse && <p className="assistant-site__bulle assistant-site__bulle--ia">{l.r.reponse}</p>}
                  {l.r.logements.length > 0 && (
                    <div className="assistant-site__logements">
                      {l.r.logements.slice(0, 6).map((g) => (
                        <a key={g.listingId} className="assistant-site__logement" href={lienLogement(g.listingId)}>
                          {g.photo && <img src={g.photo} alt="" loading="lazy" />}
                          <strong>{g.logement}</strong>
                          <span>
                            {g.nuits > 0
                              ? `${montant(g.total, g.devise)} ${mot('assistantPour', langue)} ${g.nuits} ${mot('assistantNuits', langue)}`
                              : g.ville}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                  {l.r.devis && (
                    <div className="assistant-site__devis">
                      <strong>{l.r.devis.logement}</strong>
                      <span>{l.r.devis.periode}</span>
                      <span className="assistant-site__total">{montant(l.r.devis.total, l.r.devis.devise)}</span>
                    </div>
                  )}
                  {l.r.carte && (
                    <div className="assistant-site__carte">
                      <p>{l.r.carte.resume}</p>
                      <div className="assistant-site__boutons">
                        <button type="button" disabled={enCours} onClick={() => void cliquer(l.r.carte!.demandeId, 'valider')}>
                          {mot('assistantConfirmer', langue)}
                        </button>
                        <button type="button" className="second" disabled={enCours} onClick={() => void cliquer(l.r.carte!.demandeId, 'refuser')}>
                          {mot('assistantEcarter', langue)}
                        </button>
                      </div>
                    </div>
                  )}
                  {l.r.question && (
                    <div className="assistant-site__options">
                      {l.r.question.options.map((o) => (
                        <button key={o} type="button" disabled={enCours} onClick={() => void envoyer(o)}>
                          {o}
                        </button>
                      ))}
                    </div>
                  )}
                  {l.r.indisponible && whatsapp && (
                    <a className="assistant-site__action" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener nofollow">
                      {mot('ecrireWhatsapp', langue)}
                    </a>
                  )}
                </div>
              ),
            )}
            {enCours && <p className="assistant-site__bulle assistant-site__bulle--ia assistant-site__attente">•••</p>}
          </div>
          <form
            className="assistant-site__saisie"
            onSubmit={(e) => {
              e.preventDefault()
              void envoyer(saisie)
            }}
          >
            {dictee && (
              <button
                type="button"
                className={`assistant-site__micro${ecoute ? ' assistant-site__micro--ecoute' : ''}`}
                onClick={() => void dicter()}
                disabled={enCours && !ecoute}
                aria-label={ecoute ? mot('assistantEcoute', langue) : mot('assistantDicter', langue)}
                title={ecoute ? mot('assistantEcoute', langue) : mot('assistantDicter', langue)}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm7 9a7 7 0 0 1-14 0M12 19v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
            <input
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder={ecoute ? mot('assistantEcoute', langue) : mot('assistantSaisie', langue)}
              maxLength={1000}
              disabled={ecoute}
              aria-label={mot('assistantSaisie', langue)}
            />
            <button type="submit" disabled={enCours || !saisie.trim()} aria-label={mot('assistantEnvoyer', langue)}>
              ➜
            </button>
          </form>
        </section>
      )}
      <button
        type="button"
        className="assistant-site__lanceur"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-label={ouvert ? mot('assistantFermer', langue) : mot('assistantOuvrir', langue)}
      >
        {ouvert ? (
          <span aria-hidden>×</span>
        ) : (
          <>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M12 3c4.97 0 9 3.58 9 8s-4.03 8-9 8c-1.1 0-2.15-.17-3.12-.49L4 20l1.3-3.9C3.86 14.7 3 12.93 3 11c0-4.42 4.03-8 9-8Z" fill="currentColor" />
              <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            <span className="assistant-site__libelle">{mot('assistantOuvrir', langue)}</span>
          </>
        )}
      </button>
    </div>
  )
}
