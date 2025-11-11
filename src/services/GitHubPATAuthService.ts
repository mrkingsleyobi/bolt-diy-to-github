import { GitHubUser, AuthResult } from '../types/github.js';

/**
 * Service for handling GitHub Personal Access Token authentication
 */
export class GitHubPATAuthService {
  private readonly PAT_REGEX = /^ghp_[a-zA-Z0-9]{36}$/;
  private readonly GITHUB_API_BASE = 'https://api.github.com';

  /**
   * Validates the format of a GitHub Personal Access Token
   * @param token The token to validate
   * @returns boolean indicating if the token format is valid
   */
  validateToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }
    return this.PAT_REGEX.test(token);
  }

  /**
   * Authenticates with GitHub API using a Personal Access Token
   * @param token The GitHub PAT to use for authentication
   * @returns Promise resolving to authentication result
   */
  async authenticate(token: string): Promise<AuthResult> {
    // Validate input
    if (!token) {
      return {
        authenticated: false,
        error: 'Token is required'
      };
    }

    // Validate token format
    if (!this.validateToken(token)) {
      return {
        authenticated: false,
        error: 'Invalid token format'
      };
    }

    try {
      // Make a simple API call to verify the token
      const response = await fetch(`${this.GITHUB_API_BASE}/user`, {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'bolt-to-github-extension'
        }
      });

      if (response.ok) {
        const user: GitHubUser = await response.json();
        return { authenticated: true, user };
      } else if (response.status === 401) {
        return {
          authenticated: false,
          error: 'Invalid token credentials'
        };
      } else {
        return {
          authenticated: false,
          error: `GitHub API error: ${response.status}`
        };
      }
    } catch (error) {
      return {
        authenticated: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}