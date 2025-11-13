import { HttpClient } from '../../utils/http';
import { FileContent, FileCreateParams, FileUpdateParams, FileDeleteParams, FileOperationResult, FileDeleteResult, BatchFileOperation, BatchFileOperationResult } from '../types/github';
export declare class FileService {
    private httpClient;
    private getAuthHeaders;
    private hooksService;
    private verificationService;
    private jujutsuService;
    constructor(httpClient: HttpClient, getAuthHeaders: () => Record<string, string>);
    /**
     * Get file content
     * @param owner Repository owner
     * @param repo Repository name
     * @param path File path
     * @param ref Git reference (branch, tag, or commit SHA)
     * @returns Promise resolving to file content
     */
    get(owner: string, repo: string, path: string, ref?: string): Promise<FileContent>;
    /**
     * Create a new file
     * @param owner Repository owner
     * @param repo Repository name
     * @param path File path
     * @param params File creation parameters
     * @returns Promise resolving to creation result
     */
    create(owner: string, repo: string, path: string, params: FileCreateParams): Promise<FileOperationResult>;
    /**
     * Update an existing file
     * @param owner Repository owner
     * @param repo Repository name
     * @param path File path
     * @param params File update parameters
     * @returns Promise resolving to update result
     */
    update(owner: string, repo: string, path: string, params: FileUpdateParams): Promise<FileOperationResult>;
    /**
     * Delete a file
     * @param owner Repository owner
     * @param repo Repository name
     * @param path File path
     * @param params File deletion parameters
     * @returns Promise resolving to deletion result
     */
    delete(owner: string, repo: string, path: string, params: FileDeleteParams): Promise<FileDeleteResult>;
    /**
     * Batch process multiple file operations
     * @param owner Repository owner
     * @param repo Repository name
     * @param operations Array of file operations
     * @returns Promise resolving to array of operation results
     */
    batch(owner: string, repo: string, operations: BatchFileOperation[]): Promise<BatchFileOperationResult[]>;
    /**
     * Get counts of each operation type
     * @param operations File operations
     * @returns Object with operation type counts
     */
    private getOperationTypeCounts;
}
//# sourceMappingURL=FileService.d.ts.map