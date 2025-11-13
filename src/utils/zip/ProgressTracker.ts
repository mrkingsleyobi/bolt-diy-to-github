/**
 * Progress metrics for streaming operations
 */
export interface ProgressMetrics {
  /** Percentage of completion (0-100) */
  percentage: number;
  /** Number of entries processed */
  processed: number;
  /** Total number of entries */
  total: number;
  /** Current memory usage in bytes */
  memoryUsage: number;
  /** Processing rate (entries per second) */
  rate?: number;
  /** Timestamp of last update */
  timestamp?: number;
}

/**
 * Progress tracker for streaming ZIP processing
 */
export class ProgressTracker {
  private processed: number = 0;
  private total: number;
  private startTime: number;
  private lastUpdate: number = 0;
  private lastProcessed: number = 0;

  /**
   * Create a progress tracker
   * @param total Total number of entries to process
   */
  constructor(total: number) {
    this.total = total;
    this.startTime = Date.now();
    this.lastUpdate = this.startTime;
  }

  /**
   * Update progress with number of processed entries
   * @param processed Number of entries processed
   */
  update(processed: number): void {
    this.processed = processed;
    this.lastUpdate = Date.now();
    this.lastProcessed = processed;
  }

  /**
   * Get current progress metrics
   * @returns Progress metrics including percentage, processed count, total count, and memory usage
   */
  getProgress(): ProgressMetrics {
    const currentTime = Date.now();
    const elapsedSeconds = (currentTime - this.startTime) / 1000;
    const rate = elapsedSeconds > 0 ? this.processed / elapsedSeconds : 0;

    return {
      percentage: Math.round((this.processed / this.total) * 100),
      processed: this.processed,
      total: this.total,
      memoryUsage: process.memoryUsage().heapUsed,
      rate: Math.round(rate * 100) / 100,
      timestamp: currentTime
    };
  }

  /**
   * Get estimated time remaining
   * @returns Estimated time remaining in milliseconds
   */
  getEstimatedTimeRemaining(): number {
    if (this.processed === 0) return Infinity;

    const elapsed = Date.now() - this.startTime;
    const rate = this.processed / elapsed;
    const remaining = this.total - this.processed;
    return Math.round(remaining / rate);
  }
}