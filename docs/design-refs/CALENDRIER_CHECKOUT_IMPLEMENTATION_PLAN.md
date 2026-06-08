# Calendrier + Checkout MVP - Implementation Plan

## Executive Summary

This document provides a comprehensive implementation plan for the Sojori Calendrier (Calendar) and Checkout MVP based on the reference design file. The design is a single-page application with two main views: a calendar selection interface and a 4-step checkout process.

**Key Features:**
- Dual-month calendar with date range selection
- Real-time price calculation (base + weekend rates)
- 4-step checkout flow (Summary → Info → Payment → Confirmation)
- Sticky sidebar with booking recap
- Responsive design with mobile breakpoints
- Rich animations and transitions

---

## 1. Design System Analysis

### 1.1 CSS Variables (Design Tokens)

```css
/* Color Palette */
--ink: #0f1011           /* Primary text */
--ink2: #3a3a3c          /* Secondary text */
--ink3: #6e6e73          /* Tertiary text */
--ink4: #a8a7a4          /* Quaternary text */

--paper: #faf7f0         /* Main background */
--paper2: #f3eee2        /* Secondary background */
--card: #ffffff          /* Card background */

--b: #e9e3d3             /* Border */
--bs: #d4ccb5            /* Border strong */

/* Brand Colors */
--gold: #c89b3c          /* Primary brand */
--goldD: #9b7626         /* Dark gold */
--goldS: #e8c87a         /* Light gold */
--goldT: rgba(200,155,60,0.12)  /* Gold transparent */

--rose: #e11d48          /* Error/destructive */
--roseT: rgba(225,29,72,0.10)   /* Rose transparent */

--emerald: #059669       /* Success */
--emT: rgba(5,150,105,0.10)     /* Emerald transparent */

/* Typography */
--sans: Geist, system-ui, sans-serif
--serif: 'Instrument Serif', Georgia, serif
--mono: 'Geist Mono', ui-monospace, monospace
```

### 1.2 Typography System

```typescript
interface TypographyScale {
  // Headings
  h1: { size: '40px', font: 'serif', weight: 400, spacing: '-0.03em' }
  h2: { size: '30-34px', font: 'serif', weight: 400, spacing: '-0.025em' }
  h3: { size: '24px', font: 'serif', weight: 400, spacing: '-0.02em' }

  // Body
  body: { size: '14px', font: 'sans', weight: 400, lineHeight: 1.5 }
  small: { size: '11-13px', font: 'sans/mono', weight: 500-700 }

  // Special
  label: { size: '10.5px', font: 'mono', weight: 700, uppercase: true }
  price: { size: '9.5px', font: 'mono', weight: 600 }
}
```

### 1.3 Animation System

```css
@keyframes fadeIn { /* Page transitions */ }
@keyframes slideIn { /* Step transitions */ }
@keyframes fillRange { /* Calendar range selection */ }
@keyframes checkmark { /* Confirmation icon */ }
@keyframes spin { /* Loading states */ }
@keyframes shimmer { /* Skeleton loader */ }
@keyframes pulseGold { /* Focus states */ }
```

**Timing:** `cubic-bezier(0.4, 0, 0.2, 1)` (standard easing)

### 1.4 Responsive Breakpoints

```css
@media (max-width: 900px) {
  /* Mobile adaptations:
   * - Single column calendar (hide 2nd month)
   * - Stack checkout sidebar below
   * - Simplify stepper (hide labels)
   * - Single column forms
   */
}
```

---

## 2. Component Architecture

### 2.1 Component Hierarchy

