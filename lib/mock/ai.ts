import type {
  AISearchResponse,
  AIListingSummary,
  AIMarketInsight,
  SearchFilters,
  City,
  Listing,
} from '../types';
import { getListings } from './db';

/**
 * Mock AI - Simulates AI search and analysis
 * No real API calls, pure client-side logic
 */

// ─── AI Search Simulation ───
export function aiSearch(prompt: string): AISearchResponse {
  const lowerPrompt = prompt.toLowerCase();

  // Extract city
  let city: City | undefined;
  if (lowerPrompt.includes('marrakech') || lowerPrompt.includes('marrakesh')) {
    city = 'marrakech';
  } else if (lowerPrompt.includes('casablanca') || lowerPrompt.includes('casa')) {
    city = 'casablanca';
  } else if (lowerPrompt.includes('essaouira')) {
    city = 'essaouira';
  } else if (lowerPrompt.includes('fès') || lowerPrompt.includes('fes')) {
    city = 'fes';
  }

  // Extract guest count
  let guests: number | undefined;
  const guestMatch = lowerPrompt.match(/(\d+)\s*(personnes?|adultes?|voyageurs?|guests?)/);
  if (guestMatch) {
    guests = parseInt(guestMatch[1]);
  }

  // Extract price preferences
  let priceRange: [number, number] | undefined;
  if (lowerPrompt.includes('pas cher') || lowerPrompt.includes('budget') || lowerPrompt.includes('économique')) {
    priceRange = [50, 150];
  } else if (lowerPrompt.includes('luxe') || lowerPrompt.includes('haut de gamme') || lowerPrompt.includes('luxury')) {
    priceRange = [200, 500];
  } else if (lowerPrompt.includes('moyen') || lowerPrompt.includes('milieu de gamme')) {
    priceRange = [100, 200];
  }

  // Extract property type preferences
  const propertyTypes: ('riad' | 'apartment' | 'villa' | 'hotel')[] = [];
  if (lowerPrompt.includes('riad')) propertyTypes.push('riad');
  if (lowerPrompt.includes('villa')) propertyTypes.push('villa');
  if (lowerPrompt.includes('appartement') || lowerPrompt.includes('apartment')) propertyTypes.push('apartment');

  // Extract amenities
  const amenities: string[] = [];
  if (lowerPrompt.includes('piscine') || lowerPrompt.includes('pool')) amenities.push('Piscine');
  if (lowerPrompt.includes('wifi')) amenities.push('WiFi');
  if (lowerPrompt.includes('hammam')) amenities.push('Hammam');
  if (lowerPrompt.includes('jardin') || lowerPrompt.includes('garden')) amenities.push('Jardin');
  if (lowerPrompt.includes('vue') || lowerPrompt.includes('view')) amenities.push('Vue');

  // Build filters
  const filters: SearchFilters = {};
  if (city) filters.city = city;
  if (guests) filters.guests = guests;
  if (priceRange) filters.priceRange = priceRange;
  if (propertyTypes.length > 0) filters.propertyTypes = propertyTypes;
  if (amenities.length > 0) filters.amenities = amenities;

  // Generate interpretation
  let interpretation = 'Je recherche ';
  if (city) {
    const cityNames: Record<City, string> = {
      marrakech: 'à Marrakech',
      casablanca: 'à Casablanca',
      essaouira: 'à Essaouira',
      fes: 'à Fès',
    };
    interpretation += cityNames[city] + ' ';
  }
  if (propertyTypes.length > 0) {
    interpretation += propertyTypes.join(' ou ') + ' ';
  } else {
    interpretation += 'un logement ';
  }
  if (guests) {
    interpretation += `pour ${guests} personne${guests > 1 ? 's' : ''} `;
  }
  if (amenities.length > 0) {
    interpretation += `avec ${amenities.join(', ')} `;
  }
  if (priceRange) {
    interpretation += `entre ${priceRange[0]}€ et ${priceRange[1]}€/nuit`;
  }

  // Generate suggestions
  const suggestions: string[] = [];
  if (city === 'marrakech') {
    suggestions.push('Riads avec piscine médina Marrakech');
    suggestions.push('Villas luxe Palmeraie vue Atlas');
    suggestions.push('Appartements modernes Guéliz');
  } else if (city === 'essaouira') {
    suggestions.push('Riads vue mer médina Essaouira');
    suggestions.push('Villas face océan');
  } else if (city === 'casablanca') {
    suggestions.push('Penthouses Corniche Ain Diab');
    suggestions.push('Appartements business centre');
  } else {
    suggestions.push('Riads authentiques médina Marrakech');
    suggestions.push('Villas piscine privée');
    suggestions.push('Séjours bord de mer Essaouira');
  }

  // Generate insights
  const insights: AISearchResponse['insights'] = [];

  if (city) {
    insights.push({
      icon: '📊',
      title: 'Analyse de prix',
      text: `${getListings({ city }).length} biens disponibles. Prix moyen: 145€/nuit. Meilleure période: avril-juin.`,
    });
  }

  if (guests && guests >= 6) {
    insights.push({
      icon: '👨‍👩‍👧‍👦',
      title: 'Grands groupes',
      text: `J'ai identifié ${getListings({ guests }).length} biens adaptés aux groupes de ${guests} personnes avec espaces communs.`,
    });
  }

  if (amenities.includes('Piscine')) {
    insights.push({
      icon: '🏊',
      title: 'Piscines',
      text: 'Les riads avec piscine sur le toit offrent une expérience unique. Chauffage disponible en hiver.',
    });
  }

  return {
    prompt,
    interpretation,
    filters,
    suggestions,
    insights,
  };
}

