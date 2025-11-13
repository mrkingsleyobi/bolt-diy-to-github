import { FilterConfig, FilterResult, FileMetadata } from '../types/filters';
import { ConfigParser } from './ConfigParser';
import { FilterHooksService, FilterResultSummary } from './hooks/FilterHooksService';
import { FilterVerificationService, VerificationReport } from './verification/FilterVerificationService';

/**
 * Main file filter engine
 * Orchestrates all filters and applies them to files
 */
export class FilterEngine {
  private configParser: ConfigParser;

  constructor() {
    this.configParser = new ConfigParser();
  }

  /**
   * Filter files according to configuration
   * @param config Filter configuration
   * @param files Array of file metadata to filter
   * @returns Filter result with included and excluded files
   */
  async filter(config: FilterConfig, files: FileMetadata[]): Promise<FilterResult & { verification?: VerificationReport }> {
    const hooksService = FilterHooksService.getInstance();
    const verificationService = FilterVerificationService.getInstance();
    const startTime = Date.now();

    // Call pre-task hook
    await hooksService.preTask(`Filtering ${files.length} files with config: ${JSON.stringify(config)}`);

    // Parse configuration into filter instances
    const filters = this.configParser.parse(config);

    // Call post-edit hook for configuration
    await hooksService.postEdit('filter-config', config);

    // Initialize result structures
    const included: string[] = [];
    const excluded: string[] = [];
    const reasons: Record<string, string> = {};

    // For large file sets, process in parallel batches
    const batchSize = files.length > 1000 ? 100 : files.length;

    if (files.length > 1000) {
      // Process large file sets in parallel batches
      const batches = this.createBatches(files, batchSize);
      const batchResults = await Promise.all(
        batches.map(batch => this.processBatch(batch, filters))
      );

      // Merge results from all batches
      for (const batchResult of batchResults) {
        included.push(...batchResult.included);
        excluded.push(...batchResult.excluded);
        Object.assign(reasons, batchResult.reasons);
      }
    } else {
      // Process smaller file sets sequentially for better performance
      for (const file of files) {
        const filterResult = this.applyFilters(file, filters);

        if (filterResult.included) {
          included.push(file.path);
        } else {
          excluded.push(file.path);
          reasons[file.path] = filterResult.reason;
        }
      }
    }

    const processingTime = Date.now() - startTime;

    // Create result summary
    const resultSummary: FilterResultSummary = {
      totalFiles: files.length,
      includedFiles: included.length,
      excludedFiles: excluded.length,
      reasons: this.aggregateReasons(reasons),
      processingTimeMs: processingTime
    };

    // Create filter result
    const result: FilterResult = { included, excluded, reasons };

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
  private async processBatch(
    files: FileMetadata[],
    filters: any[]
  ): Promise<{ included: string[]; excluded: string[]; reasons: Record<string, string> }> {
    const included: string[] = [];
    const excluded: string[] = [];
    const reasons: Record<string, string> = {};

    // Process files in the batch
    for (const file of files) {
      const filterResult = this.applyFilters(file, filters);

      if (filterResult.included) {
        included.push(file.path);
      } else {
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
  private createBatches(files: FileMetadata[], batchSize: number): FileMetadata[][] {
    const batches: FileMetadata[][] = [];

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
  private applyFilters(file: FileMetadata, filters: any[]): { included: boolean; reason: string } {
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
  private aggregateReasons(reasons: Record<string, string>): Record<string, number> {
    const aggregated: Record<string, number> = {};

    for (const reason of Object.values(reasons)) {
      if (reason) {
        aggregated[reason] = (aggregated[reason] || 0) + 1;
      }
    }

    return aggregated;
  }
}