```
App
├── Navigation
│   ├── Brand
│   ├── Breadcrumb
│   └── TabSwitch
│
├── CalendarPage
│   ├── CalendarHeader
│   │   ├── Title
│   │   ├── Subtitle
│   │   └── ConstraintBadges
│   ├── CalendarCard
│   │   ├── MonthNavigation
│   │   ├── DualMonthGrid
│   │   │   ├── MonthGrid (x2)
│   │   │   │   ├── DayOfWeekHeader
│   │   │   │   └── DayCell (with tooltip)
│   │   │   └── Legend
│   │   └── PriceTooltip
│   ├── BookingRecap (sticky)
│   │   ├── DateDisplay
│   │   ├── NightsCounter
│   │   ├── PriceBreakdown
│   │   ├── CTAButton
│   │   └── ClearButton
│   └── StateExamples (loading, error, empty)
│
└── CheckoutPage
    ├── ProgressStepper
    ├── CheckoutLayout
    │   ├── MainContent
    │   │   ├── Step1_Summary
    │   │   │   ├── ListingRecap
    │   │   │   ├── ReservationDetails
    │   │   │   └── PriceBreakdown
    │   │   ├── Step2_Information
    │   │   │   ├── GuestInfoForm
    │   │   │   ├── ContactForm
    │   │   │   └── ArrivalForm
    │   │   ├── Step3_Payment
    │   │   │   ├── PaymentMethodSelector
    │   │   │   └── CardForm
    │   │   └── Step4_Confirmation
    │   │       ├── SuccessHero
    │   │       ├── ReservationReference
    │   │       ├── BookingSummary
    │   │       └── NextStepsTimeline
    │   └── Sidebar
    │       ├── ListingMini
    │       ├── BookingSummary
    │       └── CancellationPolicy
```

---

## 3. Detailed Component Specifications

### 3.1 Calendar Components

#### DayCell Component

```typescript
interface DayCellProps {
  date: Date;
  price: number;
  isBlocked: boolean;
  isPast: boolean;
  isWeekend: boolean;
  isCheckin: boolean;
  isCheckout: boolean;
  isInRange: boolean;
  onClick: (date: string) => void;
}

interface TooltipData {
  date: string;
  basePrice: number;
  weekendSurcharge?: number;
  totalPrice: number;
}
```

**Features:**
- Hover tooltip with price breakdown
- Visual states: available, blocked, past, selected, range
- Endpoint badges ("Arrivée", "Départ")
- Click handler for date selection

#### CalendarCard Component

```typescript
interface CalendarState {
  currentMonth: number;
  currentYear: number;
  checkin: string | null;
  checkout: string | null;
  blockedDates: Set<string>;
}

interface CalendarProps {
  initialMonth?: Date;
  minNights?: number;
  blockedDates?: string[];
  basePrice: number;
  weekendPrice: number;
  onSelectionComplete: (checkin: string, checkout: string) => void;
}
```

**Logic:**
- Dual-month display (current + next)
- Date range selection (checkin → checkout)
- Validation: min nights, blocked dates, past dates
- Auto-scroll to next month if needed

### 3.2 Checkout Components

#### ProgressStepper Component

```typescript
interface StepConfig {
  id: number;
  label: string;
  icon?: string;
}

interface StepperProps {
  steps: StepConfig[];
  currentStep: number;
  completedSteps: number[];
}
```

**States:**
- `pending`: gray, numbered
- `active`: gold background, white number
- `done`: emerald background, checkmark

#### Form Components

```typescript
interface FieldProps {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea';
  required?: boolean;
  validation?: (value: string) => boolean;
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

interface FormState {
  // Step 2
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  arrivalTime: string;
  specialRequests?: string;

  // Step 3
  paymentMethod: 'card' | 'transfer' | 'cmi';
  cardNumber?: string;
  cardExpiry?: string;
  cardCVV?: string;
  cardName?: string;
}
```

**Validation:**
- Real-time validation with green checkmark
- Error states with red border + message
- Required field indicator (red asterisk)

#### PaymentMethodSelector Component

```typescript
interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description?: string;
  badges?: string[];
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    name: '💳 Carte bancaire',
    badges: ['VISA', 'MC', 'AMEX']
  },
  {
    id: 'transfer',
    name: '🏦 Virement bancaire',
    description: 'Confirmation sous 24h'
  },
  {
    id: 'cmi',
    name: '🇲🇦 CMI Mobile · Wallet'
  }
];
```

