// TruthVerificationService.ts - Service for truth verification scoring in configuration management
// Phase 4: Environment Configuration Management - Task 12: Integrate truth verification scoring in configuration management

import { ConfigurationWorkflowResult } from '../config/ConfigurationWorkflowService';
import { ConfigValidationResult } from '../config/ConfigValidator';

/**
 * Interface for truth verification result
 */
export interface TruthVerificationResult {
  /**
   * Overall truth score (0.0 to 1.0)
   */
  score: number;

  /**
   * Whether the configuration meets the minimum truth threshold
   */
  meetsThreshold: boolean;

  /**
   * Detailed breakdown of truth factors
   */
  factors: TruthFactors;

  /**
   * Recommendations for improving truth score
   */
  recommendations: string[];
}

/**
 * Interface for truth factors that contribute to the truth score
 */
export interface TruthFactors {
  /**
   * Validation score (0.0 to 1.0)
   */
  validation: number;

  /**
   * Security score (0.0 to 1.0)
   */
  security: number;

  /**
   * Completeness score (0.0 to 1.0)
   */
  completeness: number;

  /**
   * Consistency score (0.0 to 1.0)
   */
  consistency: number;

  /**
   * Freshness score (0.0 to 1.0)
   */
  freshness: number;
}

/**
 * Interface for truth verification options
 */
export interface TruthVerificationOptions {
  /**
   * Minimum truth score threshold (default: 0.95)
   */
  threshold?: number;

  /**
   * Whether to enable auto-rollback for low truth scores (default: false)
   */
  autoRollback?: boolean;

  /**
   * Weight factors for truth score calculation
   */
  weights?: {
    validation?: number;
    security?: number;
    completeness?: number;
    consistency?: number;
    freshness?: number;
  };
}

/**
 * Service for truth verification scoring in configuration management
 */
export class TruthVerificationService {
  private readonly threshold: number;
  private readonly autoRollback: boolean;
  private readonly weights: {
    validation: number;
    security: number;
    completeness: number;
    consistency: number;
    freshness: number;
  };

