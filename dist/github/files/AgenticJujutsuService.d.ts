/**
 * AgenticJujutsuService provides quantum-resistant, self-learning version control
 * for AI agents with multi-agent coordination capabilities
 *
 * This implementation follows the agentic-jujutsu principles:
 * 1. Quantum-resistant version control
 * 2. Self-learning from operations
 * 3. Multi-agent coordination
 * 4. ReasoningBank intelligence integration
 * 5. Persistent memory patterns
 */
import { BatchFileOperation, BatchFileOperationResult } from '../types/github';
import { FileOperationSummary } from './FileHooksService';
export declare class AgenticJujutsuService {
    private static instance;
    private operationHistory;
    private agentCoordinationMap;
    private constructor();
    static getInstance(): AgenticJujutsuService;
    /**
     * Initialize agentic jujutsu session
     * @param sessionId Unique session identifier
     * @param agents List of participating agents
     */
    initializeSession(sessionId: string, agents: string[]): Promise<void>;
    /**
     * Record operation for learning and coordination
     * @param operation File operation performed
     * @param result Operation result
     * @param agentId ID of the agent performing the operation
     */
    recordOperation(operation: BatchFileOperation, result: BatchFileOperationResult, agentId: string): Promise<void>;
    /**
     * Update coordination score for an agent
     * @param agentId ID of the agent
     * @param success Whether the operation was successful
     */
    private updateCoordinationScore;
    /**
     * Get current session context for quantum-resistant versioning
     * @returns Session context information
     */
    private getCurrentSessionContext;
    /**
     * Generate quantum-resistant hash for version control
     * @returns Quantum-resistant hash string
     */
    private generateQuantumHash;
    /**
     * Analyze operation patterns for self-learning
     * @returns Learning insights
     */
    analyzePatterns(): Promise<JujutsuLearningInsights>;
    /**
     * Calculate overall success rate
     * @returns Success rate as a decimal
     */
    private calculateSuccessRate;
    /**
     * Identify common operation patterns
     * @returns Pattern analysis
     */
    private identifyCommonPatterns;
    /**
     * Analyze agent performance
     * @returns Agent performance metrics
     */
    private analyzeAgentPerformance;
    /**
     * Calculate success rate for a specific agent
     * @param agentId ID of the agent
     * @returns Success rate as a decimal
     */
    private calculateAgentSuccessRate;
    /**
     * Generate recommendations based on analysis
     * @returns List of recommendations
     */
    private generateRecommendations;
    /**
     * Generate version control report
     * @param summary Operation summary
     * @returns Version control report
     */
    generateVersionControlReport(summary: FileOperationSummary): Promise<JujutsuVersionControlReport>;
    /**
     * Cleanup session resources
     * @param sessionId Session to cleanup
     */
    cleanupSession(sessionId: string): Promise<void>;
}
export interface JujutsuOperationRecord {
    id: string;
    operation: BatchFileOperation;
    result: BatchFileOperationResult;
    agentId: string;
    timestamp: number;
    sessionContext: SessionContext;
}
interface SessionContext {
    timestamp: number;
    operationCount: number;
    agentsActive: string[];
    quantumHash: string;
}
interface AgentCoordinationInfo {
    agentId: string;
    sessionId: string;
    operationsPerformed: number;
    lastOperationTimestamp: number;
    coordinationScore: number;
}
export interface JujutsuLearningInsights {
    totalOperations: number;
    successRate: number;
    commonPatterns: Record<string, number>;
    agentPerformance: Record<string, AgentPerformance>;
    recommendations: string[];
}
interface AgentPerformance {
    operationsPerformed: number;
    coordinationScore: number;
    successRate: number;
}
export interface JujutsuVersionControlReport {
    sessionId: string;
    timestamp: string;
    operationSummary: FileOperationSummary;
    learningInsights: JujutsuLearningInsights;
    quantumResistance: {
        hash: string;
        algorithm: string;
        securityLevel: string;
    };
    agentCoordination: {
        activeAgents: string[];
        coordinationMatrix: Record<string, AgentCoordinationInfo>;
    };
}
export {};
//# sourceMappingURL=AgenticJujutsuService.d.ts.map