---

## 4. State Management Strategy

### 4.1 Recommended Approach: Context + Hooks

```typescript
// contexts/BookingContext.tsx
interface BookingContextValue {
  // Calendar state
  checkin: string | null;
  checkout: string | null;
  nights: number;

  // Pricing
  basePrice: number;
  weekendPrice: number;
  subtotal: number;
  serviceFee: number;
  tax: number;
  total: number;

  // Guest info
  guestInfo: GuestInfo | null;

  // Checkout
  currentStep: number;

  // Actions
  setDates: (checkin: string, checkout: string) => void;
  clearDates: () => void;
  setGuestInfo: (info: GuestInfo) => void;
  goToStep: (step: number) => void;
  calculatePricing: () => PriceBreakdown;
}

// Usage
const { checkin, checkout, total, setDates } = useBooking();
```

### 4.2 Alternative: Zustand (Lightweight)

```typescript
import create from 'zustand';

interface BookingStore {
  // State
  checkin: string | null;
  checkout: string | null;
  guestInfo: GuestInfo | null;
  currentStep: number;

  // Actions
  setDates: (checkin: string, checkout: string) => void;
  clearDates: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

const useBookingStore = create<BookingStore>((set) => ({
  checkin: null,
  checkout: null,
  currentStep: 1,
  setDates: (checkin, checkout) => set({ checkin, checkout }),
  // ... other actions
}));
```

---

## 5. API Integration Points

### 5.1 Required Endpoints

```typescript
// GET /api/listings/:id/availability
interface AvailabilityResponse {
  listingId: string;
  blockedDates: string[]; // ISO dates
  pricing: {
    basePrice: number;
    weekendPrice: number;
    currency: string;
  };
  constraints: {
    minNights: number;
    preferredCheckoutDay?: number; // 6 = Saturday
  };
}

// POST /api/reservations/calculate
interface CalculatePriceRequest {
  listingId: string;
  checkin: string;
  checkout: string;
  guests: {
    adults: number;
    children: number;
    infants: number;
  };
}

interface CalculatePriceResponse {
  breakdown: {
    baseNights: number;
    baseAmount: number;
    weekendNights: number;
    weekendAmount: number;
    subtotal: number;
    serviceFee: number;
    tax: number;
    total: number;
  };
  cancellationPolicy: {
    freeCancellationUntil: string;
  };
}

// POST /api/reservations
interface CreateReservationRequest {
  listingId: string;
  checkin: string;
  checkout: string;
  guests: GuestCount;
  guestInfo: GuestInfo;
  payment: PaymentInfo;
}

interface CreateReservationResponse {
  reservationId: string;
  confirmationNumber: string;
  status: 'pending' | 'confirmed';
  totalAmount: number;
  emailSent: boolean;
}
```

### 5.2 API Client Hooks

```typescript
// hooks/useAvailability.ts
export function useAvailability(listingId: string) {
  return useQuery(['availability', listingId], async () => {
    const res = await fetch(`/api/listings/${listingId}/availability`);
    return res.json();
  });
}

// hooks/usePriceCalculation.ts
export function usePriceCalculation(
  listingId: string,
  checkin: string | null,
  checkout: string | null
) {
  return useQuery(
    ['price', listingId, checkin, checkout],
    async () => {
      const res = await fetch('/api/reservations/calculate', {
        method: 'POST',
        body: JSON.stringify({ listingId, checkin, checkout })
      });
      return res.json();
    },
    { enabled: !!(checkin && checkout) }
  );
}

// hooks/useCreateReservation.ts
export function useCreateReservation() {
  return useMutation(async (data: CreateReservationRequest) => {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  });
}
```

---

## 6. File Structure

