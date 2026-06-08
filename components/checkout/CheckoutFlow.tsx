'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { CheckoutFlowProps, CheckoutStep, CheckoutData } from './types';
import CheckoutStepper from './CheckoutStepper';
import BookingRecapCard from './BookingRecapCard';
import { CountryPhoneSelector } from './CountryPhoneSelector';
import { CheckoutAuthButtons } from './CheckoutAuthButtons';
import { useListing } from '@/lib/hooks/useListings';
import { PAYMENT_MODE } from '@/lib/config/payment';
import { createPaymentIntent, confirmPayment } from '@/lib/services/paymentService';
import { createGuestReservationWithNapsRedirect, getGuestReservationByNumber, UnpaidReservationExistsError } from '@/lib/services/napsRedirectService';
import {
  formatCardNumber,
  validateCardNumber,
  validateCVV,
  validateExpiry,
  type CardData,
} from '@/lib/utils/cardEncryption';
import { logger } from '@/lib/utils/logger';
import { useUser } from '@clerk/nextjs';
import {
  buildBookingProfilePayload,
  dialCodeToCountryCode,
  localPhoneFromMetadata,
  type BookingProfileMetadata,
} from '@/lib/clerk/bookingProfile';
import { syncBookingProfileToClerk } from '@/lib/clerk/syncBookingProfile';
import styles from './CheckoutFlow.module.css';
import '../../app/checkout-mvp.css';

