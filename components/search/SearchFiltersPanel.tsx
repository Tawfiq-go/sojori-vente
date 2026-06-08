'use client';

import { useMemo, useState } from 'react';
import type { PropertyManager } from '@/lib/api/client';
import {
  SEARCH_PROPERTY_TYPES,
  normalizePropertyType,
  type SearchPropertyType,
} from '@/lib/search/propertyTypes';
import type { AmenityFilterDef } from '@/lib/search/amenityFilters';
import { SEARCH_AMENITY_FILTERS } from '@/lib/search/amenityFilters';
import PriceRangeSlider from './PriceRangeSlider';
import styles from './SearchFiltersPanel.module.css';

export type SearchFiltersState = {
  selectedPMs: string[];
  selectedTypes: SearchPropertyType[];
  selectedAmenities: string[];
  minRating: number;
  priceRange: [number, number];
};

type AmenityOption = AmenityFilterDef & { count: number };

type SearchFiltersPanelProps = {
  propertyManagers: PropertyManager[];
  facetPool: Array<{ pmId?: string; propertyType?: string; amenities?: string[] }>;
  amenityOptions: AmenityOption[];
  resultCount: number;
  filters: SearchFiltersState;
  priceBounds: [number, number];
  priceHistogram?: number[];
  onChange: (patch: Partial<SearchFiltersState>) => void;
  onReset: () => void;
  variant?: 'sidebar' | 'drawer';
  hideLiveCount?: boolean;
};

type ActiveChip = { key: string; label: string; onRemove: () => void };

const PM_GRADIENTS = [
  'linear-gradient(135deg,#c89b3c,#9b7626)',
  'linear-gradient(135deg,#c4b5fd,#7c3aed)',
  'linear-gradient(135deg,#fda4af,#dc2626)',
  'linear-gradient(135deg,#a5f3fc,#0e7490)',
  'linear-gradient(135deg,#86efac,#15803d)',
];

function FilterSection({
  title,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string;
  badge?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={styles.section}>
      <button type="button" className={styles.sectionHead} onClick={() => setOpen((v) => !v)}>
        <span className={styles.sectionTitle}>
          {title}
          {badge != null && badge > 0 && <span className={styles.sectionBadge}>{badge}</span>}
        </span>
        <span className={`${styles.sectionChevron} ${open ? styles.open : ''}`}>▼</span>
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </section>
  );
}

