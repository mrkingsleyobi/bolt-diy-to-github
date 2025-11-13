"use strict";
// ConfigurationAlertingService.ts - Service for alerting on configuration security incidents
// Phase 4: Environment Configuration Management - Task 15: Implement alerting system for configuration security incidents
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationAlertingService = void 0;
/**
 * Service for alerting on configuration security incidents
 */
class ConfigurationAlertingService {
    constructor(options = {}) {
        this.alertHistory = [];
        this.lastAlertTimestamp = 0;
        this.alertConfig = {
            enabled: options.alertConfig?.enabled ?? true,
            truthScoreThreshold: options.alertConfig?.truthScoreThreshold ?? 0.8,
            failureRateThreshold: options.alertConfig?.failureRateThreshold ?? 5,
            rollbackCountThreshold: options.alertConfig?.rollbackCountThreshold ?? 3,
            timeWindow: options.alertConfig?.timeWindow ?? 300000, // 5 minutes
            alertCooldown: options.alertConfig?.alertCooldown ?? 300000, // 5 minutes
            alertOnChanges: options.alertConfig?.alertOnChanges ?? true,
            alertOnSecurityViolations: options.alertConfig?.alertOnSecurityViolations ?? true
        };
    }
    /**
     * Process a monitoring event and generate alerts if needed
     * @param event - Monitoring event
     */
    processMonitoringEvent(event) {
        if (!this.alertConfig.enabled)
            return;
        // Check if we're in cooldown period
        const now = Date.now();
        if (now - this.lastAlertTimestamp < this.alertConfig.alertCooldown) {
            return;
        }
        // Process different types of events
        switch (event.type) {
            case 'load':
            case 'save':
            case 'validate':
                this.checkTruthScoreAlert(event);
                this.checkSecurityViolationAlert(event);
                break;
            case 'rollback':
                this.checkRollbackAlert(event);
                break;
            case 'error':
                // Errors are handled through failure rate monitoring
                break;
        }
        // Check for configuration changes if enabled
        if (this.alertConfig.alertOnChanges && (event.type === 'save' || event.type === 'delete')) {
            this.generateConfigurationChangeAlert(event);
        }
    }
    /**
     * Check for low truth score alerts
     * @param event - Monitoring event
     */
    checkTruthScoreAlert(event) {
        if (event.truthScore !== undefined && event.truthScore < this.alertConfig.truthScoreThreshold) {
            const severity = this.determineTruthScoreSeverity(event.truthScore);
            const alert = {
                timestamp: event.timestamp,
                type: 'low_truth_score',
                severity,
                message: `Configuration ${event.configKey} in environment ${event.environment} has low truth score: ${event.truthScore.toFixed(2)}`,
                configKey: event.configKey,
                environment: event.environment,
                truthScore: event.truthScore,
                metadata: {
                    operation: event.type,
                    error: event.error
                }
            };
            this.generateAlert(alert);
        }
    }
    /**
     * Check for security violation alerts
     * @param event - Monitoring event
     */
    checkSecurityViolationAlert(event) {
        if (!this.alertConfig.alertOnSecurityViolations)
            return;
        // Check for exposed tokens or other security violations
        if (event.metadata?.securityViolations) {
            const alert = {
                timestamp: event.timestamp,
                type: 'security_violation',
                severity: 'high',
                message: `Security violation detected in configuration ${event.configKey}: ${event.metadata.securityViolations}`,
                configKey: event.configKey,
                environment: event.environment,
                metadata: {
                    operation: event.type,
                    violations: event.metadata.securityViolations,
                    error: event.error
                }
            };
            this.generateAlert(alert);
        }
    }
    /**
     * Check for excessive rollback alerts
     * @param event - Monitoring event
     */
    checkRollbackAlert(event) {
        // For rollback events, we need to check the recent rollback count
        // This would typically be done by querying the monitoring service for recent rollbacks
        // For this implementation, we'll assume the event contains rollback count information
        if (event.metadata?.rollbackCount !== undefined &&
            event.metadata.rollbackCount >= this.alertConfig.rollbackCountThreshold) {
            const alert = {
                timestamp: event.timestamp,
                type: 'excessive_rollbacks',
                severity: 'high',
                message: `Excessive rollbacks detected for configuration ${event.configKey}: ${event.metadata.rollbackCount} rollbacks`,
                configKey: event.configKey,
                rollbackCount: event.metadata.rollbackCount,
                metadata: {
                    reason: event.metadata.reason,
                    backupKey: event.metadata.backupKey
                }
            };
            this.generateAlert(alert);
        }
    }
    /**
     * Generate configuration change alert
     * @param event - Monitoring event
     */
    generateConfigurationChangeAlert(event) {
        const severity = event.success ? 'low' : 'medium';
        const action = event.type === 'save' ? 'modified' : 'deleted';
        const alert = {
            timestamp: event.timestamp,
            type: 'configuration_change',
            severity,
            message: `Configuration ${event.configKey} was ${action} in environment ${event.environment}`,
            configKey: event.configKey,
            environment: event.environment,
            metadata: {
                operation: event.type,
                success: event.success,
                error: event.error
            }
        };
        this.generateAlert(alert);
    }
    /**
     * Generate an alert
     * @param alert - Configuration alert
     */
    generateAlert(alert) {
        // Add to alert history
        this.alertHistory.push(alert);
        // Update last alert timestamp
        this.lastAlertTimestamp = alert.timestamp;
        // Send alert
        this.sendAlert(alert);
        // Log alert
        this.logAlert(alert);
    }
    /**
     * Send alert to configured destinations
     * @param alert - Configuration alert
     */
    sendAlert(alert) {
        // In a real implementation, this would send alerts to:
        // - Email notifications
        // - Slack/Discord webhooks
        // - SMS notifications
        // - Incident management systems (PagerDuty, etc.)
        // - Logging systems (ELK, Splunk, etc.)
        // For this implementation, we'll just log that we would send the alert
        console.log(`[CONFIG_ALERT] SENDING ${alert.severity.toUpperCase()} ALERT: ${alert.message}`);
        // Example of what a real implementation might do:
        /*
        switch (alert.severity) {
          case 'critical':
            // Send SMS and email to on-call team
            this.sendSMS(`CRITICAL: ${alert.message}`);
            this.sendEmail('oncall@example.com', `CRITICAL Configuration Alert`, alert.message);
            break;
          case 'high':
            // Send email to team
            this.sendEmail('team@example.com', `HIGH Configuration Alert`, alert.message);
            break;
          case 'medium':
            // Send to Slack channel
            this.sendSlackMessage(`MEDIUM Alert: ${alert.message}`);
            break;
          case 'low':
            // Log to monitoring system
            this.logToMonitoringSystem(alert);
            break;
        }
        */
    }
    /**
     * Log alert to console
     * @param alert - Configuration alert
     */
    logAlert(alert) {
        const timestamp = new Date(alert.timestamp).toISOString();
        console.log(`[CONFIG_ALERT] ${timestamp} ${alert.severity.toUpperCase()} ${alert.type}: ${alert.message}`);
        if (alert.metadata) {
            console.log(`[CONFIG_ALERT] Metadata: ${JSON.stringify(alert.metadata)}`);
        }
    }
    /**
     * Determine severity based on truth score
     * @param truthScore - Truth score
     * @returns Severity level
     */
    determineTruthScoreSeverity(truthScore) {
        if (truthScore < 0.5)
            return 'critical';
        if (truthScore < 0.7)
            return 'high';
        if (truthScore < 0.8)
            return 'medium';
        return 'low';
    }
    /**
     * Get recent alerts
     * @param limit - Maximum number of alerts to return
     * @returns Recent alerts
     */
    getRecentAlerts(limit = 50) {
        return this.alertHistory.slice(-limit);
    }
    /**
     * Get alerts by type
     * @param type - Alert type
     * @returns Alerts of specified type
     */
    getAlertsByType(type) {
        return this.alertHistory.filter(alert => alert.type === type);
    }
    /**
     * Get alerts by severity
     * @param severity - Alert severity
     * @returns Alerts with specified severity
     */
    getAlertsBySeverity(severity) {
        return this.alertHistory.filter(alert => alert.severity === severity);
    }
    /**
     * Get alert configuration
     * @returns Alert configuration
     */
    getAlertConfig() {
        return { ...this.alertConfig };
    }
    /**
     * Update alert configuration
     * @param config - New alert configuration
     */
    updateAlertConfig(config) {
        Object.assign(this.alertConfig, config);
    }
    /**
     * Clear alert history
     */
    clearAlertHistory() {
        this.alertHistory.length = 0;
    }
    /**
     * Get alert statistics
     * @returns Alert statistics
     */
    getAlertStatistics() {
        const stats = {
            total: this.alertHistory.length,
            low_truth_score: 0,
            high_failure_rate: 0,
            excessive_rollbacks: 0,
            security_violation: 0,
            configuration_change: 0,
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
        };
        for (const alert of this.alertHistory) {
            stats[alert.type]++;
            stats[alert.severity]++;
        }
        return stats;
    }
}
exports.ConfigurationAlertingService = ConfigurationAlertingService;
//# sourceMappingURL=ConfigurationAlertingService.js.map