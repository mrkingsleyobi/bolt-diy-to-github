"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterEngine = void 0;
const ConfigParser_1 = require("./ConfigParser");
const FilterHooksService_1 = require("./hooks/FilterHooksService");
const FilterVerificationService_1 = require("./verification/FilterVerificationService");
/**
 * Main file filter engine
 * Orchestrates all filters and applies them to files
 */
class FilterEngine {
    constructor() {
        this.configParser = new ConfigParser_1.ConfigParser();
    }
    /**
     * Filter files according to configuration
     * @param config Filter configuration
     * @param files Array of file metadata to filter
     * @returns Filter result with included and excluded files
     */
    async filter(config, files) {
        const hooksService = FilterHooksService_1.FilterHooksService.getInstance();
        const verificationService = FilterVerificationService_1.FilterVerificationService.getInstance();
        const startTime = Date.now();
        // Call pre-task hook
        await hooksService.preTask(`Filtering ${files.length} files with config: ${JSON.stringify(config)}`);
        // Parse configuration into filter instances
        const filters = this.configParser.parse(config);
        // Call post-edit hook for configuration
        await hooksService.postEdit('filter-config', config);
        // Initialize result structures
        const included = [];
        const excluded = [];
        const reasons = {};
        // For large file sets, process in parallel batches
        const batchSize = files.length > 1000 ? 100 : files.length;
        if (files.length > 1000) {
            // Process large file sets in parallel batches
            const batches = this.createBatches(files, batchSize);
            const batchResults = await Promise.all(batches.map(batch => this.processBatch(batch, filters)));
            // Merge results from all batches
            for (const batchResult of batchResults) {
                included.push(...batchResult.included);
                excluded.push(...batchResult.excluded);
                Object.assign(reasons, batchResult.reasons);
            }
        }
        else {
            // Process smaller file sets sequentially for better performance
            for (const file of files) {
                const filterResult = this.applyFilters(file, filters);
                if (filterResult.included) {
                    included.push(file.path);
                }
                else {
                    excluded.push(file.path);
                    reasons[file.path] = filterResult.reason;
                }
            }
        }
        const processingTime = Date.now() - startTime;
        // Create result summary
        const resultSummary = {
            totalFiles: files.length,
            includedFiles: included.length,
            excludedFiles: excluded.length,
            reasons: this.aggregateReasons(reasons),
            processingTimeMs: processingTime
        };
        // Create filter result
        const result = { included, excluded, reasons };
        // Calculate truth score
        const truthScore = verificationService.calculateTruthScore(config, files, result);
        // Generate verification report
        const verificationReport = verificationService.generateReport(config, files, result, truthScore);
        // Call post-task hook with truth score
        await hooksService.postTask(resultSummary, truthScore);
        // Add verification report to result
        return { ...result, verification: verificationReport };
    }
    /**
     * Process a batch of files with filters
     * @param files Batch of files to process
     * @param filters Filters to apply
     * @returns Results for the batch
     */
    async processBatch(files, filters) {
        const included = [];
        const excluded = [];
        const reasons = {};
        // Process files in the batch
        for (const file of files) {
            const filterResult = this.applyFilters(file, filters);
            if (filterResult.included) {
                included.push(file.path);
            }
            else {
                excluded.push(file.path);
                reasons[file.path] = filterResult.reason;
            }
        }
        return { included, excluded, reasons };
    }
    /**
     * Create batches of files for parallel processing
     * @param files Files to batch
     * @param batchSize Size of each batch
     * @returns Array of file batches
     */
    createBatches(files, batchSize) {
        const batches = [];
        for (let i = 0; i < files.length; i += batchSize) {
            batches.push(files.slice(i, i + batchSize));
        }
        return batches;
    }
    /**
     * Apply all filters to a single file
     * @param file File metadata
     * @param filters Array of filters to apply
     * @returns Object with inclusion status and exclusion reason
     */
    applyFilters(file, filters) {
        // Apply each filter in order
        for (const filter of filters) {
            if (!filter.apply(file)) {
                return {
                    included: false,
                    reason: filter.getReason()
                };
            }
        }
        // File passed all filters
        return {
            included: true,
            reason: ''
        };
    }
    /**
     * Aggregate exclusion reasons for reporting
     * @param reasons Record of file paths to exclusion reasons
     * @returns Aggregated count of reasons
     */
    aggregateReasons(reasons) {
        const aggregated = {};
        for (const reason of Object.values(reasons)) {
            if (reason) {
                aggregated[reason] = (aggregated[reason] || 0) + 1;
            }
        }
        return aggregated;
    }
}
exports.FilterEngine = FilterEngine;
//# sourceMappingURL=FilterEngine.js.map