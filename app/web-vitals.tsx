'use client';

/**
 * Web Vitals Reporter Component
 * Automatically tracks Core Web Vitals using next/web-vitals
 */

import { useReportWebVitals } from 'next/web-vitals';
import { reportWebVitals, type WebVitalMetric } from '@/lib/performance/webVitals';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Convert Next.js metric to our format
    const webVitalMetric: WebVitalMetric = {
      name: metric.name as WebVitalMetric['name'],
      value: metric.value,
      rating: metric.rating as WebVitalMetric['rating'],
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType as WebVitalMetric['navigationType'],
    };

    reportWebVitals(webVitalMetric);
  });

  return null; // This component doesn't render anything
}
