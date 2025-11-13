# Task 00c: Create Memory Monitor

**Estimated Time: 8 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The current ZIP extraction service has no memory monitoring capabilities. This task creates a memory monitor for streaming ZIP processing to track and limit memory usage during large file operations.

## Current System State
- No memory monitoring in current implementation
- Basic streaming without memory constraints
- No memory usage limits or alerts

## Your Task
Create a memory monitor class for streaming ZIP processing that tracks memory usage, enforces limits, and provides alerts when thresholds are exceeded.

## Test First (RED Phase)
```typescript
import { MemoryMonitor } from '../../src/utils/zip/MemoryMonitor';

describe('MemoryMonitor', () => {
  it('should monitor memory usage', () => {
    const monitor = new MemoryMonitor();
    const usage = monitor.getCurrentUsage();
    expect(usage).toBeGreaterThanOrEqual(0);
  });

  it('should check if limit is exceeded', () => {
    const monitor = new MemoryMonitor(1000000); // 1MB limit
    expect(monitor.isLimitExceeded()).toBe(false);
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
export class MemoryMonitor {
  private limit: number;

  constructor(limit?: number) {
    this.limit = limit || Infinity;
  }

  getCurrentUsage(): number {
    return process.memoryUsage().heapUsed;
  }

  isLimitExceeded(): boolean {
    return this.getCurrentUsage() > this.limit;
  }

  getLimit(): number {
    return this.limit;
  }
}
```

## Refactored Solution (REFACTOR Phase)
```typescript
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
    this.limit = limit || Infinity;
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
    return this.getCurrentUsage().heapUsed > this.limit;
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
```

## Verification Commands
```bash
# Compile TypeScript to verify implementation
npx tsc --noEmit src/utils/zip/MemoryMonitor.ts
```

## Success Criteria
- [ ] MemoryMonitor class created with memory tracking capabilities
- [ ] Memory limit enforcement implemented
- [ ] Warning threshold monitoring
- [ ] Alert callback system
- [ ] Code compiles without errors
- [ ] Unit tests pass

## Dependencies Confirmed
- Node.js process.memoryUsage() API available
- TypeScript compiler installed

## Next Task
task_01_implement_streaming_extractor.md