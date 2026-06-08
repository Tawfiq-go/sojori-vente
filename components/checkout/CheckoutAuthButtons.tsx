'use client';

import { useEffect } from 'react';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/clerk/appearance';

const CHECKOUT_RETURN_KEY = 'sojori_checkout_return_url';

type CheckoutAuthButtonsProps = {
  returnUrl: string;
  mode: 'login' | 'signup';
};

const redirectProps = (returnUrl: string) => ({
  forceRedirectUrl: returnUrl,
  fallbackRedirectUrl: returnUrl,
  signUpForceRedirectUrl: returnUrl,
  signUpFallbackRedirectUrl: returnUrl,
  signInForceRedirectUrl: returnUrl,
  signInFallbackRedirectUrl: returnUrl,
});

export function CheckoutAuthButtons({ returnUrl, mode }: CheckoutAuthButtonsProps) {
  useEffect(() => {
    try {
      sessionStorage.setItem(CHECKOUT_RETURN_KEY, returnUrl);
    } catch {
      /* ignore storage errors */
    }
  }, [returnUrl]);

  if (mode === 'login') {
    return (
      <div className="checkout-auth">
        <SignInButton mode="modal" appearance={clerkAppearance} {...redirectProps(returnUrl)}>
          <button type="button" className="checkout-auth-primary">
            Se connecter
          </button>
        </SignInButton>
        <style jsx>{`
          .checkout-auth {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .checkout-auth-primary {
            width: 100%;
            padding: 12px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            background: var(--ink);
            color: var(--paper);
            border: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="checkout-auth">
      <SignUpButton mode="modal" appearance={clerkAppearance} {...redirectProps(returnUrl)}>
        <button type="button" className="checkout-auth-primary">
          Créer un compte
        </button>
      </SignUpButton>
      <style jsx>{`
        .checkout-auth {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .checkout-auth-primary {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          background: var(--goldT);
          color: var(--ink);
          border: 1px solid var(--gold);
        }
      `}</style>
    </div>
  );
}
