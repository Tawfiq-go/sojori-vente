# Architecture Marketplace Sojori avec IA

## 🏗️ Structure de Navigation

```
┌─────────────────────────────────────────────────────────────┐
│                    HOMEPAGE (/)                             │
│  - Hero avec recherche principale                          │
│  - Villes populaires (Marrakech, Casablanca, etc.)        │
│  - Property Managers vérifiés                              │
│  - Biens à la une                                          │
│  - Section confiance                                        │
│  └──→ Clic sur recherche ou ville ──→ /search              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              PAGE RECHERCHE (/search)                       │
│  - Filtres (prix, équipements, type, PM)                   │
│  - Carte interactive (Maroc)                                │
│  - Liste des résultats (grille)                            │
│  - Tri (pertinence, prix, note)                            │
│  └──→ Clic sur un bien ──→ /listing/[id]                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           PAGE DÉTAIL BIEN (/listing/[id])                  │
│  - Galerie photos                                           │
│  - Informations détaillées                                  │
│  - Calendrier de disponibilité                             │
│  - Avis clients                                             │
│  - Carte de localisation                                    │
│  - Formulaire de réservation                                │
│  └──→ Réserver ──→ Processus de réservation                │
└─────────────────────────────────────────────────────────────┘
```

## 🤖 Intégration de l'IA - Les 4 Points de Contact

### 1️⃣ **HOMEPAGE - Assistant de Recherche Conversationnel**
**Position** : Bulle flottante en bas à droite + Widget optionnel dans le hero

**Fonctionnalités** :
- "Je cherche un riad pour 6 personnes à Marrakech avec piscine"
- L'IA comprend et pré-remplit les filtres de recherche
- Suggestions personnalisées basées sur l'historique
- Questions guidées : "Quel est votre budget ?" "Dates flexibles ?"

**Exemple de dialogue** :
```
User: Je veux un endroit calme près de la plage
IA:   🏖️ Essaouira et Agadir sont parfaits pour ça !
      Combien de personnes ? Et vos dates ?
User: 4 personnes, première semaine de juillet
IA:   J'ai trouvé 12 biens. Voulez-vous :
      - Vue mer directe (8 biens, dès 140€/nuit)
      - À 5min de la plage (4 biens, dès 95€/nuit)
```

---

### 2️⃣ **PAGE RECHERCHE - Assistant de Filtrage Intelligent**
**Position** :
- Panneau latéral droit (collapsible)
- OU chat overlay activable

**Fonctionnalités** :
- **Compréhension du contexte** : "Montre-moi les biens avec piscine"
- **Comparaison intelligente** : "Compare ces 3 riads pour moi"
- **Recommandations** : "Basé sur vos critères, ce bien est le meilleur rapport qualité/prix"
- **Alertes prix** : "Le prix a baissé de 15% cette semaine"
- **Clarifications** : "Ce quartier est à 10min à pied de la médina, calme le soir"

**UI Visuelle** :
```
┌────────────────────────────────────────────────┐
│  🔍 Recherche : Marrakech, 15-22 juil, 4 pers │
├────────────────────────────────────────────────┤
│  [Carte] [Liste]           💬 Demander à l'IA │
├─────────────┬──────────────────────────────────┤
│  Filtres    │   📍 Carte + Résultats          │
│  □ Piscine  │                                  │
│  □ Parking  │   [Bien 1] [Bien 2] [Bien 3]    │
│  Prix       │                                  │
│  50-300€    │   ✨ IA suggest: "Villa Atlas   │
│             │      correspond parfaitement"    │
│  ─────────  │                                  │
│  💬 IA Chat │                                  │
│  "Compare   │                                  │
│   les 3"    │                                  │
└─────────────┴──────────────────────────────────┘
```

---

### 3️⃣ **PAGE DÉTAIL - Assistant de Décision**
**Position** :
- Widget intégré sous la galerie photos
- Chat contextuel dans le sidebar de réservation

**Fonctionnalités** :
- **Q&A sur le bien** : "Y a-t-il un lit bébé ?" → "Oui, disponible sur demande gratuite"
- **Analyse du quartier** : "C'est bruyant ?" → "Quartier résidentiel calme, reviews confirment"
- **Optimisation de réservation** : "Le prix baisse de 12% si vous prenez 7 nuits au lieu de 6"
- **Comparaison avec favoris** : "Ce bien est 20€/nuit moins cher que votre favori"
- **Traduction automatique** : Reviews en arabe → français

**Exemple UI** :
```
┌─────────────────────────────────────────────────┐
│  [Photos]  [← Retour aux résultats]            │
├─────────────────────────────────────────────────┤
│  Riad de la Bahia · Médina                      │
│  ⭐ 4.92 (156 avis) · Marrakech                 │
├──────────────────────────┬──────────────────────┤
│  Description             │  💬 Questions ?      │
│  Équipements             │                      │
│  Avis                    │  ✨ IA répond        │
│                          │  instantanément      │
│  💡 IA Insights:         │                      │
│  ━━━━━━━━━━━━━━━━━━━━━━ │  [Poser question]   │
│  • Prix -15% vs moyenne  │                      │
│  • Hôte ultra-réactif    │  Questions fréq:    │
│  • WiFi excellent (50Mo) │  • Parking ?        │
│  • Check-in flexible     │  • Bruit ?          │
│                          │  • Navette ?        │
└──────────────────────────┴──────────────────────┘
```

