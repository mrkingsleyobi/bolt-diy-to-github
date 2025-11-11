import { GitHubUser, AuthResult } from '../types/github.js';

/**
 * Interface for token exchange result
 */
export interface TokenExchangeResult {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * Service for handling GitHub App OAuth authentication
 */
export class GitHubAppAuthService {
  private readonly TOKEN_REGEX = /^ghu_[a-zA-Z0-9]{36}$/;
  private readonly GITHUB_API_BASE = 'https://api.github.com';
  private readonly GITHUB_OAUTH_BASE = 'https://github.com/login/oauth';

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string
  ) {
    if (!clientId || !clientSecret) {
      throw new Error('GitHub App client ID and secret are required');
    }
  }

  /**
   * Exchanges an authorization code for an access token
   * @param code The authorization code received from GitHub
   * @returns Promise resolving to token exchange result
   */
  async exchangeCodeForToken(code: string): Promise<TokenExchangeResult> {
    // Validate input
    if (!code) {
      return {
        success: false,
        error: 'Authorization code is required'
      };
    }

    try {
      // Exchange the code for an access token
      const response = await fetch(`${this.GITHUB_OAUTH_BASE}/access_token`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'bolt-to-github-extension'
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code
        })
      });

      if (response.ok) {
        const tokenData = await response.json();
        if (tokenData.access_token) {
          return {
            success: true,
            token: tokenData.access_token
          };
        } else {
          return {
            success: false,
            error: 'Failed to obtain access token from GitHub'
          };
        }
      } else {
        return {
          success: false,
          error: `GitHub API error: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validates the format of a GitHub App access token
   * @param token The token to validate
   * @returns boolean indicating if the token format is valid
   */
  validateToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }
    return this.TOKEN_REGEX.test(token);
  }

  /**
   * Authenticates with GitHub API using an access token
   * @param token The GitHub access token to use for authentication
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