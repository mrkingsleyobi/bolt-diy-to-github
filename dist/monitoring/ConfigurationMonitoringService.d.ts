import { ConfigurationWorkflowResult } from '../config/ConfigurationWorkflowService';
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
export declare class ConfigurationMonitoringService {
    private readonly monitoringConfig;
    private readonly events;
    private metrics;
    private totalDuration;
    constructor(options?: MonitoringServiceOptions);
    /**
     * Record a configuration load operation
     * @param configKey - Configuration key
     * @param environment - Environment name
     * @param result - Configuration workflow result
     * @param duration - Operation duration in milliseconds
     */
    recordLoadOperation(configKey: string, environment: string, result: ConfigurationWorkflowResult, duration: number): void;
    /**
     * Record a configuration save operation
     * @param configKey - Configuration key
     * @param environment - Environment name
     * @param result - Configuration workflow result
     * @param duration - Operation duration in milliseconds
     */
    recordSaveOperation(configKey: string, environment: string, result: ConfigurationWorkflowResult, duration: number): void;
    /**
     * Record a configuration validation operation
     * @param result - Configuration workflow result
     * @param duration - Operation duration in milliseconds
     */
    recordValidationOperation(result: ConfigurationWorkflowResult, duration: number): void;
    /**
     * Record a configuration delete operation
     * @param configKey - Configuration key
     * @param result - Configuration workflow result
     * @param duration - Operation duration in milliseconds
     */
    recordDeleteOperation(configKey: string, result: ConfigurationWorkflowResult, duration: number): void;
    /**
     * Record a rollback operation
     * @param rollbackEvent - Rollback event
     */
    recordRollbackOperation(rollbackEvent: RollbackEvent): void;
    /**
     * Record a generic error operation
     * @param error - Error message
     * @param metadata - Additional metadata
     */
    recordError(error: string, metadata?: Record<string, any>): void;
    /**
     * Update metrics based on operation result
     * @param success - Whether operation was successful
     * @param duration - Operation duration in milliseconds
     * @param truthScore - Truth score (if applicable)
     */
    private updateMetrics;
    /**
     * Record a monitoring event
     * @param event - Monitoring event
     */
    private recordEvent;
    /**
     * Determine if an operation should be logged
     * @param success - Whether operation was successful
     * @returns Whether operation should be logged
     */
    private shouldLogOperation;
    /**
     * Log a monitoring event
     * @param event - Monitoring event
     */
    private logEvent;
    /**
     * Emit a monitoring event for external systems
     * @param event - Monitoring event
     */
    private emitEvent;
    /**
     * Get current metrics
     * @returns Current metrics
     */
    getMetrics(): ConfigurationMetrics;
    /**
     * Get recent events
     * @param limit - Maximum number of events to return
     * @returns Recent events
     */
    getRecentEvents(limit?: number): MonitoringEvent[];
    /**
     * Get events by type
     * @param type - Event type
     * @returns Events of specified type
     */
    getEventsByType(type: MonitoringEvent['type']): MonitoringEvent[];
    /**
     * Get events by success status
     * @param success - Success status
     * @returns Events with specified success status
     */
    getEventsBySuccess(success: boolean): MonitoringEvent[];
    /**
     * Get failure rate
     * @returns Failure rate as a percentage
     */
    getFailureRate(): number;
    /**
     * Get success rate
     * @returns Success rate as a percentage
     */
    getSuccessRate(): number;
    /**
     * Reset metrics
     */
    resetMetrics(): void;
    /**
     * Get monitoring configuration
     * @returns Monitoring configuration
     */
    getMonitoringConfig(): MonitoringConfig;
    /**
     * Update monitoring configuration
     * @param config - New monitoring configuration
     */
    updateMonitoringConfig(config: Partial<MonitoringConfig>): void;
}
//# sourceMappingURL=ConfigurationMonitoringService.d.ts.map