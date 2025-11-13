"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryService = void 0;
class RepositoryService {
    constructor(httpClient, getAuthHeaders) {
        this.httpClient = httpClient;
        this.getAuthHeaders = getAuthHeaders;
    }
    /**
     * List repositories for the authenticated user
     * @returns Promise resolving to array of repositories
     */
    async list() {
        try {
            const headers = this.getAuthHeaders();
            return await this.httpClient.get('/user/repos', headers);
        }
        catch (error) {
            throw new Error(`Failed to list repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Create a new repository
     * @param params Repository creation parameters
     * @returns Promise resolving to the created repository
     */
    async create(params) {
        try {
            const headers = this.getAuthHeaders();
            return await this.httpClient.post('/user/repos', params, headers);
        }
        catch (error) {
            throw new Error(`Failed to create repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get a specific repository
     * @param owner Repository owner
     * @param repo Repository name
     * @returns Promise resolving to the repository
     */
    async get(owner, repo) {
        try {
            const headers = this.getAuthHeaders();
            return await this.httpClient.get(`/repos/${owner}/${repo}`, headers);
        }
        catch (error) {
            throw new Error(`Failed to get repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Delete a repository
     * @param owner Repository owner
     * @param repo Repository name
     * @returns Promise resolving when deletion is complete
     */
    async delete(owner, repo) {
        try {
            const headers = this.getAuthHeaders();
            await this.httpClient.delete(`/repos/${owner}/${repo}`, headers);
        }
        catch (error) {
            throw new Error(`Failed to delete repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.RepositoryService = RepositoryService;
//# sourceMappingURL=RepositoryService.js.map