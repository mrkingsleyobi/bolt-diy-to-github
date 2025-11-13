import { MonitoringEvent } from './ConfigurationMonitoringService';
/**
 * Interface for alert configuration
 */
export interface AlertConfig {
    /**
     * Whether to enable alerting
     */
    enabled: boolean;
    /**
     * Threshold for truth score alerts (default: 0.8)
     */
    truthScoreThreshold: number;
    /**
     * Threshold for failure rate alerts (default: 5%)
     */
    failureRateThreshold: number;
    /**
     * Threshold for rollback count alerts (default: 3)
     */
    rollbackCountThreshold: number;
    /**
     * Time window for rate calculations in milliseconds (default: 300000 - 5 minutes)
     */
    timeWindow: number;
    /**
     * Minimum time between alerts in milliseconds (default: 300000 - 5 minutes)
     */
    alertCooldown: number;
    /**
     * Whether to alert on configuration changes
     */
    alertOnChanges: boolean;
    /**
     * Whether to alert on security violations
     */
    alertOnSecurityViolations: boolean;
}
/**
 * Interface for alert
 */
export interface ConfigurationAlert {
    /**
     * Alert timestamp
     */
    timestamp: number;
    /**
     * Alert type
     */
    type: 'low_truth_score' | 'high_failure_rate' | 'excessive_rollbacks' | 'security_violation' | 'configuration_change';
    /**
     * Alert severity
     */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /**
     * Alert message
     */
    message: string;
    /**
     * Configuration key (if applicable)
     */
    configKey?: string;
    /**
     * Environment (if applicable)
     */
    environment?: string;
    /**
     * Truth score (if applicable)
     */
    truthScore?: number;
    /**
     * Failure rate (if applicable)
     */
    failureRate?: number;
    /**
     * Rollback count (if applicable)
     */
    rollbackCount?: number;
    /**
     * Additional metadata
     */
    metadata?: Record<string, any>;
}
/**
 * Interface for alerting service options
 */
export interface AlertingServiceOptions {
    /**
     * Alert configuration
     */
    alertConfig?: AlertConfig;
}
/**
 * Service for alerting on configuration security incidents
 */
export declare class ConfigurationAlertingService {
    private readonly alertConfig;
    private readonly alertHistory;
    private lastAlertTimestamp;
    constructor(options?: AlertingServiceOptions);
    /**
     * Process a monitoring event and generate alerts if needed
     * @param event - Monitoring event
     */
    processMonitoringEvent(event: MonitoringEvent): void;
    /**
     * Check for low truth score alerts
     * @param event - Monitoring event
     */
    private checkTruthScoreAlert;
    /**
     * Check for security violation alerts
     * @param event - Monitoring event
     */
    private checkSecurityViolationAlert;
    /**
     * Check for excessive rollback alerts
     * @param event - Monitoring event
     */
    private checkRollbackAlert;
    /**
     * Generate configuration change alert
     * @param event - Monitoring event
     */
    private generateConfigurationChangeAlert;
    /**
     * Generate an alert
     * @param alert - Configuration alert
     */
    private generateAlert;
    /**
     * Send alert to configured destinations
     * @param alert - Configuration alert
     */
    private sendAlert;
    /**
     * Log alert to console
     * @param alert - Configuration alert
     */
    private logAlert;
    /**
     * Determine severity based on truth score
     * @param truthScore - Truth score
     * @returns Severity level
     */
    private determineTruthScoreSeverity;
    /**
     * Get recent alerts
     * @param limit - Maximum number of alerts to return
     * @returns Recent alerts
     */
    getRecentAlerts(limit?: number): ConfigurationAlert[];
    /**
     * Get alerts by type
     * @param type - Alert type
     * @returns Alerts of specified type
     */
    getAlertsByType(type: ConfigurationAlert['type']): ConfigurationAlert[];
    /**
     * Get alerts by severity
     * @param severity - Alert severity
     * @returns Alerts with specified severity
     */
    getAlertsBySeverity(severity: ConfigurationAlert['severity']): ConfigurationAlert[];
    /**
     * Get alert configuration
     * @returns Alert configuration
     */
    getAlertConfig(): AlertConfig;
    /**
     * Update alert configuration
     * @param config - New alert configuration
     */
    updateAlertConfig(config: Partial<AlertConfig>): void;
    /**
     * Clear alert history
     */
    clearAlertHistory(): void;
    /**
     * Get alert statistics
     * @returns Alert statistics
     */
    getAlertStatistics(): Record<string, number>;
}
//# sourceMappingURL=ConfigurationAlertingService.d.ts.map