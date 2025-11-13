"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FilterHooksService_1 = require("../hooks/FilterHooksService");
// Mock MCP memory usage function for testing
global.mcp__claude_flow__memory_usage = jest.fn();
describe('FilterHooksService Persistent Memory Storage', () => {
    let hooksService;
    let mockMcpMemoryUsage;
    beforeEach(() => {
        hooksService = FilterHooksService_1.FilterHooksService.getInstance();
        mockMcpMemoryUsage = global.mcp__claude_flow__memory_usage;
        mockMcpMemoryUsage.mockClear();
    });
    it('should store task data in persistent memory', async () => {
        const taskDescription = 'Filter TypeScript files';
        await hooksService.preTask(taskDescription);
        expect(mockMcpMemoryUsage).toHaveBeenCalledWith({
            action: 'store',
            key: expect.stringContaining('swarm/filter/'),
            namespace: 'coordination',
            value: expect.stringContaining('pre-task')
        });
    });
    it('should store edit data in persistent memory', async () => {
        const filePath = 'filter-config.json';
        const config = { include: ['**/*.ts'], exclude: ['**/*.test.ts'] };
        await hooksService.postEdit(filePath, config);
        expect(mockMcpMemoryUsage).toHaveBeenCalledWith({
            action: 'store',
            key: expect.stringContaining('swarm/filter/'),
            namespace: 'coordination',
            value: expect.stringContaining('post-edit')
        });
    });
    it('should store results and truth score in persistent memory', async () => {
        const resultSummary = {
            totalFiles: 10,
            includedFiles: 8,
            excludedFiles: 2,
            reasons: { 'File matches exclude pattern': 2 },
            processingTimeMs: 50
        };
        const truthScore = 0.97;
        await hooksService.postTask(resultSummary, truthScore);
        // Check that results are stored
        expect(mockMcpMemoryUsage).toHaveBeenCalledWith({
            action: 'store',
            key: expect.stringContaining('swarm/filter/'),
            namespace: 'coordination',
            value: expect.stringContaining('post-task')
        });
        // Check that truth score is stored separately
        expect(mockMcpMemoryUsage).toHaveBeenCalledWith({
            action: 'store',
            key: expect.stringContaining('swarm/filter/'),
            namespace: 'verification',
            value: expect.stringContaining('"score":0.97')
        });
    });
    it('should store session end data in persistent memory', async () => {
        await hooksService.sessionEnd();
        expect(mockMcpMemoryUsage).toHaveBeenCalledWith({
            action: 'store',
            key: expect.stringContaining('swarm/filter/'),
            namespace: 'coordination',
            value: expect.stringContaining('session-end')
        });
    });
    it('should handle truth scores above 0.95 threshold', async () => {
        const resultSummary = {
            totalFiles: 50,
            includedFiles: 45,
            excludedFiles: 5,
            reasons: { 'File exceeds max size': 3, 'File matches exclude pattern': 2 },
            processingTimeMs: 120
        };
        const truthScore = 0.98; // Above 0.95 threshold
        await hooksService.postTask(resultSummary, truthScore);
        // Verify truth score is stored
        expect(mockMcpMemoryUsage).toHaveBeenCalledWith({
            action: 'store',
            key: expect.stringContaining('/truth-score'),
            namespace: 'verification',
            value: expect.stringContaining('"score":0.98')
        });
        // Parse the stored value to verify it meets threshold
        const calls = mockMcpMemoryUsage.mock.calls;
        const truthScoreCall = calls.find(call => call[0].key && call[0].key.includes('truth-score'));
        if (truthScoreCall) {
            const storedData = JSON.parse(truthScoreCall[0].value);
            expect(storedData.score).toBeGreaterThanOrEqual(0.95);
        }
    });
});
//# sourceMappingURL=FilterHooksService.storage.test.js.map