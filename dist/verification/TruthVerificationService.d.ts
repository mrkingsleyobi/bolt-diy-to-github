import { ConfigurationWorkflowResult } from '../config/ConfigurationWorkflowService';
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
export declare class TruthVerificationService {
    private readonly threshold;
    private readonly autoRollback;
    private readonly weights;
    constructor(options?: TruthVerificationOptions);
    /**
     * Verify the truth of a configuration workflow result
     * @param result - Configuration workflow result
     * @param previousResult - Optional previous result for consistency comparison
     * @returns Truth verification result
     */
    verifyConfigurationResult(result: ConfigurationWorkflowResult, previousResult?: ConfigurationWorkflowResult): TruthVerificationResult;
    /**
     * Calculate security score based on configuration properties
     * @param result - Configuration workflow result
     * @returns Security score (0.0 to 1.0)
     */
    private calculateSecurityScore;
    /**
     * Calculate completeness score based on required configuration properties
     * @param result - Configuration workflow result
     * @returns Completeness score (0.0 to 1.0)
     */
    private calculateCompletenessScore;
    /**
     * Calculate consistency score by comparing with previous result
     * @param result - Current configuration workflow result
     * @param previousResult - Previous configuration workflow result
     * @returns Consistency score (0.0 to 1.0)
     */
    private calculateConsistencyScore;
    /**
     * Calculate freshness score based on result timestamp
     * @param result - Configuration workflow result
     * @returns Freshness score (0.0 to 1.0)
     */
    private calculateFreshnessScore;
    /**
     * Calculate weighted truth score from factors
     * @param factors - Truth factors
     * @returns Weighted truth score (0.0 to 1.0)
     */
    private calculateWeightedScore;
    /**
     * Generate recommendations for improving truth score
     * @param factors - Truth factors
     * @param score - Current truth score
     * @returns Array of recommendations
     */
    private generateRecommendations;
    /**
     * Get the current truth threshold
     * @returns Truth threshold
     */
    getThreshold(): number;
    /**
     * Check if a score meets the truth threshold
     * @param score - Truth score to check
     * @returns Whether the score meets the threshold
     */
    meetsThreshold(score: number): boolean;
}
//# sourceMappingURL=TruthVerificationService.d.ts.map