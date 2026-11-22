import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { type DonneesLanding, LandingMiseEnPage } from '@/components/site/miseEnPage/MisesEnPage'
import { MISES_EN_PAGE, miseEnPage } from '@/lib/site/miseEnPage'
import '../mise-en-page.css'

/**
 * Les MAQUETTES des mises en page d'une landing (lot D2), sur des données FICTIVES, pour les montrer avant toute plomberie.
 * Jamais servie en production (sauf `SITE_MAQUETTES=1`), jamais indexée. `?modele=<id>&images=0|1&mode=apercu|public`.
 * Les photos viennent de `public/maquettes/` (local, hors dépôt) : absentes, la maquette montre ses replis dessinés.
 */
export const metadata: Metadata = { title: 'Maquettes des landings', robots: { index: false, follow: false } }

const sable = { fond: '#f7f1e6', texte: '#1d1a16' }
const POLICES = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Syne:wght@600;700;800&family=Inter:wght@400;600;700&display=swap'

const DONNEES: Record<string, DonneesLanding> = {
  editorial: {
    marque: 'Nommos',
    couleurs: { accent: '#0d7a85', doux: '#e2eeec', ...sable },
    polices: { titre: 'Cormorant Garamond', texte: 'Inter' },
    surtitre: 'Pool club · Marrakech',
    titre: 'Le day pass Nommos',
    accroche: 'Votre bed au bord de la piscine, de 12 h à 20 h, sur une programmation house et afro. Jardin exotique, cocktails signatures.',
    prix: { offre: '960 MAD', origine: '1 200 MAD', unite: 'le bed pour deux' },
    bouton: 'Réserver mon bed',
    restant: 'Il reste 12 beds samedi',
    faits: [
      { libelle: 'Horaires', valeur: '12 h à 20 h' },
      { libelle: 'Beds', valeur: '55 au bord du bassin' },
      { libelle: 'Accès', valeur: 'Adultes seulement' },
      { libelle: 'Navette', valeur: 'Gratuite depuis Guéliz' },
    ],
    conditions: 'Serviette fournie. Annulation gratuite jusqu’à 24 h avant.',
    code: 'POOL20',
    images: { couverture: '/maquettes/2025_08_DSC00543.webp' },
  },
  diptyque: {
    marque: 'Nommos',
    couleurs: { accent: '#7a5a3a', doux: '#efe6d8', fond: '#fbf7f0', texte: '#231c15' },
    polices: { titre: 'Playfair Display', texte: 'Inter' },
    surtitre: 'Dîner sous les palmiers',
    titre: 'Une soirée à LA LA LA',
    accroche: 'Cuisine contemporaine, cocktails signatures et DJ jusqu’à minuit, sous la pergola de la terrasse.',
    prix: { offre: '450 MAD', origine: '560 MAD', unite: 'le menu pour une personne' },
    bouton: 'Réserver ma table',
    faits: [
      { libelle: 'Service', valeur: '20 h à minuit' },
      { libelle: 'Ambiance', valeur: 'DJ set dès 22 h' },
    ],
    conditions: 'Tenue élégante. Table gardée 15 minutes.',
    images: { ambiance: '/maquettes/2025_08_DSC00858.webp', detail: '/maquettes/2025_06_rest-1.jpg' },
  },
  mosaique: {
    marque: 'Nommos',
    couleurs: { accent: '#8a5a3b', doux: '#f1e7da', fond: '#faf6ef', texte: '#22180f' },
    polices: { titre: 'Cormorant Garamond', texte: 'Inter' },
    surtitre: 'Villas privées',
    titre: 'Neuf villas, une piscine chacune',
    accroche: '12 000 m² de jardin sur la route de l’Ourika. Le calme d’une villa, le pool club à deux pas.',
    prix: { offre: 'dès 2 400 MAD', origine: '3 000 MAD', unite: 'la nuit' },
    bouton: 'Voir les dates',
    faits: [
      { libelle: 'Villas', valeur: '9 avec piscine' },
      { libelle: 'Suites', valeur: '5 exclusives' },
      { libelle: 'Séjour', valeur: '2 nuits minimum' },
    ],
    images: {
      grande: '/maquettes/2025_10_vila.webp',
      photo2: '/maquettes/2025_08_DSC00522.webp',
      photo3: '/maquettes/2025_07_piscine-3.webp',
      photo4: '/maquettes/2025_08_DSC00899.webp',
      photo5: '/maquettes/2025_07_piscine-4.webp',
    },
  },
  typographique: {
    marque: 'Nommos',
    couleurs: { accent: '#b4532a', doux: '#f3e4d8', fond: '#fff7ee', texte: '#1d1a16' },
    polices: { titre: 'Syne', texte: 'Inter' },
    surtitre: 'Tennis & padel · Nouveau',
    titre: 'Smash au soleil',
    accroche: 'Cours, stages et tournois sur les courts du resort. Raquettes prêtées, eau fraîche offerte.',
    prix: { offre: '250 MAD', origine: '300 MAD', unite: 'l’heure' },
    bouton: 'Réserver un court',
    restant: '3 créneaux libres demain',
    faits: [
      { libelle: 'Courts', valeur: '1 tennis, 2 padel' },
      { libelle: 'Horaires', valeur: '8 h à 21 h' },
      { libelle: 'Coach', valeur: 'Sur demande' },
    ],
    images: {},
  },
  carte_chef: {
    marque: 'Nommos',
    couleurs: { accent: '#c25c33', doux: '#f6e6d6', fond: '#fdf7ee', texte: '#24170f' },
    polices: { titre: 'Playfair Display', texte: 'Inter' },
    surtitre: 'Chaque dimanche dès 12 h',
    titre: 'BOHO Sunday Brunch',
    accroche: 'Un brunch à partager au bord du bassin, en musique, jusqu’au coucher du soleil.',
    prix: { offre: '390 MAD', origine: '450 MAD', unite: 'par personne' },
    bouton: 'Réserver mon brunch',
    programme: [
      { heure: '12 h', quoi: 'Ouverture du buffet' },
      { heure: '14 h', quoi: 'Live cooking' },
      { heure: '16 h', quoi: 'DJ set au bord de l’eau' },
    ],
    carte: [
      {
        categorie: 'Pains & viennoiseries',
        lignes: [
          { nom: 'Msemen et baghrir', detail: 'Miel de thym, amlou maison' },
          { nom: 'Croissants au beurre', detail: 'Confitures du jour' },
        ],
      },
      {
        categorie: 'Œufs & salé',
        lignes: [
          { nom: 'Œufs bénédicte', detail: 'Saumon fumé ou épinards' },
          { nom: 'Khlii aux œufs', detail: 'Viande séchée, cumin' },
          { nom: 'Crevettes sautées', detail: 'Sauce tomate épicée, basilic', prix: '+90 MAD' },
        ],
      },
      {
        categorie: 'Douceurs',
        lignes: [
          { nom: 'Pancakes', detail: 'Fruits rouges, sirop d’érable' },
          { nom: 'Salade de fruits frais', detail: 'Menthe et fleur d’oranger' },
        ],
      },
      {
        categorie: 'À boire',
        lignes: [
          { nom: 'Thé à la menthe', detail: 'Servi à volonté' },
          { nom: 'Jus pressés', detail: 'Orange, pastèque' },
          { nom: 'Cocktail signature', prix: '+120 MAD' },
        ],
      },
    ],
    conditions: 'Enfants de moins de 12 ans : demi-tarif. Réservation conseillée.',
    images: { plat: '/maquettes/2025_06_rest-1.jpg' },
  },
  day_pass: {
    marque: 'Nommos',
    couleurs: { accent: '#0d7a85', doux: '#e2eeec', ...sable },
    polices: { titre: 'Cormorant Garamond', texte: 'Inter' },
    surtitre: 'Pool club · Day pass',
    titre: 'Une journée au bord de l’eau',
    accroche: '55 beds, une piscine de 50 mètres, une programmation house et afro.',
    prix: { offre: '480 MAD', origine: '600 MAD', unite: 'par personne' },
    bouton: 'Réserver ma journée',
    restant: 'Il reste 12 places samedi',
    atouts: ['Serviette fournie', 'Transat ou bed', 'Wifi', 'Navette gratuite'],
    programme: [
      { heure: '12 h', quoi: 'Ouverture du pool club' },
      { heure: '14 h', quoi: 'Déjeuner au bord de l’eau' },
      { heure: '17 h', quoi: 'DJ set au coucher du soleil' },
      { heure: '20 h', quoi: 'Fermeture' },
    ],
    faits: [
      { libelle: 'Accès', valeur: 'Adultes seulement' },
      { libelle: 'Où', valeur: 'Route de l’Ourika, km 9' },
    ],
    conditions: 'Annulation gratuite jusqu’à 24 h avant.',
    images: { lieu: '/maquettes/2025_08_DSC00522.webp', detail: '/maquettes/2025_08_DSC00543.webp' },
  },
}

