"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterVerificationService = void 0;
/**
 * Verification service for filter operations
 * Provides truth scoring based on multiple quality metrics
 */
class FilterVerificationService {
    constructor() { }
    static getInstance() {
        if (!FilterVerificationService.instance) {
            FilterVerificationService.instance = new FilterVerificationService();
        }
        return FilterVerificationService.instance;
    }
    /**
     * Calculate truth score for filter operation
     * @param config Filter configuration used
     * @param files Input files
     * @param result Filter results
     * @returns Truth score between 0 and 1
     */
    calculateTruthScore(config, files, result) {
        // Calculate multiple metrics
        const metrics = {
            configCompleteness: this.calculateConfigCompleteness(config),
            patternAccuracy: this.calculatePatternAccuracy(config, files, result),
            consistency: this.calculateConsistency(config, files, result),
            performance: this.calculatePerformanceEfficiency(result),
            coverage: this.calculateCoverage(files, result)
        };
        // Weighted average of metrics (must sum to 1.0)
        const weights = {
            configCompleteness: 0.2,
            patternAccuracy: 0.3,
            consistency: 0.2,
            performance: 0.15,
            coverage: 0.15
        };
        let totalScore = 0;
        for (const [metric, weight] of Object.entries(weights)) {
            totalScore += metrics[metric] * weight;
        }
        // Ensure score is between 0 and 1
        return Math.max(0, Math.min(1, totalScore));
    }
    /**
     * Calculate configuration completeness score
     * @param config Filter configuration
     * @returns Score between 0 and 1
     */
    calculateConfigCompleteness(config) {
        let score = 0;
        const totalChecks = 4;
        // Check if required fields are present
        if (config.include !== undefined)
            score++;
        if (config.exclude !== undefined)
            score++;
        if (config.maxSize !== undefined || config.minSize !== undefined)
            score++;
        if (config.contentTypes !== undefined)
            score++;
        return score / totalChecks;
    }
    /**
     * Calculate pattern accuracy score based on expected vs actual filtering
     * @param config Filter configuration
     * @param files Input files
     * @param result Filter results
     * @returns Score between 0 and 1
     */
    calculatePatternAccuracy(config, files, result) {
        // For this implementation, we'll use a heuristic based on pattern complexity
        // and result distribution
        const totalFiles = files.length;
        if (totalFiles === 0)
            return 1; // Perfect score for empty input
        const includedRatio = result.included.length / totalFiles;
        const excludedRatio = result.excluded.length / totalFiles;
        // Check for reasonable distribution
        // A good filter should not include or exclude 100% of files unless explicitly configured
        let score = 1;
        // If all files are included or excluded, reduce score unless that's expected
        if (includedRatio === 1 && !config.include && config.exclude && config.exclude.length > 0) {
            // All files included but we have exclude patterns - might be issue
            score *= 0.7;
        }
        if (excludedRatio === 1 && config.include && config.include.length > 0) {
            // All files excluded but we have include patterns - might be issue
            score *= 0.7;
        }
        // Check pattern complexity
        const patternCount = (config.include ? config.include.length : 0) +
            (config.exclude ? config.exclude.length : 0);
        // More patterns generally mean more complexity, but also more precision
        // Score increases with pattern count up to a point
        const complexityFactor = Math.min(1, patternCount / 5);
        score *= (0.8 + 0.2 * complexityFactor);
        return Math.max(0, Math.min(1, score));
    }
    /**
     * Calculate consistency score based on deterministic behavior
     * @param config Filter configuration
     * @param files Input files
     * @param result Filter results
     * @returns Score between 0 and 1
     */
    calculateConsistency(config, files, result) {
        // In a real implementation, we would run the filter multiple times
        // and check for consistent results. For now, we'll assume consistency
        // and base the score on the presence of clear exclusion reasons.
        const filesWithReasons = Object.keys(result.reasons).length;
        const excludedFiles = result.excluded.length;
        // If we have reasons for all excluded files, that's good consistency
        if (excludedFiles === 0)
            return 1; // Perfect consistency when no files excluded
        const reasonCoverage = filesWithReasons / excludedFiles;
        return reasonCoverage; // 1.0 if all excluded files have reasons
    }
    /**
     * Calculate performance efficiency score
     * @param result Filter results
     * @returns Score between 0 and 1
     */
    calculatePerformanceEfficiency(result) {
        // In a real implementation, we would measure actual processing time
        // For now, we'll use a heuristic based on result size and complexity
        const totalResults = result.included.length + result.excluded.length;
        // Performance score degrades with very large result sets
        // This is a simplified model - in reality, performance would be measured directly
        if (totalResults === 0)
            return 1;
        // Assume good performance for reasonable result sizes
        // Performance degrades for very large datasets
        const performanceFactor = Math.min(1, 10000 / totalResults);
        return Math.max(0.5, performanceFactor); // Minimum 0.5 score
    }
    /**
     * Calculate coverage score (how much of the input space is being filtered)
     * @param files Input files
     * @param result Filter results
     * @returns Score between 0 and 1
     */
    calculateCoverage(files, result) {
        // Coverage measures how much of the input is being processed
        const totalFiles = files.length;
        if (totalFiles === 0)
            return 1; // Full coverage of empty set
        // In this context, coverage is 1.0 since we're processing all input files
        // In other contexts, it might measure how much of a codebase is covered by tests
        return 1;
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
     * @param config Filter configuration
     * @param files Input files
     * @param result Filter results
     * @param score Calculated truth score
     * @returns Detailed verification report
     */
    generateReport(config, files, result, score) {
        return {
            truthScore: score,
            meetsThreshold: this.meetsThreshold(score),
            metrics: {
                configCompleteness: this.calculateConfigCompleteness(config),
                patternAccuracy: this.calculatePatternAccuracy(config, files, result),
                consistency: this.calculateConsistency(config, files, result),
                performance: this.calculatePerformanceEfficiency(result),
                coverage: this.calculateCoverage(files, result)
            },
            summary: {
                totalFiles: files.length,
                includedFiles: result.included.length,
                excludedFiles: result.excluded.length,
                configuration: {
                    includePatterns: config.include ? config.include.length : 0,
                    excludePatterns: config.exclude ? config.exclude.length : 0,
                    hasSizeFilters: config.maxSize !== undefined || config.minSize !== undefined,
                    hasContentTypeFilters: config.contentTypes !== undefined && config.contentTypes.length > 0
                }
            },
            timestamp: new Date().toISOString()
        };
    }
}
exports.FilterVerificationService = FilterVerificationService;
//# sourceMappingURL=FilterVerificationService.js.map