// ─── AI Listing Summary ───
export function aiListingSummary(listing: Listing, userPreferences?: Partial<SearchFilters>): AIListingSummary {
  // Calculate match score
  let matchScore = 75; // Base score

  if (userPreferences) {
    if (userPreferences.city && listing.city === userPreferences.city) matchScore += 10;
    if (userPreferences.guests && listing.guests >= userPreferences.guests) matchScore += 5;
    if (userPreferences.priceRange) {
      const [min, max] = userPreferences.priceRange;
      if (listing.pricePerNight >= min && listing.pricePerNight <= max) matchScore += 10;
    }
    if (userPreferences.amenities) {
      const matchedAmenities = userPreferences.amenities.filter((a) => listing.amenities.includes(a));
      matchScore += matchedAmenities.length * 3;
    }
  }

  matchScore = Math.min(99, matchScore); // Cap at 99

  // Generate why match
  const whyMatch: string[] = [];
  if (listing.source === 'exclusive') whyMatch.push('Bien exclusif Sojori');
  if (listing.rating >= 4.8) whyMatch.push('Note exceptionnelle 4.8+');
  if (listing.instantBook) whyMatch.push('Réservation instantanée');
  if (listing.originalPrice) whyMatch.push(`Économie ${listing.originalPrice - listing.pricePerNight}€/nuit`);
  if (listing.amenities.includes('Piscine')) whyMatch.push('Piscine privée/partagée');
  if (listing.pm === 'riad-luxe') whyMatch.push('Property Manager vérifié Premium');

  // Generate pros
  const pros: string[] = [];
  if (listing.rating >= 4.8) pros.push('Avis clients excellents');
  if (listing.reviewCount > 100) pros.push(`${listing.reviewCount} avis vérifiés`);
  if (listing.location.poi.length > 0) {
    pros.push(`À ${listing.location.poi[0].distance} de ${listing.location.poi[0].name}`);
  }
  if (listing.amenities.includes('WiFi')) pros.push('WiFi haut débit');
  if (listing.amenities.includes('Hammam')) pros.push('Hammam traditionnel');

  // Generate cons (simulated)
  const cons: string[] = [];
  if (!listing.amenities.includes('Parking')) cons.push('Pas de parking privé');
  if (!listing.instantBook) cons.push('Validation manuelle requise');
  if (listing.propertyType === 'riad' && listing.neighborhood.toLowerCase().includes('médina')) {
    cons.push('Accès médina (pas de voiture)');
  }

  // Generate best for
  let bestFor = '';
  if (listing.guests >= 8) {
    bestFor = 'Parfait pour les grands groupes et familles nombreuses';
  } else if (listing.propertyType === 'riad') {
    bestFor = 'Idéal pour découvrir l\'authenticité marocaine';
  } else if (listing.propertyType === 'villa') {
    bestFor = 'Parfait pour un séjour en toute intimité';
  } else {
    bestFor = 'Idéal pour couples et petites familles';
  }

  // Generate suggestion
  let suggestion = '';
  if (matchScore >= 90) {
    suggestion = 'Ce bien correspond parfaitement à votre recherche. Je recommande vivement !';
  } else if (matchScore >= 80) {
    suggestion = 'Excellent choix qui répond à vos critères principaux.';
  } else {
    suggestion = 'Bon rapport qualité/prix mais vérifiez bien les critères importants pour vous.';
  }

  return {
    matchScore,
    whyMatch,
    pros,
    cons,
    bestFor,
    suggestion,
  };
}

