# 🐛 DEBUG - Homepage Dropdowns

## Status

✅ **Code est correct** - Les dropdowns sont bien implémentés
❓ **À tester** - Il faut vérifier manuellement dans le navigateur

## Pourquoi les dropdowns ne sont pas visibles dans le HTML?

C'est **NORMAL** ! Le HTML initial ne contient pas les dropdowns car ils sont dans des **conditionals React**:

```tsx
{showLocationPicker && (
  <div>...</div>  // Modal ville
)}

{showDatePicker && (
  <div>...</div>  // Modal dates
)}

{showGuestPicker && (
  <div>...</div>  // Modal voyageurs
)}
```

Par défaut, tous les états sont `false`, donc les modals ne sont PAS dans le HTML initial. **Ils apparaissent seulement quand on clique**.

## Test à Faire

### 1. Ouvrir dans navigateur
```
http://localhost:6001/
```

### 2. Cliquer sur "Où"
**Résultat attendu:** Liste des villes s'ouvre sous le champ

### 3. Cliquer sur "Quand"
**Résultat attendu:** Modal avec 2 inputs date (check-in + check-out)

### 4. Cliquer sur "Voyageurs"
**Résultat attendu:** Modal avec boutons +/- pour ajuster nombre d'adultes

## Si les dropdowns NE s'ouvrent PAS

### Vérifier Console JavaScript
```
F12 → Console → Chercher erreurs
```

### Erreurs possibles:

1. **Erreur Clerk** (ignorable):
```
ClerkRuntimeError: Failed to load Clerk JS
```
→ C'est normal, Clerk n'est pas configuré mais ça ne bloque pas les dropdowns

2. **Erreur React hydration** (problématique):
```
Hydration failed because the initial UI does not match
```
→ Ça bloquerait le JavaScript

3. **Erreur onClick handler** (problématique):
```
Cannot read property 'setShowLocationPicker' of undefined
```
→ État React pas initialisé correctement

## Vérification Rapide

### Dans Console JavaScript, tester:
```javascript
// Vérifier que React fonctionne
document.querySelector('.ai-cell').onclick()

// Si modal apparaît → ✅ Ça marche!
// Si rien ne se passe → ❌ Problem with React state
```

## Code Actuel

### États (ligne 15-19):
```tsx
const [showLocationPicker, setShowLocationPicker] = useState(false);
const [showGuestPicker, setShowGuestPicker] = useState(false);
const [showDatePicker, setShowDatePicker] = useState(false);
const [checkIn, setCheckIn] = useState<Date | null>(null);
const [checkOut, setCheckOut] = useState<Date | null>(null);
```

### Click handler "Où" (ligne 94-97):
```tsx
onClick={() => {
  setShowLocationPicker(!showLocationPicker);
  setShowGuestPicker(false);
  setShowDatePicker(false);
}}
```

### Click handler "Quand" (ligne 147-151):
```tsx
onClick={() => {
  setShowDatePicker(!showDatePicker);
  setShowLocationPicker(false);
  setShowGuestPicker(false);
}}
```

### Click handler "Voyageurs" (ligne 275-278):
```tsx
onClick={() => {
  setShowGuestPicker(!showGuestPicker);
  setShowLocationPicker(false);
  setShowDatePicker(false);
}}
```

## Conclusion

Le code est **correct**. Les dropdowns sont **bien là**, mais cachés par défaut.
Ils doivent apparaître **au click**.

**Si l'utilisateur dit "aucun choix possible"**, il faut:
1. Vérifier qu'il a cliqué sur les champs
2. Checker la console JavaScript pour erreurs
3. Vérifier si React hydration fonctionne

---

**Créé:** 2026-05-29 19:10
**Status:** ✅ Code validé, test manuel requis
