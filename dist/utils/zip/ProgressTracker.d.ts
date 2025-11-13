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
export declare class ProgressTracker {
    private processed;
    private total;
    private startTime;
    private lastUpdate;
    private lastProcessed;
    /**
     * Create a progress tracker
     * @param total Total number of entries to process
     */
    constructor(total: number);
    /**
     * Update progress with number of processed entries
     * @param processed Number of entries processed
     */
    update(processed: number): void;
    /**
     * Get current progress metrics
     * @returns Progress metrics including percentage, processed count, total count, and memory usage
     */
    getProgress(): ProgressMetrics;
    /**
     * Get estimated time remaining
     * @returns Estimated time remaining in milliseconds
     */
    getEstimatedTimeRemaining(): number;
}
//# sourceMappingURL=ProgressTracker.d.ts.map