# Guide de Navigation - Marketplace Sojori

## 🗺️ Pages Disponibles

### 1. **Homepage** - http://localhost:6001/
Page d'accueil du marketplace avec toutes les sections

### 2. **Page Recherche** - http://localhost:6001/search
Résultats de recherche avec filtres et IA

### 3. **Page Détail d'un Bien** - http://localhost:6001/listing/rl-001
Détail complet d'une propriété avec réservation et IA

---

## 🎯 Parcours Utilisateur

```
Homepage (/)
    ↓
    [Clic sur recherche OU ville]
    ↓
Page Recherche (/search)
    ↓
    [Clic sur un bien]
    ↓
Page Détail (/listing/[id])
    ↓
    [Clic Réserver]
    ↓
Processus de Réservation (à venir)
```

---

## 🤖 Où est l'IA ?

### Sur TOUTES les pages :
- **Bulle flottante** (bas droite) : ✨ avec animation pulse
  - Clic → Ouvre le chat IA

### Homepage (/) :
- Bulle IA persistante
- Fonctions : Recherche conversationnelle, suggestions

### Page Recherche (/search) :
1. **Bouton "Demander à l'IA"** (toolbar haut)
2. **Panel IA Insights** (sidebar gauche) :
   - Prix optimal
   - Match parfait
   - Insights quartiers
3. **Badges IA sur les biens** :
   - "Recommandé IA · 95%"
   - "Prix optimal"
   - "Match parfait"
4. **Chat IA** (clic sur bulle OU bouton) :
   - Comparaison de biens
   - Filtrage intelligent
   - Questions/réponses

### Page Détail (/listing/[id]) :
1. **Section "IA Insights"** (grand encadré violet) :
   - 4 insights visuels (prix, hôte, WiFi, flexibilité)
   - Recommandation détaillée
2. **"Questions fréquentes"** (sidebar droite) :
   - 4 questions pré-remplies
   - Clic → Ouvre le chat avec réponse
3. **Chat IA contextuel** :
   - Q&A sur le bien spécifique
   - Informations vérifiées
   - Source des données (ex: "Confirmée par 23 avis")

---

## 🎨 Design de l'IA

### Couleurs
- **Gradient violet** : `from-[#a78bfa] to-[#8b5cf6]`
- **Background** : `from-[#a78bfa]/10 to-[#8b5cf6]/10`
- **Border** : `border-[#a78bfa]/20`

### Icônes
- ✨ Assistant IA
- 💡 Insights
- 🎯 Match/Recommandation
- 💬 Chat/Questions
- 💰 Prix
- ⚡ Rapidité/Réactivité
- 📍 Localisation
- 🅿️ Parking
- 📶 WiFi

### Animations
- **Bulle flottante** : `animate-pulse`
- **Hover** : `-translate-y-1` sur les cartes
- **Transitions** : `transition-all duration-200`

---

## 📱 Composants IA Réutilisables

### 1. AI Chat Bubble (Bulle flottante)
```typescript
<button className="fixed bottom-6 right-6 w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#a78bfa] to-[var(--color-ai)] text-white flex items-center justify-center text-2xl shadow-[0_8px_24px_rgba(139,92,246,0.40)] cursor-pointer z-50 animate-pulse">
  ✨
</button>
```

### 2. AI Chat Panel (Panneau de chat)
- **Taille** : 380px × 600px (search) / 420px × 560px (detail)
- **Position** : `fixed right-6 bottom-24`
- **Structure** :
  - Header (titre + fermer)
  - Body (messages avec scroll)
  - Footer (input + bouton)

### 3. AI Insights Card
```typescript
<div className="bg-gradient-to-br from-[#a78bfa]/10 to-[var(--color-ai)]/10 border border-[#a78bfa]/20 rounded-[16px] p-6">
  {/* Contenu */}
</div>
```

### 4. AI Badge (sur bien)
```typescript
<div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-[#a78bfa] to-[var(--color-ai)] text-white rounded-[6px] text-[11px] font-[700]">
  ✨ Recommandé IA · 95%
</div>
```

---

## 🔧 Test du Mockup

### Étape 1 : Homepage
1. Ouvrir http://localhost:6001/
2. **Vérifier** :
   - Header sticky avec logo Sojori
   - Barre de recherche centrale
   - Hero avec titre "Vivez le Maroc autrement"
   - 6 villes (Marrakech, Casablanca, etc.)
   - 4 Property Managers
   - 8 biens à la une
   - Section confiance (4 cartes)
   - Footer complet
   - **Bulle IA en bas à droite** ✨

### Étape 2 : Navigation → Recherche
1. Cliquer sur la barre de recherche OU une ville
2. **Vous arrivez sur** : http://localhost:6001/search
3. **Vérifier** :
   - Header avec même recherche
   - Titre "Séjours à Marrakech"
   - Sidebar gauche : filtres (prix, type, équipements, PM)
   - **Panel "IA Insights"** (violet, 3 insights)
   - Bouton **"Demander à l'IA"** (toolbar)
   - Grille de 3 biens
   - **Badges IA** sur le premier bien ("Recommandé IA · 95%")
   - **Bulle IA** (bas droite)

### Étape 3 : Test IA - Recherche
1. Cliquer sur **"Demander à l'IA"** OU **bulle ✨**
2. **Panneau s'ouvre** à droite
3. **Contenu** :
   - Header "Assistant Sojori"
   - Message d'accueil de l'IA
   - Input pour poser question
4. Fermer avec ✕

