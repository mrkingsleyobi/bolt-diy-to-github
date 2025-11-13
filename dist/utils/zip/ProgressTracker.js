"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressTracker = void 0;
/**
 * Progress tracker for streaming ZIP processing
 */
class ProgressTracker {
    /**
     * Create a progress tracker
     * @param total Total number of entries to process
     */
    constructor(total) {
        this.processed = 0;
        this.lastUpdate = 0;
        this.lastProcessed = 0;
        this.total = total;
        this.startTime = Date.now();
        this.lastUpdate = this.startTime;
    }
    /**
     * Update progress with number of processed entries
     * @param processed Number of entries processed
     */
    update(processed) {
        this.processed = processed;
        this.lastUpdate = Date.now();
        this.lastProcessed = processed;
    }
    /**
     * Get current progress metrics
     * @returns Progress metrics including percentage, processed count, total count, and memory usage
     */
    getProgress() {
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
    getEstimatedTimeRemaining() {
        if (this.processed === 0)
            return Infinity;
        const elapsed = Date.now() - this.startTime;
        const rate = this.processed / elapsed;
        const remaining = this.total - this.processed;
        return Math.round(remaining / rate);
    }
}
exports.ProgressTracker = ProgressTracker;
//# sourceMappingURL=ProgressTracker.js.map