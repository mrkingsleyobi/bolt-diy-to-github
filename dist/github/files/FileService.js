"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const FileHooksService_1 = require("./FileHooksService");
const FileVerificationService_1 = require("./FileVerificationService");
const AgenticJujutsuService_1 = require("./AgenticJujutsuService");
class FileService {
    constructor(httpClient, getAuthHeaders) {
        this.httpClient = httpClient;
        this.getAuthHeaders = getAuthHeaders;
        this.hooksService = FileHooksService_1.FileHooksService.getInstance();
        this.verificationService = FileVerificationService_1.FileVerificationService.getInstance();
        this.jujutsuService = AgenticJujutsuService_1.AgenticJujutsuService.getInstance();
    }
    /**
     * Get file content
     * @param owner Repository owner
     * @param repo Repository name
     * @param path File path
     * @param ref Git reference (branch, tag, or commit SHA)
     * @returns Promise resolving to file content
     */
    async get(owner, repo, path, ref) {
        try {
            await this.hooksService.preTask(`Get file content for ${path}`);
            const headers = this.getAuthHeaders();
            const url = ref ? `/repos/${owner}/${repo}/contents/${path}?ref=${ref}` : `/repos/${owner}/${repo}/contents/${path}`;
            const response = await this.httpClient.get(url, headers);
            // GitHub API returns directory content when path is a directory
            // We only want file content here
            if (response.type !== 'file') {
                throw new Error(`Path ${path} is not a file`);
            }
            await this.hooksService.postEdit(path, 'get', response);
            return response;
        }
        catch (error) {
            throw new Error(`Failed to get file content: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Create a new file
     * @param owner Repository owner
     * @param repo Repository name
     * @param path File path
     * @param params File creation parameters
     * @returns Promise resolving to creation result
     */
    async create(owner, repo, path, params) {
        try {
            await this.hooksService.preTask(`Create file at ${path}`);
            const headers = this.getAuthHeaders();
            const response = await this.httpClient.post(`/repos/${owner}/${repo}/contents/${path}`, params, headers);
            await this.hooksService.postEdit(path, 'create', response);
            return response;
        }
        catch (error) {
            throw new Error(`Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Update an existing file
     * @param owner Repository owner
     * @param repo Repository name
     * @param path File path
     * @param params File update parameters
     * @returns Promise resolving to update result
     */
    async update(owner, repo, path, params) {
        try {
            await this.hooksService.preTask(`Update file at ${path}`);
            const headers = this.getAuthHeaders();
            const response = await this.httpClient.post(`/repos/${owner}/${repo}/contents/${path}`, params, headers);
            await this.hooksService.postEdit(path, 'update', response);
            return response;
        }
        catch (error) {
            throw new Error(`Failed to update file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Delete a file
     * @param owner Repository owner
     * @param repo Repository name
     * @param path File path
     * @param params File deletion parameters
     * @returns Promise resolving to deletion result
     */
    async delete(owner, repo, path, params) {
        try {
            await this.hooksService.preTask(`Delete file at ${path}`);
            const headers = this.getAuthHeaders();
            const response = await this.httpClient.post(`/repos/${owner}/${repo}/contents/${path}`, params, headers);
            await this.hooksService.postEdit(path, 'delete', response);
            return response;
        }
        catch (error) {
            throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Batch process multiple file operations
     * @param owner Repository owner
     * @param repo Repository name
     * @param operations Array of file operations
     * @returns Promise resolving to array of operation results
     */
    async batch(owner, repo, operations) {
        const startTime = Date.now();
        const sessionId = `file-batch-${Date.now()}`;
        try {
            await this.hooksService.preTask(`Batch process ${operations.length} file operations`);
            await this.jujutsuService.initializeSession(sessionId, ['file-service-agent']);
            const results = [];
            // Process operations concurrently
            const promises = operations.map(async (operation) => {
                try {
                    let result;
                    switch (operation.operation) {
                        case 'create':
                            if (!operation.content) {
                                throw new Error('Content is required for create operation');
                            }
                            result = await this.create(owner, repo, operation.path, {
                                message: operation.message,
                                content: operation.content,
                                branch: operation.branch
                            });
                            break;
                        case 'update':
                            if (!operation.content || !operation.sha) {
                                throw new Error('Content and SHA are required for update operation');
                            }
                            result = await this.update(owner, repo, operation.path, {
                                message: operation.message,
                                content: operation.content,
                                sha: operation.sha,
                                branch: operation.branch
                            });
                            break;
                        case 'delete':
                            if (!operation.sha) {
                                throw new Error('SHA is required for delete operation');
                            }
                            result = await this.delete(owner, repo, operation.path, {
                                message: operation.message,
                                sha: operation.sha,
                                branch: operation.branch
                            });
                            break;
                        default:
                            throw new Error(`Unsupported operation: ${operation.operation}`);
                    }
                    // Record operation in agentic jujutsu system
                    await this.jujutsuService.recordOperation(operation, {
                        path: operation.path,
                        success: true,
                        result
                    }, 'file-service-agent');
                    return {
                        path: operation.path,
                        success: true,
                        result
                    };
                }
                catch (error) {
                    // Record failed operation in agentic jujutsu system
                    await this.jujutsuService.recordOperation(operation, {
                        path: operation.path,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }, 'file-service-agent');
                    return {
                        path: operation.path,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            });
            // Wait for all operations to complete
            const operationResults = await Promise.all(promises);
            results.push(...operationResults);
            // Calculate truth score
            const truthScore = this.verificationService.calculateTruthScore(operations, results);
            // Generate operation summary
            const operationSummary = {
                totalOperations: operations.length,
                successfulOperations: results.filter(r => r.success).length,
                failedOperations: results.filter(r => !r.success).length,
                operationTypes: this.getOperationTypeCounts(operations),
                processingTimeMs: Date.now() - startTime,
                filesAffected: operations.map(op => op.path)
            };
            // Generate verification report
            const verificationReport = this.verificationService.generateReport(operations, results, truthScore);
            // Generate agentic jujutsu version control report
            const versionControlReport = await this.jujutsuService.generateVersionControlReport(operationSummary);
            // Post task hook with verification data
            await this.hooksService.postTask(operationSummary, truthScore);
            // Store verification report in memory if available
            if (typeof global.mcp__claude_flow__memory_usage !== 'undefined') {
                global.mcp__claude_flow__memory_usage({
                    action: 'store',
                    key: `swarm/file/batch-verification-report`,
                    namespace: 'verification',
                    value: JSON.stringify(verificationReport)
                });
                // Store version control report
                global.mcp__claude_flow__memory_usage({
                    action: 'store',
                    key: `swarm/file/version-control-report`,
                    namespace: 'version-control',
                    value: JSON.stringify(versionControlReport)
                });
            }
            // Check if truth score meets threshold
            if (!this.verificationService.meetsThreshold(truthScore)) {
                console.warn(`Warning: Truth score ${truthScore} does not meet the required threshold of 0.95`);
            }
            return results;
        }
        catch (error) {
            throw new Error(`Failed to batch process file operations: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
            await this.hooksService.sessionEnd();
            await this.jujutsuService.cleanupSession(sessionId);
        }
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
exports.FileService = FileService;
//# sourceMappingURL=FileService.js.map