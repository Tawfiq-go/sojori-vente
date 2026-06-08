import { SignIn } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/clerk/appearance';

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--paper) 0%, var(--paper-cream) 100%)',
        padding: '40px 20px',
      }}
    >
      <div>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '42px',
              fontWeight: '400',
              letterSpacing: '-0.02em',
              marginBottom: '12px',
            }}
          >
            Bienvenue sur <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Sojori</span>
          </h1>
          <p style={{ color: 'var(--ink3)', fontSize: '15px' }}>
            Connectez-vous pour gérer vos réservations et favoris
          </p>
        </div>
        <SignIn
          routing="hash"
          signUpUrl="/signup"
          forceRedirectUrl="/"
          fallbackRedirectUrl="/"
          appearance={{
            ...clerkAppearance,
            elements: {
              ...clerkAppearance.elements,
              rootBox: 'mx-auto',
              card: 'shadow-xl rounded-2xl border border-[#e9e3d3]',
            },
          }}
        />
      </div>
    </div>
  );
}
