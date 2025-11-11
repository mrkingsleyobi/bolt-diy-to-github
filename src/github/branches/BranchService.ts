// Branch Service
import { HttpClient } from '../../utils/http';
import { Branch } from '../types/github';

export class BranchService {
  constructor(private httpClient: HttpClient, private getAuthHeaders: () => Record<string, string>) {}

  /**
   * List branches for a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @returns Promise resolving to array of branches
   */
  async list(owner: string, repo: string): Promise<Branch[]> {
    try {
      const headers = this.getAuthHeaders();
      return await this.httpClient.get(`/repos/${owner}/${repo}/branches`, headers);
    } catch (error) {
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
  async get(owner: string, repo: string, branch: string): Promise<Branch> {
    try {
      const headers = this.getAuthHeaders();
      return await this.httpClient.get(`/repos/${owner}/${repo}/branches/${branch}`, headers);
    } catch (error) {
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
  async create(owner: string, repo: string, branch: string, sha: string): Promise<Branch> {
    try {
      const headers = this.getAuthHeaders();
      const data = {
        ref: `refs/heads/${branch}`,
        sha
      };
      return await this.httpClient.post(`/repos/${owner}/${repo}/git/refs`, data, headers);
    } catch (error) {
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
  async delete(owner: string, repo: string, branch: string): Promise<void> {
    try {
      const headers = this.getAuthHeaders();
      await this.httpClient.delete(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, headers);
    } catch (error) {
      throw new Error(`Failed to delete branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}