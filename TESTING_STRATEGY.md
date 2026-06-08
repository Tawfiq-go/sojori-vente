# 🧪 STRATÉGIE DE TESTS - SOJORI-VENTE & SOJORI-ORCHESTRATION

**Date:** 2026-05-29
**Objectif:** Mettre en place une infrastructure de tests complète et automatisée

---

## 📊 ÉTAT DES LIEUX

### sojori-vente (Frontend Next.js)
- **Framework:** Next.js 16.2.6, React 19.2.4
- **Tests actuels:** Aucun
- **Besoin:** Tests E2E pour parcours utilisateur, tests composants

### sojori-orchestration (Backend)
- **Framework:** Node.js/TypeScript, Express, RabbitMQ
- **Tests actuels:** À vérifier
- **Besoin:** Tests API, tests intégration services

---

## 🎯 STRATÉGIE RECOMMANDÉE

### 1️⃣ Frontend (sojori-vente) - Tests E2E avec Playwright

**Pourquoi Playwright ?**
- ✅ Supporte multi-browsers (Chromium, Firefox, WebKit)
- ✅ Tests rapides et fiables
- ✅ Screenshot/vidéo automatique en cas d'échec
- ✅ API simple et puissante
- ✅ Support TypeScript natif
- ✅ Trace viewer pour debug

**Tests prioritaires:**
1. **Flow réservation complet** (Critique 🔴)
2. **Calendrier DateRangePicker** (Haute 🟠)
3. **Checkout 4 étapes** (Haute 🟠)
4. **Authentification Clerk** (Moyenne 🟡)
5. **Recherche listings** (Moyenne 🟡)

### 2️⃣ Backend (sojori-orchestration) - Tests API avec Supertest + Jest

**Pourquoi Supertest + Jest ?**
- ✅ Standard dans l'écosystème Node.js
- ✅ Tests API simples et rapides
- ✅ Mock services externes (MongoDB, RabbitMQ)
- ✅ Coverage reports automatiques

**Tests prioritaires:**
1. **API Reservations** (Critique 🔴)
2. **API Listings** (Haute 🟠)
3. **Webhooks paiement** (Haute 🟠)
4. **Events RabbitMQ** (Moyenne 🟡)
5. **Tasks orchestration** (Moyenne 🟡)

### 3️⃣ Tests d'intégration (Frontend + Backend)

**Approche:**
- Environnement de test isolé avec:
  - Base données MongoDB test
  - RabbitMQ test
  - Services mockés (paiement, email)
- Tests end-to-end du parcours complet

---

## 🛠️ INSTALLATION PLAYWRIGHT (sojori-vente)

### Installation

```bash
cd /Users/gouacht/sojori-vente
pnpm add -D @playwright/test
pnpm exec playwright install
```

### Configuration de base

