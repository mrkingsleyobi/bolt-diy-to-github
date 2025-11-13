import { FilterConfig, FileMetadata, FilterResult } from '../../types/filters';
/**
 * Verification service for filter operations
 * Provides truth scoring based on multiple quality metrics
 */
export declare class FilterVerificationService {
    private static instance;
    private constructor();
    static getInstance(): FilterVerificationService;
    /**
     * Calculate truth score for filter operation
     * @param config Filter configuration used
     * @param files Input files
     * @param result Filter results
     * @returns Truth score between 0 and 1
     */
    calculateTruthScore(config: FilterConfig, files: FileMetadata[], result: FilterResult): number;
    /**
     * Calculate configuration completeness score
     * @param config Filter configuration
     * @returns Score between 0 and 1
     */
    private calculateConfigCompleteness;
    /**
     * Calculate pattern accuracy score based on expected vs actual filtering
     * @param config Filter configuration
     * @param files Input files
     * @param result Filter results
     * @returns Score between 0 and 1
     */
    private calculatePatternAccuracy;
    /**
     * Calculate consistency score based on deterministic behavior
     * @param config Filter configuration
     * @param files Input files
     * @param result Filter results
     * @returns Score between 0 and 1
     */
    private calculateConsistency;
    /**
     * Calculate performance efficiency score
     * @param result Filter results
     * @returns Score between 0 and 1
     */
    private calculatePerformanceEfficiency;
    /**
     * Calculate coverage score (how much of the input space is being filtered)
     * @param files Input files
     * @param result Filter results
     * @returns Score between 0 and 1
     */
    private calculateCoverage;
    /**
     * Check if truth score meets minimum threshold
     * @param score Calculated truth score
     * @param threshold Minimum required threshold (default 0.95)
     * @returns Whether score meets threshold
     */
    meetsThreshold(score: number, threshold?: number): boolean;
    /**
     * Generate verification report
     * @param config Filter configuration
     * @param files Input files
     * @param result Filter results
     * @param score Calculated truth score
     * @returns Detailed verification report
     */
    generateReport(config: FilterConfig, files: FileMetadata[], result: FilterResult, score: number): VerificationReport;
}
/**
 * Interface for verification report
 */
export interface VerificationReport {
    truthScore: number;
    meetsThreshold: boolean;
    metrics: {
        configCompleteness: number;
        patternAccuracy: number;
        consistency: number;
        performance: number;
        coverage: number;
    };
    summary: {
        totalFiles: number;
        includedFiles: number;
        excludedFiles: number;
        configuration: {
            includePatterns: number;
            excludePatterns: number;
            hasSizeFilters: boolean;
            hasContentTypeFilters: boolean;
        };
    };
    timestamp: string;
}
//# sourceMappingURL=FilterVerificationService.d.ts.map