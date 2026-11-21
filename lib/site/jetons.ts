/**
 * Les champs dynamiques d'une landing d'offre, côté affichage : `{prix_a_partir}`, `{prix_offre}`, `{remise}`,
 * `{nuits_min}`, `{logements_disponibles}`… remplacés à la lecture par les VRAIS tarifs et la vraie disponibilité des
 * logements du PM. srv-site garantit que la liste des jetons est fermée ; ici, le calcul et le remplacement.
 *
 * Règle de repli : une chaîne dont un jeton n'a pas de valeur (route muette, aucune nuit libre, pas de remise)
 * est VIDÉE en entier — le champ disparaît, jamais un prix inventé ni un « {prix} » affiché.
 * Pur, sans I/O, sans import (testé par `node --test`). Spec : sojori-production agent-site-web.md §13.
 */

/** Un jour du calendrier public de srv-listing. */
/** fr, en, ar (copie du type du site, ce module n'importe rien). */
type Langue = 'fr' | 'en' | 'ar'

export type Jour = { date: string; available?: boolean; price?: number; minStay?: number; stopSell?: boolean }

/** Ce qu'on a lu pour un logement : `jours: null` = calendrier illisible (jamais rien déduire). */
export type LogementLu = { id: string; jours: Jour[] | null; devise: string }

export type Remise = { pourcent: number; arrondi?: 'unite' | 'cinq' | 'dix' }

export type Valeurs = {
  total: number
  /** `undefined` quand aucun calendrier n'a pu être lu. */
  disponibles?: number
  remise?: Remise
  parLogement: Record<string, { prix?: number; devise: string; nuitsMin?: number; libre?: boolean }>
}

const JETON = /\{([a-z_]+)(?::([a-f0-9]{24}))?\}/g
const libre = (j: Jour) => j.available !== false && j.stopSell !== true

/** Le prix après remise, arrondi, jamais négatif ni au-dessus du prix de départ (même règle que srv-site). */
export function prixRemise(prix: number, pourcent: number, arrondi: Remise['arrondi'] = 'unite'): number {
  const pas = arrondi === 'dix' ? 10 : arrondi === 'cinq' ? 5 : 1
  const r = Math.round((prix * (1 - pourcent / 100)) / pas) * pas
  return Math.max(0, Math.min(prix, r))
}

/**
 * Les valeurs d'une offre d'après les calendriers lus. Un jour compte s'il est libre et a un prix > 0 ; le tarif d'un
 * logement est le plus bas de ses nuits libres, son séjour minimal le plus court. Les jours sont ceux de la fenêtre
 * de l'offre, déjà bornés par l'appelant.
 */
export function calculerValeurs(logements: LogementLu[], remise?: Remise): Valeurs {
  const parLogement: Valeurs['parLogement'] = {}
  let lus = 0
  let disponibles = 0
  for (const l of logements) {
    if (!l.jours) {
      parLogement[l.id] = { devise: l.devise }
      continue
    }
    lus++
    const libres = l.jours.filter((j) => libre(j))
    if (libres.length) disponibles++
    const prix = libres.map((j) => j.price).filter((p): p is number => typeof p === 'number' && Number.isFinite(p) && p > 0)
    const mins = libres.map((j) => j.minStay).filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1)
    parLogement[l.id] = {
      devise: l.devise,
      libre: libres.length > 0,
      ...(prix.length ? { prix: Math.min(...prix) } : {}),
      ...(mins.length ? { nuitsMin: Math.min(...mins) } : {}),
    }
  }
  return { total: logements.length, ...(lus ? { disponibles } : {}), ...(remise ? { remise } : {}), parLogement }
}

type Format = (montant: number, devise: string, langue: Langue) => string