---

### 4️⃣ **ASSISTANT GLOBAL - Accompagnement Complet**
**Position** : Bulle flottante persistante sur toutes les pages

**Fonctionnalités avancées** :
- **Multi-sessions** : Se souvient de vos recherches précédentes
- **Notifications proactives** : "Un bien de votre wishlist est maintenant disponible"
- **Aide à la décision** : "Vous hésitez depuis 3 jours, voulez-vous que je compare ?"
- **Support voyageur** : Après réservation → "Besoin d'un transfert aéroport ?"

---

## 🎨 Design de l'Assistant IA

### Bulle flottante (persistante)
```css
Position: fixed bottom-6 right-6
Taille: 60px × 60px
Couleur: Gradient violet (#a78bfa) → AI color (#8b5cf6)
Animation: Pulse subtil
Badge notification: Pastille rouge si nouveau message
```

### Fenêtre de chat (ouverte)
```
Taille: 380px × 600px (desktop)
        Full screen (mobile)
Position: Ancré en bas à droite
Style: Carte avec glassmorphism
Header: "Assistant Sojori ✨"
Footer: Input + bouton envoyer + suggestions
```

### Exemples de Messages IA

**Message système** :
```
┌─────────────────────────────────────┐
│ ✨ Je peux vous aider à :          │
│ • Trouver le bien parfait           │
│ • Comparer les options              │
│ • Répondre à vos questions          │
│ • Optimiser votre budget            │
└─────────────────────────────────────┘
```

**Suggestion proactive** :
```
┌─────────────────────────────────────┐
│ 💡 J'ai remarqué que vous regardez │
│    beaucoup de riads avec piscine.  │
│    Voulez-vous activer ce filtre ?  │
│                                      │
│    [Oui, filtrer] [Non merci]       │
└─────────────────────────────────────┘
```

**Comparaison intelligente** :
```
┌─────────────────────────────────────┐
│ 📊 Comparaison : Riad Luxe vs Dar H │
│                                      │
│ Prix:     185€ ✓          140€      │
│ Note:     4.92            4.88 ✓    │
│ Piscine:  Oui ✓           Non       │
│ Médina:   5min ✓          15min     │
│                                      │
│ 💡 Riad Luxe vaut les 45€ de plus   │
│    pour la localisation premium.    │
└─────────────────────────────────────┘
```

---

## 🔧 Technologie IA (Backend)

### Stack technique
```typescript
// API Routes
/api/ai/search          - Recherche conversationnelle
/api/ai/compare         - Comparaison de biens
/api/ai/recommend       - Recommandations personnalisées
/api/ai/insights        - Analyse de bien spécifique
/api/ai/chat            - Chat général

// Modèle
- GPT-4o pour compréhension + génération
- Embeddings pour recherche sémantique
- RAG (Retrieval Augmented Generation) sur :
  - Base de données des biens
  - Reviews clients
  - Quartiers et POI
  - Règles métier Sojori
```

### Exemple d'appel API
```typescript
// Client side
const response = await fetch('/api/ai/recommend', {
  method: 'POST',
  body: JSON.stringify({
    query: "riad authentique avec piscine",
    filters: { city: "marrakech", guests: 4 },
    context: "user_preference_history"
  })
});

// Response
{
  suggestions: [
    {
      listingId: "RL-001",
      score: 0.95,
      reason: "Match parfait : piscine privée, architecture traditionnelle, quartier calme",
      highlights: ["Prix optimal", "Disponible vos dates", "Hôte 5★"]
    }
  ],
  chatResponse: "J'ai trouvé 3 riads parfaits. Le Riad de la Bahia correspond exactement..."
}
```

---

## 📱 UX Mobile

### Homepage mobile
- Assistant IA : Bouton flottant uniquement
- Hero : Search bar simplifiée + bouton "Recherche guidée par IA"

### Search mobile
- IA en bottom sheet (swipe up)
- Suggestions rapides en chips

### Listing mobile
- IA en FAB (Floating Action Button)
- Quick questions en carrousel horizontal

---

## 🚀 Phases de Déploiement

### Phase 1 (MVP) - Homepage + Search
✅ Assistant de recherche conversationnel
✅ Filtrage intelligent
✅ Suggestions basiques

### Phase 2 - Listing Detail
✅ Q&A contextuel
✅ Insights automatiques
✅ Comparaison avec favoris

### Phase 3 - Personnalisation
✅ Historique utilisateur
✅ Recommandations prédictives
✅ Notifications proactives

### Phase 4 - Post-booking
✅ Conciergerie IA
✅ Support voyage
✅ Recommendations locales

---

## 📊 Métriques de Succès IA

| Métrique | Objectif |
|----------|----------|
| Taux d'utilisation de l'IA | >40% des visiteurs |
| Conversion search→booking via IA | +25% vs manuel |
| Temps de décision | -30% |
| Satisfaction (NPS) | +15 points |
| Questions résolues sans contact PM | >70% |

---

**Créé par Claude Code pour Sojori Marketplace**
**Version 1.0 - Mai 2026**
