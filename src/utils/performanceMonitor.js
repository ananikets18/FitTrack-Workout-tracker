/**
 * Performance Monitoring Utility
 * Tracks and reports Web Vitals and custom metrics
 */

import { createLogger } from './logger';

const logger = createLogger('Performance');

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.isEnabled = import.meta.env.MODE === 'development' || 
                     import.meta.env.VITE_ENABLE_PERFORMANCE === 'true';
  }

  /**
   * Report Web Vitals (LCP, FID, CLS)
   */
  reportWebVitals() {
    if (!this.isEnabled || !('PerformanceObserver' in window)) return;

    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = lastEntry.renderTime || lastEntry.loadTime;
        this.recordMetric('LCP', lcp);
        logger.info(`LCP: ${lcp.toFixed(2)}ms`);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fid = entry.processingStart - entry.startTime;
          this.recordMetric('FID', fid);
          logger.info(`FID: ${fid.toFixed(2)}ms`);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        }
        this.recordMetric('CLS', clsScore);
        logger.info(`CLS: ${clsScore.toFixed(4)}`);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      logger.error('Error setting up Web Vitals:', error);
    }
  }

  /**
   * Track custom timing metric
   */
  startTimer(label) {
    if (!this.isEnabled) return;
    this.metrics[label] = { start: performance.now() };
  }

  /**
   * End custom timing metric
   */
  endTimer(label) {
    if (!this.isEnabled || !this.metrics[label]) return;
    
    const duration = performance.now() - this.metrics[label].start;
    this.metrics[label].duration = duration;
    logger.info(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Record a metric value
   */
  recordMetric(name, value) {
    if (!this.isEnabled) return;
    this.metrics[name] = { value, timestamp: Date.now() };
  }

  /**
   * Get all recorded metrics
   */
  getMetrics() {
    return this.metrics;
  }

  /**
   * Report Page Load Performance
   */
  reportPageLoad() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
        const connectTime = perfData.responseEnd - perfData.requestStart;

        logger.info('📊 Page Performance:');
        logger.info(`  - Page Load: ${pageLoadTime}ms`);
        logger.info(`  - DOM Ready: ${domReadyTime}ms`);
        logger.info(`  - Connection: ${connectTime}ms`);

        this.recordMetric('PageLoad', pageLoadTime);
        this.recordMetric('DOMReady', domReadyTime);
        this.recordMetric('Connection', connectTime);
      }, 0);
    });
  }

  /**
   * Monitor bundle size
   */
  async reportBundleSize() {
    if (!this.isEnabled) return;

    try {
      const resources = performance.getEntriesByType('resource');
      const jsResources = resources.filter(r => r.name.endsWith('.js'));
      const cssResources = resources.filter(r => r.name.endsWith('.css'));

      const totalJSSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const totalCSSSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

      logger.info('📦 Bundle Sizes:');
      logger.info(`  - JavaScript: ${(totalJSSize / 1024).toFixed(2)} KB`);
      logger.info(`  - CSS: ${(totalCSSSize / 1024).toFixed(2)} KB`);

      this.recordMetric('BundleSize.JS', totalJSSize);
      this.recordMetric('BundleSize.CSS', totalCSSSize);
    } catch (error) {
      logger.error('Error reporting bundle size:', error);
    }
  }

  /**
   * Initialize all performance monitoring
   */
  init() {
    if (!this.isEnabled) return;

    this.reportWebVitals();
    this.reportPageLoad();
    
    // Report bundle size after load
    window.addEventListener('load', () => {
      setTimeout(() => this.reportBundleSize(), 1000);
    });
  }
}

// Create and export singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
export { PerformanceMonitor };
