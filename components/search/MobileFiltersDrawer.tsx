'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './MobileFiltersDrawer.module.css';

type MobileFiltersDrawerProps = {
  open: boolean;
  onClose: () => void;
  activeCount: number;
  resultCount: number;
  children: React.ReactNode;
};

export default function MobileFiltersDrawer({
  open,
  onClose,
  activeCount,
  resultCount,
  children,
}: MobileFiltersDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className={styles.root}>
      <button type="button" className={styles.backdrop} aria-label="Fermer" onClick={onClose} />
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="Filtres">
        <div className={styles.handle} />
        <header className={styles.header}>
          <div>
            <h2 className={styles.title}>Filtres</h2>
            {activeCount > 0 && (
              <span className={styles.badge}>{activeCount} actif{activeCount > 1 ? 's' : ''}</span>
            )}
          </div>
          <button type="button" className={styles.close} onClick={onClose}>
            ×
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        <footer className={styles.footer}>
          <button type="button" className={styles.showBtn} onClick={onClose}>
            Voir {resultCount} séjour{resultCount !== 1 ? 's' : ''}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