```
sojori-vente/
├── app/
│   ├── (main)/
│   │   ├── listings/
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Calendar view
│   │   │       └── checkout/
│   │   │           └── page.tsx        # Checkout flow
│   └── api/
│       ├── listings/
│       │   └── [id]/
│       │       └── availability/
│       │           └── route.ts
│       └── reservations/
│           ├── calculate/
│           │   └── route.ts
│           └── route.ts
│
├── components/
│   ├── calendar/
│   │   ├── Calendar.tsx
│   │   ├── CalendarCard.tsx
│   │   ├── MonthGrid.tsx
│   │   ├── DayCell.tsx
│   │   ├── DayTooltip.tsx
│   │   ├── CalendarLegend.tsx
│   │   ├── CalendarNavigation.tsx
│   │   └── ConstraintBadges.tsx
│   │
│   ├── booking/
│   │   ├── BookingRecap.tsx
│   │   ├── DateDisplay.tsx
│   │   ├── NightsCounter.tsx
│   │   └── PriceBreakdown.tsx
│   │
│   ├── checkout/
│   │   ├── CheckoutLayout.tsx
│   │   ├── ProgressStepper.tsx
│   │   ├── CheckoutSidebar.tsx
│   │   │
│   │   ├── steps/
│   │   │   ├── Step1_Summary.tsx
│   │   │   ├── Step2_Information.tsx
│   │   │   ├── Step3_Payment.tsx
│   │   │   └── Step4_Confirmation.tsx
│   │   │
│   │   ├── forms/
│   │   │   ├── GuestInfoForm.tsx
│   │   │   ├── ContactForm.tsx
│   │   │   ├── ArrivalForm.tsx
│   │   │   └── PaymentForm.tsx
│   │   │
│   │   └── ui/
│   │       ├── ListingRecap.tsx
│   │       ├── PaymentMethodSelector.tsx
│   │       ├── CardFields.tsx
│   │       ├── ConfirmationHero.tsx
│   │       └── NextStepsTimeline.tsx
│   │
│   ├── ui/
│   │   ├── Navigation.tsx
│   │   ├── TabSwitch.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── Field.tsx
│   │   └── SectionCard.tsx
│   │
│   └── states/
│       ├── LoadingSkeleton.tsx
│       ├── ErrorState.tsx
│       └── EmptyState.tsx
│
├── contexts/
│   └── BookingContext.tsx
│
├── hooks/
│   ├── useAvailability.ts
│   ├── usePriceCalculation.ts
│   ├── useCreateReservation.ts
│   ├── useBooking.ts
│   └── useCalendar.ts
│
├── lib/
│   ├── api/
│   │   └── client.ts
│   ├── pricing/
│   │   └── calculator.ts
│   └── validation/
│       ├── guest-info.ts
│       └── payment.ts
│
├── types/
│   ├── booking.ts
│   ├── calendar.ts
│   ├── listing.ts
│   └── payment.ts
│
└── styles/
    ├── globals.css           # CSS variables
    ├── calendar.css
    └── checkout.css
```

---

## 7. Implementation Steps (Priority Order)

### Phase 1: Foundation (Week 1)

**Priority 1: Design System Setup**
- [ ] Create CSS variables in `globals.css`
- [ ] Add Google Fonts (Geist, Instrument Serif, Geist Mono)
- [ ] Create base typography components
- [ ] Define animation keyframes
- [ ] Setup responsive breakpoints

**Priority 2: Core Types & Context**
- [ ] Define TypeScript interfaces (`types/`)
- [ ] Create `BookingContext` with state management
- [ ] Setup API client with type safety

**Priority 3: Navigation & Layout**
- [ ] Build Navigation component
- [ ] Create page routing structure
- [ ] Implement tab switching logic

### Phase 2: Calendar (Week 2)

**Priority 4: Calendar UI**
- [ ] Build `MonthGrid` component
- [ ] Create `DayCell` with all states
- [ ] Implement hover tooltips
- [ ] Add endpoint badges
- [ ] Create `CalendarLegend`

**Priority 5: Calendar Logic**
- [ ] Date selection state machine
- [ ] Range calculation
- [ ] Blocked dates handling
- [ ] Past dates handling
- [ ] Min nights validation

