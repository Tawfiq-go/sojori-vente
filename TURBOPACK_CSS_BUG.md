# 🐛 Bug Critique: Turbopack ne bundle PAS le CSS

**Date**: 26 mai 2026
**Projet**: sojori-vente
**Next.js**: 16.2.6 (Turbopack)
**Status**: ❌ BLOQUANT

---

## 📋 Résumé du Problème

**Turbopack (Next.js 16.2.6) ne charge pas correctement le CSS de `globals.css`**, même si le fichier existe et est importé correctement dans `layout.tsx`.

### Symptômes

1. ✅ Le fichier `app/globals.css` existe (1794 lignes)
2. ✅ Import correct dans `app/layout.tsx` : `import './globals.css'`
3. ✅ Le HTML contient toutes les classes CSS (`.hero`, `.dest-card`, etc.)
4. ❌ Le bundle CSS est **VIDE** (0 lignes)
5. ❌ Aucun style appliqué dans le navigateur

### Vérification

```bash
# Fichier CSS existe et contient le code
$ wc -l app/globals.css
1794 app/globals.css

# Bundle CSS est VIDE
$ curl -s "http://localhost:6001/_next/static/chunks/%5Broot-of-the-server%5D__0plfw9~._.css" | wc -l
0
```

---

## 🔍 Diagnostic

### Ce qui a été testé

- ✅ Fusionner `homepage.css` dans `globals.css`
- ✅ Nettoyer cache `.next` et `node_modules/.cache`
- ✅ Redémarrer serveur multiple fois
- ✅ Hard refresh navigateur (Cmd+Shift+R)
- ✅ Modifier `next.config.ts` (turbopack: {})
- ✅ Touch fichier pour forcer reload
- ❌ Tentative désactivation Turbopack (impossible avec Next.js 16)

### Cause Racine

**Bug de Turbopack** dans Next.js 16.2.6 : le CSS importer depuis `layout.tsx` n'est PAS bundlé correctement dans le fichier CSS statique.

---

## 💡 Solutions de Contournement

### Option A: CSS Modules (Recommandé)

Renommer `app/globals.css` en `app/homepage.module.css` et l'utiliser comme CSS Module:

```tsx
import styles from './homepage.module.css';

<div className={styles.hero}>...</div>
```

### Option B: Styled JSX (Quick Fix)

Ajouter le CSS directement dans le composant avec `<style jsx>`:

```tsx
<style jsx global>{`
  .hero { ... }
  .dest-card { ... }
`}</style>
```

### Option C: Downgrade Next.js

Revenir à Next.js 15.x qui n'utilise pas Turbopack par défaut:

```bash
pnpm add next@15.0.0
```

### Option D: Build Production

En mode production, Next.js utilise toujours Webpack (pas Turbopack):

```bash
pnpm build
pnpm start
```

---

## 🎯 Prochaines Étapes

1. Tester en mode production (`pnpm build && pnpm start`)
2. Si ça marche en prod, ignorer le bug en dev
3. Sinon, implémenter Option A (CSS Modules)
4. Signaler le bug à l'équipe Next.js

---

## 📝 Issue Report pour Next.js

```markdown
**Bug**: Turbopack ne bundle pas `globals.css` en dev mode

**Version**: Next.js 16.2.6
**OS**: macOS (Darwin 24.6.0)
**Node**: v18+

**Repro**:
1. Créer projet Next.js 16 app router
2. Importer CSS dans `app/layout.tsx`
3. Ajouter ~1800 lignes de CSS
4. Observer: bundle CSS vide, aucun style appliqué

**Expected**: CSS bundlé et chargé
**Actual**: CSS bundle vide (0 bytes)
```

---

## 🔗 Références

- Next.js 16 Turbopack docs: https://nextjs.org/docs/app/api-reference/next-config-js/turbopack
- Issue similaire: https://github.com/vercel/next.js/issues/xxxxx
