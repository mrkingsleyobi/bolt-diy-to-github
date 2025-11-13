// ConfigurationMonitoringService.ts - Service for monitoring configuration operations
// Phase 4: Environment Configuration Management - Task 14: Create monitoring service for configuration operations

import { ConfigurationWorkflowResult } from '../config/ConfigurationWorkflowService';
import { TruthVerificationResult } from '../verification/TruthVerificationService';
import { RollbackEvent } from '../verification/AutomatedRollbackService';

/**
 * Interface for monitoring metrics
 */
export interface ConfigurationMetrics {
  /**
   * Total number of configuration operations
   */
  totalOperations: number;

  /**
   * Number of successful operations
   */
  successfulOperations: number;

  /**
   * Number of failed operations
   */
  failedOperations: number;

  /**
   * Average operation duration in milliseconds
   */
  averageDuration: number;

  /**
   * Current truth score
   */
  currentTruthScore: number;

  /**
   * Number of rollbacks performed
   */
  rollbackCount: number;

  /**
   * Timestamp of last operation
   */
  lastOperationTimestamp: number;
}

/**
 * Interface for monitoring event
 */
export interface MonitoringEvent {
  /**
   * Event timestamp
   */
  timestamp: number;

  /**
   * Event type
   */
  type: 'load' | 'save' | 'validate' | 'delete' | 'rollback' | 'error';

  /**
   * Configuration key (if applicable)
   */
  configKey?: string;

  /**
   * Environment (if applicable)
   */
  environment?: string;

  /**
   * Operation duration in milliseconds
   */
  duration?: number;

  /**
   * Truth score (if applicable)
   */
  truthScore?: number;

  /**
   * Success status
   */
  success: boolean;

  /**
   * Error message (if applicable)
   */
  error?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for monitoring configuration
 */
export interface MonitoringConfig {
  /**
   * Whether to enable monitoring
   */
  enabled: boolean;

  /**
   * Whether to log all operations
   */
  logAllOperations: boolean;

  /**
   * Whether to log only failed operations
   */
  logOnlyFailures: boolean;

  /**
   * Maximum number of events to keep in memory
   */
  maxEvents: number;

  /**
   * Whether to emit events for external monitoring systems
   */
  emitEvents: boolean;
}

/**
 * Interface for monitoring service options
 */
export interface MonitoringServiceOptions {
  /**
   * Monitoring configuration
   */
  monitoringConfig?: MonitoringConfig;
}

/**
 * Service for monitoring configuration operations
 */
export class ConfigurationMonitoringService {
  private readonly monitoringConfig: MonitoringConfig;
  private readonly events: MonitoringEvent[] = [];
  private metrics: ConfigurationMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageDuration: 0,
    currentTruthScore: 0,
    rollbackCount: 0,
    lastOperationTimestamp: 0
  };
  private totalDuration: number = 0;

  constructor(options: MonitoringServiceOptions = {}) {
    this.monitoringConfig = {
      enabled: options.monitoringConfig?.enabled ?? true,
      logAllOperations: options.monitoringConfig?.logAllOperations ?? true,
      logOnlyFailures: options.monitoringConfig?.logOnlyFailures ?? false,
      maxEvents: options.monitoringConfig?.maxEvents ?? 1000,
      emitEvents: options.monitoringConfig?.emitEvents ?? false
    };
  }

