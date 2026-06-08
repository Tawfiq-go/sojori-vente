'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PhoneDialSelect } from '@/components/becomeHost/PhoneDialSelect';
import {
  bookBecomeHostSlot,
  createBecomeHostRequest,
  fetchBecomeHostBookingWeek,
  qualifyBecomeHostRequest,
  type BookingWeekData,
  type UserType,
} from '@/lib/services/becomeHostService';

type FormMode = 'pm' | 'owner';

const PROPERTY_OPTIONS = [
  { value: '1', label: '1 bien' },
  { value: '2-5', label: '2-5 biens' },
  { value: '6-10', label: '6-10 biens' },
  { value: '11-20', label: '11-20 biens' },
  { value: '21-50', label: '21-50 biens' },
  { value: '51+', label: '51+ biens' },
];

const OWNER_TYPES = ['Appartement', 'Villa', 'Riad', 'Studio', 'Maison'];
const CITIES = ['Marrakech', 'Casablanca', 'Fès', 'Essaouira', 'Tanger', 'Autre'];
const PM_TOOLS = ['Aucun', 'PMS', 'Channel Manager', 'Airbnb seul', 'Excel'];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 11,
  border: '1px solid var(--b)',
  background: 'var(--card)',
  color: 'var(--ink)',
  fontSize: 14,
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 700,
  color: 'var(--ink2)',
  marginBottom: 6,
};

