/**
 * FilterHooksService provides integration with Claude's coordination system
 * for tracking filter operations and enabling agentic-jujutsu version control
 */
export declare class FilterHooksService {
    private static instance;
    private sessionId;
    private constructor();
    static getInstance(): FilterHooksService;
    /**
     * Pre-task hook - called before filter operations begin
     * @param taskDescription Description of the filtering task
     */
    preTask(taskDescription: string): Promise<void>;
    /**
     * Post-edit hook - called after filter configuration is modified
     * @param filePath Path to the configuration file that was edited
     * @param config The filter configuration that was applied
     */
    postEdit(filePath: string, config: any): Promise<void>;
    /**
     * Post-task hook - called after filter operations complete
     * @param resultSummary Summary of the filtering results
     * @param truthScore Verification score for the operation
     */
    postTask(resultSummary: FilterResultSummary, truthScore?: number): Promise<void>;
    /**
     * Session end hook - called when filtering session completes
     */
    sessionEnd(): Promise<void>;
}
/**
 * Interface for filter result summary
 */
export interface FilterResultSummary {
    totalFiles: number;
    includedFiles: number;
    excludedFiles: number;
    reasons: {
        [reason: string]: number;
    };
    processingTimeMs: number;
}
//# sourceMappingURL=FilterHooksService.d.ts.map