// AutomatedRollbackService.ts - Service for automated rollback of configuration with low truth scores
// Phase 4: Environment Configuration Management - Task 13: Implement automated rollback for low truth scores in configuration

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
export class AutomatedRollbackService {
  private readonly truthVerificationService: TruthVerificationService;
  private readonly configurationWorkflowService: ConfigurationWorkflowService;
  private readonly encryptedConfigStore: EncryptedConfigStore;
  private readonly rollbackConfig: RollbackConfig;
  private readonly autoBackup: boolean;
  private readonly rollbackHistory: RollbackEvent[] = [];
  private readonly backupHistory: Map<string, string> = new Map(); // configKey -> backupKey

  constructor(
    truthVerificationService: TruthVerificationService,
    configurationWorkflowService: ConfigurationWorkflowService,
    encryptedConfigStore: EncryptedConfigStore,
    options: RollbackServiceOptions = {}
  ) {
    this.truthVerificationService = truthVerificationService;
    this.configurationWorkflowService = configurationWorkflowService;
    this.encryptedConfigStore = encryptedConfigStore;
    this.rollbackConfig = {
      enabled: options.rollbackConfig?.enabled ?? true,
      threshold: options.rollbackConfig?.threshold ?? 0.95,
      maxAttempts: options.rollbackConfig?.maxAttempts ?? 3,
      notifyOnRollback: options.rollbackConfig?.notifyOnRollback ?? true,
      backupKeyPrefix: options.rollbackConfig?.backupKeyPrefix ?? 'backup_'
    };
    this.autoBackup = options.autoBackup ?? true;
  }

  /**
   * Process a configuration result and trigger rollback if needed
   * @param result - Configuration workflow result
   * @param configKey - Configuration key
   * @param environment - Environment name
   * @returns Rollback event if rollback was attempted
   */
  async processConfigurationResult(
    result: ConfigurationWorkflowResult,
    configKey: string,
    environment: string
  ): Promise<RollbackEvent | null> {
    // Verify the configuration result
    const verification = this.truthVerificationService.verifyConfigurationResult(result);

    // Check if rollback is needed
    if (this.rollbackConfig.enabled && !verification.meetsThreshold) {
      // Perform rollback
      const rollbackEvent = await this.performRollback(configKey, environment, result, verification.score);
      return rollbackEvent;
    }

    // If auto backup is enabled and result is valid, create a backup
    if (this.autoBackup && result.success && verification.meetsThreshold) {
      await this.createBackup(configKey, environment);
    }

    return null; // No rollback needed
  }

  /**
   * Perform rollback to previous configuration
   * @param configKey - Configuration key
   * @param environment - Environment name
   * @param result - Configuration workflow result that failed
   * @param truthScore - Truth score that triggered rollback
   * @returns Rollback event
   */
  private async performRollback(
    configKey: string,
    environment: string,
    result: ConfigurationWorkflowResult,
    truthScore: number
  ): Promise<RollbackEvent> {
    const timestamp = Date.now();
    let backupKey = this.backupHistory.get(configKey);

    // If no backup exists, we can't rollback
    if (!backupKey) {
      const rollbackEvent: RollbackEvent = {
        timestamp,
        configKey,
        reason: 'No backup available for rollback',
        truthScore,
        success: false,
        error: 'No previous configuration backup found'
      };

      this.rollbackHistory.push(rollbackEvent);

      if (this.rollbackConfig.notifyOnRollback) {
        this.notifyRollback(rollbackEvent);
      }

      return rollbackEvent;
    }

    try {
      // Check if we've exceeded max attempts
      const recentRollbacks = this.rollbackHistory.filter(
        event => event.configKey === configKey && Date.now() - event.timestamp < 60000 // Last minute
      );

      if (recentRollbacks.length >= this.rollbackConfig.maxAttempts) {
        throw new Error(`Maximum rollback attempts (${this.rollbackConfig.maxAttempts}) exceeded`);
      }

      // Load the backup configuration
      const backupConfig = await this.encryptedConfigStore.load(backupKey);

      if (!backupConfig) {
        throw new Error(`Backup configuration not found for key: ${backupKey}`);
      }

      // Restore the backup configuration
      await this.configurationWorkflowService.saveConfiguration(environment, configKey, backupConfig);

      const rollbackEvent: RollbackEvent = {
        timestamp,
        configKey,
        reason: `Low truth score: ${truthScore.toFixed(2)}`,
        truthScore,
        backupKey,
        success: true
      };

      this.rollbackHistory.push(rollbackEvent);

      if (this.rollbackConfig.notifyOnRollback) {
        this.notifyRollback(rollbackEvent);
      }

      return rollbackEvent;
    } catch (error) {
      const rollbackEvent: RollbackEvent = {
        timestamp,
        configKey,
        reason: `Low truth score: ${truthScore.toFixed(2)}`,
        truthScore,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during rollback'
      };

      this.rollbackHistory.push(rollbackEvent);

      if (this.rollbackConfig.notifyOnRollback) {
        this.notifyRollback(rollbackEvent);
      }

      return rollbackEvent;
    }
  }

