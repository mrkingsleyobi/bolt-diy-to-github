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
export declare class MemoryMonitor {
    private limit;
    private warningThreshold;
    private alertCallback?;
    /**
     * Create a memory monitor
     * @param limit Maximum memory usage in bytes (default: Infinity)
     * @param warningThreshold Warning threshold as percentage of limit (default: 80)
     */
    constructor(limit?: number, warningThreshold?: number);
    /**
     * Get current memory usage
     * @returns Memory usage information
     */
    getCurrentUsage(): MemoryUsage;
    /**
     * Check if memory limit is exceeded
     * @returns True if current usage exceeds limit
     */
    isLimitExceeded(): boolean;
    /**
     * Check if memory usage is above warning threshold
     * @returns True if current usage exceeds warning threshold
     */
    isWarningThresholdExceeded(): boolean;
    /**
     * Get memory usage as percentage of limit
     * @returns Percentage of limit used (0-100)
     */
    getUsagePercentage(): number;
    /**
     * Get memory limit
     * @returns Memory limit in bytes
     */
    getLimit(): number;
    /**
     * Set alert callback for memory usage warnings
     * @param callback Function to call when warning threshold is exceeded
     */
    setAlertCallback(callback: (usage: MemoryUsage) => void): void;
    /**
     * Check memory usage and trigger alert if necessary
     */
    checkAndAlert(): void;
}
//# sourceMappingURL=MemoryMonitor.d.ts.map