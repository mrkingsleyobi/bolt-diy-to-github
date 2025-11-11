// Main GitHub Client with service integration
import { HttpClient } from '../utils/http';
import { GitHubPATAuthService } from '../services/GitHubPATAuthService';
import { RepositoryService } from './repositories/RepositoryService';
import { BranchService } from './branches/BranchService';

export class GitHubClient {
  private httpClient: HttpClient;
  private authService: GitHubPATAuthService;
  private token: string;
  private _repositories: RepositoryService;
  private _branches: BranchService;

  constructor(token: string) {
    // Validate token format
    this.authService = new GitHubPATAuthService();
    if (!this.authService.validateToken(token)) {
      throw new Error('Invalid GitHub PAT format');
    }

    this.token = token;
    this.httpClient = new HttpClient({
      baseUrl: 'https://api.github.com',
      userAgent: 'bolt-diy-to-github-client'
    });

    // Initialize services
    this._repositories = new RepositoryService(this.httpClient, this.getAuthHeaders.bind(this));
    this._branches = new BranchService(this.httpClient, this.getAuthHeaders.bind(this));
  }

  private getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `token ${this.token}`
    };
  }

  get repositories() {
    return this._repositories;
  }

  get branches() {
    return this._branches;
  }
}