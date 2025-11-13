# Task 00b: Create Progress Tracker

**Estimated Time: 8 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The current ZIP extraction service has basic progress tracking but lacks detailed metrics for streaming operations. This task creates a progress tracker for enhanced streaming functionality with memory monitoring.

## Current System State
- Basic progress callback exists in ZipExtractionOptions
- No dedicated progress tracking class
- No memory usage monitoring

## Your Task
Create a progress tracker class for streaming ZIP processing that tracks detailed metrics including memory usage, processing rate, and backpressure.

## Test First (RED Phase)
```typescript
import { ProgressTracker } from '../../src/utils/zip/ProgressTracker';

describe('ProgressTracker', () => {
  it('should track progress correctly', () => {
    const tracker = new ProgressTracker(100);
    expect(tracker.getProgress().total).toBe(100);
    expect(tracker.getProgress().processed).toBe(0);
  });

  it('should update progress', () => {
    const tracker = new ProgressTracker(50);
    tracker.update(10);
    expect(tracker.getProgress().processed).toBe(10);
    expect(tracker.getProgress().percentage).toBe(20);
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
export interface ProgressMetrics {
  percentage: number;
  processed: number;
  total: number;
  memoryUsage: number;
}

export class ProgressTracker {
  private processed: number = 0;
  private total: number;

  constructor(total: number) {
    this.total = total;
  }

  update(processed: number): void {
    this.processed = processed;
  }

  getProgress(): ProgressMetrics {
    return {
      percentage: Math.round((this.processed / this.total) * 100),
      processed: this.processed,
      total: this.total,
      memoryUsage: process.memoryUsage().heapUsed
    };
  }
}
```

## Refactored Solution (REFACTOR Phase)
```typescript
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
```

## Verification Commands
```bash
# Compile TypeScript to verify implementation
npx tsc --noEmit src/utils/zip/ProgressTracker.ts
```

## Success Criteria
- [ ] ProgressTracker class created with constructor and update methods
- [ ] getProgress() method returns detailed metrics
- [ ] Memory usage tracking implemented
- [ ] Processing rate calculation
- [ ] Code compiles without errors
- [ ] Unit tests pass

## Dependencies Confirmed
- Node.js process API available for memory usage
- TypeScript compiler installed

## Next Task
task_00c_create_memory_monitor.md