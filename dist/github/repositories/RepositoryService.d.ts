import { HttpClient } from '../../utils/http';
import { Repository } from '../types/github';
export declare class RepositoryService {
    private httpClient;
    private getAuthHeaders;
    constructor(httpClient: HttpClient, getAuthHeaders: () => Record<string, string>);
    /**
     * List repositories for the authenticated user
     * @returns Promise resolving to array of repositories
     */
    list(): Promise<Repository[]>;
    /**
     * Create a new repository
     * @param params Repository creation parameters
     * @returns Promise resolving to the created repository
     */
    create(params: {
        name: string;
        [key: string]: any;
    }): Promise<Repository>;
    /**
     * Get a specific repository
     * @param owner Repository owner
     * @param repo Repository name
     * @returns Promise resolving to the repository
     */
    get(owner: string, repo: string): Promise<Repository>;
    /**
     * Delete a repository
     * @param owner Repository owner
     * @param repo Repository name
     * @returns Promise resolving when deletion is complete
     */
    delete(owner: string, repo: string): Promise<void>;
}
//# sourceMappingURL=RepositoryService.d.ts.map