'use client';

import { useMemo } from 'react';
import styles from './PriceRangeSlider.module.css';

type PriceRangeSliderProps = {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  histogram?: number[];
};

function formatMad(n: number) {
  return `${n.toLocaleString('fr-FR')} MAD`;
}

export default function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  histogram = [],
}: PriceRangeSliderProps) {
  const [lo, hi] = value;
  const span = Math.max(max - min, 1);

  const fillLeft = ((lo - min) / span) * 100;
  const fillWidth = ((hi - lo) / span) * 100;

  const bars = useMemo(() => {
    if (histogram.length) return histogram;
    return Array.from({ length: 24 }, (_, i) => 20 + Math.round(40 * Math.sin(i * 0.45) ** 2));
  }, [histogram]);

  const maxBar = Math.max(...bars, 1);

  return (
    <div className={styles.wrap}>
      <div className={styles.hist}>
        {bars.map((h, i) => {
          const barCenter = min + ((i + 0.5) / bars.length) * span;
          const inRange = barCenter >= lo && barCenter <= hi;
          return (
            <span
              key={i}
              className={`${styles.bar} ${inRange ? styles.barOn : ''}`}
              style={{ height: `${Math.max(12, (h / maxBar) * 100)}%` }}
            />
          );
        })}
      </div>

      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={50}
          value={lo}
          className={styles.thumbLo}
          onChange={(e) => {
            const next = Math.min(Number(e.target.value), hi - 50);
            onChange([Math.max(min, next), hi]);
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={50}
          value={hi}
          className={styles.thumbHi}
          onChange={(e) => {
            const next = Math.max(Number(e.target.value), lo + 50);
            onChange([lo, Math.min(max, next)]);
          }}
        />
      </div>

      <div className={styles.labels}>
        <span>{formatMad(lo)}</span>
        <span className={styles.median}>par nuit</span>
        <span>{formatMad(hi)}</span>
      </div>
    </div>
  );
}
