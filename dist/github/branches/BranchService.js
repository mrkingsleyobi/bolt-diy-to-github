"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchService = void 0;
class BranchService {
    constructor(httpClient, getAuthHeaders) {
        this.httpClient = httpClient;
        this.getAuthHeaders = getAuthHeaders;
    }
    /**
     * List branches for a repository
     * @param owner Repository owner
     * @param repo Repository name
     * @returns Promise resolving to array of branches
     */
    async list(owner, repo) {
        try {
            const headers = this.getAuthHeaders();
            return await this.httpClient.get(`/repos/${owner}/${repo}/branches`, headers);
        }
        catch (error) {
            throw new Error(`Failed to list branches: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get a specific branch
     * @param owner Repository owner
     * @param repo Repository name
     * @param branch Branch name
     * @returns Promise resolving to the branch
     */
    async get(owner, repo, branch) {
        try {
            const headers = this.getAuthHeaders();
            return await this.httpClient.get(`/repos/${owner}/${repo}/branches/${branch}`, headers);
        }
        catch (error) {
            throw new Error(`Failed to get branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Create a new branch
     * @param owner Repository owner
     * @param repo Repository name
     * @param branch New branch name
     * @param sha SHA of the commit to branch from
     * @returns Promise resolving to the created branch
     */
    async create(owner, repo, branch, sha) {
        try {
            const headers = this.getAuthHeaders();
            const data = {
                ref: `refs/heads/${branch}`,
                sha
            };
            return await this.httpClient.post(`/repos/${owner}/${repo}/git/refs`, data, headers);
        }
        catch (error) {
            throw new Error(`Failed to create branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Delete a branch
     * @param owner Repository owner
     * @param repo Repository name
     * @param branch Branch name
     * @returns Promise resolving when deletion is complete
     */
    async delete(owner, repo, branch) {
        try {
            const headers = this.getAuthHeaders();
            await this.httpClient.delete(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, headers);
        }
        catch (error) {
            throw new Error(`Failed to delete branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.BranchService = BranchService;
//# sourceMappingURL=BranchService.js.map