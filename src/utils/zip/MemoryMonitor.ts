/**
 * Memory usage information
 */
export interface MemoryUsage {
  /** Total heap size */
  heapTotal: number;
  /** Used heap size */
  heapUsed: number;
  /** External memory usage */
  external: number;
  /** Resident set size */
  rss: number;
  /** Array buffers memory usage */
  arrayBuffers: number;
}

/**
 * Memory monitor for streaming operations
 */
export class MemoryMonitor {
  private limit: number;
  private warningThreshold: number;
  private alertCallback?: (usage: MemoryUsage) => void;

  /**
   * Create a memory monitor
   * @param limit Maximum memory usage in bytes (default: Infinity)
   * @param warningThreshold Warning threshold as percentage of limit (default: 80)
   */
  constructor(limit?: number, warningThreshold?: number) {
    this.limit = (limit !== undefined && limit !== null) ? limit : Infinity;
    this.warningThreshold = warningThreshold || 80;
  }

  /**
   * Get current memory usage
   * @returns Memory usage information
   */
  getCurrentUsage(): MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * Check if memory limit is exceeded
   * @returns True if current usage exceeds limit
   */
  isLimitExceeded(): boolean {
    const heapUsed = this.getCurrentUsage().heapUsed;
    const limit = this.limit;
    const result = heapUsed > limit;
    return result;
  }

  /**
   * Check if memory usage is above warning threshold
   * @returns True if current usage exceeds warning threshold
   */
  isWarningThresholdExceeded(): boolean {
    if (this.limit === Infinity) return false;
    const usage = this.getCurrentUsage().heapUsed;
    const threshold = (this.limit * this.warningThreshold) / 100;
    return usage > threshold;
  }

  /**
   * Get memory usage as percentage of limit
   * @returns Percentage of limit used (0-100)
   */
  getUsagePercentage(): number {
    if (this.limit === Infinity) return 0;
    const usage = this.getCurrentUsage().heapUsed;
    return Math.round((usage / this.limit) * 100);
  }

  /**
   * Get memory limit
   * @returns Memory limit in bytes
   */
  getLimit(): number {
    return this.limit;
  }

  /**
   * Set alert callback for memory usage warnings
   * @param callback Function to call when warning threshold is exceeded
   */
  setAlertCallback(callback: (usage: MemoryUsage) => void): void {
    this.alertCallback = callback;
  }

  /**
   * Check memory usage and trigger alert if necessary
   */
  checkAndAlert(): void {
    if (this.isWarningThresholdExceeded() && this.alertCallback) {
      this.alertCallback(this.getCurrentUsage());
    }
  }
}