export default function CheckoutFlow({
  listingId,
  dateRange,
  guests,
  pricing,
  onComplete,
  onCancel,
}: CheckoutFlowProps) {
  const { user, isSignedIn, isLoaded: isUserLoaded } = useUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [checkoutReturnUrl, setCheckoutReturnUrl] = useState('');
  useEffect(() => {
    const query = searchParams.toString();
    setCheckoutReturnUrl(
      typeof window !== 'undefined'
        ? window.location.href
        : query
          ? `${pathname}?${query}`
          : pathname,
    );
  }, [pathname, searchParams]);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const [accountMode, setAccountMode] = useState<'guest' | 'login' | 'signup'>('guest');
  const [phoneCountry, setPhoneCountry] = useState('+212');
  const [cardExpiry, setCardExpiry] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'cash'>('card');
  const [data, setData] = useState<Partial<CheckoutData>>({
    traveler: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    payment: {
      method: 'card',
    },
  });

  // Card data states (sécurisés - jamais stockés)
  const [cardNumber, setCardNumber] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');

  // Fetch listing data for recap card
  const { listing } = useListing(listingId);

  useEffect(() => {
    if (!isUserLoaded) return;
    if (isSignedIn) {
      setAccountMode('login');
    }
  }, [isSignedIn, isUserLoaded]);

  useEffect(() => {
    if (!isSignedIn || !user) return;

    const meta = user.unsafeMetadata as BookingProfileMetadata;
    const dialCode = meta.phoneCountryCode || phoneCountry;
    const phoneFromProfile = localPhoneFromMetadata(dialCode, meta.phone);

    if (meta.phoneCountryCode) {
      setPhoneCountry(meta.phoneCountryCode);
    }

    setData((prev) => ({
      ...prev,
      traveler: {
        firstName: user.firstName || prev.traveler?.firstName || '',
        lastName: user.lastName || prev.traveler?.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || prev.traveler?.email || '',
        phone: prev.traveler?.phone || phoneFromProfile,
      },
    }));
  }, [isSignedIn, user]);

  // Retour arrière depuis NAPS (bfcache) peut restaurer processing=true → débloquer l’UI
  useEffect(() => {
    const unlock = () => setProcessing(false);
    window.addEventListener('pageshow', unlock);
    return () => window.removeEventListener('pageshow', unlock);
  }, []);

  // Résa déjà créée, paiement NAPS en attente (localStorage)
  useEffect(() => {
    let cancelled = false;
    async function loadPending() {
      try {
        const pending = localStorage.getItem('pendingReservationNumber');
        if (!pending) return;
        const reservation = await getGuestReservationByNumber(pending);
        if (cancelled) return;
        if (
          reservation.paymentStatus === 'Paid' ||
          reservation.paymentStatus === 'paid'
        ) {
          localStorage.removeItem('pendingReservationNumber');
          setReservationNumber(reservation.reservationNumber);
          setCurrentStep(2);
          return;
        }
        setProcessing(false);
        setPendingPayment({
          reservationNumber: pending,
          paymentLink: reservation.paymentLink,
          lastError: reservation.lastNapsError?.userMessage || null,
        });
      } catch {
        if (!cancelled) setProcessing(false);
      }
    }
    loadPending();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistTravelerProfile = async (phoneFull: string) => {
    if (!isSignedIn) return;
    const country = dialCodeToCountryCode(phoneCountry);
    try {
      await syncBookingProfileToClerk(
        buildBookingProfilePayload({
          phone: phoneFull,
          phoneCountryCode: phoneCountry,
          country,
          nationality: country,
          source: 'checkout',
        }),
      );
    } catch (err) {
      logger.error('[CHECKOUT] Profil Clerk non synchronisé', err);
    }
  };

  const nights = Math.round((dateRange.checkOut.getTime() - dateRange.checkIn.getTime()) / (1000 * 60 * 60 * 24));

  const goStep = (step: CheckoutStep) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [reservationNumber, setReservationNumber] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    reservationNumber: string
    paymentLink?: string | null
    lastError?: string | null
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [priceChanged, setPriceChanged] = useState(false);
  const [newPrice, setNewPrice] = useState<number | null>(null);
  const [showPriceWarning, setShowPriceWarning] = useState(false);

  // Metadata stored inside the PaymentIntent so the backend can (re)build the
  // reservation even if the browser is closed during a 3DS challenge.
  const buildPaymentMetadata = (): Record<string, string> => ({
    checkIn: dateRange.checkIn.toISOString().split('T')[0],
    checkOut: dateRange.checkOut.toISOString().split('T')[0],
    guests: `${guests.adults}`,
    children: `${guests.children || 0}`,
    infants: `${guests.infants || 0}`,
    baseNights: `${pricing.baseNights}`,
    basePrice: `${pricing.basePrice}`,
    weekendNights: `${pricing.weekendNights}`,
    weekendPrice: `${pricing.weekendPrice}`,
    subtotal: `${pricing.subtotal}`,
    serviceFee: `${pricing.serviceFee}`,
    tax: `${pricing.tax}`,
    total: `${pricing.total}`,
    ...(user?.id ? { clerkId: user.id } : {}),
    country: dialCodeToCountryCode(phoneCountry),
    phoneCountryCode: phoneCountry,
  });

  const buildGuestReservationPayload = (method: 'card' | 'later') => {
    const phoneFull = `${phoneCountry}${data.traveler?.phone}`;
    return {
      listingId,
      checkIn: dateRange.checkIn.toISOString().split('T')[0],
      checkOut: dateRange.checkOut.toISOString().split('T')[0],
      guests: {
        adults: guests.adults,
        children: guests.children || 0,
        infants: guests.infants || 0,
      },
      traveler: {
        firstName: data.traveler?.firstName || '',
        lastName: data.traveler?.lastName || '',
        email: data.traveler?.email || '',
        phone: phoneFull,
        country: dialCodeToCountryCode(phoneCountry),
        phoneCountryCode: phoneCountry,
      },
      ...(user?.id
        ? {
            clerkId: user.id,
            clerkEnvironment: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')
              ? ('development' as const)
              : ('production' as const),
          }
        : {}),
      pricing: {
        baseNights: pricing.baseNights,
        basePrice: pricing.basePrice,
        weekendNights: pricing.weekendNights,
        weekendPrice: pricing.weekendPrice,
        subtotal: pricing.subtotal,
        serviceFee: pricing.serviceFee,
        tax: pricing.tax,
        total: pricing.total,
      },
      payment: { method },
    };
  };

  // NAPS redirect (default): reservation + lien NAPS, saisie carte sur page NAPS.
  const handleCardRedirectPayment = async (replaceExisting = false) => {
    const phoneFull = `${phoneCountry}${data.traveler?.phone}`;
    const payload = buildGuestReservationPayload('card');
    payload.payment = { ...payload.payment, replaceExisting };

    let result;
    try {
      result = await createGuestReservationWithNapsRedirect(payload);
    } catch (err) {
      if (err instanceof UnpaidReservationExistsError && !replaceExisting) {
        setProcessing(false);
        setPendingPayment({
          reservationNumber: err.reservationNumber,
          paymentLink: err.paymentUrl,
          lastError: null,
        });
        try {
          localStorage.setItem('pendingReservationNumber', err.reservationNumber);
        } catch {
          /* ignore */
        }
        setError(
          `Paiement déjà en attente pour ces dates (${err.reservationNumber}). Reprenez le lien NAPS ou cliquez « Nouvelle tentative ».`,
        );
        return;
      }
      throw err;
    }

    await persistTravelerProfile(phoneFull);

    try {
      localStorage.setItem('pendingReservationNumber', result.reservationNumber);
    } catch {
      /* ignore */
    }

    if (!result.paymentUrl) {
      throw new Error('Lien de paiement NAPS indisponible');
    }

    logger.debug('[CHECKOUT] Redirect NAPS', { reservationNumber: result.reservationNumber });
    window.location.href = result.paymentUrl;
  };

  // NAPS API directe (désactivé en UI sauf NEXT_PUBLIC_PAYMENT_MODE=api).
  const handleCardApiPayment = async () => {
    // Validate card fields
    if (!validateCardNumber(cardNumber)) {
      throw new Error('Numéro de carte invalide');
    }
    const expDigits = cardExpiry.replace(/\D/g, '');
    const expiryMonth = expDigits.slice(0, 2);
    const expiryYear = expDigits.slice(2, 4);
    if (!validateExpiry(expiryMonth, expiryYear)) {
      throw new Error("Date d'expiration invalide");
    }
    if (!validateCVV(cardCVV)) {
      throw new Error('CVV invalide');
    }
    if (!cardHolderName.trim()) {
      throw new Error('Nom sur la carte requis');
    }

    const cardData: CardData = {
      number: cardNumber.replace(/\s/g, ''),
      cvv: cardCVV,
      expiryMonth,
      expiryYear,
      holderName: cardHolderName.trim(),
    };

    const phoneFull = `${phoneCountry}${data.traveler?.phone}`;

    // 1. Create PaymentIntent (stores all data in backend DB before charging)
    const intent = await createPaymentIntent({
      amount: Math.round(pricing.total * 100),
      currency: '504', // MAD (ISO numeric)
      context: { type: 'reservation', referenceId: listingId },
      guest: {
        firstName: data.traveler?.firstName || '',
        lastName: data.traveler?.lastName || '',
        email: data.traveler?.email || '',
        phone: phoneFull,
      },
      metadata: buildPaymentMetadata(),
    });

    await persistTravelerProfile(phoneFull);

    // Persist intent id so the 3DS return page can reconcile even if the tab
    // is closed/reopened during the bank challenge.
    try {
      localStorage.setItem('pendingPaymentIntent', intent.id);
    } catch {
      /* ignore storage errors */
    }

    // 2. Confirm with encrypted card data
    const result = await confirmPayment(intent.id, cardData);

    // 3. 3DS challenge required -> redirect to the bank (unavoidable for 3DS).
    //    The webhook creates the reservation; the return page shows confirmation.
    if (result.requiresAction && result.actionUrl) {
      logger.debug('[CHECKOUT] 3DS challenge, redirection banque');
      window.location.href = result.actionUrl;
      return;
    }

    // 4. Failure
    if (!result.success) {
      try {
        localStorage.removeItem('pendingPaymentIntent');
      } catch {
        /* ignore */
      }
      throw new Error(result.error || 'Le paiement a échoué');
    }

    // 5. Success without 3DS -> reservation already created by backend
    try {
      localStorage.removeItem('pendingPaymentIntent');
    } catch {
      /* ignore */
    }
    const resData = result.data as { reservationId?: string; reservationNumber?: string };
    if (resData?.reservationNumber) {
      setReservationNumber(resData.reservationNumber);
    }
    setCurrentStep(2);
    if (resData?.reservationId) {
      onComplete(resData.reservationId);
    }
  };

  // Cash / transfer: deferred payment via guest API.
  const handleDeferredReservation = async () => {
    const phoneFull = `${phoneCountry}${data.traveler?.phone}`;
    const result = await createGuestReservationWithNapsRedirect(
      buildGuestReservationPayload('later'),
    );

    await persistTravelerProfile(phoneFull);

    setReservationNumber(result.reservationNumber);
    setCurrentStep(2);
    onComplete(result.reservationId);
  };

  const handlePayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Validate required traveler fields
      const missingFields: string[] = [];
      if (!data.traveler?.firstName?.trim()) missingFields.push('Prénom');
      if (!data.traveler?.lastName?.trim()) missingFields.push('Nom');
      if (!data.traveler?.email?.trim()) missingFields.push('Email');
      if (!data.traveler?.phone?.trim()) missingFields.push('Téléphone');

      if (missingFields.length > 0) {
        setError(`Veuillez remplir les champs obligatoires : ${missingFields.join(', ')}`);
        setProcessing(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (paymentMethod === 'card') {
        if (PAYMENT_MODE === 'api') {
          await handleCardApiPayment();
        } else {
          const replaceExisting = pendingPayment === null;
          await handleCardRedirectPayment(replaceExisting);
        }
      } else {
        await handleDeferredReservation();
      }
    } catch (err) {
      logger.error('Reservation failed:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={styles.wrap}>
      {/* Stepper - Nouveau design MVP */}
      <CheckoutStepper
        currentStep={currentStep}
        onStepClick={(step) => {
          if (step < currentStep) {
            goStep(step);
          }
        }}
      />

      <div className={styles.layout}>
        <div className={styles.main}>
          {/* STEP 1 - Informations & Paiement */}
          {currentStep === 1 && (
            <div className={styles.step}>
              <h2>
                Vos <span className={styles.it}>informations</span> & <span className={styles.it}>paiement</span>
              </h2>
              <p className={styles.hSub}>Partagées avec le Property Manager pour préparer votre arrivée</p>

              {error && (
                <div
                  role="alert"
                  style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #fca5a5',
                    background: '#fef2f2',
                    color: '#b91c1c',
                    fontSize: '14px',
                  }}
                >
                  {error}
                </div>
              )}

              {pendingPayment && (
                <div
                  role="status"
                  style={{
                    marginBottom: '16px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #fbbf24',
                    background: '#fef3c7',
                    color: '#92400e',
                    fontSize: '14px',
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Paiement en attente</strong>
                  <div style={{ marginTop: '8px' }}>
                    Réservation <b>{pendingPayment.reservationNumber}</b> — paiement NAPS non finalisé.
                    {pendingPayment.lastError ? (
                      <div style={{ marginTop: '6px' }}>Dernière erreur : {pendingPayment.lastError}</div>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {pendingPayment.paymentLink ? (
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = pendingPayment.paymentLink!;
                        }}
                        style={{
                          padding: '10px 16px',
                          background: 'var(--ink)',
                          color: 'var(--paper)',
                          border: 0,
                          borderRadius: '8px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Reprendre le paiement NAPS
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('pendingReservationNumber');
                        setPendingPayment(null);
                        setError(null);
                      }}
                      style={{
                        padding: '10px 16px',
                        background: 'transparent',
                        border: '1px solid #92400e',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Nouvelle tentative
                    </button>
                  </div>
                </div>
              )}

              {/* Account Mode Selector */}
              <div className={styles.card}>
                <div className={styles.lbl}>Réserver en tant que</div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    className={`${styles.accountBtn} ${accountMode === 'guest' ? styles.active : ''}`}
                    onClick={() => !isSignedIn && setAccountMode('guest')}
                    disabled={isSignedIn}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: accountMode === 'guest' ? '2px solid var(--gold)' : '1px solid var(--b)',
                      borderRadius: '8px',
                      background: accountMode === 'guest' ? 'var(--goldT)' : 'var(--card)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: isSignedIn ? 'not-allowed' : 'pointer',
                      opacity: isSignedIn ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    Sans compte
                  </button>
                  <button
                    className={`${styles.accountBtn} ${accountMode === 'login' ? styles.active : ''}`}
                    onClick={() => setAccountMode('login')}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: accountMode === 'login' ? '2px solid var(--gold)' : '1px solid var(--b)',
                      borderRadius: '8px',
                      background: accountMode === 'login' ? 'var(--goldT)' : 'var(--card)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    J'ai un compte
                  </button>
                  <button
                    className={`${styles.accountBtn} ${accountMode === 'signup' ? styles.active : ''}`}
                    onClick={() => !isSignedIn && setAccountMode('signup')}
                    disabled={isSignedIn}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: accountMode === 'signup' ? '2px solid var(--gold)' : '1px solid var(--b)',
                      borderRadius: '8px',
                      background: accountMode === 'signup' ? 'var(--goldT)' : 'var(--card)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: isSignedIn ? 'not-allowed' : 'pointer',
                      opacity: isSignedIn ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    Créer un compte
                  </button>
                </div>
                {isSignedIn && user && (
                  <div className={styles.connectedBanner}>
                    <span>✓</span>
                    <span>
                      Connecté en tant que <strong>{user.primaryEmailAddress?.emailAddress}</strong>
                    </span>
                  </div>
                )}
              </div>

              {(accountMode === 'login' || accountMode === 'signup') && !isSignedIn && (
                <div className={styles.card}>
                  <div className={styles.lbl}>
                    {accountMode === 'login' ? 'Connexion' : 'Créer un compte'}
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--ink3)', marginBottom: '16px' }}>
                    {accountMode === 'login'
                      ? 'Connectez-vous avec votre compte Sojori pour retrouver vos réservations.'
                      : 'Un compte Sojori simplifie vos prochaines réservations.'}
                  </p>
                  <CheckoutAuthButtons returnUrl={checkoutReturnUrl} mode={accountMode} />
                </div>
              )}

              <div className={styles.card}>
                <div className={styles.lbl}>Qui voyage ?</div>

                {/* Nom et Prénom */}
                <div className={styles.fieldGrid}>
                  <div className={styles.field}>
                    <label>
                      Prénom<span className={styles.req}>*</span>
                    </label>
                    <input
                      value={data.traveler?.firstName}
                      onChange={(e) =>
                        setData({ ...data, traveler: { ...data.traveler!, firstName: e.target.value } })
                      }
                      placeholder="Mohamed"
                    />
                  </div>
                  <div className={styles.field}>
                    <label>
                      Nom<span className={styles.req}>*</span>
                    </label>
                    <input
                      value={data.traveler?.lastName}
                      onChange={(e) => setData({ ...data, traveler: { ...data.traveler!, lastName: e.target.value } })}
                      placeholder="Benali"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className={styles.field}>
                  <label>
                    Email<span className={styles.req}>*</span>
                  </label>
                  <input
                    type="email"
                    value={data.traveler?.email}
                    onChange={(e) =>
                      !isSignedIn &&
                      setData({ ...data, traveler: { ...data.traveler!, email: e.target.value } })
                    }
                    readOnly={isSignedIn}
                    className={isSignedIn ? styles.locked : undefined}
                    placeholder="mohamed@example.com"
                  />
                  {isSignedIn && (
                    <p style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '4px' }}>
                      Email lié à votre compte Sojori (non modifiable)
                    </p>
                  )}
                </div>

                {/* Téléphone avec sélecteur de pays searchable */}
                <div className={styles.field}>
                  <label>
                    Téléphone<span className={styles.req}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <CountryPhoneSelector
                      value={phoneCountry}
                      onChange={setPhoneCountry}
                    />
                    <input
                      type="tel"
                      value={data.traveler?.phone}
                      onChange={(e) => {
                        // Remove leading 0 if present
                        const value = e.target.value.replace(/^0+/, '');
                        setData({ ...data, traveler: { ...data.traveler!, phone: value } });
                      }}
                      placeholder={phoneCountry === '+212' ? '612345678' : '612345678'}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '4px' }}>
                    Ne pas commencer par 0. Format Maroc : 6XX-XXXXXX
                  </p>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.lbl}>Arrivée</div>
                <div className={styles.field}>
                  <label>Heure d'arrivée estimée</label>
                  <select>
                    <option>15:00 · Standard</option>
                    <option>17:00</option>
                    <option>19:00</option>
                    <option>🌃 Après 20:00 · late</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>
                    Demandes spéciales <span style={{ color: 'var(--ink4)', fontWeight: 500 }}>(optionnel)</span>
                  </label>
                  <textarea rows={2} placeholder="Lit bébé, parking, arrivée tardive…" />
                </div>
              </div>

              {/* PAYMENT SECTION - Combined */}
              <div className={styles.card}>
                <div className={styles.lbl}>Mode de paiement</div>
                <p style={{ fontSize: '13px', color: 'var(--ink3)', marginBottom: '16px' }}>
                  Paiement sécurisé · débité après confirmation de l'hôte sous 24h
                </p>

                {/* Option 1: Carte bancaire */}
                <label
                  className={`${styles.payMethod} ${paymentMethod === 'card' ? styles.on : ''}`}
                  onClick={() => setPaymentMethod('card')}
                  style={{ cursor: 'pointer' }}
                >
                  <span className={styles.radio} />
                  <div className={styles.pmInfo}>
                    <div className={styles.pmNm}>💳 Carte bancaire</div>
                  </div>
                  <div className={styles.cards}>
                    <span>VISA</span>
                    <span>MC</span>
                    <span>AMEX</span>
                  </div>
                </label>

                {/* Option 2: Virement bancaire */}
                <label
                  className={`${styles.payMethod} ${paymentMethod === 'transfer' ? styles.on : ''}`}
                  onClick={() => setPaymentMethod('transfer')}
                  style={{ cursor: 'pointer' }}
                >
                  <span className={styles.radio} />
                  <div className={styles.pmInfo}>
                    <div className={styles.pmNm}>🏦 Virement bancaire</div>
                    <div className={styles.pmDs}>Confirmation sous 24h</div>
                  </div>
                </label>

                {/* Option 3: Cash */}
                <label
                  className={`${styles.payMethod} ${paymentMethod === 'cash' ? styles.on : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                  style={{ cursor: 'pointer' }}
                >
                  <span className={styles.radio} />
                  <div className={styles.pmInfo}>
                    <div className={styles.pmNm}>💵 Cash</div>
                    <div className={styles.pmDs}>Paiement à l'arrivée</div>
                  </div>
                </label>

                {/* NAPS redirect — no card fields on our site (PCI SAQ A) */}
                {paymentMethod === 'card' && PAYMENT_MODE !== 'api' && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '16px',
                      background: 'var(--paper2)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                      Paiement sécurisé via NAPS
                    </div>
                    <div style={{ color: 'var(--ink2)', marginBottom: '12px' }}>
                      Vous serez redirigé vers la page de paiement sécurisée NAPS pour saisir votre
                      carte bancaire. Aucune donnée carte n&apos;est collectée sur Sojori.
                    </div>
                    <div className={styles.sslRow}>
                      🔒 SSL · 3D Secure · Hébergé par NAPS (PCI DSS Level 1)
                    </div>
                  </div>
                )}

                {/* API directe — champs carte (NEXT_PUBLIC_PAYMENT_MODE=api uniquement) */}
                {paymentMethod === 'card' && PAYMENT_MODE === 'api' && (
                  <div className={styles.cardFields}>
                    <div className={styles.field}>
                      <label>
                        Numéro de carte<span className={styles.req}>*</span>
                      </label>
                      <input
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        inputMode="numeric"
                        autoComplete="cc-number"
                        style={{ fontFamily: 'var(--mono)', letterSpacing: '0.06em' }}
                        placeholder="4242 4242 4242 4242"
                      />
                    </div>
                    <div className={styles.fieldGrid}>
                      <div className={styles.field}>
                        <label>
                          Expiration<span className={styles.req}>*</span>
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 4) {
                              if (value.length >= 3) {
                                setCardExpiry(`${value.slice(0, 2)} / ${value.slice(2)}`);
                              } else {
                                setCardExpiry(value);
                              }
                            }
                          }}
                          maxLength={7}
                          style={{ fontFamily: 'var(--mono)' }}
                          placeholder="MM / AA"
                        />
                      </div>
                      <div className={styles.field}>
                        <label>
                          CVV<span className={styles.req}>*</span>
                        </label>
                        <input
                          maxLength={4}
                          value={cardCVV}
                          onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, ''))}
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          style={{ fontFamily: 'var(--mono)' }}
                          placeholder="•••"
                        />
                      </div>
                    </div>
                    <div className={styles.field}>
                      <label>
                        Nom sur la carte<span className={styles.req}>*</span>
                      </label>
                      <input
                        value={cardHolderName}
                        onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
                        autoComplete="cc-name"
                        placeholder="MOHAMED BENALI"
                      />
                    </div>
                    <div className={styles.sslRow}>🔒 Paiement sécurisé SSL · 3D Secure · PCI DSS Level 1</div>
                  </div>
                )}

                {/* Transfer info - only show if transfer selected */}
                {paymentMethod === 'transfer' && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'var(--paper2)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>📋 Informations de virement</div>
                    <div style={{ color: 'var(--ink2)' }}>
                      Les coordonnées bancaires vous seront envoyées par email après validation de votre réservation.
                      Votre réservation sera confirmée après réception du virement sous 24h.
                    </div>
                  </div>
                )}

                {/* Cash info - only show if cash selected */}
                {paymentMethod === 'cash' && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'var(--paper2)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>💵 Paiement en espèces</div>
                    <div style={{ color: 'var(--ink2)' }}>
                      Le paiement s'effectuera directement auprès de l'hôte à votre arrivée.
                      Votre réservation sera confirmée sous réserve de disponibilité.
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fee',
                  color: '#c33',
                  borderRadius: '8px',
                  marginTop: '16px',
                  fontSize: '14px'
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Price change warning modal */}
              {showPriceWarning && newPrice !== null && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  padding: '20px'
                }}>
                  <div style={{
                    background: 'var(--card)',
                    borderRadius: '16px',
                    padding: '32px',
                    maxWidth: '480px',
                    width: '100%',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                  }}>
                    <div style={{
                      fontSize: '48px',
                      textAlign: 'center',
                      marginBottom: '16px'
                    }}>⚠️</div>
                    <h3 style={{
                      fontFamily: 'var(--serif)',
                      fontSize: '24px',
                      textAlign: 'center',
                      marginBottom: '16px',
                      color: 'var(--ink)'
                    }}>
                      Le prix a changé
                    </h3>
                    <div style={{
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: 'var(--ink2)',
                      marginBottom: '24px',
                      textAlign: 'center'
                    }}>
                      Le prix du bien a été mis à jour depuis votre sélection.
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '16px',
                      background: 'var(--paper2)',
                      borderRadius: '12px',
                      marginBottom: '24px'
                    }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: 'var(--ink3)', marginBottom: '4px' }}>
                          Prix initial
                        </div>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: 'var(--ink2)',
                          textDecoration: 'line-through'
                        }}>
                          {pricing.total.toLocaleString('fr-FR')} MAD
                        </div>
                      </div>
                      <div style={{
                        fontSize: '24px',
                        color: 'var(--ink4)',
                        display: 'flex',
                        alignItems: 'center'
                      }}>→</div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: 'var(--ink3)', marginBottom: '4px' }}>
                          Nouveau prix
                        </div>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: newPrice > pricing.total ? '#c33' : '#3c3'
                        }}>
                          {newPrice.toLocaleString('fr-FR')} MAD
                        </div>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      flexDirection: 'column'
                    }}>
                      <button
                        onClick={() => {
                          setShowPriceWarning(false);
                          // Update pricing with new price and retry
                          pricing.total = newPrice;
                          handlePayment();
                        }}
                        style={{
                          padding: '14px 24px',
                          background: 'var(--gold)',
                          color: 'var(--ink)',
                          border: 0,
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        Accepter le nouveau prix
                      </button>
                      <button
                        onClick={() => {
                          setShowPriceWarning(false);
                          setPriceChanged(false);
                          setNewPrice(null);
                          onCancel();
                        }}
                        style={{
                          padding: '14px 24px',
                          background: 'transparent',
                          color: 'var(--ink2)',
                          border: '1px solid var(--b)',
                          borderRadius: '12px',
                          fontWeight: 600,
                          fontSize: '14px',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        Annuler la réservation
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.nav}>
                <button className={`${styles.btn} ${styles.next}`} onClick={handlePayment} disabled={processing} style={{ width: '100%' }}>
                  {processing
                    ? '⏳ Traitement...'
                    : paymentMethod === 'card' && PAYMENT_MODE !== 'api'
                      ? `Continuer vers NAPS · ${pricing.total.toLocaleString('fr-FR')} MAD`
                      : paymentMethod === 'card'
                        ? `🔒 Payer ${pricing.total.toLocaleString('fr-FR')} MAD`
                        : `Confirmer · ${pricing.total.toLocaleString('fr-FR')} MAD`}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 - Confirmation */}
          {currentStep === 2 && (
            <div className={styles.step}>
              <div className={styles.confirmHero}>
                <div className={styles.confirmCheck}>✓</div>
                <h2>Réservation confirmée !</h2>
                <p>
                  Un email de confirmation a été envoyé à <b>{data.traveler?.email}</b> avec tous les détails de votre réservation.
                  {paymentMethod !== 'card' && ' Le Property Manager confirmera votre réservation sous 24h.'}
                </p>

                {/* Message spécifique pour les guests (sans compte) */}
                {accountMode === 'guest' && !isSignedIn && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'var(--goldT)',
                    border: '1px solid var(--gold)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--ink)' }}>
                      📧 Toutes les informations par email
                    </div>
                    <div style={{ color: 'var(--ink2)', marginBottom: '12px' }}>
                      Vous n'avez pas besoin de compte pour suivre votre réservation.
                      Toutes les informations (confirmation, instructions d'arrivée, contacts) vous seront envoyées par email.
                    </div>
                    <div style={{
                      padding: '12px',
                      background: 'var(--card)',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '6px' }}>💡 Créer un compte (optionnel)</div>
                      <div style={{ color: 'var(--ink3)', marginBottom: '8px' }}>
                        Pour suivre facilement vos réservations et accéder rapidement à vos informations.
                      </div>
                      <button
                        onClick={() => window.location.href = '/signup'}
                        style={{
                          padding: '8px 16px',
                          background: 'var(--gold)',
                          color: 'var(--ink)',
                          border: 0,
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Créer mon compte
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.refBox}>
                <div className={styles.info}>
                  <div className={styles.l}>Numéro de réservation</div>
                  <div className={styles.v}>#{reservationNumber || 'SOJORI-2026-XXXX'}</div>
                </div>
                <button className={styles.copy} onClick={() => navigator.clipboard.writeText(reservationNumber)}>⧉ Copier</button>
              </div>

              <div className={styles.card}>
                <div className={styles.listingRecap}>
                  <div className={styles.ph} style={{ width: '80px', height: '72px' }}>
                    <div className={styles.grain} />
                  </div>
                  <div className={styles.info}>
                    <div className={styles.nm} style={{ fontSize: '18px' }}>
                      {listing?.title || 'Votre réservation'}
                    </div>
                    <div className={styles.loc}>
                      📅 {dateRange.checkIn.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} →{' '}
                      {dateRange.checkOut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · 👥{' '}
                      {guests.adults} ad · {guests.children} enf · 💰 {pricing.total.toLocaleString('fr-FR')} MAD
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.lbl}>Prochaines étapes</div>
                <div className={styles.timelineSteps}>
                  <div className={styles.tlStep}>
                    <div className={styles.n}>1</div>
                    <div className={styles.tx}>
                      Vous recevrez les <b>instructions d'arrivée</b> par email 48h avant le check-in.
                    </div>
                  </div>
                  <div className={styles.tlStep}>
                    <div className={styles.n}>2</div>
                    <div className={styles.tx}>
                      Le <b>Property Manager</b> vous contactera 24h avant votre arrivée.
                    </div>
                  </div>
                  <div className={styles.tlStep}>
                    <div className={styles.n}>3</div>
                    <div className={styles.tx}>
                      <b>Check-in</b> à partir de 15:00 · concierge sur place pour l'accueil.
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.nav}>
                {/* Show "Voir ma réservation" only if user has account */}
                {isSignedIn && (
                  <button
                    className={`${styles.btn} ${styles.back}`}
                    onClick={() => window.location.href = '/profile'}
                  >
                    Voir ma réservation
                  </button>
                )}
                <button
                  className={`${styles.btn} ${styles.next}`}
                  onClick={() => window.location.href = '/'}
                  style={{ width: !isSignedIn ? '100%' : 'auto' }}
                >
                  Retour à l'accueil
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SIDE RECAP - Nouveau design MVP */}
        {listing && (
          <aside className={styles.side}>
            <BookingRecapCard
              listing={{
                title: listing.title,
                location: `${listing.neighborhood}, ${listing.city}`,
                rating: listing.rating,
                reviewCount: listing.reviewCount,
                imageUrl: listing.images?.[0],
              }}
              checkIn={dateRange.checkIn}
              checkOut={dateRange.checkOut}
              guests={{
                adults: guests.adults,
                children: guests.children,
              }}
              pricing={pricing}
              showDetails={true}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
