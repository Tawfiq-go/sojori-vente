/**
 * La forme d'un site telle que srv-site la sert (`GET /api/v1/public/sites/…`). Copie de lecture
 * du contrat `SiteSpec` v1 (sojori-production, apps/srv-site/src/domaine/spec.ts) : l'app affiche,
 * elle ne valide pas — srv-site a déjà refusé tout ce qui n'est pas permis. Spec :
 * sojori-production/docs/patterns/agents/agent-site-web.md.
 */
export type Langue = 'fr' | 'en' | 'ar'
export type Texte = Partial<Record<Langue, string>>
export type Valeur = Texte | string | string[] | Array<Record<string, Texte | string>>

export type Section =
  | { id: string; niveau: 'sojori'; type: string; reglages: Record<string, unknown> }
  | { id: string; niveau: 'bibliotheque'; type: string; variante: string; contenu: Record<string, Valeur> }
  | { id: string; niveau: 'mesure'; nom: string; html: Texte; css: string }

export type Page = {
  id: string
  chemin: string
  titre: Texte
  seo?: { titre?: Texte; description?: Texte }
  /** Présent : landing d'offre (fenêtre de validité évaluée par srv-site à chaque lecture). Jamais dans le menu. */
  offre?: OffreServie
  sections: Section[]
}

/** La fenêtre d'une landing telle que srv-site la sert : l'état à l'instant de la lecture et les instants en UTC. */
export type OffreServie = {
  etat: 'a_venir' | 'en_cours' | 'terminee'
  debutUtc?: string
  finUtc?: string
  /** Soirée : le moment fort (`miseEnPage.evenement.quand`) en UTC, calculé par srv-site : le compte à rebours. */
  momentUtc?: string
  apresFin?: 'terminee' | 'masquer'
  /** Point d'accroche du paiement : seul `whatsapp` change l'affichage (le bouton mène à WhatsApp) ; `moteur` n'est pas branché. */
  paiement?: 'demonstration' | 'whatsapp' | 'moteur'
  /** Règle de remise des champs dynamiques (jetons) : pourcentage entier, appliqué aux vrais tarifs. */
  remise?: { pourcent: number; arrondi?: 'unite' | 'cinq' | 'dix' }
  /** Périmètre des champs dynamiques (identifiants de logements) ; absent = les logements du PM. */
  logements?: string[]
  /** Le design propre à la page (listes fermées de srv-site). */
  design?: { accent?: string; accentDoux?: string; police?: string; style?: string }
  /** Le service lié (carte ou prestation du catalogue) : une référence. Son contenu est dans `serviceLu`. */
  service?: { source: 'services'; id: string; forme: 'carte' | 'prestation' | 'evenement'; nom: string }
  /** Landing d'un ÉVÉNEMENT (Services) : date, statut et places, lus en direct par srv-site ; jamais la liste des invités. */
  evenementLu?: {
    debut: string
    fuseau: string
    statut: string
    maxPersonnes: number
    restantes: number
    reservable: boolean
    paiement?: { carte: boolean; surPlace: boolean }
  }
  /** Le service lié, LU EN DIRECT par srv-site dans le catalogue (jamais figé) ; absent = illisible ou introuvable. */
  serviceLu?: ServiceLu
  /** Le cadeau offert d'un séjour, lu en direct (son nom seulement). */
  cadeauLu?: { nom: Texte }
  /** La composition de la page et ses emplacements d'images (srv-site, lot D1). Absente : rendu d'aujourd'hui. */
  miseEnPage?: {
    id: string
    emplacements?: Record<string, string>
    programme?: Array<{ heure: string; quoi: Texte }>
    atouts?: Texte[]
    /** Soirée : le moment fort (heure locale) et le lieu. */
    evenement?: { quand: string; lieu?: Texte }
    palette?: Array<{ nom: Texte; couleur: string }>
    sections?: Array<{ titre: Texte; points: Texte[] }>
    /** Soirée : les formules, chacune une prestation ; leur nom et leur prix sont dans `formulesLues` (même indice). */
    formules?: Array<{ service: { id: string; nom: string }; points?: Texte[]; badge?: Texte }>
  }
  /** Soirée : les formules lues en direct par srv-site, même ordre que `miseEnPage.formules` ; `null` = illisible, non montrée. */
  formulesLues?: Array<ServiceLu | null>
}