export default function SearchFiltersPanel({
  propertyManagers,
  facetPool,
  amenityOptions,
  resultCount,
  filters,
  priceBounds,
  priceHistogram,
  onChange,
  onReset,
  variant = 'sidebar',
  hideLiveCount = false,
}: SearchFiltersPanelProps) {
  const [amSearch, setAmSearch] = useState('');
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const pmOptions = useMemo(
    () =>
      propertyManagers
        .map((pm, i) => ({
          pm,
          count: facetPool.filter((l) => l.pmId === pm.id).length,
          gradient: PM_GRADIENTS[i % PM_GRADIENTS.length],
        }))
        .filter((x) => x.count > 0 || filters.selectedPMs.includes(x.pm.id))
        .sort((a, b) => b.count - a.count),
    [propertyManagers, facetPool, filters.selectedPMs],
  );

  const typeOptions = useMemo(
    () =>
      SEARCH_PROPERTY_TYPES.map(({ key, label, emoji }) => ({
        key,
        label,
        emoji,
        count: facetPool.filter((l) => normalizePropertyType(l.propertyType) === key).length,
      })).filter((t) => t.count > 0 || filters.selectedTypes.includes(t.key)),
    [facetPool, filters.selectedTypes],
  );

  const filteredAmenities = useMemo(() => {
    const q = amSearch.trim().toLowerCase();
    let list = amenityOptions;
    if (q) list = list.filter((a) => a.label.toLowerCase().includes(q));
    return list;
  }, [amenityOptions, amSearch]);

  const visibleAmenities = showAllAmenities ? filteredAmenities : filteredAmenities.slice(0, 12);
  const hiddenAmenityCount = Math.max(0, filteredAmenities.length - 12);

  const priceActive =
    filters.priceRange[0] > priceBounds[0] || filters.priceRange[1] < priceBounds[1];

  const activeCount =
    filters.selectedPMs.length +
    filters.selectedTypes.length +
    filters.selectedAmenities.length +
    (filters.minRating > 0 ? 1 : 0) +
    (priceActive ? 1 : 0);

  const activeChips: ActiveChip[] = useMemo(() => {
    const chips: ActiveChip[] = [];
    for (const id of filters.selectedPMs) {
      const pm = propertyManagers.find((p) => p.id === id);
      if (pm) {
        chips.push({
          key: `pm-${id}`,
          label: pm.name,
          onRemove: () =>
            onChange({ selectedPMs: filters.selectedPMs.filter((x) => x !== id) }),
        });
      }
    }
    for (const key of filters.selectedTypes) {
      const t = SEARCH_PROPERTY_TYPES.find((x) => x.key === key);
      if (t) {
        chips.push({
          key: `type-${key}`,
          label: t.label,
          onRemove: () =>
            onChange({ selectedTypes: filters.selectedTypes.filter((x) => x !== key) }),
        });
      }
    }
    for (const key of filters.selectedAmenities) {
      const a = amenityOptions.find((x) => x.key === key);
      chips.push({
        key: `am-${key}`,
        label: a?.label || key,
        onRemove: () =>
          onChange({ selectedAmenities: filters.selectedAmenities.filter((x) => x !== key) }),
      });
    }
    if (filters.minRating > 0) {
      chips.push({
        key: 'rating',
        label: `${filters.minRating}+ ★`,
        onRemove: () => onChange({ minRating: 0 }),
      });
    }
    if (priceActive) {
      chips.push({
        key: 'price',
        label: `${filters.priceRange[0].toLocaleString('fr-FR')}–${filters.priceRange[1].toLocaleString('fr-FR')} MAD`,
        onRemove: () => onChange({ priceRange: priceBounds }),
      });
    }
    return chips;
  }, [filters, propertyManagers, amenityOptions, onChange, priceActive, priceBounds]);

  const togglePm = (id: string) => {
    const on = filters.selectedPMs.includes(id);
    onChange({
      selectedPMs: on ? filters.selectedPMs.filter((x) => x !== id) : [...filters.selectedPMs, id],
    });
  };

  const toggleType = (key: SearchPropertyType) => {
    const on = filters.selectedTypes.includes(key);
    onChange({
      selectedTypes: on
        ? filters.selectedTypes.filter((x) => x !== key)
        : [...filters.selectedTypes, key],
    });
  };

  const toggleAmenity = (key: string) => {
    const on = filters.selectedAmenities.includes(key);
    onChange({
      selectedAmenities: on
        ? filters.selectedAmenities.filter((x) => x !== key)
        : [...filters.selectedAmenities, key],
    });
  };

  const topQuickAmenities = amenityOptions
    .filter((a) => a.count > 0)
    .slice(0, 4);

  // Si aucun count > 0, proposer quand même les 4 filtres standards les plus utiles
  const quickAmenities =
    topQuickAmenities.length > 0
      ? topQuickAmenities
      : SEARCH_AMENITY_FILTERS.slice(0, 4).map((f) => ({
          ...f,
          count: amenityOptions.find((o) => o.key === f.key)?.count ?? 0,
        }));

  return (
    <aside
      className={`${styles.panel} ${variant === 'drawer' ? styles.panelDrawer : ''} ${variant === 'sidebar' ? styles.panelDesktop : ''}`}
    >
      <div className={styles.head}>
        <div>
          <h2 className={styles.headTitle}>Affiner</h2>
          <div className={styles.headMeta}>Mise à jour instantanée</div>
        </div>
        {activeCount > 0 && (
          <button type="button" className={styles.clearAll} onClick={onReset}>
            Tout effacer
          </button>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className={styles.chipsRow}>
          {activeChips.map((chip) => (
            <button key={chip.key} type="button" className={styles.chip} onClick={chip.onRemove}>
              {chip.label}
              <span className={styles.chipX}>×</span>
            </button>
          ))}
        </div>
      )}

      {quickAmenities.length > 0 && (
        <div className={styles.quickBar}>
          <div className={styles.quickLabel}>Populaires</div>
          {quickAmenities.map((a) => (
            <button
              key={a.key}
              type="button"
              className={`${styles.toggle} ${filters.selectedAmenities.includes(a.key) ? styles.on : ''}`}
              onClick={() => toggleAmenity(a.key)}
            >
              {a.emoji} {a.label}
              <span className={styles.toggleCount}>{a.count}</span>
            </button>
          ))}
        </div>
      )}

      <FilterSection title="Budget / nuit" badge={priceActive ? 1 : 0}>
        <PriceRangeSlider
          min={priceBounds[0]}
          max={priceBounds[1]}
          value={filters.priceRange}
          histogram={priceHistogram}
          onChange={(priceRange) => onChange({ priceRange })}
        />
      </FilterSection>

      {pmOptions.length > 0 && (
        <FilterSection title="Property Managers" badge={filters.selectedPMs.length}>
          <div className={styles.pmList}>
            {pmOptions.map(({ pm, count, gradient }) => {
              const on = filters.selectedPMs.includes(pm.id);
              return (
                <button
                  key={pm.id}
                  type="button"
                  className={`${styles.pmCard} ${on ? styles.on : ''}`}
                  disabled={count === 0 && !on}
                  onClick={() => togglePm(pm.id)}
                >
                  <span className={styles.pmAvatar} style={{ background: gradient }}>
                    {(pm.slug || pm.name).substring(0, 2).toUpperCase()}
                  </span>
                  <span className={styles.pmName}>{pm.name}</span>
                  <span className={styles.pmCount}>{count}</span>
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {typeOptions.length > 0 && (
        <FilterSection title="Type de bien" badge={filters.selectedTypes.length}>
          <div className={styles.toggleGrid}>
            {typeOptions.map(({ key, label, emoji, count }) => (
              <button
                key={key}
                type="button"
                className={`${styles.toggle} ${filters.selectedTypes.includes(key) ? styles.on : ''}`}
                disabled={count === 0 && !filters.selectedTypes.includes(key)}
                onClick={() => toggleType(key)}
              >
                {emoji} {label}
                <span className={styles.toggleCount}>{count}</span>
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Équipements" badge={filters.selectedAmenities.length}>
        <input
          type="search"
          className={styles.amSearch}
          placeholder="Rechercher un équipement…"
          value={amSearch}
          onChange={(e) => setAmSearch(e.target.value)}
        />
        <div className={`${styles.amGrid} ${showAllAmenities ? styles.expanded : ''}`}>
          {visibleAmenities.map((a) => (
            <button
              key={a.key}
              type="button"
              className={`${styles.toggle} ${filters.selectedAmenities.includes(a.key) ? styles.on : ''} ${a.count === 0 && !filters.selectedAmenities.includes(a.key) ? styles.toggleMuted : ''}`}
              disabled={a.count === 0 && !filters.selectedAmenities.includes(a.key)}
              onClick={() => toggleAmenity(a.key)}
            >
              {a.emoji} {a.label}
              <span className={styles.toggleCount}>{a.count}</span>
            </button>
          ))}
        </div>
        {hiddenAmenityCount > 0 && (
          <button
            type="button"
            className={styles.moreBtn}
            onClick={() => setShowAllAmenities((v) => !v)}
          >
            {showAllAmenities ? 'Afficher moins' : `+ ${hiddenAmenityCount} équipements`}
          </button>
        )}
      </FilterSection>

      <FilterSection title="Note minimum" badge={filters.minRating > 0 ? 1 : 0} defaultOpen={false}>
        <div className={styles.ratingRow}>
          {[4.0, 4.5, 4.8].map((rating) => {
            const on = filters.minRating === rating;
            return (
              <button
                key={rating}
                type="button"
                className={`${styles.ratingBtn} ${on ? styles.on : ''}`}
                onClick={() => onChange({ minRating: on ? 0 : rating })}
              >
                ★ {rating}+
              </button>
            );
          })}
        </div>
      </FilterSection>

      {!hideLiveCount && (
        <div className={styles.liveCount}>
          <b>{resultCount}</b> séjour{resultCount !== 1 ? 's' : ''} correspondant{resultCount !== 1 ? 's' : ''}
        </div>
      )}
    </aside>
  );
}