// ─── AI Market Insights ───
export function aiMarketInsights(city: City, checkIn?: string, checkOut?: string): AIMarketInsight {
  const listings = getListings({ city });
  const avgPrice = Math.round(listings.reduce((sum, l) => sum + l.pricePerNight, 0) / listings.length);

  // Price analysis
  const priceAnalysis = `Prix moyen à ${city}: ${avgPrice}€/nuit. Les riads exclusifs Sojori sont en moyenne 15% moins chers que sur Airbnb grâce à nos partenariats directs.`;

  // Seasonal trend
  let seasonalTrend = '';
  const month = checkIn ? new Date(checkIn).getMonth() : new Date().getMonth();
  if (month >= 3 && month <= 5) {
    // Apr-Jun
    seasonalTrend = 'Période idéale : printemps, climat parfait (20-28°C), prix modérés, affluence moyenne.';
  } else if (month >= 6 && month <= 8) {
    // Jul-Sep
    seasonalTrend = 'Haute saison : très forte demande, prix élevés (+30%), chaleur intense. Réservez tôt !';
  } else if (month >= 9 && month <= 11) {
    // Oct-Dec
    seasonalTrend = 'Excellent rapport : automne doux, prix en baisse (-20%), disponibilités larges.';
  } else {
    // Jan-Mar
    seasonalTrend = 'Basse saison : meilleurs tarifs (-25%), moins de touristes, températures fraîches (12-20°C).';
  }

  // Recommendation
  let recommendation = '';
  if (city === 'marrakech') {
    recommendation =
      'Marrakech : privilégiez un riad en médina pour l\'authenticité ou une villa Palmeraie pour le calme. Évitez les week-ends (prix +40%).';
  } else if (city === 'essaouira') {
    recommendation =
      'Essaouira : idéal pour les surfeurs et amateurs de calme. Choisissez un riad vue mer dans la médina ou une villa route d\'Agadir.';
  } else if (city === 'casablanca') {
    recommendation =
      'Casablanca : privilégiez Ain Diab (corniche) pour les loisirs ou Maarif/Gauthier pour le business.';
  } else {
    recommendation =
      'Fès : médina UNESCO, choisissez un riad traditionnel proche de Bab Boujloud pour vivre l\'expérience authentique.';
  }

  // Alternative dates (simulated savings)
  const alternativeDates: AIMarketInsight['alternativeDates'] = [];
  if (checkIn) {
    const date1 = new Date(checkIn);
    date1.setDate(date1.getDate() - 7);
    alternativeDates.push({
      date: date1.toISOString().split('T')[0],
      savings: 35,
    });

    const date2 = new Date(checkIn);
    date2.setDate(date2.getDate() + 14);
    alternativeDates.push({
      date: date2.toISOString().split('T')[0],
      savings: 28,
    });
  }

  return {
    priceAnalysis,
    seasonalTrend,
    recommendation,
    alternativeDates,
  };
}