/** La valeur d'un jeton, ou `undefined` (donnée absente : la chaîne entière disparaît). */
function valeurDe(nom: string, id: string | undefined, v: Valeurs, langue: Langue, fmt: Format): string | undefined {
  const cibles = id ? [v.parLogement[id]].filter(Boolean) : Object.values(v.parLogement)
  const avecPrix = cibles.filter((c) => c.prix !== undefined)
  const moins = avecPrix.length ? avecPrix.reduce((a, b) => ((b.prix as number) < (a.prix as number) ? b : a)) : undefined
  switch (nom) {
    case 'prix_a_partir':
    case 'prix_barre':
      return moins ? fmt(moins.prix as number, moins.devise, langue) : undefined
    case 'prix_offre':
      return moins && v.remise ? fmt(prixRemise(moins.prix as number, v.remise.pourcent, v.remise.arrondi), moins.devise, langue) : undefined
    case 'remise':
      return v.remise ? `-${v.remise.pourcent} %` : undefined
    case 'nuits_min': {
      const n = cibles.map((c) => c.nuitsMin).filter((x): x is number => x !== undefined)
      return n.length ? String(Math.min(...n)) : undefined
    }
    case 'logements_disponibles':
      return v.disponibles === undefined ? undefined : String(v.disponibles)
    case 'logements_total':
      return v.total > 0 ? String(v.total) : undefined
    default:
      return undefined
  }
}

/** Une chaîne avec ses jetons remplacés ; `''` si l'un d'eux n'a pas de valeur. Sans jeton : rendue telle quelle. */
export function resoudreTexte(texte: string, v: Valeurs, langue: Langue, fmt: Format): string {
  let manque = false
  const r = texte.replace(JETON, (_m, nom: string, id?: string) => {
    const x = valeurDe(nom, id, v, langue, fmt)
    if (x === undefined) manque = true
    return x ?? ''
  })
  return manque ? '' : r
}

const LANGUES = new Set(['fr', 'en', 'ar'])

/**
 * Remplace les jetons dans tout un contenu (sections). Un texte par langue (`{fr, en, ar}`) est résolu dans SA langue
 * (chiffres et devise suivent le système de langues du site) ; une chaîne simple (`valeur`, code) dans la langue servie.
 * Les clés non textuelles (id, type, médias, liens) ne sont jamais touchées.
 */
export function resoudreContenu<T>(contenu: T, v: Valeurs, langue: Langue, fmt: Format): T {
  const marche = (x: unknown, lg: Langue): unknown => {
    if (typeof x === 'string') return resoudreTexte(x, v, lg, fmt)
    if (Array.isArray(x)) return x.map((e) => marche(e, lg))
    if (x && typeof x === 'object') {
      return Object.fromEntries(
        Object.entries(x).map(([k, e]) => {
          if (CLES_FIXES.has(k)) return [k, e]
          return [k, marche(e, LANGUES.has(k) ? (k as Langue) : lg)]
        }),
      )
    }
    return x
  }
  return marche(contenu, langue) as T
}

/** Ce qui n'est jamais un texte affiché. */
const CLES_FIXES = new Set(['id', 'niveau', 'type', 'variante', 'media', 'medias', 'lien', 'lien2', 'code', 'imageAttente', 'css'])

/** La landing emploie-t-elle au moins un jeton ? (sinon aucun appel aux tarifs) */
export function contientJeton(contenu: unknown): boolean {
  const s = JSON.stringify(contenu) ?? ''
  return /\{[a-z_]+(?::[a-f0-9]{24})?\}/.test(s)
}

const JOUR = 86_400_000
/** La fenêtre de lecture des calendriers : de maintenant (ou du début) à la fin de l'offre, 92 jours au plus. */
export function fenetre(offre: { debutUtc?: string; finUtc?: string }, maintenantMs: number): { from: string; to: string } | null {
  const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10)
  const debut = offre.debutUtc ? Date.parse(offre.debutUtc) : NaN
  const fin = offre.finUtc ? Date.parse(offre.finUtc) : NaN
  const depart = Number.isFinite(debut) ? Math.max(debut, maintenantMs) : maintenantMs
  const from = ymd(depart)
  const plafond = depart + 92 * JOUR
  const to = ymd(Number.isFinite(fin) ? Math.min(fin, plafond) : plafond)
  return to > from ? { from, to } : null
}
