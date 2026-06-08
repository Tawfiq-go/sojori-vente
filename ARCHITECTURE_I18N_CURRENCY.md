# Architecture Multi-Devise & Multi-Langue - Sojori

## 🔍 Audit Backend (État actuel)

### Devises
- ✅ **Backend stocke** : `currency` dans chaque listing (actuellement: MAD)
- ❌ **Endpoint config** : `/api/v1/config/currency` → 404 (n'existe pas encore)
- ❌ **Conversion temps réel** : Non disponible
- ✅ **Structure prête** : Les listings ont déjà le champ `currency`

### Authentification
- ✅ **Clerk** : Système d'auth déjà intégré
- ❌ **User preferences** : `/api/v1/user/preferences` → Nécessite implémentation backend

---

## 🎯 Architecture Proposée

### 1. **Multi-Devise (MAD / EUR / USD)**

#### A. Détection automatique
```typescript
// lib/config/currency.ts
export const SUPPORTED_CURRENCIES = {
  MAD: { symbol: 'MAD', locale: 'ar-MA', flag: '🇲🇦' },
  EUR: { symbol: '€', locale: 'fr-FR', flag: '🇪🇺' },
  USD: { symbol: '$', locale: 'en-US', flag: '🇺🇸' },
} as const;

// Détection automatique basée sur:
// 1. Préférences utilisateur (si connecté)
// 2. Geolocation IP
// 3. Navigator language
// 4. Fallback: MAD (devise native du Maroc)
```

#### B. Taux de change
**Option 1 : API tierce (recommandé)**
```typescript
// Service de taux de change
// - https://exchangerate-api.com (gratuit 1500 req/mois)
// - https://fixer.io (gratuit 100 req/mois)
// - Cache: 1 heure (les taux changent peu)

interface ExchangeRates {
  base: 'MAD';
  rates: {
    EUR: 0.092;  // 1 MAD = 0.092 EUR
    USD: 0.10;   // 1 MAD = 0.10 USD
  };
  timestamp: string;
}
```

**Option 2 : Taux fixes (plus simple, moins précis)**
```typescript
// Taux fixes mis à jour manuellement 1x/mois
const FIXED_RATES = {
  MAD_TO_EUR: 0.092,
  MAD_TO_USD: 0.10,
  EUR_TO_USD: 1.09,
};
```

#### C. Conversion côté frontend
```typescript
// lib/utils/currency.ts
export function convertPrice(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rates: ExchangeRates
): number {
  // Toujours convertir via MAD (devise de base)
  const amountInMAD = fromCurrency === 'MAD'
    ? amount
    : amount / rates.rates[fromCurrency];

  const converted = toCurrency === 'MAD'
    ? amountInMAD
    : amountInMAD * rates.rates[toCurrency];

  return Math.round(converted * 100) / 100; // 2 décimales
}

export function formatPrice(
  amount: number,
  currency: Currency
): string {
  const config = SUPPORTED_CURRENCIES[currency];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency,
  }).format(amount);
}
```

#### D. Stockage des préférences
```typescript
// 1. Context React (session en cours)
interface UserPreferences {
  currency: Currency;
  language: Language;
  notificationsEnabled: boolean;
}

// 2. LocalStorage (persistance locale)
localStorage.setItem('sojori:currency', 'EUR');

// 3. Backend (si connecté)
// PATCH /api/v1/user/preferences
{
  currency: 'EUR',
  language: 'fr',
  timezone: 'Europe/Paris'
}
```

---

### 2. **Multi-Langue (FR / EN / ES / AR)**

#### A. Stratégie i18n

**Option 1 : next-intl (recommandé pour Next.js)**
```bash
pnpm add next-intl
```

**Structure:**
```
/messages
  /fr.json    # Français (priorité 1)
  /en.json    # Anglais
  /es.json    # Espagnol
  /ar.json    # Arabe
```

**Configuration:**
```typescript
// i18n.ts
import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}));
```

**Utilisation:**
```typescript
import {useTranslations} from 'next-intl';

function HomePage() {
  const t = useTranslations('HomePage');

  return <h1>{t('title')}</h1>; // "Trouvez votre riad"
}
```

**Option 2 : react-i18next (alternative)**
- Plus flexible
- Plus complexe
- Bon pour SSR

#### B. Détection automatique langue
```typescript
// lib/utils/locale.ts
export function detectUserLocale(): Language {
  // 1. User preference (if logged in)
  const userPref = getUserPreference();
  if (userPref?.language) return userPref.language;

  // 2. Cookie (previous choice)
  const cookieLang = getCookie('sojori:lang');
  if (cookieLang) return cookieLang;

  // 3. Browser language
  const browserLang = navigator.language;
  if (browserLang.startsWith('fr')) return 'fr';
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('ar')) return 'ar';

  // 4. Fallback
  return 'fr'; // Français par défaut (Maroc francophone)
}
```

#### C. Structure des traductions
```json
// messages/fr.json
{
  "common": {
    "search": "Rechercher",
    "book": "Réserver",
    "reviews": "avis",
    "night": "nuit",
    "nights": "nuits"
  },
  "homepage": {
    "hero": {
      "title": "Trouvez votre riad parfait au Maroc",
      "subtitle": "Des séjours authentiques dans les plus belles villes"
    }
  },
  "listing": {
    "amenities": "Équipements",
    "location": "Emplacement",
    "availability": "Disponibilités"
  }
}
```

```json
// messages/en.json
{
  "common": {
    "search": "Search",
    "book": "Book",
    "reviews": "reviews",
    "night": "night",
    "nights": "nights"
  },
  "homepage": {
    "hero": {
      "title": "Find your perfect riad in Morocco",
      "subtitle": "Authentic stays in the most beautiful cities"
    }
  }
}
```

#### D. RTL Support (Arabe)
```css
/* app/globals.css */
[dir="rtl"] {
  text-align: right;
  direction: rtl;
}

[dir="rtl"] .Navigation {
  flex-direction: row-reverse;
}
```

---

### 3. **Intégration avec Authentification**

#### A. Flow utilisateur non connecté
```
1. Visite homepage
   ↓
2. Détection automatique (IP/Browser)
   - Langue: FR (navigator.language)
   - Devise: EUR (geolocation: France)
   ↓
3. Stockage LocalStorage
   - sojori:lang = 'fr'
   - sojori:currency = 'EUR'
   ↓
4. Affichage personnalisé
```

#### B. Flow utilisateur connecté (Clerk)
```
1. Login via Clerk
   ↓
2. Fetch user preferences from backend
   GET /api/v1/user/preferences
   {
     userId: 'clerk_abc123',
     currency: 'MAD',
     language: 'fr',
     createdAt: '2024-01-15'
   }
   ↓
3. Sync avec LocalStorage
   localStorage.setItem('sojori:currency', 'MAD')
   localStorage.setItem('sojori:lang', 'fr')
   ↓
4. Affichage personnalisé
```

#### C. Sauvegarde des préférences
```typescript
// components/CurrencySelector.tsx
async function handleCurrencyChange(newCurrency: Currency) {
  // 1. Update UI immediately (optimistic)
  setCurrency(newCurrency);

  // 2. Save to localStorage
  localStorage.setItem('sojori:currency', newCurrency);

  // 3. Save to backend (if logged in)
  if (user) {
    await fetch('/api/v1/user/preferences', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${await getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currency: newCurrency }),
    });
  }
}
```

---

### 4. **Composants UI**

#### A. Sélecteur de devise
```typescript
// components/CurrencySelector.tsx
export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
      <option value="MAD">🇲🇦 MAD</option>
      <option value="EUR">🇪🇺 EUR</option>
      <option value="USD">🇺🇸 USD</option>
    </select>
  );
}
```

#### B. Sélecteur de langue
```typescript
// components/LanguageSelector.tsx
export function LanguageSelector() {
  const { locale, setLocale } = useLocale();

  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      <option value="fr">🇫🇷 Français</option>
      <option value="en">🇬🇧 English</option>
      <option value="es">🇪🇸 Español</option>
      <option value="ar">🇸🇦 العربية</option>
    </select>
  );
}
```

#### C. Affichage prix converti
```typescript
// components/PriceDisplay.tsx
export function PriceDisplay({
  amount,
  originalCurrency = 'MAD'
}: PriceDisplayProps) {
  const { currency, rates } = useCurrency();

  const convertedAmount = convertPrice(
    amount,
    originalCurrency,
    currency,
    rates
  );

  return (
    <div>
      <span className="price">
        {formatPrice(convertedAmount, currency)}
      </span>
      {currency !== originalCurrency && (
        <span className="original">
          ({formatPrice(amount, originalCurrency)})
        </span>
      )}
    </div>
  );
}
```

---

### 5. **Architecture Context**

```typescript
// context/AppContext.tsx
interface AppContextValue {
  // Currency
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRates: ExchangeRates;
  convertPrice: (amount: number, from: Currency, to: Currency) => number;

  // Language
  locale: Language;
  setLocale: (locale: Language) => void;
  t: (key: string) => string; // Translation function

  // User
  user: ClerkUser | null;
  preferences: UserPreferences | null;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useUser(); // Clerk
  const [currency, setCurrency] = useState<Currency>('MAD');
  const [locale, setLocale] = useState<Language>('fr');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);

  // Load exchange rates on mount
  useEffect(() => {
    fetchExchangeRates().then(setExchangeRates);
  }, []);

  // Load user preferences on login
  useEffect(() => {
    if (user) {
      fetchUserPreferences(user.id).then(prefs => {
        if (prefs.currency) setCurrency(prefs.currency);
        if (prefs.language) setLocale(prefs.language);
      });
    }
  }, [user]);

  // ...
}
```

---

### 6. **Backend Requirements**

#### Endpoints nécessaires

```typescript
// GET /api/v1/config/currency
// Response: Current exchange rates
{
  "success": true,
  "data": {
    "base": "MAD",
    "rates": {
      "EUR": 0.092,
      "USD": 0.10
    },
    "lastUpdated": "2024-01-15T10:00:00Z"
  }
}

// GET /api/v1/user/preferences
// Response: User preferences
{
  "success": true,
  "data": {
    "userId": "clerk_abc123",
    "currency": "EUR",
    "language": "fr",
    "notifications": true
  }
}

// PATCH /api/v1/user/preferences
// Body: Partial preferences update
{
  "currency": "USD",
  "language": "en"
}
```

---

## 📋 Plan d'Implémentation

### Phase 1 : Multi-Devise (Priorité 1)
1. ✅ Créer `lib/config/currency.ts`
2. ✅ Créer `lib/utils/currency.ts` (conversion)
3. ✅ Créer `context/CurrencyContext.tsx`
4. ✅ Créer `components/CurrencySelector.tsx`
5. ✅ Intégrer dans Navigation
6. ✅ Mettre à jour tous les prix (PriceDisplay)
7. ⏳ Backend: Implémenter `/api/v1/config/currency`
8. ⏳ Backend: Implémenter `/api/v1/user/preferences`

### Phase 2 : Multi-Langue (Priorité 2)
1. ⏳ Installer `next-intl`
2. ⏳ Créer structure `/messages`
3. ⏳ Traduire FR (complet)
4. ⏳ Traduire EN (complet)
5. ⏳ Traduire ES (complet)
6. ⏳ Traduire AR (complet) + RTL
7. ⏳ Créer `components/LanguageSelector.tsx`
8. ⏳ Intégrer dans Navigation

### Phase 3 : Tests & Optimisation
1. ⏳ Tests E2E (changement devise/langue)
2. ⏳ Performance (cache taux de change)
3. ⏳ SEO (hreflang tags)
4. ⏳ Analytics (track preferences)

---

## 🎯 Recommandations

### Devise
- **Devise de base** : MAD (stocké dans DB)
- **Conversion** : Frontend uniquement (affichage)
- **Paiement** : Toujours en MAD (simplifie comptabilité)
- **Disclaimer** : "Prix indicatif. Paiement en MAD." (pour EUR/USD)

### Langue
- **Focus FR** : Traduction complète en priorité
- **EN/ES** : Traductions essentielles (homepage, search, booking)
- **AR** : Peut attendre Phase 2 (RTL complexe)

### UX
- **Détection auto** : Ne pas forcer un choix au premier visit
- **Persistance** : LocalStorage + Backend (si connecté)
- **Visibilité** : Sélecteurs dans header (toujours accessibles)
- **Feedback** : Toast confirmation changement

---

**Prêt à implémenter ? Je peux commencer par Phase 1 (Multi-Devise) ! 🚀**
