import { StreamEntry } from '../../types/streaming';
import { ZipExtractionResult } from '../../types/zip';

/**
 * Verification service for ZIP operations
 * Provides truth scoring based on multiple quality metrics for ZIP processing
 */
export class ZipVerificationService {
  private static instance: ZipVerificationService;

  private constructor() {}

  static getInstance(): ZipVerificationService {
    if (!ZipVerificationService.instance) {
      ZipVerificationService.instance = new ZipVerificationService();
    }
    return ZipVerificationService.instance;
  }

  /**
   * Calculate truth score for ZIP extraction operation
   * @param entries Input stream entries
   * @param result Extraction results
   * @param processingTime Processing time in milliseconds
   * @returns Truth score between 0 and 1
   */
  calculateTruthScore(
    entries: StreamEntry[],
    result: ZipExtractionResult,
    processingTime: number
  ): number {
    // Calculate multiple metrics
    const metrics = {
      extractionAccuracy: this.calculateExtractionAccuracy(entries, result),
      dataIntegrity: this.calculateDataIntegrity(entries, result),
      performance: this.calculatePerformanceEfficiency(entries, result, processingTime),
      resourceUsage: this.calculateResourceEfficiency(result),
      consistency: this.calculateConsistency(result)
    };

    // Weighted average of metrics (must sum to 1.0)
    const weights = {
      extractionAccuracy: 0.3,
      dataIntegrity: 0.25,
      performance: 0.2,
      resourceUsage: 0.15,
      consistency: 0.1
    };

    let totalScore = 0;
    for (const [metric, weight] of Object.entries(weights)) {
      totalScore += (metrics as any)[metric] * weight;
    }

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, totalScore));
  }

  /**
   * Calculate extraction accuracy score
   * @param entries Input stream entries
   * @param result Extraction results
   * @returns Score between 0 and 1
   */
  private calculateExtractionAccuracy(
    entries: StreamEntry[],
    result: ZipExtractionResult
  ): number {
    const totalEntries = entries.length;
    if (totalEntries === 0) return 1; // Perfect score for no entries

    // Count successfully extracted entries
    const successRate = result.extractedCount / totalEntries;

    // Adjust for warnings - each warning reduces score slightly
    const warningPenalty = result.warnings.length * 0.05;

    return Math.max(0, Math.min(1, successRate - warningPenalty));
  }

  /**
   * Calculate data integrity score
   * @param entries Input stream entries
   * @param result Extraction results
   * @returns Score between 0 and 1
   */
  private calculateDataIntegrity(
    entries: StreamEntry[],
    result: ZipExtractionResult
  ): number {
    // For data integrity, we check if the total size matches expectations
    const expectedSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const actualSize = result.totalSize;

    if (expectedSize === 0) return 1; // Perfect score for no data

    // Calculate size accuracy
    const sizeAccuracy = 1 - Math.abs(expectedSize - actualSize) / expectedSize;

    // Check if all entries have proper metadata
    const entriesWithMetadata = result.entries.filter(entry =>
      entry.name && entry.size !== undefined
    ).length;

    const metadataCompleteness = result.entries.length > 0 ?
      entriesWithMetadata / result.entries.length : 1;

    // Combine size accuracy and metadata completeness
    return (sizeAccuracy * 0.7) + (metadataCompleteness * 0.3);
  }

  /**
   * Calculate performance efficiency score
   * @param entries Input stream entries
   * @param result Extraction results
   * @param processingTime Processing time in milliseconds
   * @returns Score between 0 and 1
   */
  private calculatePerformanceEfficiency(
    entries: StreamEntry[],
    result: ZipExtractionResult,
    processingTime: number
  ): number {
    if (processingTime <= 0) return 1; // Perfect score for no time taken

    // Calculate average processing time per entry
    const avgTimePerEntry = entries.length > 0 ? processingTime / entries.length : 0;

    // Performance score degrades with longer processing times
    // Assume good performance for reasonable processing times
    // Performance degrades for very long processing times
    if (avgTimePerEntry === 0) return 1;

    // Use a logarithmic scale for better performance scoring
    // Good performance: < 10ms per entry, Poor performance: > 1000ms per entry
    const performanceFactor = Math.max(0, Math.min(1, 1000 / (avgTimePerEntry * 100)));
    return Math.max(0.1, performanceFactor); // Minimum 0.1 score
  }

  /**
   * Calculate resource usage efficiency score
   * @param result Extraction results
   * @returns Score between 0 and 1
   */
  private calculateResourceEfficiency(
    result: ZipExtractionResult
  ): number {
    // For resource efficiency, we consider the ratio of warnings to successful extractions
    if (result.extractedCount === 0) {
      return result.warnings.length === 0 ? 1 : 0; // Perfect score if no extractions and no warnings
    }

    // Lower warning ratio means better resource efficiency
    const warningRatio = result.warnings.length / result.extractedCount;

    // Convert to efficiency score (lower warnings = higher efficiency)
    return Math.max(0, 1 - warningRatio);
  }

  /**
   * Calculate consistency score
   * @param result Extraction results
   * @returns Score between 0 and 1
   */
  private calculateConsistency(
    result: ZipExtractionResult
  ): number {
    // For consistency, we check if all entries have consistent metadata
    if (result.entries.length === 0) return 1; // Perfect consistency for no entries

    // Check if all entries have required fields
    const entriesWithAllFields = result.entries.filter(entry =>
      entry.name &&
      entry.size !== undefined &&
      entry.lastModified instanceof Date
    ).length;

    return entriesWithAllFields / result.entries.length;
  }

  /**
   * Check if truth score meets minimum threshold
   * @param score Calculated truth score
   * @param threshold Minimum required threshold (default 0.95)
   * @returns Whether score meets threshold
   */
  meetsThreshold(score: number, threshold: number = 0.95): boolean {
    return score >= threshold;
  }

  /**
   * Generate verification report
   * @param entries Input stream entries
   * @param result Extraction results
   * @param processingTime Processing time in milliseconds
   * @param score Calculated truth score
   * @returns Detailed verification report
   */
  generateReport(
    entries: StreamEntry[],
    result: ZipExtractionResult,
    processingTime: number,
    score: number
  ): ZipVerificationReport {
    return {
      truthScore: score,
      meetsThreshold: this.meetsThreshold(score),
      metrics: {
        extractionAccuracy: this.calculateExtractionAccuracy(entries, result),
        dataIntegrity: this.calculateDataIntegrity(entries, result),
        performance: this.calculatePerformanceEfficiency(entries, result, processingTime),
        resourceUsage: this.calculateResourceEfficiency(result),
        consistency: this.calculateConsistency(result)
      },
      summary: {
        totalEntries: entries.length,
        extractedEntries: result.extractedCount,
        totalSize: result.totalSize,
        warnings: result.warnings.length,
        processingTimeMs: processingTime
      },
      timestamp: new Date().toISOString()
    };
  }
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