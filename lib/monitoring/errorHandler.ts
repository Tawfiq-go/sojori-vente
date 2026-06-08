/**
 * Error Handling & Monitoring
 * Centralized error tracking with optional Sentry integration
 */

interface ErrorContext {
  user?: {
    id: string;
    email?: string;
  };
  page?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

class ErrorHandler {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private sentryEnabled = false; // Set to true when Sentry is configured

  /**
   * Log error to console and monitoring service
   */
  logError(error: Error, context?: ErrorContext) {
    // Always log to console in development
    if (this.isDevelopment) {
      console.error('🔴 Error:', error);
      console.error('Context:', context);
      console.trace();
    }

    // Log to Sentry in production (if configured)
    if (this.sentryEnabled && typeof window !== 'undefined') {
      this.sendToSentry(error, context);
    }

    // Log to backend monitoring
    this.sendToBackend(error, context);

    // Store in localStorage for debugging
    this.storeInLocalStorage(error, context);
  }

  /**
   * Send error to Sentry (placeholder for future integration)
   */
  private sendToSentry(error: Error, context?: ErrorContext) {
    // TODO: Integrate Sentry
    // Sentry.captureException(error, {
    //   tags: {
    //     page: context?.page,
    //     component: context?.component,
    //   },
    //   user: context?.user,
    //   extra: context?.metadata,
    // });
    console.log('[Sentry] Would send:', error.message);
  }

  /**
   * Send error to backend API
   */
  private async sendToBackend(error: Error, context?: ErrorContext) {
    try {
      const payload = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        context: {
          ...context,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
        },
      };

      // TODO: Send to backend logging endpoint
      // await fetch('/api/v1/logs/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });

      if (this.isDevelopment) {
        console.log('[Backend] Would send error log:', payload);
      }
    } catch (err) {
      console.error('Failed to send error to backend:', err);
    }
  }

  /**
   * Store error in localStorage for debugging
   */
  private storeInLocalStorage(error: Error, context?: ErrorContext) {
    if (typeof window === 'undefined') return;

    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        context,
      };

      const existingLogs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      existingLogs.push(errorLog);

      // Keep only last 50 errors
      if (existingLogs.length > 50) {
        existingLogs.shift();
      }

      localStorage.setItem('error_logs', JSON.stringify(existingLogs));
    } catch (err) {
      console.error('Failed to store error in localStorage:', err);
    }
  }

  /**
   * Log warning (non-critical error)
   */
  logWarning(message: string, context?: ErrorContext) {
    console.warn('⚠️ Warning:', message, context);

    if (typeof window !== 'undefined') {
      const warningLog = {
        timestamp: new Date().toISOString(),
        message,
        context,
      };

      const existingWarnings = JSON.parse(localStorage.getItem('warning_logs') || '[]');
      existingWarnings.push(warningLog);

      if (existingWarnings.length > 100) {
        existingWarnings.shift();
      }

      localStorage.setItem('warning_logs', JSON.stringify(existingWarnings));
    }
  }

  /**
   * Log info (tracking user actions)
   */
  logInfo(message: string, metadata?: Record<string, unknown>) {
    if (this.isDevelopment) {
      console.log('ℹ️ Info:', message, metadata);
    }

    // TODO: Send to analytics
    // analytics.track(message, metadata);
  }

  /**
   * Get error logs from localStorage
   */
  getErrorLogs(): Array<{
    timestamp: string;
    message: string;
    stack?: string;
    context?: ErrorContext;
  }> {
    if (typeof window === 'undefined') return [];

    try {
      return JSON.parse(localStorage.getItem('error_logs') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Clear error logs
   */
  clearErrorLogs() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('error_logs');
      localStorage.removeItem('warning_logs');
    }
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

/**
 * React Error Boundary Helper
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return class ErrorBoundary extends React.Component<P, { hasError: boolean }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error: Error) {
      return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      errorHandler.logError(error, {
        component: componentName,
        metadata: { errorInfo },
      });
    }

    render() {
      if (this.state.hasError) {
        return (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <h2>Une erreur est survenue</h2>
            <p>Nous travaillons à résoudre ce problème.</p>
            <button onClick={() => this.setState({ hasError: false })}>Réessayer</button>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
}

/**
 * Global error handler for uncaught errors
 */
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorHandler.logError(event.error, {
      page: window.location.pathname,
      metadata: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.logError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
      page: window.location.pathname,
    });
  });
}