  constructor(options: TruthVerificationOptions = {}) {
    this.threshold = options.threshold ?? 0.95;
    this.autoRollback = options.autoRollback ?? false;
    this.weights = {
      validation: options.weights?.validation ?? 0.3,
      security: options.weights?.security ?? 0.25,
      completeness: options.weights?.completeness ?? 0.2,
      consistency: options.weights?.consistency ?? 0.15,
      freshness: options.weights?.freshness ?? 0.1
    };

    // Validate that weights sum to 1.0
    const totalWeight = Object.values(this.weights).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      throw new Error('Truth verification weights must sum to 1.0');
    }
  }

  /**
   * Verify the truth of a configuration workflow result
   * @param result - Configuration workflow result
   * @param previousResult - Optional previous result for consistency comparison
   * @returns Truth verification result
   */
  verifyConfigurationResult(
    result: ConfigurationWorkflowResult,
    previousResult?: ConfigurationWorkflowResult
  ): TruthVerificationResult {
    // If the result already has a truth score, use it as a base
    if (result.truthScore !== undefined) {
      const baseScore = result.truthScore;

      // Calculate factors based on the base score and result properties
      const factors: TruthFactors = {
        validation: result.validation?.valid !== false ? baseScore : baseScore * 0.7,
        security: this.calculateSecurityScore(result),
        completeness: this.calculateCompletenessScore(result),
        consistency: previousResult ? this.calculateConsistencyScore(result, previousResult) : baseScore,
        freshness: this.calculateFreshnessScore(result)
      };

      // Calculate weighted score
      const score = this.calculateWeightedScore(factors);

      // Generate recommendations
      const recommendations = this.generateRecommendations(factors, score);

      return {
        score,
        meetsThreshold: score >= this.threshold,
        factors,
        recommendations
      };
    }

    // If no truth score, calculate from scratch
    const factors: TruthFactors = {
      validation: result.validation?.valid !== false ? 0.9 : 0.3,
      security: this.calculateSecurityScore(result),
      completeness: this.calculateCompletenessScore(result),
      consistency: previousResult ? this.calculateConsistencyScore(result, previousResult) : 0.8,
      freshness: this.calculateFreshnessScore(result)
    };

    // Calculate weighted score
    const score = this.calculateWeightedScore(factors);

    // Generate recommendations
    const recommendations = this.generateRecommendations(factors, score);

    return {
      score,
      meetsThreshold: score >= this.threshold,
      factors,
      recommendations
    };
  }

  /**
   * Calculate security score based on configuration properties
   * @param result - Configuration workflow result
   * @returns Security score (0.0 to 1.0)
   */
  private calculateSecurityScore(result: ConfigurationWorkflowResult): number {
    if (!result.config) {
      return 0.5; // Neutral score for missing config
    }

    let securityScore = 1.0;

    // Check for sensitive data exposure
    if (result.config.github?.token) {
      securityScore -= 0.3; // Heavy penalty for token exposure
    }

    // Check security settings
    if (result.config.security) {
      if (result.config.security.encryptionEnabled === false) {
        securityScore -= 0.2;
      }
      if (result.config.security.authTimeout < 10000) {
        securityScore -= 0.1;
      }
      if (result.config.security.rateLimit > 1000) {
        securityScore -= 0.1;
      }
    }

    // Check limits for security
    if (result.config.limits) {
      if (result.config.limits.maxFileSize > 104857600) {
        securityScore -= 0.1;
      }
      if (result.config.limits.maxConnections > 50) {
        securityScore -= 0.1;
      }
    }

    return Math.max(0, Math.min(1, securityScore)); // Clamp between 0 and 1
  }

  /**
   * Calculate completeness score based on required configuration properties
   * @param result - Configuration workflow result
   * @returns Completeness score (0.0 to 1.0)
   */
  private calculateCompletenessScore(result: ConfigurationWorkflowResult): number {
    if (!result.config) {
      return 0.0; // No config means no completeness
    }

    const requiredProperties = [
      'environment',
      'github.repository',
      'github.owner',
      'deployment.target'
    ];

    let presentProperties = 0;

    for (const prop of requiredProperties) {
      const parts = prop.split('.');
      let current: any = result.config;
      let found = true;

      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          found = false;
          break;
        }
      }

      if (found && current !== undefined && current !== null) {
        presentProperties++;
      }
    }

    return presentProperties / requiredProperties.length;
  }

  /**
   * Calculate consistency score by comparing with previous result
   * @param result - Current configuration workflow result
   * @param previousResult - Previous configuration workflow result
   * @returns Consistency score (0.0 to 1.0)
   */
  private calculateConsistencyScore(
    result: ConfigurationWorkflowResult,
    previousResult: ConfigurationWorkflowResult
  ): number {
    if (!result.config || !previousResult.config) {
      return 0.5; // Neutral score for missing configs
    }

    // Compare environment
    const environmentConsistent =
      result.config.environment === previousResult.config.environment ? 1 : 0;

    // Compare deployment target
    const deploymentTargetConsistent =
      result.config.deployment?.target === previousResult.config.deployment?.target ? 1 : 0;

    // Compare security settings
    const securityConsistent =
      result.config.security?.encryptionEnabled === previousResult.config.security?.encryptionEnabled ? 1 : 0;

    // Average the consistency factors
    return (environmentConsistent + deploymentTargetConsistent + securityConsistent) / 3;
  }

  /**
   * Calculate freshness score based on result timestamp
   * @param result - Configuration workflow result
   * @returns Freshness score (0.0 to 1.0)
   */
  private calculateFreshnessScore(result: ConfigurationWorkflowResult): number {
    // For this implementation, we'll use a placeholder
    // In a real implementation, we would check timestamps and data freshness
    return 0.8; // Assume relatively fresh data
  }

  /**
   * Calculate weighted truth score from factors
   * @param factors - Truth factors
   * @returns Weighted truth score (0.0 to 1.0)
   */
  private calculateWeightedScore(factors: TruthFactors): number {
    return (
      factors.validation * this.weights.validation +
      factors.security * this.weights.security +
      factors.completeness * this.weights.completeness +
      factors.consistency * this.weights.consistency +
      factors.freshness * this.weights.freshness
    );
  }

  /**
   * Generate recommendations for improving truth score
   * @param factors - Truth factors
   * @param score - Current truth score
   * @returns Array of recommendations
   */
  private generateRecommendations(factors: TruthFactors, score: number): string[] {
    const recommendations: string[] = [];

    if (score < this.threshold) {
      recommendations.push(`Overall truth score ${score.toFixed(2)} is below threshold ${this.threshold.toFixed(2)}`);
    }

    if (factors.validation < 0.8) {
      recommendations.push('Improve configuration validation - fix validation errors');
    }

    if (factors.security < 0.7) {
      recommendations.push('Address security vulnerabilities - enable encryption, review limits');
    }

    if (factors.completeness < 0.8) {
      recommendations.push('Complete missing required configuration properties');
    }

    if (factors.consistency < 0.7) {
      recommendations.push('Ensure configuration consistency with previous versions');
    }

    if (factors.freshness < 0.7) {
      recommendations.push('Update configuration with fresh data');
    }

    if (recommendations.length === 0) {
      recommendations.push('Configuration truth score is excellent - no improvements needed');
    }

    return recommendations;
  }

  /**
   * Get the current truth threshold
   * @returns Truth threshold
   */
  getThreshold(): number {
    return this.threshold;
  }

  /**
   * Check if a score meets the truth threshold
   * @param score - Truth score to check
   * @returns Whether the score meets the threshold
   */
  meetsThreshold(score: number): boolean {
    return score >= this.threshold;
  }
}