/** Ce que le public peut lire d'un service : nom, prix TTC EN CENTIMES (prestation), photo, vendable depuis la landing. */
export type ServiceLu = {
  nom: Texte
  prixCentimes?: number
  devise?: string
  image?: string
  commandable: boolean
  /** Formule d'événement : l'identifiant de sa prestation (la commande la désigne par lui), billet ou table, ce qui est compris. */
  id?: string
  par?: 'personne' | 'table'
  personnesParTable?: number | null
  description?: Texte
}

export type SiteSpec = {
  v: 1
  identite: {
    nom: string
    logo?: string
    /** L'en-tête : logo seul (défaut s'il y a un logo), logo et nom, nom seul. */
    affichage?: 'logo' | 'logo_nom' | 'nom'
    /** Le bouton WhatsApp flottant, au numéro du bloc contact. */
    whatsappFlottant?: boolean
    /** Le bouton « Réserver » de l'en-tête (absent = pas de bouton : les sites déjà en ligne ne changent pas). */
    reserver?: boolean
    /** L'espace IA du site (bulle de Réservation directe), si le PM l'a allumé. */
    assistant?: boolean
  }
  theme: {
    couleurs: { fond: string; texte: string; accent: string; accentDoux: string }
    polices: { titres: string; texte: string }
    arrondi: 'aucun' | 'doux' | 'rond'
    densite: 'aeree' | 'normale' | 'serree'
    /** Direction artistique (absente = classique). */
    style?: 'classique' | 'editorial' | 'riad' | 'minimal' | 'luxe' | 'moderne' | 'immersif'
    /** Le mouvement au défilement (absent = douces ; rien en classique). */
    animations?: 'aucune' | 'douces'
  }
  langues: { defaut: Langue; actives: Langue[] }
  pages: Page[]
  piedDePage: { texte?: Texte; infos?: Texte[]; reseaux?: Array<{ type: string; url: string }> }
}

export type Media = { url: string; type: 'image' | 'video'; alt?: string }

export type SitePublic = {
  siteId: string
  adresse: string
  spec: SiteSpec
  medias: Record<string, Media>
  /** Les mentions légales de la version publiée (raison sociale, ICE, RC, adresse…). */
  mentions: Record<string, string> | null
  /** Le bloc « contact » : numéro WhatsApp (chiffres, pour wa.me) et formulaire de la page de contact du PM. */
  contact?: { whatsapp: string | null; formulaire: string | null }
  /** Les questions fréquentes validées du PM et ses expériences actives, figées à la mise en ligne. */
  faq?: Array<{ question: string; reponse: string }>
  experiences?: Array<{ titre: string; description?: string; prix?: number; devise?: string; photo?: string }>
  version: number | null
  apercu: boolean
}

/** Un logement tel que la liste publique de srv-listing le rend (`?pm=<slug>`). */
export type Logement = {
  id: string
  /** Le propriétaire du logement (srv-listing `pmId`). */
  pmId?: string
  title: string
  city?: string
  pricePerNight?: number
  currency?: string
  maxGuests?: number
  bedrooms?: number
  bathrooms?: number
  images?: string[]
  description?: string
  amenities?: string[]
  /** Coordonnées de srv-listing ; un logement sans coordonnées n'a ni l'une ni l'autre (jamais 0,0). */
  lat?: number
  lng?: number
  rating?: number
  reviewCount?: number
}

/** Un avis de voyageur, tel que `GET /api/v1/guest/listings/:id/reviews` le rend (PII déjà retirées). */
export type Avis = {
  id: string
  prenom: string
  note: number | null
  texte: string
  plateforme?: string
  date?: string
  logement: string
}