Fichier `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:6001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:6001',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 📝 EXEMPLES DE TESTS

### Test 1: Flow réservation complet (E2E)

Fichier: `tests/e2e/reservation-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Reservation Flow', () => {
  test('should complete full reservation from listing to confirmation', async ({ page }) => {
    // 1. Navigate to listing
    await page.goto('/listings/6765ba9c351665002ef47726');
    await expect(page.locator('h1')).toContainText('Riad');

    // 2. Select dates in calendar
    // Wait for calendar to load
    await page.waitForSelector('[data-testid="calendar-month"]');

    // Click check-in date (15th of current month)
    await page.click('[data-date="2026-06-15"]');
    await expect(page.locator('[data-date="2026-06-15"]')).toHaveClass(/checkin/);

    // Click check-out date (20th)
    await page.click('[data-date="2026-06-20"]');
    await expect(page.locator('[data-date="2026-06-20"]')).toHaveClass(/checkout/);

    // Verify nights calculation (5 nights)
    await expect(page.locator('[data-testid="nights-count"]')).toContainText('5 nuits');

    // Verify price calculation
    const totalPrice = await page.locator('[data-testid="total-price"]').textContent();
    expect(totalPrice).toMatch(/\d+\s*MAD/);

    // 3. Select guests
    await page.selectOption('select[name="guests"]', '2');

    // 4. Click "Réserver maintenant"
    await page.click('button:has-text("Réserver maintenant")');

    // Should redirect to checkout
    await expect(page).toHaveURL(/\/checkout\/[^\/]+\?/);

    // 5. Step 1: Récapitulatif
    await expect(page.locator('[data-testid="checkout-step"]')).toContainText('1');
    await expect(page.locator('[data-testid="booking-summary"]')).toBeVisible();
    await page.click('button:has-text("Continuer")');

    // 6. Step 2: Informations voyageur
    await expect(page.locator('[data-testid="checkout-step"]')).toContainText('2');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@sojori.com');
    await page.fill('input[name="phone"]', '+212612345678');
    await page.selectOption('select[name="arrivalTime"]', '15:00');
    await page.click('button:has-text("Continuer")');

    // 7. Step 3: Paiement
    await expect(page.locator('[data-testid="checkout-step"]')).toContainText('3');
    await page.click('input[value="card"]'); // Select card payment
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/26');
    await page.fill('input[name="cvv"]', '123');
    await page.fill('input[name="cardName"]', 'TEST USER');
    await page.click('button:has-text("Payer")');

    // 8. Step 4: Confirmation
    await expect(page.locator('[data-testid="checkout-step"]')).toContainText('4');
    await expect(page.locator('[data-testid="confirmation-checkmark"]')).toBeVisible();

    // Verify reservation number
    const reservationNumber = await page.locator('[data-testid="reservation-number"]').textContent();
    expect(reservationNumber).toMatch(/SOJORI-\d{4}-\d{4}/);

    // Click "Voir ma réservation"
    await page.click('button:has-text("Voir ma réservation")');
    await expect(page).toHaveURL(/\/profile/);
  });

  test('should show error when selecting less than minimum nights', async ({ page }) => {
    await page.goto('/listings/6765ba9c351665002ef47726');

    // Select only 2 nights (minimum is 3)
    await page.click('[data-date="2026-06-15"]');
    await page.click('[data-date="2026-06-17"]');

    // Error message should appear
    await expect(page.locator('[data-testid="error-message"]')).toContainText('minimum 3 nuits');

    // Reserve button should be disabled
    await expect(page.locator('button:has-text("Réserver maintenant")')).toBeDisabled();
  });

  test('should handle checkout without date selection', async ({ page }) => {
    // Try to access checkout directly without dates
    await page.goto('/checkout/6765ba9c351665002ef47726');

    // Should show error page
    await expect(page.locator('h1')).toContainText('Informations de réservation manquantes');

    // Click back button
    await page.click('button:has-text("Retour au bien")');
    await expect(page).toHaveURL(/\/listings\/6765ba9c351665002ef47726/);
  });
});
```

### Test 2: DateRangePicker composant

Fichier: `tests/e2e/date-range-picker.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('DateRangePicker Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo-mvp');
  });

  test('should display calendar with two months on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    const months = await page.locator('[data-testid="calendar-month"]').count();
    expect(months).toBe(2);
  });

  test('should display calendar with one month on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const months = await page.locator('[data-testid="calendar-month"]').count();
    expect(months).toBe(1);
  });

  test('should show price tooltip on hover', async ({ page }) => {
    const date = page.locator('[data-date="2026-06-15"]');
    await date.hover();

    // Tooltip should appear
    await expect(page.locator('[data-testid="price-tooltip"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-tooltip"]')).toContainText('185 MAD');
  });

  test('should handle date selection flow', async ({ page }) => {
    // Click check-in
    await page.click('[data-date="2026-06-15"]');
    await expect(page.locator('[data-date="2026-06-15"]')).toHaveAttribute('data-state', 'checkin');

    // Click check-out
    await page.click('[data-date="2026-06-20"]');
    await expect(page.locator('[data-date="2026-06-20"]')).toHaveAttribute('data-state', 'checkout');

    // Range dates should have special class
    for (let day = 16; day <= 19; day++) {
      await expect(page.locator(`[data-date="2026-06-${day}"]`)).toHaveClass(/range/);
    }
  });

  test('should clear dates when clicking clear button', async ({ page }) => {
    // Select dates
    await page.click('[data-date="2026-06-15"]');
    await page.click('[data-date="2026-06-20"]');

    // Click clear
    await page.click('button:has-text("Effacer les dates")');

    // Dates should be cleared
    await expect(page.locator('[data-state="checkin"]')).toHaveCount(0);
    await expect(page.locator('[data-state="checkout"]')).toHaveCount(0);
  });
});
```

### Test 3: API Backend (sojori-orchestration)

Fichier: `apps/srv-reservations/src/test/reservations.test.ts`

```typescript
import request from 'supertest';
import { app } from '../app';
import { connectDB, closeDB } from '../config/database';
import { Reservation } from '../models/Reservation';