  /**
   * Create a backup of the current configuration
   * @param configKey - Configuration key
   * @param environment - Environment name
   */
  private async createBackup(configKey: string, environment: string): Promise<void> {
    try {
      // Load current configuration
      const currentConfigResult = await this.configurationWorkflowService.loadConfiguration(
        environment,
        configKey
      );

      if (currentConfigResult.success && currentConfigResult.config) {
        // Create backup key with timestamp
        const timestamp = Date.now();
        const backupKey = `${this.rollbackConfig.backupKeyPrefix}${configKey}_${timestamp}`;

        // Save backup
        await this.encryptedConfigStore.save(backupKey, currentConfigResult.config);

        // Update backup history
        this.backupHistory.set(configKey, backupKey);

        // Clean up old backups (keep only last 5)
        await this.cleanupOldBackups(configKey);
      }
    } catch (error) {
      console.warn(`Failed to create backup for ${configKey}:`, error);
    }
  }

  /**
   * Clean up old backups, keeping only the most recent ones
   * @param configKey - Configuration key
   */
  private async cleanupOldBackups(configKey: string): Promise<void> {
    try {
      // List all configurations
      const allConfigs = await this.encryptedConfigStore.list();

      // Find backups for this config key
      const backupPrefix = `${this.rollbackConfig.backupKeyPrefix}${configKey}_`;
      const backups = allConfigs
        .filter(name => name.startsWith(backupPrefix))
        .sort()
        .reverse(); // Sort by timestamp, newest first

      // Delete old backups (keep only last 5)
      if (backups.length > 5) {
        const oldBackups = backups.slice(5);
        for (const backup of oldBackups) {
          await this.encryptedConfigStore.delete(backup);
        }
      }
    } catch (error) {
      console.warn(`Failed to cleanup old backups for ${configKey}:`, error);
    }
  }

  /**
   * Notify about rollback event
   * @param rollbackEvent - Rollback event
   */
  private notifyRollback(rollbackEvent: RollbackEvent): void {
    // In a real implementation, this would send notifications via email, Slack, etc.
    console.log(`[ROLLBACK] Configuration ${rollbackEvent.configKey} rolled back at ${new Date(rollbackEvent.timestamp).toISOString()}`);
    console.log(`  Reason: ${rollbackEvent.reason}`);
    console.log(`  Truth Score: ${rollbackEvent.truthScore.toFixed(2)}`);
    console.log(`  Success: ${rollbackEvent.success}`);
    if (rollbackEvent.error) {
      console.log(`  Error: ${rollbackEvent.error}`);
    }
    if (rollbackEvent.backupKey) {
      console.log(`  Backup Restored: ${rollbackEvent.backupKey}`);
    }
  }

  /**
   * Get rollback history
   * @returns Rollback history
   */
  getRollbackHistory(): RollbackEvent[] {
    return [...this.rollbackHistory];
  }

  /**
   * Get backup history
   * @returns Backup history map
   */
  getBackupHistory(): Map<string, string> {
    return new Map(this.backupHistory);
  }

  /**
   * Get rollback configuration
   * @returns Rollback configuration
   */
  getRollbackConfig(): RollbackConfig {
    return { ...this.rollbackConfig };
  }

  /**
   * Update rollback configuration
   * @param config - New rollback configuration
   */
  updateRollbackConfig(config: Partial<RollbackConfig>): void {
    Object.assign(this.rollbackConfig, config);
  }

  /**
   * Manually trigger rollback for a configuration
   * @param configKey - Configuration key
   * @param environment - Environment name
   * @param reason - Reason for manual rollback
   * @returns Rollback event
   */
  async manualRollback(
    configKey: string,
    environment: string,
    reason: string
  ): Promise<RollbackEvent> {
    const timestamp = Date.now();
    let backupKey = this.backupHistory.get(configKey);

    if (!backupKey) {
      const rollbackEvent: RollbackEvent = {
        timestamp,
        configKey,
        reason: `Manual rollback: ${reason} (No backup available)`,
        truthScore: 0, // Manual rollback has no truth score
        success: false,
        error: 'No previous configuration backup found'
      };

      this.rollbackHistory.push(rollbackEvent);
      this.notifyRollback(rollbackEvent);

      return rollbackEvent;
    }

    try {
      // Load the backup configuration
      const backupConfig = await this.encryptedConfigStore.load(backupKey);

      if (!backupConfig) {
        throw new Error(`Backup configuration not found for key: ${backupKey}`);
      }

      // Restore the backup configuration
      await this.configurationWorkflowService.saveConfiguration(environment, configKey, backupConfig);

      const rollbackEvent: RollbackEvent = {
        timestamp,
        configKey,
        reason: `Manual rollback: ${reason}`,
        truthScore: 0, // Manual rollback has no truth score
        backupKey,
        success: true
      };

      this.rollbackHistory.push(rollbackEvent);
      this.notifyRollback(rollbackEvent);

      return rollbackEvent;
    } catch (error) {
      const rollbackEvent: RollbackEvent = {
        timestamp,
        configKey,
        reason: `Manual rollback: ${reason}`,
        truthScore: 0, // Manual rollback has no truth score
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during manual rollback'
      };

      this.rollbackHistory.push(rollbackEvent);
      this.notifyRollback(rollbackEvent);

      return rollbackEvent;
    }
  }
}