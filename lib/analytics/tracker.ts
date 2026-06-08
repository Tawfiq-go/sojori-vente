/**
 * Analytics Tracker
 * Centralized tracking for user events
 */

interface TrackEventParams {
  event: string;
  category?: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

interface PageViewParams {
  path: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

class Analytics {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private gaEnabled = false; // Set to true when GA is configured
  private plausibleEnabled = false; // Alternative to GA

  /**
   * Track page view
   */
  trackPageView({ path, title, metadata }: PageViewParams) {
    if (this.isDevelopment) {
      console.log('📊 [Analytics] Page View:', { path, title, metadata });
    }

    // Google Analytics
    if (this.gaEnabled && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: path,
        page_title: title,
        ...metadata,
      });
    }

    // Plausible Analytics (privacy-friendly alternative)
    if (this.plausibleEnabled && typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('pageview', {
        url: path,
        ...metadata,
      });
    }
  }

  /**
   * Track custom event
   */
  trackEvent({ event, category, label, value, metadata }: TrackEventParams) {
    if (this.isDevelopment) {
      console.log('📊 [Analytics] Event:', { event, category, label, value, metadata });
    }

    // Google Analytics
    if (this.gaEnabled && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, {
        event_category: category,
        event_label: label,
        value: value,
        ...metadata,
      });
    }

    // Plausible Analytics
    if (this.plausibleEnabled && typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible(event, {
        props: { category, label, value, ...metadata },
      });
    }

    // Store in localStorage for debugging
    this.storeEvent({ event, category, label, value, metadata });
  }

  /**
   * Track user actions
   */
  trackUserAction(action: string, metadata?: Record<string, unknown>) {
    this.trackEvent({
      event: 'user_action',
      category: 'engagement',
      label: action,
      metadata,
    });
  }

  /**
   * Track search
   */
  trackSearch(query: string, filters?: Record<string, unknown>) {
    this.trackEvent({
      event: 'search',
      category: 'search',
      label: query,
      metadata: filters,
    });
  }

  /**
   * Track listing view
   */
  trackListingView(listingId: string, listingTitle?: string) {
    this.trackEvent({
      event: 'view_listing',
      category: 'listings',
      label: listingTitle,
      metadata: { listingId },
    });
  }

  /**
   * Track booking initiation
   */
  trackBookingStart(listingId: string, checkIn: string, checkOut: string) {
    this.trackEvent({
      event: 'begin_checkout',
      category: 'booking',
      metadata: {
        listingId,
        checkIn,
        checkOut,
      },
    });
  }

  /**
   * Track booking completion
   */
  trackBookingComplete(bookingId: string, totalPrice: number, currency: string) {
    this.trackEvent({
      event: 'purchase',
      category: 'booking',
      value: totalPrice,
      metadata: {
        bookingId,
        currency,
        transaction_id: bookingId,
      },
    });

    // Enhanced e-commerce tracking (GA4)
    if (this.gaEnabled && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'purchase', {
        transaction_id: bookingId,
        value: totalPrice,
        currency: currency,
      });
    }
  }

  /**
   * Track wishlist actions
   */
  trackWishlistAdd(listingId: string) {
    this.trackEvent({
      event: 'add_to_wishlist',
      category: 'wishlist',
      metadata: { listingId },
    });
  }

  trackWishlistRemove(listingId: string) {
    this.trackEvent({
      event: 'remove_from_wishlist',
      category: 'wishlist',
      metadata: { listingId },
    });
  }

  /**
   * Track AI interactions
   */
  trackAISearch(query: string, resultsCount: number) {
    this.trackEvent({
      event: 'ai_search',
      category: 'ai',
      label: query,
      value: resultsCount,
    });
  }

  /**
   * Track form submissions
   */
  trackFormSubmit(formName: string, metadata?: Record<string, unknown>) {
    this.trackEvent({
      event: 'form_submit',
      category: 'forms',
      label: formName,
      metadata,
    });
  }

  /**
   * Track errors
   */
  trackError(errorMessage: string, context?: Record<string, unknown>) {
    this.trackEvent({
      event: 'error',
      category: 'errors',
      label: errorMessage,
      metadata: context,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metricName: string, value: number, metadata?: Record<string, unknown>) {
    this.trackEvent({
      event: 'performance_metric',
      category: 'performance',
      label: metricName,
      value: Math.round(value),
      metadata,
    });
  }

  /**
   * Store event in localStorage for debugging
   */
  private storeEvent(event: TrackEventParams) {
    if (typeof window === 'undefined') return;

    try {
      const eventLog = {
        timestamp: new Date().toISOString(),
        ...event,
      };

      const existingEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      existingEvents.push(eventLog);

      // Keep only last 100 events
      if (existingEvents.length > 100) {
        existingEvents.shift();
      }

      localStorage.setItem('analytics_events', JSON.stringify(existingEvents));
    } catch (err) {
      console.error('Failed to store analytics event:', err);
    }
  }

  /**
   * Get analytics events from localStorage
   */
  getEvents(): TrackEventParams[] {
    if (typeof window === 'undefined') return [];

    try {
      return JSON.parse(localStorage.getItem('analytics_events') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Clear analytics events
   */
  clearEvents() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('analytics_events');
    }
  }

  /**
   * Track Core Web Vitals
   */
  trackWebVitals(metric: {
    name: string;
    value: number;
    id: string;
    rating?: 'good' | 'needs-improvement' | 'poor';
  }) {
    this.trackPerformance(metric.name, metric.value, {
      id: metric.id,
      rating: metric.rating,
    });
  }
}

// Export singleton instance
export const analytics = new Analytics();

/**
 * Hook for tracking page views in Next.js
 */
export function usePageTracking() {
  if (typeof window === 'undefined') return;

  // Track page view on mount
  React.useEffect(() => {
    analytics.trackPageView({
      path: window.location.pathname,
      title: document.title,
    });
  }, []);
}

/**
 * Helper to track link clicks
 */
export function trackLinkClick(linkText: string, href: string) {
  analytics.trackUserAction('link_click', {
    linkText,
    href,
  });
}

/**
 * Helper to track button clicks
 */
export function trackButtonClick(buttonName: string, metadata?: Record<string, unknown>) {
  analytics.trackUserAction('button_click', {
    buttonName,
    ...metadata,
  });
}