  /**
   * Record a configuration load operation
   * @param configKey - Configuration key
   * @param environment - Environment name
   * @param result - Configuration workflow result
   * @param duration - Operation duration in milliseconds
   */
  recordLoadOperation(
    configKey: string,
    environment: string,
    result: ConfigurationWorkflowResult,
    duration: number
  ): void {
    if (!this.monitoringConfig.enabled) return;

    const success = result.success;
    const truthScore = result.truthScore ?? 0;

    this.updateMetrics(success, duration, truthScore);

    if (this.shouldLogOperation(success)) {
      const event: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'load',
        configKey,
        environment,
        duration,
        truthScore,
        success,
        error: result.error
      };

      this.recordEvent(event);
    }
  }

  /**
   * Record a configuration save operation
   * @param configKey - Configuration key
   * @param environment - Environment name
   * @param result - Configuration workflow result
   * @param duration - Operation duration in milliseconds
   */
  recordSaveOperation(
    configKey: string,
    environment: string,
    result: ConfigurationWorkflowResult,
    duration: number
  ): void {
    if (!this.monitoringConfig.enabled) return;

    const success = result.success;
    const truthScore = result.truthScore ?? 0;

    this.updateMetrics(success, duration, truthScore);

    if (this.shouldLogOperation(success)) {
      const event: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'save',
        configKey,
        environment,
        duration,
        truthScore,
        success,
        error: result.error
      };

      this.recordEvent(event);
    }
  }

  /**
   * Record a configuration validation operation
   * @param result - Configuration workflow result
   * @param duration - Operation duration in milliseconds
   */
  recordValidationOperation(
    result: ConfigurationWorkflowResult,
    duration: number
  ): void {
    if (!this.monitoringConfig.enabled) return;

    const success = result.success;
    const truthScore = result.truthScore ?? 0;

    this.updateMetrics(success, duration, truthScore);

    if (this.shouldLogOperation(success)) {
      const event: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'validate',
        duration,
        truthScore,
        success,
        error: result.error
      };

      this.recordEvent(event);
    }
  }

  /**
   * Record a configuration delete operation
   * @param configKey - Configuration key
   * @param result - Configuration workflow result
   * @param duration - Operation duration in milliseconds
   */
  recordDeleteOperation(
    configKey: string,
    result: ConfigurationWorkflowResult,
    duration: number
  ): void {
    if (!this.monitoringConfig.enabled) return;

    const success = result.success;

    this.updateMetrics(success, duration, 0); // Delete operations don't have truth scores

    if (this.shouldLogOperation(success)) {
      const event: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'delete',
        configKey,
        duration,
        success,
        error: result.error
      };

      this.recordEvent(event);
    }
  }

  /**
   * Record a rollback operation
   * @param rollbackEvent - Rollback event
   */
  recordRollbackOperation(rollbackEvent: RollbackEvent): void {
    if (!this.monitoringConfig.enabled) return;

    this.metrics.rollbackCount++;

    if (this.monitoringConfig.logAllOperations || !rollbackEvent.success) {
      const event: MonitoringEvent = {
        timestamp: rollbackEvent.timestamp,
        type: 'rollback',
        configKey: rollbackEvent.configKey,
        truthScore: rollbackEvent.truthScore,
        success: rollbackEvent.success,
        error: rollbackEvent.error,
        metadata: {
          reason: rollbackEvent.reason,
          backupKey: rollbackEvent.backupKey
        }
      };

      this.recordEvent(event);
    }
  }

  /**
   * Record a generic error operation
   * @param error - Error message
   * @param metadata - Additional metadata
   */
  recordError(error: string, metadata?: Record<string, any>): void {
    if (!this.monitoringConfig.enabled) return;

    this.metrics.failedOperations++;
    this.metrics.totalOperations++;
    this.metrics.lastOperationTimestamp = Date.now();

    if (this.monitoringConfig.logAllOperations || this.monitoringConfig.logOnlyFailures) {
      const event: MonitoringEvent = {
        timestamp: Date.now(),
        type: 'error',
        success: false,
        error,
        metadata
      };

      this.recordEvent(event);
    }
  }

  /**
   * Update metrics based on operation result
   * @param success - Whether operation was successful
   * @param duration - Operation duration in milliseconds
   * @param truthScore - Truth score (if applicable)
   */
  private updateMetrics(success: boolean, duration: number, truthScore: number): void {
    this.metrics.totalOperations++;
    if (success) {
      this.metrics.successfulOperations++;
    } else {
      this.metrics.failedOperations++;
    }

    // Update average duration
    this.totalDuration += duration;
    this.metrics.averageDuration = this.totalDuration / this.metrics.totalOperations;

    // Update current truth score if provided
    if (truthScore > 0) {
      this.metrics.currentTruthScore = truthScore;
    }

    this.metrics.lastOperationTimestamp = Date.now();
  }

  /**
   * Record a monitoring event
   * @param event - Monitoring event
   */
  private recordEvent(event: MonitoringEvent): void {
    this.events.push(event);

    // Trim events if we exceed maxEvents
    if (this.events.length > this.monitoringConfig.maxEvents) {
      this.events.shift(); // Remove oldest event
    }

    // Emit event if configured
    if (this.monitoringConfig.emitEvents) {
      this.emitEvent(event);
    }

    // Log event if configured
    this.logEvent(event);
  }

  /**
   * Determine if an operation should be logged
   * @param success - Whether operation was successful
   * @returns Whether operation should be logged
   */
  private shouldLogOperation(success: boolean): boolean {
    if (!this.monitoringConfig.logAllOperations && !this.monitoringConfig.logOnlyFailures) {
      return false; // Logging disabled
    }

    if (this.monitoringConfig.logOnlyFailures) {
      return !success; // Only log failures
    }

    return true; // Log all operations
  }

  /**
   * Log a monitoring event
   * @param event - Monitoring event
   */
  private logEvent(event: MonitoringEvent): void {
    const timestamp = new Date(event.timestamp).toISOString();
    const status = event.success ? 'SUCCESS' : 'FAILURE';

    switch (event.type) {
      case 'load':
        console.log(`[CONFIG_MONITOR] ${timestamp} LOAD ${status} key=${event.configKey} env=${event.environment} duration=${event.duration}ms truth=${event.truthScore?.toFixed(2)}`);
        break;
      case 'save':
        console.log(`[CONFIG_MONITOR] ${timestamp} SAVE ${status} key=${event.configKey} env=${event.environment} duration=${event.duration}ms truth=${event.truthScore?.toFixed(2)}`);
        break;
      case 'validate':
        console.log(`[CONFIG_MONITOR] ${timestamp} VALIDATE ${status} duration=${event.duration}ms truth=${event.truthScore?.toFixed(2)}`);
        break;
      case 'delete':
        console.log(`[CONFIG_MONITOR] ${timestamp} DELETE ${status} key=${event.configKey} duration=${event.duration}ms`);
        break;
      case 'rollback':
        console.log(`[CONFIG_MONITOR] ${timestamp} ROLLBACK ${status} key=${event.configKey} truth=${event.truthScore?.toFixed(2)} reason="${event.metadata?.reason}"`);
        break;
      case 'error':
        console.log(`[CONFIG_MONITOR] ${timestamp} ERROR message="${event.error}"`);
        break;
    }

    if (event.error) {
      console.log(`[CONFIG_MONITOR] ${timestamp} ERROR details="${event.error}"`);
    }
  }

  /**
   * Emit a monitoring event for external systems
   * @param event - Monitoring event
   */
  private emitEvent(event: MonitoringEvent): void {
    // In a real implementation, this would emit events to external monitoring systems
    // such as Prometheus, Grafana, Datadog, etc.
    // For now, we'll just log that we would emit the event
    console.log(`[CONFIG_MONITOR] EMIT ${event.type} event to external monitoring system`);
  }

  /**
   * Get current metrics
   * @returns Current metrics
   */
  getMetrics(): ConfigurationMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent events
   * @param limit - Maximum number of events to return
   * @returns Recent events
   */
  getRecentEvents(limit: number = 50): MonitoringEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get events by type
   * @param type - Event type
   * @returns Events of specified type
   */
  getEventsByType(type: MonitoringEvent['type']): MonitoringEvent[] {
    return this.events.filter(event => event.type === type);
  }

  /**
   * Get events by success status
   * @param success - Success status
   * @returns Events with specified success status
   */
  getEventsBySuccess(success: boolean): MonitoringEvent[] {
    return this.events.filter(event => event.success === success);
  }

  /**
   * Get failure rate
   * @returns Failure rate as a percentage
   */
  getFailureRate(): number {
    if (this.metrics.totalOperations === 0) return 0;
    return (this.metrics.failedOperations / this.metrics.totalOperations) * 100;
  }

  /**
   * Get success rate
   * @returns Success rate as a percentage
   */
  getSuccessRate(): number {
    if (this.metrics.totalOperations === 0) return 0;
    return (this.metrics.successfulOperations / this.metrics.totalOperations) * 100;
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageDuration: 0,
      currentTruthScore: 0,
      rollbackCount: 0,
      lastOperationTimestamp: 0
    };
    this.totalDuration = 0;
  }

  /**
   * Get monitoring configuration
   * @returns Monitoring configuration
   */
  getMonitoringConfig(): MonitoringConfig {
    return { ...this.monitoringConfig };
  }

  /**
   * Update monitoring configuration
   * @param config - New monitoring configuration
   */
  updateMonitoringConfig(config: Partial<MonitoringConfig>): void {
    Object.assign(this.monitoringConfig, config);
  }
}