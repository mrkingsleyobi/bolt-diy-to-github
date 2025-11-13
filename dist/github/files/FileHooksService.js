"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileHooksService = void 0;
/**
 * FileHooksService provides integration with Claude's coordination system
 * for tracking file operations and enabling agentic-jujutsu version control
 */
class FileHooksService {
    constructor() {
        this.sessionId = `file-session-${Date.now()}`;
    }
    static getInstance() {
        if (!FileHooksService.instance) {
            FileHooksService.instance = new FileHooksService();
        }
        return FileHooksService.instance;
    }
    /**
     * Pre-task hook - called before file operations begin
     * @param taskDescription Description of the file operation task
     */
    async preTask(taskDescription) {
        try {
            // Store task metadata in memory
            const taskData = {
                sessionId: this.sessionId,
                task: taskDescription,
                timestamp: new Date().toISOString(),
                type: 'pre-task'
            };
            // In a real implementation, this would use MCP memory tools
            // For now, we'll just log to console
            console.log(`[FILE PRE-TASK HOOK] ${JSON.stringify(taskData)}`);
            // If running in Claude environment, store in persistent memory
            if (typeof global.mcp__claude_flow__memory_usage !== 'undefined') {
                global.mcp__claude_flow__memory_usage({
                    action: 'store',
                    key: `swarm/file/${this.sessionId}/task`,
                    namespace: 'coordination',
                    value: JSON.stringify(taskData)
                });
            }
        }
        catch (error) {
            console.warn('Failed to execute pre-task hook:', error);
        }
    }
    /**
     * Post-edit hook - called after file operations are performed
     * @param filePath Path to the file that was modified
     * @param operation The operation that was performed
     * @param result The result of the operation
     */
    async postEdit(filePath, operation, result) {
        try {
            const editData = {
                sessionId: this.sessionId,
                file: filePath,
                operation: operation,
                result: result,
                timestamp: new Date().toISOString(),
                type: 'post-edit'
            };
            console.log(`[FILE POST-EDIT HOOK] ${JSON.stringify(editData)}`);
            // Store in persistent memory if available
            if (typeof global.mcp__claude_flow__memory_usage !== 'undefined') {
                global.mcp__claude_flow__memory_usage({
                    action: 'store',
                    key: `swarm/file/${this.sessionId}/edit/${filePath}`,
                    namespace: 'coordination',
                    value: JSON.stringify(editData)
                });
            }
        }
        catch (error) {
            console.warn('Failed to execute post-edit hook:', error);
        }
    }
    /**
     * Post-task hook - called after file operations complete
     * @param operationSummary Summary of the file operations
     * @param truthScore Verification score for the operation
     */
    async postTask(operationSummary, truthScore) {
        try {
            const taskData = {
                sessionId: this.sessionId,
                results: operationSummary,
                truthScore: truthScore,
                timestamp: new Date().toISOString(),
                type: 'post-task'
            };
            console.log(`[FILE POST-TASK HOOK] ${JSON.stringify(taskData)}`);
            // Store results in persistent memory
            if (typeof global.mcp__claude_flow__memory_usage !== 'undefined') {
                global.mcp__claude_flow__memory_usage({
                    action: 'store',
                    key: `swarm/file/${this.sessionId}/results`,
                    namespace: 'coordination',
                    value: JSON.stringify(taskData)
                });
                // Store truth score if provided
                if (truthScore !== undefined) {
                    global.mcp__claude_flow__memory_usage({
                        action: 'store',
                        key: `swarm/file/${this.sessionId}/truth-score`,
                        namespace: 'verification',
                        value: JSON.stringify({ score: truthScore, timestamp: new Date().toISOString() })
                    });
                }
            }
        }
        catch (error) {
            console.warn('Failed to execute post-task hook:', error);
        }
    }
    /**
     * Session end hook - called when file operations session completes
     */
    async sessionEnd() {
        try {
            const sessionData = {
                sessionId: this.sessionId,
                endTime: new Date().toISOString(),
                type: 'session-end'
            };
            console.log(`[FILE SESSION-END HOOK] ${JSON.stringify(sessionData)}`);
            // Store session end marker
            if (typeof global.mcp__claude_flow__memory_usage !== 'undefined') {
                global.mcp__claude_flow__memory_usage({
                    action: 'store',
                    key: `swarm/file/${this.sessionId}/end`,
                    namespace: 'coordination',
                    value: JSON.stringify(sessionData)
                });
            }
        }
        catch (error) {
            console.warn('Failed to execute session-end hook:', error);
        }
    }
}
exports.FileHooksService = FileHooksService;
//# sourceMappingURL=FileHooksService.js.map