type Props = { searchParams: Promise<{ modele?: string; images?: string; mode?: string }> }

export default async function Maquettes({ searchParams }: Props) {
  if (process.env.NODE_ENV === 'production' && process.env.SITE_MAQUETTES !== '1') notFound()
  const q = await searchParams
  const m = q.modele ? miseEnPage(q.modele) : undefined
  if (!m)
    return (
      <main style={{ padding: 40, fontFamily: 'system-ui', maxWidth: 760 }}>
        <link rel="stylesheet" href={POLICES} />
        <h1>Maquettes des landings</h1>
        <ul>
          {MISES_EN_PAGE.map((x) => (
            <li key={x.id} style={{ margin: '12px 0' }}>
              <strong>{x.nom}</strong> : {x.description}{' '}
              <a href={`?modele=${x.id}&images=1&mode=public`}>avec photos</a> · <a href={`?modele=${x.id}&images=0&mode=apercu`}>sans photo (aperçu)</a> · <a href={`?modele=${x.id}&images=0&mode=public`}>sans photo (public)</a>
            </li>
          ))}
        </ul>
      </main>
    )
  const d = DONNEES[m.id]
  const sansImages = q.images === '0'
  return (
    <>
      <link rel="stylesheet" href={POLICES} />
      <LandingMiseEnPage m={m} d={sansImages ? { ...d, images: {} } : d} apercu={q.mode === 'apercu'} />
    </>
  )
}
