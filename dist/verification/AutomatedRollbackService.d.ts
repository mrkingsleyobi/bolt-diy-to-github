import { TruthVerificationService } from './TruthVerificationService';
import { ConfigurationWorkflowService } from '../config/ConfigurationWorkflowService';
import { EncryptedConfigStore } from '../config/EncryptedConfigStore';
import { ConfigurationWorkflowResult } from '../config/ConfigurationWorkflowService';
/**
 * Interface for rollback configuration
 */
export interface RollbackConfig {
    /**
     * Whether to enable automated rollback
     */
    enabled: boolean;
    /**
     * Minimum truth score threshold for rollback
     */
    threshold: number;
    /**
     * Maximum number of rollback attempts
     */
    maxAttempts: number;
    /**
     * Whether to notify on rollback
     */
    notifyOnRollback: boolean;
    /**
     * Backup configuration key prefix
     */
    backupKeyPrefix: string;
}
/**
 * Interface for rollback event
 */
export interface RollbackEvent {
    /**
     * Timestamp of rollback
     */
    timestamp: number;
    /**
     * Configuration key that was rolled back
     */
    configKey: string;
    /**
     * Reason for rollback
     */
    reason: string;
    /**
     * Truth score that triggered rollback
     */
    truthScore: number;
    /**
     * Previous configuration backup key
     */
    backupKey?: string;
    /**
     * Whether rollback was successful
     */
    success: boolean;
    /**
     * Error message if rollback failed
     */
    error?: string;
}
/**
 * Interface for rollback service options
 */
export interface RollbackServiceOptions {
    /**
     * Rollback configuration
     */
    rollbackConfig?: RollbackConfig;
    /**
     * Whether to automatically backup configurations before changes
     */
    autoBackup?: boolean;
}
/**
 * Service for automated rollback of configuration with low truth scores
 */
export declare class AutomatedRollbackService {
    private readonly truthVerificationService;
    private readonly configurationWorkflowService;
    private readonly encryptedConfigStore;
    private readonly rollbackConfig;
    private readonly autoBackup;
    private readonly rollbackHistory;
    private readonly backupHistory;
    constructor(truthVerificationService: TruthVerificationService, configurationWorkflowService: ConfigurationWorkflowService, encryptedConfigStore: EncryptedConfigStore, options?: RollbackServiceOptions);
    /**
     * Process a configuration result and trigger rollback if needed
     * @param result - Configuration workflow result
     * @param configKey - Configuration key
     * @param environment - Environment name
     * @returns Rollback event if rollback was attempted
     */
    processConfigurationResult(result: ConfigurationWorkflowResult, configKey: string, environment: string): Promise<RollbackEvent | null>;
    /**
     * Perform rollback to previous configuration
     * @param configKey - Configuration key
     * @param environment - Environment name
     * @param result - Configuration workflow result that failed
     * @param truthScore - Truth score that triggered rollback
     * @returns Rollback event
     */
    private performRollback;
    /**
     * Create a backup of the current configuration
     * @param configKey - Configuration key
     * @param environment - Environment name
     */
    private createBackup;
    /**
     * Clean up old backups, keeping only the most recent ones
     * @param configKey - Configuration key
     */
    private cleanupOldBackups;
    /**
     * Notify about rollback event
     * @param rollbackEvent - Rollback event
     */
    private notifyRollback;
    /**
     * Get rollback history
     * @returns Rollback history
     */
    getRollbackHistory(): RollbackEvent[];
    /**
     * Get backup history
     * @returns Backup history map
     */
    getBackupHistory(): Map<string, string>;
    /**
     * Get rollback configuration
     * @returns Rollback configuration
     */
    getRollbackConfig(): RollbackConfig;
    /**
     * Update rollback configuration
     * @param config - New rollback configuration
     */
    updateRollbackConfig(config: Partial<RollbackConfig>): void;
    /**
     * Manually trigger rollback for a configuration
     * @param configKey - Configuration key
     * @param environment - Environment name
     * @param reason - Reason for manual rollback
     * @returns Rollback event
     */
    manualRollback(configKey: string, environment: string, reason: string): Promise<RollbackEvent>;
}
//# sourceMappingURL=AutomatedRollbackService.d.ts.map