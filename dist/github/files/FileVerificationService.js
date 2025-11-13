"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileVerificationService = void 0;
/**
 * Verification service for file operations
 * Provides truth scoring based on multiple quality metrics
 */
class FileVerificationService {
    constructor() { }
    static getInstance() {
        if (!FileVerificationService.instance) {
            FileVerificationService.instance = new FileVerificationService();
        }
        return FileVerificationService.instance;
    }
    /**
     * Calculate truth score for file operations
     * @param operations File operations performed
     * @param results Operation results
     * @returns Truth score between 0 and 1
     */
    calculateTruthScore(operations, results) {
        // Calculate multiple metrics
        const metrics = {
            operationAccuracy: this.calculateOperationAccuracy(operations, results),
            resultConsistency: this.calculateResultConsistency(results),
            performance: this.calculatePerformanceEfficiency(results),
            errorHandling: this.calculateErrorHandlingQuality(operations, results)
        };
        // Weighted average of metrics (must sum to 1.0)
        const weights = {
            operationAccuracy: 0.3,
            resultConsistency: 0.25,
            performance: 0.2,
            errorHandling: 0.25
        };
        let totalScore = 0;
        for (const [metric, weight] of Object.entries(weights)) {
            totalScore += metrics[metric] * weight;
        }
        // Ensure score is between 0 and 1
        return Math.max(0, Math.min(1, totalScore));
    }
    /**
     * Calculate operation accuracy score
     * @param operations File operations requested
     * @param results Operation results
     * @returns Score between 0 and 1
     */
    calculateOperationAccuracy(operations, results) {
        if (operations.length === 0)
            return 1; // Perfect score for no operations
        // Check if all operations have corresponding results
        const matchingResults = results.filter(result => operations.some(op => op.path === result.path));
        // Accuracy is based on how many operations were properly executed
        return matchingResults.length / operations.length;
    }
    /**
     * Calculate result consistency score
     * @param results Operation results
     * @returns Score between 0 and 1
     */
    calculateResultConsistency(results) {
        const totalOperations = results.length;
        if (totalOperations === 0)
            return 1; // Perfect consistency for no operations
        // Count successful operations
        const successfulOperations = results.filter(result => result.success).length;
        // Consistency is measured by the ratio of successful operations
        // In a perfect system, all operations should succeed
        return successfulOperations / totalOperations;
    }
    /**
     * Calculate performance efficiency score
     * @param results Operation results
     * @returns Score between 0 and 1
     */
    calculatePerformanceEfficiency(results) {
        // In a real implementation, we would measure actual processing time
        // For now, we'll use a heuristic based on result size and complexity
        const totalResults = results.length;
        if (totalResults === 0)
            return 1;
        // Performance score degrades with very large result sets
        // This is a simplified model - in reality, performance would be measured directly
        const performanceFactor = Math.min(1, 100 / totalResults);
        return Math.max(0.5, performanceFactor); // Minimum 0.5 score
    }
    /**
     * Calculate error handling quality score
     * @param operations File operations requested
     * @param results Operation results
     * @returns Score between 0 and 1
     */
    calculateErrorHandlingQuality(operations, results) {
        // Check if failed operations have proper error messages
        const failedResults = results.filter(result => !result.success);
        if (failedResults.length === 0)
            return 1; // Perfect score when no failures
        // Count how many failures have meaningful error messages
        const meaningfulErrors = failedResults.filter(result => result.error && result.error.length > 10 // At least 10 characters for a meaningful error
        ).length;
        return meaningfulErrors / failedResults.length;
    }
    /**
     * Check if truth score meets minimum threshold
     * @param score Calculated truth score
     * @param threshold Minimum required threshold (default 0.95)
     * @returns Whether score meets threshold
     */
    meetsThreshold(score, threshold = 0.95) {
        return score >= threshold;
    }
    /**
     * Generate verification report
     * @param operations File operations performed
     * @param results Operation results
     * @param score Calculated truth score
     * @returns Detailed verification report
     */
    generateReport(operations, results, score) {
        return {
            truthScore: score,
            meetsThreshold: this.meetsThreshold(score),
            metrics: {
                operationAccuracy: this.calculateOperationAccuracy(operations, results),
                resultConsistency: this.calculateResultConsistency(results),
                performance: this.calculatePerformanceEfficiency(results),
                errorHandling: this.calculateErrorHandlingQuality(operations, results)
            },
            summary: {
                totalOperations: operations.length,
                successfulOperations: results.filter(r => r.success).length,
                failedOperations: results.filter(r => !r.success).length,
                operationTypes: this.getOperationTypeCounts(operations)
            },
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Get counts of each operation type
     * @param operations File operations
     * @returns Object with operation type counts
     */
    getOperationTypeCounts(operations) {
        const counts = {
            create: 0,
            update: 0,
            delete: 0
        };
        operations.forEach(op => {
            counts[op.operation] = (counts[op.operation] || 0) + 1;
        });
        return counts;
    }
}
exports.FileVerificationService = FileVerificationService;
//# sourceMappingURL=FileVerificationService.js.map