// ─── AI Suggestions ───
export function aiSuggestAlternatives(listing: Listing): Listing[] {
  // Find similar listings
  const similar = getListings({
    city: listing.city,
    guests: listing.guests - 2, // Allow smaller
  });

  return similar
    .filter((l) => l.id !== listing.id)
    .filter((l) => Math.abs(l.pricePerNight - listing.pricePerNight) < 100)
    .filter((l) => l.propertyType === listing.propertyType || l.pm === listing.pm)
    .slice(0, 4);
}

// ─── AI Chat Simulation ───
export function aiChatResponse(userMessage: string, context?: { listingId?: string; city?: City }): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('piscine') || lower.includes('pool')) {
    return 'Oui ! Ce bien dispose d\'une piscine. En médina, les piscines sont souvent sur le toit avec vue panoramique. Voulez-vous savoir si elle est chauffée ?';
  }

  if (lower.includes('parking')) {
    return 'En médina de Marrakech, les riads n\'ont généralement pas de parking privé car les voitures ne peuvent pas circuler. Je recommande de réserver un parking public proche (10-15€/jour) ou d\'utiliser un taxi/transfert. Besoin d\'aide pour organiser ça ?';
  }

  if (lower.includes('aéroport') || lower.includes('airport')) {
    return 'L\'aéroport de Marrakech-Menara est à 20 minutes en taxi (environ 100-150 MAD). Je peux vous aider à réserver un transfert privé avec accueil personnalisé pour 25€/trajet. Intéressé ?';
  }

  if (lower.includes('annulation') || lower.includes('cancel')) {
    return 'Ce bien propose une annulation gratuite jusqu\'à 7 jours avant l\'arrivée. En cas d\'annulation plus tardive, la première nuit est retenue. C\'est une politique flexible qui vous protège en cas d\'imprévu.';
  }

  if (lower.includes('enfants') || lower.includes('children') || lower.includes('kids')) {
    return 'Ce bien accueille les enfants ! Points importants : piscine non sécurisée (surveillance parentale requise), lit bébé disponible sur demande, chaises hautes fournies. Les riads ont souvent des escaliers, soyez vigilants avec les tout-petits.';
  }

  if (lower.includes('restaurant') || lower.includes('manger')) {
    return 'Le quartier regorge de restaurants authentiques ! Je recommande : Le Jardin (cuisine bio), Nomad (terrasse vue médina), Café des Épices (local). Le Property Manager peut aussi vous préparer un dîner marocain sur place. Envie de suggestions détaillées ?';
  }

  if (lower.includes('activités') || lower.includes('à faire')) {
    return 'Top activités à Marrakech : visite guidée souks et médina (demi-journée), excursion Palais + Jardin Majorelle, cours de cuisine marocaine, quad dans la Palmeraie, hammam traditionnel. Je peux vous recommander des prestataires de confiance !';
  }

  return 'Je suis là pour vous aider ! N\'hésitez pas à me poser des questions sur le logement, les équipements, l\'emplacement ou des recommandations locales. 😊';
}

// ─── AI Quick Insights for Search Results ───
export function aiQuickInsight(filters: SearchFilters): string | null {
  const { city, priceRange, guests } = filters;

  if (city === 'marrakech' && priceRange && priceRange[1] < 120) {
    return '💡 Astuce : Les riads en médina offrent souvent le meilleur rapport qualité/prix dans cette gamme.';
  }

  if (guests && guests >= 8) {
    return '👨‍👩‍👧‍👦 Grand groupe : Privilégiez les villas avec espaces communs et plusieurs salles de bain.';
  }

  if (city === 'essaouira') {
    return '🌊 Essaouira : Ville venteuse idéale pour surf et kitesurf. Pensez aux coupe-vent !';
  }

  return null;
}
