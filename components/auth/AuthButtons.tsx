'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/clerk/appearance';
import styles from './AuthButtons.module.css';

type AuthButtonsProps = {
  variant?: 'nav' | 'inline';
};

export function AuthButtons({ variant = 'nav' }: AuthButtonsProps) {
  if (variant === 'inline') {
    return (
      <div className={styles.authInline}>
        <SignInButton mode="modal" appearance={clerkAppearance}>
          <button type="button" className={styles.authInlinePrimary}>
            Se connecter
          </button>
        </SignInButton>
        <SignUpButton mode="modal" appearance={clerkAppearance}>
          <button type="button" className={styles.authInlineSecondary}>
            Créer un compte
          </button>
        </SignUpButton>
      </div>
    );
  }

  return (
    <div className={styles.authActions}>
      <SignInButton mode="modal" appearance={clerkAppearance}>
        <button type="button" className={styles.navCta}>
          Se connecter
        </button>
      </SignInButton>
      <SignUpButton mode="modal" appearance={clerkAppearance}>
        <button type="button" className={styles.navSignup}>
          Créer un compte
        </button>
      </SignUpButton>
    </div>
  );
}
