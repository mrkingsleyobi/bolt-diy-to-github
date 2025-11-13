/**
 * FileHooksService provides integration with Claude's coordination system
 * for tracking file operations and enabling agentic-jujutsu version control
 */
export declare class FileHooksService {
    private static instance;
    private sessionId;
    private constructor();
    static getInstance(): FileHooksService;
    /**
     * Pre-task hook - called before file operations begin
     * @param taskDescription Description of the file operation task
     */
    preTask(taskDescription: string): Promise<void>;
    /**
     * Post-edit hook - called after file operations are performed
     * @param filePath Path to the file that was modified
     * @param operation The operation that was performed
     * @param result The result of the operation
     */
    postEdit(filePath: string, operation: string, result: any): Promise<void>;
    /**
     * Post-task hook - called after file operations complete
     * @param operationSummary Summary of the file operations
     * @param truthScore Verification score for the operation
     */
    postTask(operationSummary: FileOperationSummary, truthScore?: number): Promise<void>;
    /**
     * Session end hook - called when file operations session completes
     */
    sessionEnd(): Promise<void>;
}
/**
 * Interface for file operation summary
 */
export interface FileOperationSummary {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    operationTypes: {
        [operation: string]: number;
    };
    processingTimeMs: number;
    filesAffected: string[];
}
//# sourceMappingURL=FileHooksService.d.ts.map