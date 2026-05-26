# Placement Visuel de l'IA - Marketplace Sojori

## 📍 Carte Complète de l'IA

Ce document montre **exactement** où et comment l'IA apparaît sur chaque page.

---

## 1️⃣ HOMEPAGE - http://localhost:6001/

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo S] sojori     [🔍 Où | Quand | Qui 🔍]    [♡] [👤]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│            ╔════════════════════════════╗                    │
│            ║   Vivez le Maroc           ║                    │
│            ║   ✨ autrement             ║                    │
│            ╚════════════════════════════╝                    │
│                                                              │
│        [Destination] [Dates] [Voyageurs] [→]                │
│                                                              │
│  ━━━━━━━━━━━━━ Explorez le Maroc ━━━━━━━━━━━━━━━           │
│                                                              │
│  [Marrakech]  [Casablanca]  [Essaouira]                     │
│  [Fès]        [Tanger]       [Chefchaouen]                  │
│                                                              │
│  ━━━━━━━━━━━ Nos Property Managers ━━━━━━━━━━━━            │
│                                                              │
│  [RL]  [DH]  [AS]  [CM]                                     │
│                                                              │
│  ━━━━━━━━━━━━━ Biens à la une ━━━━━━━━━━━━━━━━            │
│                                                              │
│  [Riad 1]  [Villa 2]  [Riad 3]  [Dar 4]                    │
│  [Riad 5]  [Appart]   [Maison]  [Villa 8]                  │
│                                                              │
│  [Footer complet...]                                         │
│                                                              │
│                                          ┌───────┐           │
│                                          │  ✨   │ ← Bulle IA│
│                                          │       │   (anime) │
│                                          └───────┘           │
└──────────────────────────────────────────────────────────────┘
```

### ✨ Points IA :
- **Bulle flottante** : Bas droite, 60×60px, violet gradient, animation pulse
- **Fonction** : Clic → Ouvre chat pour recherche conversationnelle

---

## 2️⃣ PAGE RECHERCHE - http://localhost:6001/search

```
┌──────────────────────────────────────────────────────────────────────┐
│ [← sojori]  [🔍 Marrakech | 15-22 juil | 4 pers]  [♡] [👤]          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Séjours à Marrakech                                                 │
│  156 biens · 15-22 juillet · 4 voyageurs                            │
│                                                                      │
│  ┌──────────────────┐  ✨ Demander à l'IA    [▼ Pertinence]       │
│                                                                      │
│  ├────────┬─────────────────────────────────────────────────┐       │
│  │Filtres │                  Résultats                      │       │
│  │━━━━━━━━│                                                 │       │
│  │        │  ┌─────────────────────────────────────┐       │       │
│  │Prix    │  │ ✨ Recommandé IA · 95%              │       │       │
│  │50-300€ │  │ ┌──────────────────────────────┐   │       │       │
│  │        │  │ │   [Photo RIAD LUXE]          │   │       │       │
│  │Type    │  │ │ 💰 Prix optimal 🎯 Match     │   │       │       │
│  │☐ Riad  │  │ └──────────────────────────────┘   │       │       │
│  │☐ Villa │  │ Riad de la Bahia · Médina          │       │       │
│  │        │  │ ★ 4.92 (156 avis)                  │       │       │
│  │Équipt  │  │ 185€ / nuit                        │       │       │
│  │☐ Piscine│ └─────────────────────────────────────┘       │       │
│  │☐ WiFi  │                                                 │       │
│  │        │  [Bien 2]      [Bien 3]                        │       │
│  │PM      │                                                 │       │
│  │☐ RL    │                                                 │       │
│  │☐ AS    │                                                 │       │
│  │        │                                                 │       │
│  │ ✨ IA  │                                                 │       │
│  │Insights│                                                 │       │
│  │━━━━━━━━│                                                 │       │
│  │💡 Prix │                                                 │       │
│  │baissent│                                                 │       │
│  │15% 20+ │                                                 │       │
│  │        │                                                 │       │
│  │🎯Match │                                                 │       │
│  │95%     │                                                 │       │
│  │        │                                                 │       │
│  │📍Médina│                                                 │       │
│  │demandée│                                                 │       │
│  └────────┴─────────────────────────────────────────────────┘       │
│                                                                      │
│                                            ┌─────────────┐           │
│                                            │ ✨ Chat IA  │ ← Si ouvert│
│                                            │ ━━━━━━━━━━ │   (380×500)│
│                                            │ Messages... │           │
│                                            │             │           │
│                                            │ [Input →]   │           │
│                                            └─────────────┘           │
│                                          ┌───────┐                   │
│                                          │  ✨   │ ← Bulle (toujours)│
│                                          └───────┘                   │
└──────────────────────────────────────────────────────────────────────┘
```

### ✨ Points IA (5 éléments) :
1. **Bouton "Demander à l'IA"** : Toolbar haut, violet, ouvre chat
2. **Badge "Recommandé IA · 95%"** : Sur premier bien, gradient violet
3. **Badges sur photo** : "Prix optimal", "Match parfait" (or)
4. **Panel "IA Insights"** : Sidebar gauche, fond violet/10, 3 insights
5. **Bulle flottante** : Bas droite, ouvre chat alternatif

### Chat ouvert :
- Position : `fixed right-6 bottom-24`
- Taille : 380px × 500px
- Header : "Assistant Sojori ✨"
- Body : Messages scrollables
- Footer : Input + bouton →

---

## 3️⃣ PAGE DÉTAIL - http://localhost:6001/listing/rl-001

```
┌────────────────────────────────────────────────────────────────────────┐
│ [← sojori]    ← Retour aux résultats    [↗ Partager] [♡ Sauvegarder] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │ [  Grande galerie photos - 5 images en grid  ]               │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                        │
│  ┌───────────────────────────────┬─────────────────────────────┐     │
│  │ [RIAD LUXE] PM vérifié        │  ┌───────────────────────┐  │     │
│  │                               │  │ 185€ / nuit           │  │     │
│  │ Riad de la Bahia              │  │ ━━━━━━━━━━━━━━━       │  │     │
│  │ Riad authentique cœur Médina  │  │ Arrivée: 15 juil      │  │     │
│  │                               │  │ Départ:  22 juil      │  │     │
│  │ ★ 4.92 (156 avis) · Marrakech │  │ 4 voyageurs           │  │     │
│  │                               │  │                       │  │     │
│  │ 👥 6 voyageurs 🛏️ 3 chambres │  │ [RÉSERVER]            │  │     │
│  │ 🛁 2 salles de bain           │  │                       │  │     │
│  │                               │  │ Total: 1 360€         │  │     │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  └───────────────────────┘  │     │
│  │                               │                            │     │
│  │ ✨ IA INSIGHTS                │  💬 Questions fréquentes   │     │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  ━━━━━━━━━━━━━━━━━━━━━━━━ │     │
│  │ ┌─────────┬─────────┐        │  Parking ?                 │     │
│  │ │💰 Prix  │⚡Hôte   │        │  Bruyant ?                 │     │
│  │ │-15%     │2min     │        │  Navette aéroport ?        │     │
│  │ └─────────┴─────────┘        │  Restaurants halal ?       │     │
│  │ ┌─────────┬─────────┐        │                            │     │
│  │ │📶 WiFi  │🕐 Flexib│        │  [💬 Poser autre question] │     │
│  │ │50Mbps   │Check-in │        │                            │     │
│  │ └─────────┴─────────┘        │                            │     │
│  │                               │                            │     │
│  │ 💡 Recommandation :           │                            │     │
│  │ Ce bien offre un excellent    │                            │     │
│  │ rapport qualité/prix. Prix    │                            │     │
│  │ 15% sous la moyenne. Reste    │                            │     │
│  │ 2 créneaux en juillet !       │                            │     │
│  │                               │                            │     │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │                            │     │
│  │                               │                            │     │
│  │ [Vue d'ensemble] [Équipements]│                            │     │
│  │ [Avis] [Localisation]         │                            │     │
│  │                               │                            │     │
│  │ Description...                │                            │     │
│  │ Équipements...                │                            │     │
│  └───────────────────────────────┴─────────────────────────────┘     │
│                                                                        │
│                          [Overlay noir si chat ouvert]                │
│                            ┌──────────────────────┐                   │
│                            │ ✨ Assistant Sojori  │ ← Chat contextuel │
│                            │ Posez vos questions  │   (420×560)       │
│                            │ ━━━━━━━━━━━━━━━━━━━ │                   │
│                            │ IA: Bonjour...       │                   │
│                            │ User: Parking ?      │                   │
│                            │ IA: Oui ! 🅿️...     │                   │
│                            │                      │                   │
│                            │ [Input ──────→]      │                   │
│                            └──────────────────────┘                   │
│                                        ┌───────┐                      │
│                                        │  ✨   │ ← Bulle (toujours)   │
│                                        └───────┘                      │
└────────────────────────────────────────────────────────────────────────┘
```

### ✨ Points IA (4 éléments) :
1. **Section "IA Insights"** : Grand encadré violet, 4 insights + reco
2. **"Questions fréquentes"** : Sidebar, 4 questions cliquables
3. **Bouton "Poser autre question"** : Violet, ouvre chat
4. **Bulle flottante** : Bas droite

### Chat contextuel :
- Plus grand : 420px × 560px
- Overlay noir derrière (opacité 20%)
- Réponses vérifiées avec source
- Exemple pré-rempli (parking)

---

## 🎨 Code Couleurs IA

### Violet (Gradient) :
```css
background: linear-gradient(to bottom right, #a78bfa, #8b5cf6)
```

### Fond Panel :
```css
background: linear-gradient(to bottom right, rgba(167,139,250,0.1), rgba(139,92,246,0.1))
border: 1px solid rgba(167,139,250,0.2)
```

### Badge IA :
```css
background: linear-gradient(to right, #a78bfa, #8b5cf6)
color: white
```

### Bulle flottante :
```css
width: 60px
height: 60px
border-radius: 50%
background: linear-gradient(to bottom right, #a78bfa, #8b5cf6)
box-shadow: 0 8px 24px rgba(139,92,246,0.4)
animation: pulse 2s infinite
```

---

## 📱 Responsive (Mobile)

### Homepage & Search (< 768px) :
- Bulle IA reste visible (48×48px)
- Chat en full screen (pas sidebar)
- Panel Insights en accordion (collapsible)

### Detail (< 768px) :
- Section Insights full width
- Questions en carrousel horizontal
- Chat en bottom sheet (swipe up)

---

## 🎯 Résumé Visuel

```
┌─────────────────────────────────────────────┐
│              IA SUR SOJORI                  │
├─────────────────────────────────────────────┤
│                                             │
│  Homepage (/)        →  ✨ Bulle           │
│                                             │
│  Search (/search)    →  ✨ 5 points:       │
│                         1. Bulle flottante  │
│                         2. Bouton toolbar   │
│                         3. Panel Insights   │
│                         4. Badges biens     │
│                         5. Chat panel       │
│                                             │
│  Detail (/listing)   →  ✨ 4 points:       │
│                         1. Bulle flottante  │
│                         2. Section Insights │
│                         3. Questions sidebar│
│                         4. Chat contextuel  │
│                                             │
└─────────────────────────────────────────────┘
```

---

**Total : 10 points de contact avec l'IA**
**Sur 3 pages**
**Couleur : Violet (#8b5cf6)**
**Icône : ✨**

---

Créé pour Sojori Marketplace · Mai 2026 ✨