### Étape 4 : Navigation → Détail
1. Cliquer sur un bien (ex: "Riad de la Bahia")
2. **Vous arrivez sur** : http://localhost:6001/listing/rl-001
3. **Vérifier** :
   - "← Retour aux résultats" (header)
   - Galerie 5 photos
   - Titre + note + localisation
   - Badge "RIAD LUXE" (PM)
   - Stats (voyageurs, chambres, SdB)
   - **Section "IA Insights"** (grand encadré violet) :
     - 4 insights visuels
     - Recommandation détaillée
   - Tabs (Vue d'ensemble, Équipements, etc.)
   - **Sidebar droite** :
     - Carte réservation
     - **"Questions fréquentes"** (4 questions)
     - Bouton "Poser une autre question"
   - **Bulle IA** (bas droite)

### Étape 5 : Test IA - Détail
1. Cliquer sur **"Y a-t-il un parking ?"**
2. **Chat s'ouvre** avec :
   - Question pré-remplie
   - Réponse de l'IA : "Oui ! 🅿️ Le riad dispose d'un parking..."
   - Mention "Info vérifiée · Confirmée par 23 avis"
3. Taper une autre question dans l'input
4. Fermer avec ✕ ou overlay noir

---

## 📊 Points Clés de l'Intégration IA

### 1. **Contexte** : L'IA connaît :
- La page actuelle (search / detail)
- Les critères de recherche (ville, dates, nb personnes)
- L'historique de navigation
- Les biens consultés

### 2. **Proactivité** :
- Insights automatiques (sans demander)
- Badges de recommandation
- Suggestions dans les résultats

### 3. **Réactivité** :
- Réponses instantanées
- Sources vérifiées
- Langage naturel

### 4. **Personnalisation** :
- Score de matching (95%, 88%, etc.)
- Recommandations basées sur critères
- Comparaisons intelligentes

---

## 🚀 Prochaines Étapes (Non implémentées)

### À ajouter :
1. **Vraie connexion API IA** (actuellement mockup statique)
2. **Historique des conversations**
3. **Notifications proactives**
4. **Recherche vocale**
5. **Mode comparaison** (comparer 2-3 biens côte à côte)
6. **Page de réservation** avec assistant IA
7. **Post-booking** : conciergerie IA

### Backend nécessaire :
```typescript
// API Routes à créer
POST /api/ai/chat           // Chat général
POST /api/ai/search         // Recherche conversationnelle
POST /api/ai/compare        // Comparer biens
POST /api/ai/insights       // Insights sur un bien
POST /api/ai/recommend      // Recommandations
```

---

## 🎯 Résumé Visuel

```
┌────────────────────────────────────────────────────┐
│                    HOMEPAGE                        │
│                                                    │
│  [Logo]  [Recherche centrale]  [User]             │
│                                                    │
│  Hero: "Vivez le Maroc autrement"                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                   │
│                                                    │
│  🌆 Villes (6 cartes)                             │
│  👔 Property Managers (4 cartes)                  │
│  🏘️ Biens à la une (8 cartes)                     │
│  ✓ Confiance (4 cartes)                           │
│                                                    │
│                          ✨ AI Bubble (flottante) │
└────────────────────────────────────────────────────┘
                         ↓ [Clic ville/recherche]
┌────────────────────────────────────────────────────┐
│                  PAGE RECHERCHE                    │
│                                                    │
│  [Retour] [Recherche] [Demander à l'IA] [Tri]     │
│                                                    │
│  ┌─────────────┬──────────────────────────────┐   │
│  │ Filtres     │   Résultats (grille 3 col)   │   │
│  │ ━━━━━━━━    │                              │   │
│  │ Prix        │   [Bien ✨ IA 95%]           │   │
│  │ Type        │   [Bien]                     │   │
│  │ Équipements │   [Bien]                     │   │
│  │             │                              │   │
│  │ ✨ IA       │                              │   │
│  │ Insights    │                              │   │
│  │ ━━━━━━━━    │                              │   │
│  │ 3 insights  │                              │   │
│  └─────────────┴──────────────────────────────┘   │
│                                                    │
│                          ✨ AI Bubble & Chat      │
└────────────────────────────────────────────────────┘
                         ↓ [Clic bien]
┌────────────────────────────────────────────────────┐
│                  PAGE DÉTAIL BIEN                  │
│                                                    │
│  [← Retour] [Partager] [Sauvegarder]              │
│                                                    │
│  [Galerie photos 5 images]                         │
│                                                    │
│  ┌─────────────────────┬──────────────────┐        │
│  │ Titre + Note        │  Carte Résa      │        │
│  │ Stats (👥🛏️🛁)      │  185€/nuit       │        │
│  │                     │  [Dates]         │        │
│  │ ✨ IA INSIGHTS      │  [Voyageurs]     │        │
│  │ ━━━━━━━━━━━━━━━━    │  [Réserver]      │        │
│  │ 4 insights visuels  │  Total: 1360€    │        │
│  │ + recommandation    │                  │        │
│  │                     │  💬 Questions    │        │
│  │ [Tabs: Vue/Équip/   │  fréquentes      │        │
│  │  Avis/Localisation] │  ━━━━━━━━━━━━    │        │
│  │                     │  4 questions     │        │
│  │ Description         │  + Poser autre   │        │
│  │ Équipements         │                  │        │
│  └─────────────────────┴──────────────────┘        │
│                                                    │
│                    ✨ AI Chat contextuel          │
└────────────────────────────────────────────────────┘
```

---

**Créé pour Sojori Marketplace**
**Version 1.0 - Mai 2026**
**Navigation complète avec IA intégrée** ✨
