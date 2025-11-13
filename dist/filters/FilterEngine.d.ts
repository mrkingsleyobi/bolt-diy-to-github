import { FilterConfig, FilterResult, FileMetadata } from '../types/filters';
import { VerificationReport } from './verification/FilterVerificationService';
/**
 * Main file filter engine
 * Orchestrates all filters and applies them to files
 */
export declare class FilterEngine {
    private configParser;
    constructor();
    /**
     * Filter files according to configuration
     * @param config Filter configuration
     * @param files Array of file metadata to filter
     * @returns Filter result with included and excluded files
     */
    filter(config: FilterConfig, files: FileMetadata[]): Promise<FilterResult & {
        verification?: VerificationReport;
    }>;
    /**
     * Process a batch of files with filters
     * @param files Batch of files to process
     * @param filters Filters to apply
     * @returns Results for the batch
     */
    private processBatch;
    /**
     * Create batches of files for parallel processing
     * @param files Files to batch
     * @param batchSize Size of each batch
     * @returns Array of file batches
     */
    private createBatches;
    /**
     * Apply all filters to a single file
     * @param file File metadata
     * @param filters Array of filters to apply
     * @returns Object with inclusion status and exclusion reason
     */
    private applyFilters;
    /**
     * Aggregate exclusion reasons for reporting
     * @param reasons Record of file paths to exclusion reasons
     * @returns Aggregated count of reasons
     */
    private aggregateReasons;
}
//# sourceMappingURL=FilterEngine.d.ts.map