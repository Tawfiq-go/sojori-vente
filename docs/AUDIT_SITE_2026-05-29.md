# 🔍 Audit Complet Site Sojori Vente - 2026-05-29

**Status:** 🚧 En cours

---

## 📋 Problèmes Détectés

### 🔴 Navigation - Liens Cassés (404)

| Lien | URL | Status | Action Requise |
|------|-----|--------|----------------|
| Hôtes vérifiés | `/verified-hosts` | ❌ 404 | Créer page |
| Expériences | `/experiences` | ❌ 404 | Créer page |
| Devenir hôte | `/become-host` | ❌ 404 | Créer page |
| Destinations | `/search` | ✅ 200 | OK |
| Wishlist | `/wishlist` | ✅ 200 | OK |

### ✅ Pages Existantes

- ✅ `/` - Homepage
- ✅ `/search` - Recherche listings
- ✅ `/wishlist` - Liste favoris
- ✅ `/listings/[id]` - Détail listing
- ✅ `/checkout/[id]` - Flow checkout
- ✅ `/pm/[slug]` - Property managers
- ✅ `/login` - Connexion
- ✅ `/signup` - Inscription
- ✅ `/profile` - Profil utilisateur
- ✅ `/demo-mvp` - Demo (à supprimer ?)

---

## 🔍 Tests en Cours

### Homepage (`/`)

**Boutons à tester:**
- [ ] ✨ Demander à Sojori AI (cmd-k)
- [ ] Dropdowns: Où, Quand, Voyageurs
- [ ] Bouton "Chercher avec l'IA"
- [ ] Cards Property Managers (liens)
- [ ] Cards Featured Listings (liens)
- [ ] 🌐 Changement langue
- [ ] ♡ Wishlist counter
- [ ] Se connecter

**APIs à vérifier:**
- [ ] `GET /api/v1/listing/public/listings?limit=10` (Featured)
- [ ] `GET /api/v1/listing/public/cities` (Cities)

### Page Listing (`/listings/[id]`)

**Fonctionnalités:**
- [ ] AvailabilityCalendar affichage
- [ ] Sélection dates check-in/out
- [ ] Calcul prix automatique
- [ ] Blocked dates depuis API
- [ ] Auto-redirect vers checkout
- [ ] Bouton "Retour"

**APIs:**
- [ ] `GET /api/v1/listing/public/listings/:id`
- [ ] `GET /api/v1/listing/public/listings/:id/availability`

### Page Checkout (`/checkout/[id]`)

**Flow complet:**
- [ ] Step 1: Récapitulatif
- [ ] Step 2: Informations voyageur
- [ ] Step 3: Paiement
- [ ] Step 4: Confirmation
- [ ] Stepper navigation
- [ ] BookingRecapCard sticky
- [ ] Validation formulaires

### Page Search (`/search`)

**Fonctionnalités:**
- [ ] Filtres (ville, prix, guests)
- [ ] Affichage résultats
- [ ] Pagination
- [ ] Tri (prix, rating)
- [ ] Cards clickables

---

## 🛠️ Actions à Prendre

### Priorité HAUTE

1. **Créer pages manquantes:**
   - `/verified-hosts` - Liste hôtes vérifiés
   - `/experiences` - Expériences Sojori
   - `/become-host` - Landing page devenir hôte

2. **Tester tous les boutons homepage**

3. **Vérifier flow checkout end-to-end**

### Priorité MOYENNE

4. **Améliorer error handling APIs**
5. **Ajouter loading states manquants**
6. **Tester responsive mobile**

### Priorité BASSE

7. **Optimiser performance**
8. **Ajouter analytics**

---

## 📊 Résultats Tests (à compléter)

### APIs

| Endpoint | Method | Status | Response Time | Erreurs |
|----------|--------|--------|---------------|---------|
| `/api/v1/listing/public/listings` | GET | ⏳ | - | - |
| `/api/v1/listing/public/listings/:id` | GET | ⏳ | - | - |
| `/api/v1/listing/public/listings/:id/availability` | GET | ⏳ | - | - |
| `/api/v1/listing/public/cities` | GET | ⏳ | - | - |

### Boutons

| Bouton | Page | Action | Status |
|--------|------|--------|--------|
| Cmd-K | Homepage | Redirect `/search?ai=true` | ⏳ |
| Dropdown Où | Homepage | Affiche cities | ⏳ |
| Dropdown Quand | Homepage | Affiche calendrier | ⏳ |
| Dropdown Voyageurs | Homepage | Affiche selector | ⏳ |
| Chercher avec l'IA | Homepage | Submit search | ⏳ |
| Se connecter | Navigation | Clerk modal | ⏳ |
| 🌐 Langue | Navigation | Alert "à venir" | ⏳ |

---

**Status:** 🚧 **Audit en cours...**

**Prochaine étape:** Créer pages manquantes et tester tous les boutons.
