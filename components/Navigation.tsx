'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchTenantPublic, getTenantSlug, type TenantPublic } from '@/lib/tenantPreview';
import { useWishlistStore } from '@/lib/store/useBookingStore';
import { UserButton, useUser } from '@clerk/nextjs';
import { CurrencySelector } from '@/components/CurrencySelector';
import { AuthButtons } from '@/components/auth/AuthButtons';
import { clerkAppearance } from '@/lib/clerk/appearance';
import styles from './Navigation.module.css';

export function Navigation() {
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const { isSignedIn, user } = useUser();

  const [tenant, setTenant] = useState<TenantPublic | null>(null);
  const [tenantActive, setTenantActive] = useState(false);
  useEffect(() => {
    const slug = getTenantSlug();
    if (!slug) return;
    setTenantActive(true);
    void fetchTenantPublic(slug).then((pm) => {
      if (pm) setTenant(pm);
    });
  }, []);
  const tenantName = tenant?.directBooking?.siteName || tenant?.name || '';

  const handleLanguageSwitch = () => {
    alert('Changement de langue à venir');
  };

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.brand}>
        {tenant?.vitrineLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tenant.vitrineLogoUrl}
            alt=""
            style={{ height: 28, width: 'auto', borderRadius: 6 }}
          />
        ) : (
          <span className={styles.dot} />
        )}
        {tenant ? tenantName || 'sojori' : 'sojori'}
      </Link>

      <div className={styles.navLinks}>
        <Link href="/search">Destinations</Link>
        {!tenantActive && <Link href="/verified-hosts">Hôtes vérifiés</Link>}
        <Link href="/experiences">Expériences</Link>
        <Link href="/become-host">Devenir hôte</Link>
        {!tenantActive && (
          <a href="https://business.sojori.com" target="_blank" rel="noopener noreferrer">
            Pour les professionnels
          </a>
        )}
      </div>

      <div className={styles.navRight}>
        <button
          type="button"
          className={styles.cmdK}
          onClick={() => {
            window.location.href = '/search?ai=true';
          }}
        >
          <span>✨ Demander à Sojori AI</span>
          <kbd>⌘K</kbd>
        </button>
        <Link href="/wishlist" className={styles.iconBtn}>
          {wishlistCount > 0 ? `♥ ${wishlistCount}` : '♡'}
        </Link>
        <CurrencySelector />
        <button type="button" className={styles.iconBtn} onClick={handleLanguageSwitch}>
          🌐
        </button>

        {isSignedIn ? (
          <div className={styles.signedIn}>
            <Link href="/profile" className={styles.accountLink}>
              Mon compte
            </Link>
            <UserButton
              appearance={{
                ...clerkAppearance,
                elements: {
                  ...clerkAppearance.elements,
                  avatarBox: 'w-10 h-10',
                },
              }}
            />
          </div>
        ) : (
          <AuthButtons />
        )}
      </div>
    </nav>
  );
}
