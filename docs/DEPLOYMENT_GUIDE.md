# 🚀 Guide de Déploiement - Sojori Vente

**Version:** 1.0.0
**Date:** 30 Mai 2026
**Stack:** Next.js 15 + React 19 + TypeScript

---

## 📋 Pré-requis

### Environnement Local
- Node.js 18+ (recommandé: 20 LTS)
- pnpm 8+
- Git

### Services Externes
- Backend API: `https://dev.sojori.com`
- CDN Images: S3 + Google Cloud Storage
- Auth: Clerk (clés à configurer)
- Monitoring: Sentry (optionnel)
- Analytics: Google Analytics / Plausible (optionnel)

---

## 🔧 Configuration

### 1. Variables d'Environnement

Créer `.env.local` à la racine du projet :

```bash
# Backend API
NEXT_PUBLIC_API_BASE_URL=https://dev.sojori.com

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://sojori.com
NEXT_PUBLIC_SITE_NAME=Sojori

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY
CLERK_SECRET_KEY=sk_live_YOUR_SECRET

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Analytics (optionnel)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=sojori.com

# Monitoring (optionnel)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=true
```

---

## 📦 Build & Test Local

### Installation
```bash
# Cloner le repo
git clone https://github.com/sojori/sojori-vente.git
cd sojori-vente

# Installer les dépendances
pnpm install

# Copier .env.example vers .env.local
cp .env.example .env.local

# Éditer les variables d'environnement
nano .env.local
```

### Development
```bash
# Lancer le serveur de développement
pnpm dev

# Ouvrir http://localhost:6001
```

### Build Production
```bash
# Build optimisé
pnpm build

# Tester le build localement
pnpm start

# Ouvrir http://localhost:6001
```

### Tests
```bash
# Tests E2E (Playwright)
pnpm exec playwright test

# Tests avec UI
pnpm exec playwright test --ui

# Tests spécifiques
pnpm exec playwright test tests/e2e/booking-flow.spec.ts
```

### Linting & Formatting
```bash
# ESLint
pnpm lint

# Fix auto
pnpm lint:fix

# TypeScript check
pnpm type-check
```

---

## 🌐 Déploiement Vercel (Recommandé)

### Option 1: GitHub Integration (Automatique)

1. **Connecter le repo à Vercel**
   ```bash
   # Installer Vercel CLI
   pnpm add -g vercel

   # Login
   vercel login

   # Lier le projet
   vercel link
   ```

2. **Configurer les variables d'environnement**
   - Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
   - Sélectionner le projet
   - Settings → Environment Variables
   - Ajouter toutes les variables de `.env.local`

3. **Déployer**
   ```bash
   # Push vers main
   git add .
   git commit -m "feat: deploy to production"
   git push origin main

   # Vercel déploie automatiquement
   ```

### Option 2: Déploiement Manuel

```bash
# Build et deploy
vercel --prod

# Alias custom domain
vercel alias set sojori-vente.vercel.app sojori.com
```

### Configuration Vercel

**vercel.json:**
```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["cdg1"],
  "env": {
    "NEXT_PUBLIC_API_BASE_URL": "@api-base-url",
    "NEXT_PUBLIC_SITE_URL": "@site-url"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ]
}
```

---

## 🔥 Déploiement Netlify (Alternative)

### Configuration

**netlify.toml:**
```toml
[build]
  command = "pnpm build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--legacy-peer-deps"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "origin-when-cross-origin"
```

### Déploiement
```bash
# Installer Netlify CLI
pnpm add -g netlify-cli

# Login
netlify login

# Lier le projet
netlify link

# Build et deploy
netlify deploy --prod
```

---

## 🐳 Déploiement Docker (Self-hosted)

### Dockerfile

**Dockerfile:**
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Build & Run
```bash
# Build image
docker build -t sojori-vente:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://dev.sojori.com \
  -e NEXT_PUBLIC_SITE_URL=https://sojori.com \
  sojori-vente:latest
```

### Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  sojori-vente:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=https://dev.sojori.com
      - NEXT_PUBLIC_SITE_URL=https://sojori.com
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${CLERK_PK}
      - CLERK_SECRET_KEY=${CLERK_SK}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

