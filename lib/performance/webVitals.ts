/**
 * Web Vitals Tracker
 * Measures Core Web Vitals for performance monitoring
 */

import { analytics } from '../analytics/tracker';

export interface WebVitalMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender';
}

/**
 * Report Web Vital metrics
 */
export function reportWebVitals(metric: WebVitalMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 [Web Vital] ${metric.name}:`, {
      value: Math.round(metric.value),
      rating: metric.rating,
      delta: Math.round(metric.delta),
    });
  }

  // Send to analytics
  analytics.trackWebVitals({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    rating: metric.rating,
  });

  // Send to backend for monitoring
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // TODO: Send to backend monitoring API
    // fetch('/api/v1/metrics/web-vitals', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     metric: metric.name,
    //     value: metric.value,
    //     rating: metric.rating,
    //     page: window.location.pathname,
    //     timestamp: new Date().toISOString(),
    //   }),
    // });
  }
}

/**
 * Get rating thresholds for each metric
 */
export function getMetricThresholds(metricName: string): { good: number; needsImprovement: number } {
  const thresholds: Record<string, { good: number; needsImprovement: number }> = {
    CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
    FID: { good: 100, needsImprovement: 300 }, // First Input Delay (ms)
    FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint (ms)
    LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint (ms)
    TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte (ms)
    INP: { good: 200, needsImprovement: 500 }, // Interaction to Next Paint (ms)
  };

  return thresholds[metricName] || { good: 0, needsImprovement: 0 };
}

/**
 * Calculate rating based on value
 */
export function calculateRating(
  metricName: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = getMetricThresholds(metricName);

  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Performance observer for custom metrics
 */
export class PerformanceMonitor {
  private observers: PerformanceObserver[] = [];

  /**
   * Monitor resource loading times
   */
  monitorResources() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;

            // Log slow resources
            if (resourceEntry.duration > 1000) {
              console.warn(`Slow resource: ${resourceEntry.name} took ${Math.round(resourceEntry.duration)}ms`);

              analytics.trackPerformance('slow_resource', resourceEntry.duration, {
                resourceName: resourceEntry.name,
                resourceType: resourceEntry.initiatorType,
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (err) {
      console.error('Failed to monitor resources:', err);
    }
  }

  /**
   * Monitor long tasks (blocking main thread)
   */
  monitorLongTasks() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const taskEntry = entry as PerformanceEntry;

          console.warn(`Long task detected: ${Math.round(taskEntry.duration)}ms`);

          analytics.trackPerformance('long_task', taskEntry.duration, {
            startTime: taskEntry.startTime,
          });
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (err) {
      // longtask not supported in all browsers
      console.debug('Long task monitoring not available');
    }
  }

  /**
   * Monitor navigation timing
   */
  monitorNavigation() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (perfData) {
        const metrics = {
          dns: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcp: perfData.connectEnd - perfData.connectStart,
          ttfb: perfData.responseStart - perfData.requestStart,
          download: perfData.responseEnd - perfData.responseStart,
          domInteractive: perfData.domInteractive - perfData.fetchStart,
          domComplete: perfData.domComplete - perfData.fetchStart,
          loadComplete: perfData.loadEventEnd - perfData.fetchStart,
        };

        console.log('📊 [Performance] Navigation Timing:', metrics);

        // Track critical metrics
        analytics.trackPerformance('ttfb', metrics.ttfb);
        analytics.trackPerformance('dom_interactive', metrics.domInteractive);
        analytics.trackPerformance('load_complete', metrics.loadComplete);
      }
    });
  }

  /**
   * Disconnect all observers
   */
  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Initialize performance monitoring
let performanceMonitor: PerformanceMonitor | null = null;

export function initializePerformanceMonitoring() {
  if (typeof window === 'undefined' || performanceMonitor) return;

  performanceMonitor = new PerformanceMonitor();
  performanceMonitor.monitorResources();
  performanceMonitor.monitorLongTasks();
  performanceMonitor.monitorNavigation();

  return performanceMonitor;
}

/**
 * Measure custom performance marks
 */
export function measurePerformance(markName: string) {
  if (typeof window === 'undefined' || !performance.mark) return;

  performance.mark(markName);

  return {
    end: (endMarkName?: string) => {
      const finalMarkName = endMarkName || `${markName}-end`;
      performance.mark(finalMarkName);

      try {
        const measureName = `${markName}-duration`;
        performance.measure(measureName, markName, finalMarkName);

        const measure = performance.getEntriesByName(measureName)[0];
        if (measure) {
          console.log(`⏱️ [Performance] ${measureName}: ${Math.round(measure.duration)}ms`);

          analytics.trackPerformance(measureName, measure.duration);

          // Clean up marks
          performance.clearMarks(markName);
          performance.clearMarks(finalMarkName);
          performance.clearMeasures(measureName);

          return measure.duration;
        }
      } catch (err) {
        console.error('Failed to measure performance:', err);
      }
    },
  };
}

/**
 * React hook for measuring component render time
 */
export function usePerformanceMeasure(componentName: string) {
  if (typeof window === 'undefined') return;

  React.useEffect(() => {
    const mark = measurePerformance(`render-${componentName}`);

    return () => {
      mark?.end();
    };
  }, [componentName]);
}
