/**
 * Become Host API — srv-crm /api/v1/become-host
 */

const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'https://dev.sojori.com';

const API = `${BASE}/api/v1/become-host`;

export type UserType = 'property_owner' | 'professional_pm';

export type BecomeHostStatus =
  | 'pending'
  | 'contacted'
  | 'qualified'
  | 'matched'
  | 'converted'
  | 'rejected';

export interface BecomeHostPayload {
  userType: UserType;
  email: string;
  phone: string;
  countryCode: string;
  numberOfProperties?: string;
  fullName?: string;
  source?: string;
  company?: string;
  numberOfPropertiesManaged?: string;
  currentPMS?: string;
  currentChannelManager?: string;
  currentTools?: string[];
  cityRegion?: string;
  numberOfPropertiesOwned?: string;
  propertyTypes?: string[];
  propertyLocations?: string[];
  currentManagementStatus?: 'self_managed' | 'with_pm' | 'vacant' | 'other';
  lookingFor?: string;
  timeline?: string;
  hearAboutUs?: string;
  biggestChallenges?: string;
  expectations?: string;
}

export type BookingDay = {
  date: string;
  label: string;
  slots: { id: string; startTime: string; endTime: string }[];
};

export type BookingWeekData = {
  agent: { id: string; firstName: string; lastName: string };
  days: BookingDay[];
};

function normalizeResponse(raw: unknown): Record<string, unknown> {
  const base = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...(raw as object) } : {};
  const o = base as Record<string, unknown>;
  if (o.success === true) return o;
  if (typeof o.error === 'string' && o.error.trim()) {
    if (o.success == null) o.success = false;
    return o;
  }
  if (typeof o.message === 'string' && o.message.trim() && !o.error) {
    o.error = o.message.trim();
    o.success = false;
  }
  return o;
}

export function apiError(o: Record<string, unknown>): string {
  if (typeof o.error === 'string' && o.error.trim()) return o.error.trim();
  if (typeof o.message === 'string' && o.message.trim()) return o.message.trim();
  return '';
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: Record<string, unknown>; status: number }> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    return { ok: false, data: { success: false, error: `HTTP ${res.status}` }, status: res.status };
  }
  return { ok: res.ok, data: normalizeResponse(raw), status: res.status };
}

export async function createBecomeHostRequest(payload: BecomeHostPayload) {
  const { ok, data } = await fetchJson(`${API}/request`, {
    method: 'POST',
    body: JSON.stringify({ ...payload, source: payload.source || 'become-host-page' }),
  });
  if (!ok || data.success !== true) {
    return { success: false as const, error: apiError(data) || 'Erreur envoi' };
  }
  return {
    success: true as const,
    data: data.data as { id: string; alreadyExists?: boolean },
  };
}

export async function fetchBecomeHostBookingWeek(becomeHostRequestId: string) {
  const qs = `?becomeHostRequestId=${encodeURIComponent(becomeHostRequestId)}`;
  const { data } = await fetchJson(`${API}/booking-week${qs}`);
  if (data.success !== true) {
    return { success: false as const, error: apiError(data) };
  }
  return { success: true as const, data: data.data as BookingWeekData | { alreadyBooked: true; appointment: unknown } | { noAgent: true; message?: string; days: [] } };
}

export async function bookBecomeHostSlot(params: {
  becomeHostRequestId: string;
  slotId: string;
  clientName?: string;
}) {
  const { data } = await fetchJson(`${API}/booking`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (data.success !== true) {
    return { success: false as const, error: apiError(data) };
  }
  return { success: true as const, data: data.data };
}

export async function qualifyBecomeHostRequest(id: string, body: Partial<BecomeHostPayload>) {
  const { data } = await fetchJson(`${API}/request/${id}/qualify`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (data.success !== true) {
    return { success: false as const, error: apiError(data) };
  }
  return { success: true as const };
}
