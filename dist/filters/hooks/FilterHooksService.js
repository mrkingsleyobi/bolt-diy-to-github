"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterHooksService = void 0;
/**
 * FilterHooksService provides integration with Claude's coordination system
 * for tracking filter operations and enabling agentic-jujutsu version control
 */
class FilterHooksService {
    constructor() {
        this.sessionId = `filter-session-${Date.now()}`;
    }
    static getInstance() {
        if (!FilterHooksService.instance) {
            FilterHooksService.instance = new FilterHooksService();
        }
        return FilterHooksService.instance;
    }
    /**
     * Pre-task hook - called before filter operations begin
     * @param taskDescription Description of the filtering task
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
            console.log(`[PRE-TASK HOOK] ${JSON.stringify(taskData)}`);
            // If running in Claude environment, store in persistent memory
            if (typeof global.mcp__claude_flow__memory_usage !== 'undefined') {
                global.mcp__claude_flow__memory_usage({
                    action: 'store',
                    key: `swarm/filter/${this.sessionId}/task`,
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
     * Post-edit hook - called after filter configuration is modified
     * @param filePath Path to the configuration file that was edited
     * @param config The filter configuration that was applied
     */
    async postEdit(filePath, config) {
        try {
            const editData = {
                sessionId: this.sessionId,
                file: filePath,
                config: config,
                timestamp: new Date().toISOString(),
                type: 'post-edit'
            };
            console.log(`[POST-EDIT HOOK] ${JSON.stringify(editData)}`);
            // Store in persistent memory if available
            if (typeof global.mcp__claude_flow__memory_usage !== 'undefined') {
                global.mcp__claude_flow__memory_usage({
                    action: 'store',
                    key: `swarm/filter/${this.sessionId}/edit`,
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
     * Post-task hook - called after filter operations complete
     * @param resultSummary Summary of the filtering results
     * @param truthScore Verification score for the operation
     */
    async postTask(resultSummary, truthScore) {
        try {
            const taskData = {
                sessionId: this.sessionId,
                results: resultSummary,
                truthScore: truthScore,
                timestamp: new Date().toISOString(),
                type: 'post-task'
            };
            console.log(`[POST-TASK HOOK] ${JSON.stringify(taskData)}`);
            // Store results in persistent memory
            if (typeof global.mcp__claude_flow__memory_usage !== 'undefined') {
                global.mcp__claude_flow__memory_usage({
                    action: 'store',
                    key: `swarm/filter/${this.sessionId}/results`,
                    namespace: 'coordination',
                    value: JSON.stringify(taskData)
                });
                // Store truth score if provided
                if (truthScore !== undefined) {
                    global.mcp__claude_flow__memory_usage({
                        action: 'store',
                        key: `swarm/filter/${this.sessionId}/truth-score`,
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
     * Session end hook - called when filtering session completes
     */
    async sessionEnd() {
        try {
            const sessionData = {
                sessionId: this.sessionId,
                endTime: new Date().toISOString(),
                type: 'session-end'
            };
            console.log(`[SESSION-END HOOK] ${JSON.stringify(sessionData)}`);
            // Store session end marker
            if (typeof global.mcp__claude_flow__memory_usage !== 'undefined') {
                global.mcp__claude_flow__memory_usage({
                    action: 'store',
                    key: `swarm/filter/${this.sessionId}/end`,
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
exports.FilterHooksService = FilterHooksService;
//# sourceMappingURL=FilterHooksService.js.map