**Priority 6: Booking Recap**
- [ ] Create sticky sidebar component
- [ ] Implement `PriceBreakdown`
- [ ] Add real-time price calculation
- [ ] Weekend rate logic
- [ ] Service fee & tax calculation

**Priority 7: API Integration**
- [ ] Connect to availability endpoint
- [ ] Implement price calculation API
- [ ] Add loading states
- [ ] Add error handling
- [ ] Create skeleton loaders

### Phase 3: Checkout (Week 3)

**Priority 8: Checkout Layout**
- [ ] Build `CheckoutLayout` with sidebar
- [ ] Create `ProgressStepper`
- [ ] Implement step navigation
- [ ] Add step transitions

**Priority 9: Step 1 - Summary**
- [ ] Create `ListingRecap` component
- [ ] Display reservation details
- [ ] Show price breakdown
- [ ] Add edit functionality

**Priority 10: Step 2 - Information**
- [ ] Build form components (Input, Select, Textarea)
- [ ] Create `GuestInfoForm`
- [ ] Add validation logic
- [ ] Implement real-time validation indicators
- [ ] Store form data in context

**Priority 11: Step 3 - Payment**
- [ ] Create `PaymentMethodSelector`
- [ ] Build `CardFields` component
- [ ] Add card number formatting
- [ ] Implement validation
- [ ] Add SSL security indicators

**Priority 12: Step 4 - Confirmation**
- [ ] Build `ConfirmationHero` with animation
- [ ] Display reservation reference
- [ ] Create `NextStepsTimeline`
- [ ] Add email confirmation notice

### Phase 4: Polish & Testing (Week 4)

**Priority 13: Mobile Responsive**
- [ ] Test on mobile viewports
- [ ] Hide second calendar month on mobile
- [ ] Stack checkout sidebar
- [ ] Simplify stepper labels
- [ ] Single-column forms

**Priority 14: Error States**
- [ ] Loading skeletons
- [ ] Error messages
- [ ] Empty states
- [ ] Network error handling
- [ ] Form validation errors

**Priority 15: Animations & Transitions**
- [ ] Page transitions (fadeIn)
- [ ] Step transitions (slideIn)
- [ ] Calendar range animation (fillRange)
- [ ] Checkmark animation
- [ ] Button hover states

**Priority 16: Testing & QA**
- [ ] Unit tests for pricing logic
- [ ] Integration tests for booking flow
- [ ] E2E tests for complete user journey
- [ ] Cross-browser testing
- [ ] Performance optimization

---

## 8. Technical Specifications

### 8.1 Pricing Logic

```typescript
// lib/pricing/calculator.ts
export interface PricingConfig {
  basePrice: number;
  weekendPrice: number;
  serviceFeeRate: number;  // 0.10 = 10%
  taxRate: number;          // 0.03 = 3%
}

export function calculateStay(
  checkin: Date,
  checkout: Date,
  config: PricingConfig
): PriceBreakdown {
  const nights: number[] = [];

  for (let d = new Date(checkin); d < checkout; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    const isWeekend = dow === 5 || dow === 6; // Friday or Saturday
    nights.push(isWeekend ? config.weekendPrice : config.basePrice);
  }

  const baseNights = nights.filter(p => p === config.basePrice).length;
  const weekendNights = nights.filter(p => p === config.weekendPrice).length;

  const baseAmount = baseNights * config.basePrice;
  const weekendAmount = weekendNights * config.weekendPrice;
  const subtotal = baseAmount + weekendAmount;

  const serviceFee = Math.round(subtotal * config.serviceFeeRate);
  const tax = Math.round(subtotal * config.taxRate);
  const total = subtotal + serviceFee + tax;

  return {
    totalNights: nights.length,
    baseNights,
    weekendNights,
    baseAmount,
    weekendAmount,
    subtotal,
    serviceFee,
    tax,
    total
  };
}
```

### 8.2 Validation Rules

