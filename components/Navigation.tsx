'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWishlistStore } from '@/lib/store/useBookingStore';

export function Navigation() {
  const pathname = usePathname();
  const wishlistCount = useWishlistStore((state) => state.items.length);

  return (
    <nav className="nav">
      <Link href="/" className="brand">
        <span className="dot"></span>
        sojori
      </Link>

      <div className="nav-links">
        <Link href="/">Accueil</Link>
        <Link href="/search">Explorer</Link>
        <Link href="/about">À propos</Link>
        <Link href="/pms">Property Managers</Link>
      </div>

      <div className="nav-right">
        <div className="lang-chip">FR</div>
        <button className="cmd-k">
          <span>✨ AI Search</span>
          <kbd>⌘K</kbd>
        </button>
        <Link href="/wishlist" className="icon-btn">
          {wishlistCount > 0 ? `♥ ${wishlistCount}` : '♡'}
        </Link>
        <Link href="/account" className="nav-cta">
          Mon compte
        </Link>
      </div>

      <style jsx>{`
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 18px 32px;
          display: flex;
          align-items: center;
          gap: 22px;
          background: rgba(250, 247, 240, 0.8);
          backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(233, 227, 211, 0.5);
          transition: padding 0.2s;
        }

        .nav.scrolled {
          padding: 12px 32px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--serif);
          font-size: 26px;
          font-weight: 400;
          letter-spacing: -0.025em;
          font-style: italic;
        }

        .brand .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--gold);
          box-shadow: 0 0 12px var(--gold);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 28px;
          margin-left: 32px;
          font-size: 13px;
          font-weight: 500;
          color: var(--ink2);
        }

        .nav-links a:hover {
          color: var(--ink);
        }

        .nav-right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .lang-chip {
          font-family: var(--mono);
          font-size: 11px;
          font-weight: 700;
          color: var(--ink2);
          padding: 7px 11px;
          border: 1px solid var(--b);
          border-radius: 99px;
          letter-spacing: 0.04em;
        }

        .cmd-k {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: var(--card);
          border: 1px solid var(--b);
          border-radius: 99px;
          font-size: 12px;
          color: var(--ink3);
          cursor: pointer;
          transition: all 0.15s;
        }

        .cmd-k:hover {
          border-color: var(--gold);
          color: var(--gold);
        }

        .cmd-k kbd {
          font-family: var(--mono);
          font-size: 10px;
          background: var(--paper2);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--ink2);
          font-weight: 700;
          border: 1px solid var(--b);
        }

        .nav-cta {
          padding: 9px 18px;
          background: var(--ink);
          color: var(--paper);
          font-size: 13px;
          font-weight: 600;
          border-radius: 99px;
          letter-spacing: -0.005em;
        }

        .nav-cta:hover {
          background: #1a1a1c;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--b);
          background: var(--card);
          font-size: 14px;
          transition: all 0.15s;
        }

        .icon-btn:hover {
          border-color: var(--ink2);
        }

        @media (max-width: 900px) {
          .nav-links {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}
