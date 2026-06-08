'use client';

import styles from './GuestPicker.module.css';

export type GuestCounts = {
  adults: number;
  children: number;
  infants: number;
  pets: number;
};

type GuestPickerProps = {
  value: GuestCounts;
  onChange: (value: GuestCounts) => void;
  onClose?: () => void;
};

function CounterRow({
  title,
  subtitle,
  value,
  min,
  max,
  onDecrement,
  onIncrement,
}: {
  title: string;
  subtitle?: string;
  value: number;
  min: number;
  max: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  const canDec = value > min;
  const canInc = value < max;

  return (
    <div className={styles.row}>
      <div className={styles.rowLabel}>
        <div className={styles.rowTitle}>{title}</div>
        {subtitle && <div className={styles.rowSub}>{subtitle}</div>}
      </div>
      <div className={styles.counter}>
        <button type="button" className={styles.btn} disabled={!canDec} onClick={onDecrement}>
          −
        </button>
        <span className={styles.val}>{value}</span>
        <button type="button" className={styles.btn} disabled={!canInc} onClick={onIncrement}>
          +
        </button>
      </div>
    </div>
  );
}

export function formatGuestSummary(value: GuestCounts): string {
  const { adults, children, infants, pets } = value;
  const total = adults + children;
  const parts: string[] = [];

  if (children > 0 || infants > 0 || pets > 0) {
    parts.push(`${adults} adulte${adults > 1 ? 's' : ''}`);
    if (children > 0) parts.push(`${children} enfant${children > 1 ? 's' : ''}`);
    if (infants > 0) parts.push(`${infants} bébé${infants > 1 ? 's' : ''}`);
    if (pets > 0) parts.push(`${pets} animal${pets > 1 ? 'aux' : ''}`);
    return parts.join(', ');
  }

  return `${total} voyageur${total > 1 ? 's' : ''}`;
}

export default function GuestPicker({ value, onChange, onClose }: GuestPickerProps) {
  const set = (patch: Partial<GuestCounts>) => onChange({ ...value, ...patch });

  return (
    <div className={styles.wrap}>
      <CounterRow
        title="Voyageurs"
        subtitle="13 ans et plus"
        value={value.adults}
        min={1}
        max={16}
        onDecrement={() => set({ adults: Math.max(1, value.adults - 1) })}
        onIncrement={() => set({ adults: Math.min(16, value.adults + 1) })}
      />
      <CounterRow
        title="Enfants"
        subtitle="De 2 à 12 ans"
        value={value.children}
        min={0}
        max={15}
        onDecrement={() => set({ children: Math.max(0, value.children - 1) })}
        onIncrement={() => set({ children: Math.min(15, value.children + 1) })}
      />
      <CounterRow
        title="Bébés"
        subtitle="Moins de 2 ans"
        value={value.infants}
        min={0}
        max={5}
        onDecrement={() => set({ infants: Math.max(0, value.infants - 1) })}
        onIncrement={() => set({ infants: Math.min(5, value.infants + 1) })}
      />
      <CounterRow
        title="Animaux domestiques"
        value={value.pets}
        min={0}
        max={5}
        onDecrement={() => set({ pets: Math.max(0, value.pets - 1) })}
        onIncrement={() => set({ pets: Math.min(5, value.pets + 1) })}
      />
      {onClose && (
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          Fermer
        </button>
      )}
    </div>
  );
}
