'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/clerk/appearance';

type AuthButtonsProps = {
  /** Variante compacte pour la nav */
  variant?: 'nav' | 'inline';
};

export function AuthButtons({ variant = 'nav' }: AuthButtonsProps) {
  if (variant === 'inline') {
    return (
      <div className="auth-inline">
        <SignInButton mode="modal" appearance={clerkAppearance}>
          <button type="button" className="auth-inline-primary">
            Se connecter
          </button>
        </SignInButton>
        <SignUpButton mode="modal" appearance={clerkAppearance}>
          <button type="button" className="auth-inline-secondary">
            Créer un compte
          </button>
        </SignUpButton>
        <style jsx>{`
          .auth-inline {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .auth-inline-primary,
          .auth-inline-secondary {
            width: 100%;
            padding: 12px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
          }
          .auth-inline-primary {
            background: var(--ink);
            color: var(--paper);
            border: 0;
          }
          .auth-inline-secondary {
            background: var(--goldT);
            color: var(--ink);
            border: 1px solid var(--gold);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="auth-actions">
      <SignInButton mode="modal" appearance={clerkAppearance}>
        <button type="button" className="nav-cta">
          Se connecter
        </button>
      </SignInButton>
      <SignUpButton mode="modal" appearance={clerkAppearance}>
        <button type="button" className="nav-signup">
          Créer un compte
        </button>
      </SignUpButton>
      <style jsx>{`
        .auth-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-cta {
          padding: 9px 18px;
          background: var(--ink);
          color: var(--paper);
          font-size: 13px;
          font-weight: 600;
          border-radius: 99px;
          letter-spacing: -0.005em;
          white-space: nowrap;
          cursor: pointer;
          border: 0;
        }
        .nav-cta:hover {
          background: #1a1a1c;
        }
        .nav-signup {
          padding: 9px 14px;
          border: 1px solid var(--b);
          background: var(--card);
          color: var(--ink2);
          font-size: 13px;
          font-weight: 600;
          border-radius: 99px;
          white-space: nowrap;
          cursor: pointer;
        }
        .nav-signup:hover {
          border-color: var(--gold);
          color: var(--ink);
        }
      `}</style>
    </div>
  );
}