```typescript
// lib/validation/guest-info.ts
export const VALIDATION_RULES = {
  firstName: {
    required: true,
    minLength: 2,
    pattern: /^[a-zA-ZÀ-ÿ\s'-]+$/
  },
  lastName: {
    required: true,
    minLength: 2,
    pattern: /^[a-zA-ZÀ-ÿ\s'-]+$/
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    required: true,
    pattern: /^\+?[0-9\s-]{10,}$/
  }
};

// lib/validation/payment.ts
export const CARD_VALIDATION = {
  cardNumber: {
    length: 16,
    pattern: /^[0-9]{16}$/,
    luhnCheck: true
  },
  cvv: {
    length: [3, 4],
    pattern: /^[0-9]{3,4}$/
  },
  expiry: {
    pattern: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
    futureDate: true
  }
};
```

### 8.3 Date Utilities

```typescript
// lib/utils/dates.ts
export function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const lastDay = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= lastDay; d++) {
    days.push(new Date(year, month, d));
  }

  return days;
}

export function isWeekend(date: Date): boolean {
  const dow = date.getDay();
  return dow === 5 || dow === 6;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return d1.toISOString().slice(0, 10) === d2.toISOString().slice(0, 10);
}

export function isInRange(date: Date, start: Date, end: Date): boolean {
  return date > start && date < end;
}

export function getDaysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
```

---

## 9. Integration with Existing Sojori-Vente Codebase

### 9.1 Existing Dependencies to Leverage

Based on the sojori-vente codebase, integrate with:

**Next.js App Router:**
- Use existing routing structure
- Leverage server/client components
- Utilize route handlers for API

**UI Components:**
- Check for existing button/input components
- Reuse if design system aligns
- Extend with calendar-specific variants

**API Client:**
- Use existing fetch wrappers
- Extend with booking endpoints
- Maintain error handling patterns

### 9.2 New Dependencies Required

```json
{
  "dependencies": {
    "date-fns": "^2.30.0",           // Date manipulation
    "react-query": "^3.39.3",         // Data fetching
    "zustand": "^4.4.7",              // State management (or use Context)
    "zod": "^3.22.4",                 // Schema validation
    "react-hook-form": "^7.48.2"      // Form handling
  },
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "vitest": "^1.0.4"
  }
}
```

### 9.3 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
STRIPE_PUBLIC_KEY=pk_test_...
CMI_MERCHANT_ID=...
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
// components/calendar/__tests__/DayCell.test.tsx
describe('DayCell', () => {
  it('renders date and price', () => {
    render(<DayCell date={new Date(2026, 5, 15)} price={185} />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('185')).toBeInTheDocument();
  });

  it('shows blocked state', () => {
    const { container } = render(
      <DayCell date={new Date()} price={185} isBlocked />
    );
    expect(container.querySelector('.blocked')).toBeInTheDocument();
  });
});

// lib/pricing/__tests__/calculator.test.ts
describe('calculateStay', () => {
  it('calculates weekend pricing correctly', () => {
    const result = calculateStay(
      new Date(2026, 5, 12), // Friday
      new Date(2026, 5, 14), // Sunday
      { basePrice: 185, weekendPrice: 240 }
    );

    expect(result.weekendNights).toBe(2);
    expect(result.weekendAmount).toBe(480);
  });
});
```

### 10.2 Integration Tests

```typescript
// __tests__/booking-flow.test.tsx
describe('Booking Flow', () => {
  it('completes full booking journey', async () => {
    const user = userEvent.setup();
    render(<CalendarPage listingId="123" />);

    // Select dates
    await user.click(screen.getByText('15'));
    await user.click(screen.getByText('22'));

    // Proceed to checkout
    await user.click(screen.getByText('Réserver maintenant'));

    // Fill guest info
    await user.type(screen.getByLabelText('Prénom'), 'Mohamed');
    // ... more fields

    // Submit payment
    await user.click(screen.getByText(/Payer/));

    // Check confirmation
    expect(screen.getByText(/confirmée/)).toBeInTheDocument();
  });
});
```

### 10.3 E2E Tests (Playwright)

```typescript
// e2e/booking.spec.ts
test('user can complete booking', async ({ page }) => {
  await page.goto('/listings/riad-bahia');

  // Calendar selection
  await page.click('[data-date="2026-06-15"]');
  await page.click('[data-date="2026-06-22"]');
  await expect(page.getByText('7 nuits')).toBeVisible();

  // Checkout
  await page.click('text=Réserver maintenant');
  await page.waitForURL('**/checkout');

  // Forms
  await page.fill('[name="firstName"]', 'Mohamed');
  await page.fill('[name="email"]', 'test@example.com');

  // Payment (test mode)
  await page.fill('[name="cardNumber"]', '4242424242424242');
  await page.click('text=Payer');

  // Confirmation
  await expect(page.getByText('confirmée')).toBeVisible();
});
```

---

## 11. Performance Optimization

### 11.1 Code Splitting

```typescript
// app/listings/[id]/page.tsx
import dynamic from 'next/dynamic';