function ChipSelect({
  options,
  selected,
  onChange,
  multi = true,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;
}) {
  const toggle = (opt: string) => {
    if (multi) {
      onChange(selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]);
    } else {
      onChange([opt]);
    }
  };
  return (
    <div className="bh-chip-select">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`bh-chip-opt ${selected.includes(opt) ? 'on' : ''}`}
          onClick={() => toggle(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function BecomeHostFormSection({ mode, onBack }: { mode: FormMode; onBack: () => void }) {
  const userType: UserType = mode === 'pm' ? 'professional_pm' : 'property_owner';
  const maxStep = mode === 'pm' ? 4 : 3;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState('');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+33');
  const [dialIso, setDialIso] = useState('FR');
  const [numberOfProperties, setNumberOfProperties] = useState('');

  const [bookingChecking, setBookingChecking] = useState(false);
  const [bookingWeek, setBookingWeek] = useState<BookingWeekData | null>(null);
  const [bookingNoAgent, setBookingNoAgent] = useState('');
  const [selectedDateYmd, setSelectedDateYmd] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    id: string;
    startTime: string;
    endTime: string;
    date: string;
  } | null>(null);

  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [cityRegion, setCityRegion] = useState('Marrakech');
  const [currentPMS, setCurrentPMS] = useState('');
  const [currentChannelManager, setCurrentChannelManager] = useState('');
  const [currentTools, setCurrentTools] = useState<string[]>(['Aucun']);
  const [propertyTypes, setPropertyTypes] = useState<string[]>(['Appartement']);
  const [propertyCity, setPropertyCity] = useState('Marrakech');
  const [managementStatus, setManagementStatus] = useState<string[]>(['Géré moi-même']);
  const [lookingFor, setLookingFor] = useState('');
  const [timeline, setTimeline] = useState('immediate');
  const [biggestChallenges, setBiggestChallenges] = useState('');
  const [expectations, setExpectations] = useState('');

  const managementMap: Record<string, 'self_managed' | 'with_pm' | 'vacant'> = {
    'Géré moi-même': 'self_managed',
    'Avec un PM': 'with_pm',
    Vacant: 'vacant',
  };

  useEffect(() => {
    if (mode !== 'pm' || step !== 2 || !requestId) return;
    let cancelled = false;
    (async () => {
      setBookingChecking(true);
      setBookingNoAgent('');
      setBookingWeek(null);
      setSelectedSlot(null);
      setSelectedDateYmd(null);
      const res = await fetchBecomeHostBookingWeek(requestId);
      if (cancelled) return;
      if (!res.success) {
        setError(res.error || 'Impossible de charger les disponibilités');
        setBookingChecking(false);
        return;
      }
      const d = res.data;
      if ('noAgent' in d && d.noAgent) {
        setBookingNoAgent(d.message || 'Aucun créneau en ligne. Nous vous recontactons sous 24h.');
        setBookingChecking(false);
        return;
      }
      if ('alreadyBooked' in d && d.alreadyBooked) {
        setStep(3);
        setBookingChecking(false);
        return;
      }
      if ('days' in d && 'agent' in d) {
        setBookingWeek(d as BookingWeekData);
      }
      setBookingChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, step, requestId]);

  const submitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const t0 = Date.now();
    try {
      const res = await createBecomeHostRequest({
        userType,
        email: email.trim(),
        phone: phone.replace(/\D/g, ''),
        countryCode,
        numberOfProperties,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setRequestId(res.data?.id || '');
      const elapsed = Date.now() - t0;
      if (elapsed < 3000) await new Promise((r) => setTimeout(r, 3000 - elapsed));
      setStep(2);
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const confirmSlot = async () => {
    if (!selectedSlot || !requestId) {
      setError('Choisissez un créneau avant de continuer.');
      return;
    }
    setLoading(true);
    setError('');
    const local = email.split('@')[0]?.replace(/[.+_]/g, ' ').trim();
    const provisional = local ? local.charAt(0).toUpperCase() + local.slice(1) : 'Invité';
    const res = await bookBecomeHostSlot({
      becomeHostRequestId: requestId,
      slotId: selectedSlot.id,
      clientName: provisional,
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Impossible de réserver ce créneau');
      return;
    }
    setStep(3);
  };

  const submitOwnerQualify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestId) return;
    setLoading(true);
    setError('');
    const res = await qualifyBecomeHostRequest(requestId, {
      fullName: fullName.trim(),
      propertyTypes,
      propertyLocations: [propertyCity],
      currentManagementStatus: managementMap[managementStatus[0]] || 'self_managed',
      lookingFor: lookingFor.trim(),
      timeline,
      numberOfPropertiesOwned: numberOfProperties,
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Erreur envoi');
      return;
    }
    setStep(3);
  };

  const submitPmQualify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestId) return;
    setLoading(true);
    setError('');
    const res = await qualifyBecomeHostRequest(requestId, {
      fullName: fullName.trim(),
      company: company.trim(),
      cityRegion,
      currentPMS: currentPMS.trim(),
      currentChannelManager: currentChannelManager.trim(),
      currentTools: currentTools.filter((t) => t !== 'Aucun'),
      lookingFor: lookingFor.trim(),
      timeline,
      biggestChallenges: biggestChallenges.trim(),
      expectations: expectations.trim(),
      numberOfPropertiesManaged: numberOfProperties,
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Erreur envoi');
      return;
    }
    setStep(4);
  };

  const skipBookingNoAgent = () => setStep(3);

  const bannerTitle =
    mode === 'pm'
      ? step === 1
        ? 'Rejoindre comme PM Pro'
        : step === 2
          ? 'Choisissez votre créneau'
          : 'Complétez votre profil'
      : step === 1
        ? 'Trouver mon PM partenaire'
        : 'Parlez-nous de vos biens';

  const bannerSub =
    step === 1
      ? 'Contact · comme sur sojori.com'
      : mode === 'pm' && step === 2
        ? '30 min · avec notre équipe'
        : 'Dernières informations';

  if (step === maxStep) {
    return (
      <div className="bh-form-section">
        <div className="bh-form-card">
          <div className="bh-form-success">
            <div className="em">✓</div>
            <h3>Demande reçue !</h3>
            <p>
              Merci. Notre équipe vous recontacte sous <b>24h</b>.
              {mode === 'pm' && ' Votre créneau est confirmé — complétez le questionnaire si ce n’est pas déjà fait.'}
              {mode === 'owner' && ' Nous vous mettrons en relation avec un PM partenaire qualifié.'}
            </p>
            <div className="ref">
              SOJORI-{mode === 'pm' ? 'PM' : 'OWN'}-{requestId.slice(-6).toUpperCase()}
            </div>
            <p style={{ marginTop: 20 }}>
              <Link href="/" style={{ color: 'var(--goldD)', fontWeight: 700 }}>
                Retour à l&apos;accueil →
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bh-form-section">
      <button type="button" className="bh-form-back" onClick={step === 1 ? onBack : () => setStep((s) => s - 1)}>
        ← {step === 1 ? 'Retour à l\'accueil' : 'Précédent'}
      </button>

      <div className="bh-form-card">
        <div className={`bh-form-banner ${mode}`}>
          <div className="ic">{mode === 'pm' ? '💼' : '🤝'}</div>
          <div>
            <h3>{bannerTitle}</h3>
            <div className="ds">{bannerSub}</div>
          </div>
        </div>

        <div className="bh-form-body">
          {error && <p className="bh-form-error">{error}</p>}

          {/* STEP 1 — contact simple (sojori.com) */}
          {step === 1 && (
            <form onSubmit={submitStep1}>
              <div className="bh-fp-title">Vos coordonnées</div>
              <div className="bh-fp-sub">On vous recontacte par WhatsApp ou email sous 24h.</div>

              <div className="bh-field">
                <label style={labelStyle}>
                  Email <span className="req">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
                <div style={{ flex: '1 1 280px', minWidth: 220 }}>
                  <PhoneDialSelect
                    dial={countryCode}
                    iso={dialIso}
                    onSelect={(d, iso) => {
                      setCountryCode(d);
                      setDialIso(iso);
                    }}
                    inputStyle={inputStyle}
                    labelStyle={labelStyle}
                    dialLabel="Pays / indicatif *"
                    dialSearchPlaceholder="Rechercher un pays ou +33…"
                    dialNoResults="Aucun résultat"
                  />
                </div>
                <div style={{ flex: '2 1 220px', minWidth: 180 }}>
                  <label style={labelStyle}>
                    Téléphone <span className="req">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="6 12 34 56 78"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="bh-field">
                <label style={labelStyle}>
                  Nombre de biens <span className="req">*</span>
                </label>
                <select
                  required
                  value={numberOfProperties}
                  onChange={(e) => setNumberOfProperties(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Sélectionnez...</option>
                  {PROPERTY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="bh-form-foot next" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? 'Envoi en cours…' : mode === 'pm' ? 'Continuer → choix du créneau' : 'Continuer → vos biens'}
              </button>
            </form>
          )}

          {/* STEP 2 PM — calendrier RDV */}
          {step === 2 && mode === 'pm' && (
            <div>
              {bookingChecking && (
                <p style={{ textAlign: 'center', color: 'var(--ink3)', padding: 40 }}>Chargement des disponibilités…</p>
              )}
              {!bookingChecking && bookingNoAgent && (
                <div>
                  <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink2)', marginBottom: 20 }}>{bookingNoAgent}</p>
                  <button type="button" className="bh-form-foot next" style={{ width: '100%' }} onClick={skipBookingNoAgent}>
                    Continuer sans créneau →
                  </button>
                </div>
              )}
              {!bookingChecking && bookingWeek && (
                <>
                  <div className="bh-booking-agent">
                    👤 {bookingWeek.agent.firstName} {bookingWeek.agent.lastName}
                  </div>
                  <p className="bh-fp-sub">Choisissez un jour puis un horaire (30 min)</p>
                  <div className="bh-cal-days">
                    {bookingWeek.days.map((d) => {
                      const active = selectedDateYmd === d.date;
                      const full = d.slots.length === 0;
                      return (
                        <button
                          key={d.date}
                          type="button"
                          className={`bh-cal-day ${active ? 'active' : ''} ${full ? 'full' : ''}`}
                          onClick={() => {
                            if (!full) {
                              setSelectedDateYmd(d.date);
                              setSelectedSlot(null);
                            }
                          }}
                        >
                          <span className="lbl">{d.label}</span>
                          <span className="cnt">{full ? 'Complet' : `${d.slots.length} libre${d.slots.length > 1 ? 's' : ''}`}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedDateYmd && (
                    <div className="bh-slots-wrap">
                      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Créneaux disponibles</p>
                      <div className="bh-slots">
                        {(bookingWeek.days.find((x) => x.date === selectedDateYmd)?.slots || []).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className={`bh-slot ${selectedSlot?.id === s.id ? 'active' : ''}`}
                            onClick={() =>
                              setSelectedSlot({
                                id: s.id,
                                startTime: s.startTime,
                                endTime: s.endTime,
                                date: selectedDateYmd,
                              })
                            }
                          >
                            {s.startTime} – {s.endTime}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="bh-form-foot next"
                    style={{ width: '100%', marginTop: 20 }}
                    disabled={loading || !selectedSlot}
                    onClick={confirmSlot}
                  >
                    {loading ? 'Confirmation…' : 'Confirmer ce créneau →'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* STEP 2 OWNER — qualification proprio */}
          {step === 2 && mode === 'owner' && (
            <form onSubmit={submitOwnerQualify}>
              <div className="bh-fp-title">Vos biens</div>
              <div className="bh-fp-sub">Pour vous matcher avec le bon PM partenaire.</div>
              <div className="bh-field">
                <label style={labelStyle}>Nom complet *</label>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
              </div>
              <div className="bh-field">
                <label style={labelStyle}>Ville principale</label>
                <select value={propertyCity} onChange={(e) => setPropertyCity(e.target.value)} style={inputStyle}>
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="bh-field">
                <label style={labelStyle}>Type de biens</label>
                <ChipSelect options={OWNER_TYPES} selected={propertyTypes} onChange={setPropertyTypes} />
              </div>
              <div className="bh-field">
                <label style={labelStyle}>Statut actuel</label>
                <ChipSelect
                  options={['Géré moi-même', 'Avec un PM', 'Vacant']}
                  selected={managementStatus}
                  onChange={setManagementStatus}
                  multi={false}
                />
              </div>
              <div className="bh-field">
                <label style={labelStyle}>Que recherchez-vous ?</label>
                <textarea value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} style={inputStyle} rows={3} />
              </div>
              <div className="bh-field">
                <label style={labelStyle}>Échéance</label>
                <select value={timeline} onChange={(e) => setTimeline(e.target.value)} style={inputStyle}>
                  <option value="immediate">Immédiate</option>
                  <option value="1-3_months">1 à 3 mois</option>
                  <option value="3-6_months">3 à 6 mois</option>
                  <option value="exploring">Je me renseigne</option>
                </select>
              </div>
              <button type="submit" className="bh-form-foot next" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Envoi…' : 'Envoyer ma demande ✓'}
              </button>
            </form>
          )}

          {/* STEP 3 PM — qualification enrichie */}
          {step === 3 && mode === 'pm' && (
            <form onSubmit={submitPmQualify}>
              <div className="bh-fp-title">Votre profil PM</div>
              <div className="bh-fp-sub">Pour personnaliser votre accès Orchestrator.</div>
              <div className="bh-field">
                <label style={labelStyle}>Nom complet *</label>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
              </div>
              <div className="bh-field">
                <label style={labelStyle}>Société / marque *</label>
                <input required value={company} onChange={(e) => setCompany(e.target.value)} style={inputStyle} />
              </div>
              <div className="bh-field-row">
                <div className="bh-field">
                  <label style={labelStyle}>Ville principale</label>
                  <select value={cityRegion} onChange={(e) => setCityRegion(e.target.value)} style={inputStyle}>
                    {CITIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="bh-field">
                  <label style={labelStyle}>PMS actuel</label>
                  <input value={currentPMS} onChange={(e) => setCurrentPMS(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div className="bh-field">
                <label style={labelStyle}>Channel manager</label>
                <input value={currentChannelManager} onChange={(e) => setCurrentChannelManager(e.target.value)} style={inputStyle} />
              </div>
              <div className="bh-field">
                <label style={labelStyle}>Outils actuels</label>
                <ChipSelect options={PM_TOOLS} selected={currentTools} onChange={setCurrentTools} />
              </div>
              <div className="bh-field">
                <label style={labelStyle}>Principaux défis</label>
                <textarea value={biggestChallenges} onChange={(e) => setBiggestChallenges(e.target.value)} style={inputStyle} rows={2} />
              </div>
              <div className="bh-field">
                <label style={labelStyle}>Attentes</label>
                <textarea value={expectations} onChange={(e) => setExpectations(e.target.value)} style={inputStyle} rows={2} />
              </div>
              <button type="submit" className="bh-form-foot next" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Envoi…' : 'Terminer ✓'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
