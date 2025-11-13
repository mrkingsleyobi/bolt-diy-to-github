import { BatchFileOperation, BatchFileOperationResult } from '../types/github';
/**
 * Verification service for file operations
 * Provides truth scoring based on multiple quality metrics
 */
export declare class FileVerificationService {
    private static instance;
    private constructor();
    static getInstance(): FileVerificationService;
    /**
     * Calculate truth score for file operations
     * @param operations File operations performed
     * @param results Operation results
     * @returns Truth score between 0 and 1
     */
    calculateTruthScore(operations: BatchFileOperation[], results: BatchFileOperationResult[]): number;
    /**
     * Calculate operation accuracy score
     * @param operations File operations requested
     * @param results Operation results
     * @returns Score between 0 and 1
     */
    private calculateOperationAccuracy;
    /**
     * Calculate result consistency score
     * @param results Operation results
     * @returns Score between 0 and 1
     */
    private calculateResultConsistency;
    /**
     * Calculate performance efficiency score
     * @param results Operation results
     * @returns Score between 0 and 1
     */
    private calculatePerformanceEfficiency;
    /**
     * Calculate error handling quality score
     * @param operations File operations requested
     * @param results Operation results
     * @returns Score between 0 and 1
     */
    private calculateErrorHandlingQuality;
    /**
     * Check if truth score meets minimum threshold
     * @param score Calculated truth score
     * @param threshold Minimum required threshold (default 0.95)
     * @returns Whether score meets threshold
     */
    meetsThreshold(score: number, threshold?: number): boolean;
    /**
     * Generate verification report
     * @param operations File operations performed
     * @param results Operation results
     * @param score Calculated truth score
     * @returns Detailed verification report
     */
    generateReport(operations: BatchFileOperation[], results: BatchFileOperationResult[], score: number): FileVerificationReport;
    /**
     * Get counts of each operation type
     * @param operations File operations
     * @returns Object with operation type counts
     */
    private getOperationTypeCounts;
}
/**
 * Interface for file verification report
 */
export interface FileVerificationReport {
    truthScore: number;
    meetsThreshold: boolean;
    metrics: {
        operationAccuracy: number;
        resultConsistency: number;
        performance: number;
        errorHandling: number;
    };
    summary: {
        totalOperations: number;
        successfulOperations: number;
        failedOperations: number;
        operationTypes: Record<string, number>;
    };
    timestamp: string;
}
//# sourceMappingURL=FileVerificationService.d.ts.map