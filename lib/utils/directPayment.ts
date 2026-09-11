export type DirectPaymentMethodId = 'card' | 'wire' | 'cash';

export interface PublicDirectPaymentWire {
  iban?: string;
  bic?: string;
  holder?: string;
  bankName?: string;
}

export interface PublicMethodPartialPayment {
  enabled?: boolean;
  depositPercent?: number;
  allowFullPayment?: boolean;
}

export interface PublicDirectPayment {
  methods?: DirectPaymentMethodId[];
  cashForReturningOnly?: boolean;
  wire?: PublicDirectPaymentWire | null;
  partialPayment?: {
    card?: PublicMethodPartialPayment;
    wire?: PublicMethodPartialPayment;
  };
}

const DEFAULT_METHODS: DirectPaymentMethodId[] = ['card', 'wire', 'cash'];

function normalizePartialMethod(input?: PublicMethodPartialPayment | null, legacy?: PublicMethodPartialPayment | null) {
  const src = input && Object.keys(input).length ? input : legacy || {};
  return {
    enabled: src.enabled === true,
    depositPercent: src.depositPercent ?? 20,
    allowFullPayment: src.allowFullPayment !== false,
  };
}

export function resolvePublicDirectPayment(input?: PublicDirectPayment | null) {
  const methods = (input?.methods || DEFAULT_METHODS).filter((m): m is DirectPaymentMethodId =>
    ['card', 'wire', 'cash'].includes(m),
  );
  const partialRaw = input?.partialPayment;
  const legacyPartial =
    partialRaw?.enabled !== undefined && !partialRaw?.card && !partialRaw?.wire ? partialRaw : null;
  return {
    methods: methods.length ? methods : [...DEFAULT_METHODS],
    cashForReturningOnly: input?.cashForReturningOnly === true,
    wire: input?.wire?.iban
      ? {
          iban: input.wire.iban,
          bic: input.wire.bic,
          holder: input.wire.holder,
          bankName: input.wire.bankName,
        }
      : null,
    partialPayment: {
      card: normalizePartialMethod(partialRaw?.card, legacyPartial),
      wire: normalizePartialMethod(partialRaw?.wire),
    },
  };
}

export function resolvePartialForUiMethod(
  cfg: ReturnType<typeof resolvePublicDirectPayment>,
  paymentMethod: 'card' | 'transfer' | 'cash',
) {
  if (paymentMethod === 'card') return cfg.partialPayment.card;
  if (paymentMethod === 'transfer') return cfg.partialPayment.wire;
  return { enabled: false, depositPercent: 20, allowFullPayment: true };
}

export function computeCheckoutAmount(
  total: number,
  cfg: ReturnType<typeof resolvePublicDirectPayment>,
  payMode: 'full' | 'deposit',
  paymentMethod: 'card' | 'transfer' | 'cash' = 'card',
): number {
  const roundedTotal = Math.round(total * 100) / 100;
  if (payMode !== 'deposit') return roundedTotal;

  const partial = resolvePartialForUiMethod(cfg, paymentMethod);
  if (!partial.enabled) return roundedTotal;

  const pct = partial.depositPercent ?? 20;
  const deposit = Math.round(((roundedTotal * pct) / 100) * 100) / 100;
  return Math.min(roundedTotal, Math.max(0.01, deposit));
}

export function mapUiPaymentToApi(method: 'card' | 'transfer' | 'cash') {
  if (method === 'transfer') return 'bank_transfer' as const;
  if (method === 'cash') return 'cash' as const;
  return 'card' as const;
}

export function formatWireInstructions(wire: PublicDirectPaymentWire): string {
  const lines: string[] = [];
  if (wire.bankName) lines.push(wire.bankName);
  if (wire.holder) lines.push(`Titulaire : ${wire.holder}`);
  lines.push(`IBAN : ${wire.iban}`);
  if (wire.bic) lines.push(`BIC : ${wire.bic}`);
  return lines.join('\n');
}