const CalendarCard = dynamic(() => import('@/components/calendar/CalendarCard'), {
  loading: () => <CalendarSkeleton />,
  ssr: false // Calendar is interactive, no need for SSR
});
```

### 11.2 Memoization

```typescript
// components/calendar/Calendar.tsx
const Calendar = memo(({ listingId }: CalendarProps) => {
  const blockedDates = useMemo(
    () => new Set(availability?.blockedDates || []),
    [availability]
  );

  const pricing = useMemo(
    () => calculateStay(checkin, checkout, config),
    [checkin, checkout, config]
  );

  return <CalendarCard ... />;
});
```

### 11.3 Debouncing

```typescript
// hooks/useCalendar.ts
const debouncedPriceCalc = useMemo(
  () => debounce((checkin, checkout) => {
    queryClient.invalidateQueries(['price', checkin, checkout]);
  }, 300),
  []
);
```

---

## 12. Accessibility (a11y)

### 12.1 Calendar Accessibility

```typescript
<button
  className="day"
  role="gridcell"
  aria-label={`${date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })}, ${price} MAD par nuit`}
  aria-selected={isSelected}
  aria-disabled={isBlocked || isPast}
  tabIndex={isBlocked ? -1 : 0}
  onClick={onClick}
>
  ...
</button>
```

### 12.2 Form Labels

```typescript
<label htmlFor="firstName">
  Prénom <span className="req" aria-label="requis">*</span>
