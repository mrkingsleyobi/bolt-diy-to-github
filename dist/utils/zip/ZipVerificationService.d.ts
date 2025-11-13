import { StreamEntry } from '../../types/streaming';
import { ZipExtractionResult } from '../../types/zip';
/**
 * Verification service for ZIP operations
 * Provides truth scoring based on multiple quality metrics for ZIP processing
 */
export declare class ZipVerificationService {
    private static instance;
    private constructor();
    static getInstance(): ZipVerificationService;
    /**
     * Calculate truth score for ZIP extraction operation
     * @param entries Input stream entries
     * @param result Extraction results
     * @param processingTime Processing time in milliseconds
     * @returns Truth score between 0 and 1
     */
    calculateTruthScore(entries: StreamEntry[], result: ZipExtractionResult, processingTime: number): number;
    /**
     * Calculate extraction accuracy score
     * @param entries Input stream entries
     * @param result Extraction results
     * @returns Score between 0 and 1
     */
    private calculateExtractionAccuracy;
    /**
     * Calculate data integrity score
     * @param entries Input stream entries
     * @param result Extraction results
     * @returns Score between 0 and 1
     */
    private calculateDataIntegrity;
    /**
     * Calculate performance efficiency score
     * @param entries Input stream entries
     * @param result Extraction results
     * @param processingTime Processing time in milliseconds
     * @returns Score between 0 and 1
     */
    private calculatePerformanceEfficiency;
    /**
     * Calculate resource usage efficiency score
     * @param result Extraction results
     * @returns Score between 0 and 1
     */
    private calculateResourceEfficiency;
    /**
     * Calculate consistency score
     * @param result Extraction results
     * @returns Score between 0 and 1
     */
    private calculateConsistency;
    /**
     * Check if truth score meets minimum threshold
     * @param score Calculated truth score
     * @param threshold Minimum required threshold (default 0.95)
     * @returns Whether score meets threshold
     */
    meetsThreshold(score: number, threshold?: number): boolean;
    /**
     * Generate verification report
     * @param entries Input stream entries
     * @param result Extraction results
     * @param processingTime Processing time in milliseconds
     * @param score Calculated truth score
     * @returns Detailed verification report
     */
    generateReport(entries: StreamEntry[], result: ZipExtractionResult, processingTime: number, score: number): ZipVerificationReport;
}
/**
 * Interface for ZIP verification report
 */
export interface ZipVerificationReport {
    truthScore: number;
    meetsThreshold: boolean;
    metrics: {
        extractionAccuracy: number;
        dataIntegrity: number;
        performance: number;
        resourceUsage: number;
        consistency: number;
    };
    summary: {
        totalEntries: number;
        extractedEntries: number;
        totalSize: number;
        warnings: number;
        processingTimeMs: number;
    };
    timestamp: string;
}
//# sourceMappingURL=ZipVerificationService.d.ts.map