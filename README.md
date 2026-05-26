# Sojori Marketplace - Mockup Complet avec IA

## 🎯 Vue d'Ensemble

Marketplace de locations premium au Maroc avec **assistant IA intégré** dans tout le parcours utilisateur.

**Stack technique** :
- Next.js 16.2.6 (App Router)
- React 19.2.4
- TypeScript 5
- Tailwind CSS 4
- Design system personnalisé

---

## 🚀 Démarrage Rapide

```bash
# Installer les dépendances (déjà fait)
npm install

# Lancer le serveur (port 6001)
npm run dev

# Ouvrir dans le navigateur
open http://localhost:6001
```

**Le serveur tourne déjà sur http://localhost:6001**

---

## 📄 Pages Disponibles

| URL | Description | IA Intégrée |
|-----|-------------|-------------|
| http://localhost:6001/ | Homepage avec hero, villes, PMs, biens | ✨ Bulle flottante |
| http://localhost:6001/search | Recherche avec filtres et résultats | ✨ Insights + Chat + Badges |
| http://localhost:6001/listing/rl-001 | Détail d'un bien + réservation | ✨ Insights + Q&A contextuel |

---

## 🤖 Où se trouve l'IA ?

### Sur TOUTES les pages :
**Bulle flottante ✨** (bas droite) qui ouvre un chat contextuel

### Homepage (/) :
- Recherche conversationnelle
- Suggestions de destinations

### Page Recherche (/search) :
1. **Bouton "Demander à l'IA"** dans la toolbar
2. **Panel "IA Insights"** (sidebar) avec 3 insights automatiques
3. **Badges IA** sur les biens recommandés ("Recommandé IA · 95%")
4. **Chat IA** pour comparer, filtrer, poser questions

### Page Détail (/listing/[id]) :
1. **Section "IA Insights"** :
   - 4 insights visuels (prix, hôte, WiFi, flexibilité)
   - Recommandation détaillée
2. **"Questions fréquentes"** (sidebar) :
   - 4 questions pré-remplies
   - Clic → Réponse immédiate de l'IA
3. **Chat IA contextuel** avec informations vérifiées

---

## 📚 Documentation

| Fichier | Contenu |
|---------|---------|
| `docs/ARCHITECTURE_MARKETPLACE_AI.md` | Architecture complète + intégration IA en détail |
| `docs/GUIDE_NAVIGATION.md` | Guide de navigation + test du mockup |

---

## 🎨 Design System

### Couleurs
```css
/* Primary (Or Sojori) */
--color-primary: #e6b022
--color-primary-dark: #b88914
--color-primary-soft: #f5d572

/* AI (Violet) */
--color-ai: #8b5cf6

/* Surfaces */
--color-bg: #fbfaf6
--color-card: #ffffff
--color-alt: #f5f3ec

/* Text */
--color-text: #1a1408
--color-text-secondary: #4a4539
--color-text-tertiary: #78746a
```

### Typographie
- **Sans** : Geist (300-800)
- **Mono** : Geist Mono (400, 500)

---

## 🔍 Test du Mockup

### Parcours complet :
1. **Homepage** → Cliquer sur barre de recherche
2. **Page Recherche** → Voir filtres, résultats, insights IA
3. **Clic "Demander à l'IA"** → Tester le chat
4. **Clic sur un bien** (ex: "Riad de la Bahia")
5. **Page Détail** → Voir insights IA, questions fréquentes
6. **Clic "Parking ?"** → Chat s'ouvre avec réponse

### Points à vérifier :
- ✅ Bulle ✨ présente sur toutes les pages
- ✅ Badge "Recommandé IA" sur le premier bien (recherche)
- ✅ Panel "IA Insights" violet (sidebar gauche, recherche)
- ✅ Section "IA Insights" large (page détail)
- ✅ "Questions fréquentes" dans sidebar (page détail)
- ✅ Chat s'ouvre/ferme correctement
- ✅ Navigation fonctionnelle entre pages

---

## 🎯 Fonctionnalités IA (Mockup)

### Actuellement implémenté :
- ✅ Interface UI complète de l'IA
- ✅ Bulle flottante persistante
- ✅ Panels de chat contextuels
- ✅ Insights automatiques
- ✅ Badges de recommandation
- ✅ Questions pré-remplies
- ✅ Messages de démonstration

### À implémenter (backend) :
- ⏳ Vraie API IA (GPT-4, embeddings)
- ⏳ Recherche conversationnelle
- ⏳ Comparaison de biens
- ⏳ Réponses dynamiques
- ⏳ Personnalisation utilisateur
- ⏳ Historique des conversations

---

## 📁 Structure du Projet

```
sojori-vente/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── search/
│   │   └── page.tsx                # Page recherche
│   ├── listing/
│   │   └── [id]/
│   │       └── page.tsx            # Page détail bien
│   ├── layout.tsx                  # Layout global
│   └── globals.css                 # Styles globaux + tokens
├── docs/
│   ├── ARCHITECTURE_MARKETPLACE_AI.md
│   └── GUIDE_NAVIGATION.md
└── public/                         # Assets statiques
```

---

## 🎭 Exemple de Données (Mock)

### Villes disponibles :
- Marrakech (412 biens)
- Casablanca (186 biens)
- Essaouira (94 biens)
- Fès (128 biens)
- Tanger (76 biens)
- Chefchaouen (42 biens)

### Property Managers :
- Riad Luxe (12 biens, 4.9★)
- Dar Hassan (8 biens, 4.8★)
- Atlas Stays (23 biens, 4.7★)
- Casa Med (17 biens, 4.85★)

### Biens mockés :
- RL-001: Riad de la Bahia (185€/nuit, 4.92★)
- AS-042: Villa contemporaine (240€/nuit, 4.86★)
- RL-015: Riad Marrakech piscine (295€/nuit, 4.88★)

---

## 🚀 Prochaines Étapes

### Phase 1 : Backend IA
1. Créer les API routes (`/api/ai/*`)
2. Intégrer OpenAI GPT-4
3. Connecter le chat à l'API
4. Implémenter la recherche conversationnelle

### Phase 2 : Vraies Données
1. Connecter à une base de données réelle
2. Remplacer les données mockées
3. Ajouter pagination
4. Implémenter les filtres réels

### Phase 3 : Fonctionnalités
1. Processus de réservation complet
2. Système de paiement
3. Espace utilisateur
4. Wishlist persistante
5. Historique de recherche

### Phase 4 : IA Avancée
1. Personnalisation basée sur l'historique
2. Notifications proactives
3. Comparaison multi-biens
4. Conciergerie post-réservation
5. Recherche vocale

---

## 📊 Métriques Visées (IA)

| Métrique | Objectif |
|----------|----------|
| Taux d'utilisation de l'IA | >40% |
| Conversion via IA | +25% |
| Temps de décision | -30% |
| Satisfaction NPS | +15 pts |
| Questions résolues sans contact | >70% |

---

**Créé avec Claude Code**
**Marketplace Sojori - Mai 2026**
**Mockup complet avec IA intégrée** ✨
