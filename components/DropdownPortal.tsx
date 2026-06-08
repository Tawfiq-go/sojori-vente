'use client';

import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

interface DropdownPortalProps {
  children: ReactNode;
  triggerRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
  alignment?: 'left' | 'center' | 'right';
}

/**
 * Dropdown via portal + position:fixed (évite overflow:hidden des parents).
 */
export function DropdownPortal({
  children,
  triggerRef,
  isOpen,
  onClose,
  alignment = 'left',
}: DropdownPortalProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const trigger = triggerRef.current;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        trigger &&
        !trigger.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, triggerRef]);

  const trigger = triggerRef.current;
  if (!isOpen || !trigger) return null;

  const triggerRect = trigger.getBoundingClientRect();

  let left = triggerRect.left;
  if (alignment === 'center') {
    left = triggerRect.left + triggerRect.width / 2;
  } else if (alignment === 'right') {
    left = triggerRect.right;
  }

  const style: React.CSSProperties = {
    position: 'fixed',
    top: `${triggerRect.bottom + 8}px`,
    left: `${left}px`,
    transform:
      alignment === 'center'
        ? 'translateX(-50%)'
        : alignment === 'right'
          ? 'translateX(-100%)'
          : undefined,
    zIndex: 99999,
    maxHeight: '90vh',
    overflowY: 'auto',
  };

  return createPortal(
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 16, 17, 0.15)',
          backdropFilter: 'blur(2px)',
          zIndex: 99998,
        }}
        onClick={onClose}
      />
      <div ref={dropdownRef} style={style}>
        {children}
      </div>
    </>,
    document.body,
  );
}
