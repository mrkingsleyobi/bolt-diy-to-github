// Repository Service
import { HttpClient } from '../../utils/http';
import { Repository } from '../types/github';

export class RepositoryService {
  constructor(private httpClient: HttpClient, private getAuthHeaders: () => Record<string, string>) {}

  /**
   * List repositories for the authenticated user
   * @returns Promise resolving to array of repositories
   */
  async list(): Promise<Repository[]> {
    try {
      const headers = this.getAuthHeaders();
      return await this.httpClient.get('/user/repos', headers);
    } catch (error) {
      throw new Error(`Failed to list repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new repository
   * @param params Repository creation parameters
   * @returns Promise resolving to the created repository
   */
  async create(params: { name: string; [key: string]: any }): Promise<Repository> {
    try {
      const headers = this.getAuthHeaders();
      return await this.httpClient.post('/user/repos', params, headers);
    } catch (error) {
      throw new Error(`Failed to create repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific repository
   * @param owner Repository owner
   * @param repo Repository name
   * @returns Promise resolving to the repository
   */
  async get(owner: string, repo: string): Promise<Repository> {
    try {
      const headers = this.getAuthHeaders();
      return await this.httpClient.get(`/repos/${owner}/${repo}`, headers);
    } catch (error) {
      throw new Error(`Failed to get repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @returns Promise resolving when deletion is complete
   */
  async delete(owner: string, repo: string): Promise<void> {
    try {
      const headers = this.getAuthHeaders();
      await this.httpClient.delete(`/repos/${owner}/${repo}`, headers);
    } catch (error) {
      throw new Error(`Failed to delete repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}