describe('Reservations API', () => {
  beforeAll(async () => {
    await connectDB(process.env.MONGODB_TEST_URI);
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await Reservation.deleteMany({});
  });

  describe('POST /api/v1/guest/reservations', () => {
    it('should create a new reservation', async () => {
      const reservationData = {
        listingId: '6765ba9c351665002ef47726',
        checkIn: '2026-06-15T00:00:00.000Z',
        checkOut: '2026-06-20T00:00:00.000Z',
        guests: { adults: 2, children: 0 },
        traveler: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@sojori.com',
          phone: '+212612345678',
        },
        payment: {
          method: 'card',
          amount: 1587,
        },
        pricing: {
          baseNights: 3,
          basePrice: 555,
          weekendNights: 2,
          weekendPrice: 480,
          subtotal: 1035,
          serviceFee: 103,
          tax: 31,
          total: 1587,
        },
      };

      const response = await request(app)
        .post('/api/v1/guest/reservations')
        .send(reservationData)
        .expect(201);

      expect(response.body).toHaveProperty('reservationId');
      expect(response.body.reservationId).toMatch(/SOJORI-\d{4}-\d{4}/);
      expect(response.body).toHaveProperty('status', 'confirmed');
    });

    it('should reject reservation with missing required fields', async () => {
      const incompleteData = {
        listingId: '6765ba9c351665002ef47726',
        // Missing checkIn, checkOut, etc.
      };

      const response = await request(app)
        .post('/api/v1/guest/reservations')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject reservation with invalid date range', async () => {
      const invalidData = {
        listingId: '6765ba9c351665002ef47726',
        checkIn: '2026-06-20T00:00:00.000Z',
        checkOut: '2026-06-15T00:00:00.000Z', // Check-out before check-in
        guests: { adults: 2, children: 0 },
      };

      const response = await request(app)
        .post('/api/v1/guest/reservations')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('date');
    });
  });

  describe('GET /api/v1/guest/reservations/:id', () => {
    it('should retrieve reservation by ID', async () => {
      // Create a reservation first
      const reservation = await Reservation.create({
        reservationNumber: 'SOJORI-2026-1234',
        listingId: '6765ba9c351665002ef47726',
        checkIn: new Date('2026-06-15'),
        checkOut: new Date('2026-06-20'),
        status: 'confirmed',
      });

      const response = await request(app)
        .get(`/api/v1/guest/reservations/${reservation._id}`)
        .expect(200);

      expect(response.body.reservationNumber).toBe('SOJORI-2026-1234');
      expect(response.body.status).toBe('confirmed');
    });

    it('should return 404 for non-existent reservation', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await request(app)
        .get(`/api/v1/guest/reservations/${fakeId}`)
        .expect(404);
    });
  });
});
```

---

## 🚀 COMMANDES UTILES

### sojori-vente (Frontend)

```bash
# Lancer les tests E2E
pnpm exec playwright test

# Lancer tests en mode UI (interactif)
pnpm exec playwright test --ui

# Lancer un seul fichier
pnpm exec playwright test tests/e2e/reservation-flow.spec.ts

# Lancer en mode debug
pnpm exec playwright test --debug

# Voir le rapport HTML
pnpm exec playwright show-report

# Prendre screenshots de référence
pnpm exec playwright test --update-snapshots
```

### sojori-orchestration (Backend)

```bash
# Installer Jest et Supertest
cd /Users/gouacht/sojori-production/apps/srv-reservations
pnpm add -D jest @types/jest ts-jest supertest @types/supertest

# Lancer tests
pnpm test

# Lancer avec coverage
pnpm test -- --coverage

# Lancer en mode watch
pnpm test -- --watch

# Lancer un seul fichier
pnpm test reservations.test.ts
```

---

## 📈 INTÉGRATION CI/CD

### GitHub Actions Workflow

Fichier: `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: |
          cd sojori-vente
          pnpm install

      - name: Install Playwright Browsers
        run: |
          cd sojori-vente
          pnpm exec playwright install --with-deps

      - name: Run Playwright tests
        run: |
          cd sojori-vente
          pnpm exec playwright test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: sojori-vente/playwright-report/
          retention-days: 30

  backend-tests:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --eval 'db.adminCommand(\"ping\")'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      rabbitmq:
        image: rabbitmq:3-management
        ports:
          - 5672:5672
          - 15672:15672
        options: >-
          --health-cmd "rabbitmq-diagnostics -q ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test
        env:
          MONGODB_TEST_URI: mongodb://localhost:27017/sojori-test
          RABBITMQ_URL: amqp://localhost:5672

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
```

---

## 🎯 PRIORITÉS D'IMPLÉMENTATION

### Phase 1 (Semaine 1) - Tests critiques
- ✅ Installer Playwright dans sojori-vente
- ✅ Créer test flow réservation complet
- ✅ Créer test DateRangePicker
- ✅ Créer test CheckoutFlow

### Phase 2 (Semaine 2) - Tests API Backend
- ✅ Installer Jest + Supertest dans srv-reservations
- ✅ Créer tests API réservations
- ✅ Créer tests API listings
- ✅ Mock services externes

### Phase 3 (Semaine 3) - Tests d'intégration
- ✅ Setup environnement test isolé
- ✅ Tests end-to-end complets
- ✅ Tests webhooks paiement

### Phase 4 (Semaine 4) - CI/CD
- ✅ Créer workflow GitHub Actions
- ✅ Intégrer coverage reports
- ✅ Setup alertes échecs tests

---

## 📊 MÉTRIQUES DE SUCCÈS

- **Coverage:** >80% pour backend API
- **Tests E2E:** 100% parcours critiques couverts
- **CI/CD:** Tests automatiques sur chaque PR
- **Performance:** Tests E2E < 5 minutes
- **Fiabilité:** <1% tests flaky

---

## 🔗 RESSOURCES

- [Playwright Documentation](https://playwright.dev)
- [Jest Documentation](https://jestjs.io)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com)

---

**Créé le:** 2026-05-29
**Par:** Claude Code (Sonnet 4.5)