</label>
<input
  id="firstName"
  name="firstName"
  required
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby={error ? "firstName-error" : undefined}
/>
{error && (
  <span id="firstName-error" role="alert">
    {error}
  </span>
)}
```

### 12.3 Keyboard Navigation

```typescript
// Calendar keyboard support
const handleKeyDown = (e: KeyboardEvent, date: Date) => {
  switch (e.key) {
    case 'ArrowRight':
      focusNextDay(date);
      break;
    case 'ArrowLeft':
      focusPrevDay(date);
      break;
    case 'ArrowDown':
      focusDayBelow(date);
      break;
    case 'ArrowUp':
      focusDayAbove(date);
      break;
    case 'Enter':
    case ' ':
      selectDate(date);
      break;
  }
};
```

---

## 13. Deployment Checklist

### 13.1 Pre-Deploy

- [ ] Run full test suite
- [ ] Lighthouse audit (Performance, Accessibility, SEO)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile device testing (iOS, Android)
- [ ] API rate limit testing
- [ ] Error tracking setup (Sentry)
- [ ] Analytics events (GA4, Mixpanel)

### 13.2 Environment Setup

- [ ] Production API endpoints configured
- [ ] Payment gateway credentials (production)
- [ ] CORS policies updated
- [ ] CDN configuration for static assets
- [ ] Database indexes for reservations queries

### 13.3 Monitoring

- [ ] Error rate alerts
- [ ] API latency monitoring
- [ ] Conversion funnel tracking
- [ ] Form abandonment tracking
- [ ] Payment failure alerts

---

## 14. Future Enhancements

### 14.1 MVP+1 Features

- [ ] Multi-month calendar (3-6 months)
- [ ] Guest count selector in calendar
- [ ] Dynamic pricing (demand-based)
- [ ] Coupon/promo code support
- [ ] Multi-currency support
- [ ] Save booking as draft

### 14.2 Advanced Features

- [ ] Instant booking vs. request to book
- [ ] Multi-room/property booking
- [ ] Loyalty program integration
- [ ] Referral program
- [ ] Gift card support
- [ ] Corporate booking portal

---

## 15. Summary & Recommendations

### Key Components to Build

1. **Calendar System** (Most complex)
   - DayCell with states and tooltip
   - MonthGrid with date logic
   - Range selection state machine
   - Price calculation engine

2. **Checkout Flow** (Most critical)
   - 4-step wizard with validation
   - Form handling with validation
   - Payment integration
   - Confirmation flow

3. **Shared UI** (Foundation)
   - Design system implementation
   - Form components
   - Button variants
   - Card layouts

### Recommended Tech Stack

- **Framework:** Next.js 14 (App Router)
- **State:** React Context + useReducer (or Zustand)
- **Data Fetching:** React Query
- **Forms:** React Hook Form + Zod
- **Styling:** CSS Modules (preserve existing design)
- **Testing:** Vitest + Testing Library + Playwright
- **Dates:** date-fns (lighter than moment)

### Implementation Approach

**Week 1:** Foundation + Calendar UI
**Week 2:** Calendar logic + Booking recap + API
**Week 3:** Checkout flow (all 4 steps)
**Week 4:** Mobile, polish, testing

**Estimated Effort:** 3-4 weeks for MVP with 1 full-time developer

### Risk Mitigation

1. **Complex state management:** Start with Context, migrate to Zustand if needed
2. **Price calculation errors:** Unit test extensively, use Decimal.js for precision
3. **Payment integration:** Use test mode, validate with Stripe test cards
4. **Mobile UX:** Mobile-first approach, test early and often
5. **Performance:** Code split, lazy load, memoize calculations

### Success Metrics

- Calendar interaction rate > 80%
- Checkout completion rate > 60%
- Form validation error rate < 10%
- Mobile conversion parity with desktop
- Page load time < 2s (LCP)
- API response time < 500ms (p95)

---

## 16. Appendix: Code Snippets

### A. Calendar State Machine

```typescript
type CalendarAction =
  | { type: 'SELECT_CHECKIN'; date: string }
  | { type: 'SELECT_CHECKOUT'; date: string }
  | { type: 'CLEAR_DATES' };

interface CalendarState {
  checkin: string | null;
  checkout: string | null;
  mode: 'idle' | 'selecting-checkout';
}

function calendarReducer(
  state: CalendarState,
  action: CalendarAction
): CalendarState {
  switch (action.type) {
    case 'SELECT_CHECKIN':
      return {
        checkin: action.date,
        checkout: null,
        mode: 'selecting-checkout'
      };

    case 'SELECT_CHECKOUT':
      if (!state.checkin) return state;
      if (action.date <= state.checkin) {
        return {
          checkin: action.date,
          checkout: null,
          mode: 'selecting-checkout'
        };
      }
      return {
        ...state,
        checkout: action.date,
        mode: 'idle'
      };

    case 'CLEAR_DATES':
      return {
        checkin: null,
        checkout: null,
        mode: 'idle'
      };

    default:
      return state;
  }
}
```

### B. Card Number Formatting

```typescript
export function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 16);
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ');
}

export function validateLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}
```

### C. Responsive Hook

```typescript
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Usage
const isMobile = useMediaQuery('(max-width: 900px)');
```

---

**Document Version:** 1.0
**Last Updated:** 2026-05-29
**Author:** Claude (Anthropic)
**Status:** Ready for Implementation
