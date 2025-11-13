import { HttpClient } from '../../utils/http';
import { Branch } from '../types/github';
export declare class BranchService {
    private httpClient;
    private getAuthHeaders;
    constructor(httpClient: HttpClient, getAuthHeaders: () => Record<string, string>);
    /**
     * List branches for a repository
     * @param owner Repository owner
     * @param repo Repository name
     * @returns Promise resolving to array of branches
     */
    list(owner: string, repo: string): Promise<Branch[]>;
    /**
     * Get a specific branch
     * @param owner Repository owner
     * @param repo Repository name
     * @param branch Branch name
     * @returns Promise resolving to the branch
     */
    get(owner: string, repo: string, branch: string): Promise<Branch>;
    /**
     * Create a new branch
     * @param owner Repository owner
     * @param repo Repository name
     * @param branch New branch name
     * @param sha SHA of the commit to branch from
     * @returns Promise resolving to the created branch
     */
    create(owner: string, repo: string, branch: string, sha: string): Promise<Branch>;
    /**
     * Delete a branch
     * @param owner Repository owner
     * @param repo Repository name
     * @param branch Branch name
     * @returns Promise resolving when deletion is complete
     */
    delete(owner: string, repo: string, branch: string): Promise<void>;
}
//# sourceMappingURL=BranchService.d.ts.map