```bash
# Start
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## ☁️ Déploiement Google Cloud Run

### Configuration

**cloudbuild.yaml:**
```yaml
steps:
  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/sojori-vente:$COMMIT_SHA', '.']

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/sojori-vente:$COMMIT_SHA']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'sojori-vente'
      - '--image=gcr.io/$PROJECT_ID/sojori-vente:$COMMIT_SHA'
      - '--region=europe-west9'
      - '--platform=managed'
      - '--allow-unauthenticated'

images:
  - 'gcr.io/$PROJECT_ID/sojori-vente:$COMMIT_SHA'
```

### Déploiement
```bash
# Build et deploy
gcloud builds submit --config cloudbuild.yaml

# Ou direct avec gcloud run deploy
gcloud run deploy sojori-vente \
  --source . \
  --platform managed \
  --region europe-west9 \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_API_BASE_URL=https://dev.sojori.com
```

---

## 🔍 Post-Déploiement

### Vérifications

1. **Health Check**
   ```bash
   curl https://sojori.com
   # HTTP 200 OK
   ```

2. **Sitemap**
   ```bash
   curl https://sojori.com/sitemap.xml
   # XML sitemap valide
   ```

3. **Robots.txt**
   ```bash
   curl https://sojori.com/robots.txt
   # robots.txt valide
   ```

4. **API Connectivity**
   ```bash
   curl https://dev.sojori.com/api/v1/listing/public/listings
   # Listings retournés
   ```

5. **Performance (Lighthouse)**
   ```bash
   pnpm add -g lighthouse

   lighthouse https://sojori.com --view
   ```

   **Targets:**
   - Performance: > 90
   - Accessibility: > 95
   - Best Practices: > 95
   - SEO: > 95

### Monitoring

1. **Vercel Analytics**
   - Dashboard: [vercel.com/analytics](https://vercel.com/analytics)
   - Core Web Vitals automatiques

2. **Sentry (Error Tracking)**
   - Dashboard: [sentry.io](https://sentry.io)
   - Erreurs en temps réel

3. **Google Analytics**
   - Dashboard: [analytics.google.com](https://analytics.google.com)
   - Trafic et conversions

4. **Custom Logs**
   ```javascript
   // Check localStorage logs
   console.log(JSON.parse(localStorage.getItem('error_logs')));
   console.log(JSON.parse(localStorage.getItem('analytics_events')));
   ```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_API_BASE_URL: ${{ secrets.API_BASE_URL }}

      - name: Run E2E tests
        run: pnpm exec playwright test

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🛡️ Sécurité

### Checklist Sécurité

- [x] HTTPS activé
- [x] Headers sécurité (CSP, X-Frame-Options, etc.)
- [x] Secrets dans variables d'environnement (pas dans le code)
- [x] API endpoints protégés (Clerk auth)
- [x] Rate limiting sur backend
- [x] Input validation
- [x] XSS protection
- [x] CSRF protection

### Secrets Management

**Vercel:**
```bash
# Ajouter secret
vercel env add CLERK_SECRET_KEY

# Lister secrets
vercel env ls
```

**Google Cloud:**
```bash
# Créer secret
gcloud secrets create clerk-secret --data-file=secret.txt

# Utiliser dans Cloud Run
gcloud run services update sojori-vente \
  --update-secrets CLERK_SECRET_KEY=clerk-secret:latest
```

---

## 📊 Rollback

### Vercel
```bash
# Lister deployments
vercel ls

# Promouvoir un ancien deployment
vercel alias set <deployment-url> sojori.com
```

### Docker
```bash
# Revenir à une version précédente
docker pull sojori-vente:v1.0.0
docker-compose up -d
```

---

## 🔗 Ressources

- **Documentation Next.js:** https://nextjs.org/docs
- **Vercel Docs:** https://vercel.com/docs
- **Playwright Docs:** https://playwright.dev
- **Clerk Docs:** https://clerk.com/docs

---

**Maintenu par:** Sojori Tech Team
**Dernière mise à jour:** 30 Mai 2026
