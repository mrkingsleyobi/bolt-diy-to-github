# GitHub Authentication Services Usage Guide

## 1. Overview

This guide provides practical examples and best practices for using the GitHub authentication services implemented in Phase 1 of the bolt-diy-to-github integration. It covers implementation details, common use cases, error handling, and security recommendations.

## 2. Quick Start Examples

### 2.1 Basic PAT Authentication

```typescript
import { GitHubPATAuthService } from 'bolt-diy-to-github/src/services/GitHubPATAuthService';

// Initialize the service
const authService = new GitHubPATAuthService();

// Validate a token format
const token = 'ghp_your_personal_access_token_here';
const isValid = authService.validateToken(token);

if (isValid) {
  console.log('Token format is valid');

  // Authenticate with GitHub
  try {
    const result = await authService.authenticate(token);

    if (result.authenticated) {
      console.log(`Authentication successful for user: ${result.user.login}`);
    } else {
      console.error(`Authentication failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Authentication error:', error);
  }
} else {
  console.error('Invalid token format');
}
```

### 2.2 GitHub App OAuth Flow

```typescript
import { GitHubAppAuthService } from 'bolt-diy-to-github/src/services/GitHubAppAuthService';

// Initialize with your GitHub App credentials
const appAuthService = new GitHubAppAuthService(
  process.env.GITHUB_APP_CLIENT_ID,
  process.env.GITHUB_APP_CLIENT_SECRET
);

// After receiving authorization code from GitHub OAuth redirect
async function handleOAuthCallback(authorizationCode: string) {
  try {
    // Exchange code for access token
    const exchangeResult = await appAuthService.exchangeCodeForToken(authorizationCode);

    if (exchangeResult.success) {
      console.log('Token exchange successful');

      // Validate the token format
      const isValid = appAuthService.validateToken(exchangeResult.token);

      if (isValid) {
        // Authenticate with GitHub
        const authResult = await appAuthService.authenticate(exchangeResult.token);

        if (authResult.authenticated) {
          console.log(`GitHub App authentication successful for user: ${authResult.user.login}`);
          return authResult.user;
        } else {
          console.error(`Authentication failed: ${authResult.error}`);
        }
      } else {
        console.error('Invalid token format from OAuth exchange');
      }
    } else {
      console.error(`Token exchange failed: ${exchangeResult.error}`);
    }
  } catch (error) {
    console.error('OAuth flow error:', error);
  }

  return null;
}
```

### 2.3 Enhanced PAT Authentication with Storage

```typescript
import { EnhancedGitHubPATAuthService } from 'bolt-diy-to-github/src/services/validation/EnhancedGitHubPATAuthService';
import { SecureTokenStorage } from 'bolt-diy-to-github/src/services/storage/SecureTokenStorage';

const enhancedAuthService = new EnhancedGitHubPATAuthService();
const tokenStorage = new SecureTokenStorage();

// Store a token securely
async function storeUserToken(username: string, token: string, encryptionPassword: string) {
  try {
    // Validate token format first
    if (!enhancedAuthService.validateTokenFormat(token)) {
      throw new Error('Invalid token format');
    }

    // Store encrypted token
    await tokenStorage.storeToken(token, encryptionPassword, username);
    console.log(`Token stored securely for user: ${username}`);
  } catch (error) {
    console.error('Failed to store token:', error);
    throw error;
  }
}

// Authenticate using stored token
async function authenticateUser(username: string, encryptionPassword: string) {
  try {
    // Check if token exists
    if (!tokenStorage.hasToken(username)) {
      throw new Error(`No stored token found for user: ${username}`);
    }

    // Retrieve and authenticate with stored token
    const authResult = await enhancedAuthService.authenticateWithStoredToken(username);

    if (authResult.authenticated) {
      console.log(`Authentication successful for user: ${authResult.user.login}`);
      return authResult.user;
    } else {
      console.error(`Authentication failed: ${authResult.error}`);

      // Remove invalid token
      if (authResult.error.includes('Invalid token credentials')) {
        tokenStorage.removeToken(username);
        console.log(`Removed invalid token for user: ${username}`);
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
  }

  return null;
}
```

## 3. Integration with GitHubClient

### 3.1 Basic Client Usage

```typescript
import { GitHubClient } from 'bolt-diy-to-github/src/github/GitHubClient';

// Initialize client with PAT
const client = new GitHubClient('ghp_your_personal_access_token_here');

// List repositories
async function listUserRepositories() {
  try {
    const repos = await client.repositories.list();
    console.log(`Found ${repos.length} repositories:`);
    repos.forEach(repo => {
      console.log(`- ${repo.name} (${repo.private ? 'private' : 'public'})`);
    });
    return repos;
  } catch (error) {
    console.error('Failed to list repositories:', error);
    throw error;
  }
}

// Create a new repository
async function createRepository(name: string, description: string, isPrivate: boolean = false) {
  try {
    const newRepo = await client.repositories.create({
      name,
      description,
      private: isPrivate
    });

    console.log(`Repository created: ${newRepo.html_url}`);
    return newRepo;
  } catch (error) {
    console.error('Failed to create repository:', error);
    throw error;
  }
}

// List branches for a repository
async function listRepositoryBranches(owner: string, repo: string) {
  try {
    const branches = await client.branches.list(owner, repo);
    console.log(`Found ${branches.length} branches in ${repo}:`);
    branches.forEach(branch => {
      console.log(`- ${branch.name} (${branch.commit.sha.substring(0, 7)})`);
    });
    return branches;
  } catch (error) {
    console.error('Failed to list branches:', error);
    throw error;
  }
}
```

### 3.2 Client with Enhanced Authentication

```typescript
import { GitHubClient } from 'bolt-diy-to-github/src/github/GitHubClient';
import { EnhancedGitHubPATAuthService } from 'bolt-diy-to-github/src/services/validation/EnhancedGitHubPATAuthService';
import { SecureTokenStorage } from 'bolt-diy-to-github/src/services/storage/SecureTokenStorage';

class AuthenticatedGitHubClient {
  private client: GitHubClient | null = null;
  private authService: EnhancedGitHubPATAuthService;
  private tokenStorage: SecureTokenStorage;

  constructor() {
    this.authService = new EnhancedGitHubPATAuthService();
    this.tokenStorage = new SecureTokenStorage();
  }

  async authenticateUser(username: string, encryptionPassword: string): Promise<boolean> {
    try {
      // Authenticate using stored token
      const authResult = await this.authService.authenticateWithStoredToken(username);

      if (authResult.authenticated && authResult.user) {
        // Initialize GitHub client with authenticated token
        const token = this.authService.retrieveToken(username);
        if (token) {
          this.client = new GitHubClient(token);
          console.log(`Authenticated as: ${authResult.user.login}`);
          return true;
        }
      } else {
        console.error(`Authentication failed: ${authResult.error}`);
        // Remove invalid token
        this.tokenStorage.removeToken(username);
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }

    this.client = null;
    return false;
  }

  // Repository operations
  async listRepositories() {
    if (!this.client) {
      throw new Error('User not authenticated');
    }

    try {
      return await this.client.repositories.list();
    } catch (error) {
      console.error('Failed to list repositories:', error);
      throw error;
    }
  }

  async createRepository(name: string, description: string, isPrivate: boolean = false) {
    if (!this.client) {
      throw new Error('User not authenticated');
    }

    try {
      return await this.client.repositories.create({
        name,
        description,
        private: isPrivate
      });
    } catch (error) {
      console.error('Failed to create repository:', error);
      throw error;
    }
  }

  // Branch operations
  async listBranches(owner: string, repo: string) {
    if (!this.client) {
      throw new Error('User not authenticated');
    }

    try {
      return await this.client.branches.list(owner, repo);
    } catch (error) {
      console.error('Failed to list branches:', error);
      throw error;
    }
  }

  async createBranch(owner: string, repo: string, branchName: string, sourceSha: string) {
    if (!this.client) {
      throw new Error('User not authenticated');
    }

    try {
      return await this.client.branches.create(owner, repo, branchName, sourceSha);
    } catch (error) {
      console.error('Failed to create branch:', error);
      throw error;
    }
  }
}

// Usage example
const githubManager = new AuthenticatedGitHubClient();

async function performGitHubOperations(username: string, password: string) {
  // Authenticate user
  const isAuthenticated = await githubManager.authenticateUser(username, password);

  if (isAuthenticated) {
    try {
      // List repositories
      const repos = await githubManager.listRepositories();
      console.log(`User has ${repos.length} repositories`);

      // Create a new repository
      const newRepo = await githubManager.createRepository(
        'my-new-project',
        'A new project created with bolt-diy-to-github',
        true // private
      );

      console.log(`Created repository: ${newRepo.html_url}`);

      // List branches of the new repository
      const branches = await githubManager.listBranches(username, newRepo.name);
      console.log(`Repository has ${branches.length} branches`);

    } catch (error) {
      console.error('GitHub operations failed:', error);
    }
  } else {
    console.error('Authentication failed');
  }
}
```

## 4. Error Handling Best Practices

### 4.1 Comprehensive Error Handling

```typescript
import { GitHubPATAuthService, AuthResult } from 'bolt-diy-to-github/src/services/GitHubPATAuthService';

class GitHubAuthManager {
  private authService: GitHubPATAuthService;

  constructor() {
    this.authService = new GitHubPATAuthService();
  }

  async authenticateWithRetry(token: string, maxRetries: number = 3): Promise<AuthResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Authentication attempt ${attempt}/${maxRetries}`);

        const result = await this.authService.authenticate(token);

        if (result.authenticated) {
          console.log('Authentication successful');
          return result;
        } else {
          console.warn(`Authentication failed: ${result.error}`);

          // Don't retry for validation errors
          if (result.error.includes('Invalid token')) {
            return result;
          }
        }
      } catch (error) {
        lastError = error as Error;
        console.error(`Authentication attempt ${attempt} failed:`, error);

        // Don't retry for certain errors
        if (error instanceof Error && error.message.includes('Invalid token format')) {
          return {
            authenticated: false,
            error: 'Invalid token format'
          };
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s, etc.
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      authenticated: false,
      error: `Authentication failed after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`
    };
  }

  async validateAndAuthenticate(token: string): Promise<AuthResult> {
    // Step 1: Validate token format
    if (!token) {
      return {
        authenticated: false,
        error: 'Token is required'
      };
    }

    const isValidFormat = this.authService.validateToken(token);
    if (!isValidFormat) {
      return {
        authenticated: false,
        error: 'Invalid token format. Token must start with "ghp_" followed by 36 alphanumeric characters.'
      };
    }

    // Step 2: Authenticate with retry logic
    return await this.authenticateWithRetry(token);
  }
}

// Usage
const authManager = new GitHubAuthManager();

async function handleUserAuthentication(userToken: string) {
  try {
    const result = await authManager.validateAndAuthenticate(userToken);

    if (result.authenticated) {
      console.log(`Welcome, ${result.user.login}!`);
      // Proceed with authenticated operations
      return result.user;
    } else {
      console.error('Authentication failed:', result.error);

      // Handle specific error cases
      if (result.error.includes('Invalid token format')) {
        console.log('Please provide a valid GitHub Personal Access Token');
      } else if (result.error.includes('Invalid token credentials')) {
        console.log('Your token may have expired or been revoked. Please generate a new one.');
      } else if (result.error.includes('Network error')) {
        console.log('Network connectivity issue. Please check your connection and try again.');
      }
    }
  } catch (error) {
    console.error('Unexpected authentication error:', error);
  }

  return null;
}
```

### 4.2 Error Handling with User Feedback

```typescript
interface UserFacingError {
  message: string;
  code: string;
  userAction?: string;
  technicalDetails?: string;
}

class GitHubErrorHandler {
  static translateAuthError(error: string): UserFacingError {
    if (error.includes('Token is required')) {
      return {
        message: 'GitHub token is required to proceed.',
        code: 'MISSING_TOKEN',
        userAction: 'Please provide your GitHub Personal Access Token.',
        technicalDetails: error
      };
    }

    if (error.includes('Invalid token format')) {
      return {
        message: 'The provided GitHub token format is invalid.',
        code: 'INVALID_TOKEN_FORMAT',
        userAction: 'Ensure your token starts with "ghp_" followed by 36 alphanumeric characters.',
        technicalDetails: error
      };
    }

    if (error.includes('Invalid token credentials')) {
      return {
        message: 'Your GitHub token is invalid or has expired.',
        code: 'INVALID_CREDENTIALS',
        userAction: 'Please generate a new Personal Access Token in your GitHub settings.',
        technicalDetails: error
      };
    }

    if (error.includes('Network error')) {
      return {
        message: 'Unable to connect to GitHub. Please check your network connection.',
        code: 'NETWORK_ERROR',
        userAction: 'Check your internet connection and try again.',
        technicalDetails: error
      };
    }

    if (error.includes('GitHub API error')) {
      const statusCode = error.match(/GitHub API error: (\d+)/)?.[1] || 'unknown';

      if (statusCode === '403') {
        return {
          message: 'GitHub API rate limit exceeded or insufficient permissions.',
          code: 'API_RATE_LIMIT',
          userAction: 'Wait for the rate limit to reset or check your token permissions.',
          technicalDetails: error
        };
      }

      return {
        message: `GitHub API error (Status ${statusCode}).`,
        code: 'API_ERROR',
        userAction: 'Please try again later or check GitHub status page.',
        technicalDetails: error
      };
    }

    // Generic error
    return {
      message: 'An unexpected error occurred during GitHub authentication.',
      code: 'UNKNOWN_ERROR',
      userAction: 'Please try again or contact support.',
      technicalDetails: error
    };
  }
}

// Usage with user-facing error messages
async function authenticateUserWithFriendlyErrors(token: string) {
  const authManager = new GitHubAuthManager();

  try {
    const result = await authManager.validateAndAuthenticate(token);

    if (result.authenticated) {
      return {
        success: true,
        user: result.user,
        message: `Successfully authenticated as ${result.user.login}`
      };
    } else {
      const userError = GitHubErrorHandler.translateAuthError(result.error);
      return {
        success: false,
        error: userError,
        message: userError.message
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const userError = GitHubErrorHandler.translateAuthError(errorMessage);

    return {
      success: false,
      error: userError,
      message: userError.message
    };
  }
}
```

## 5. Security Best Practices

### 5.1 Token Management

```typescript
import { SecureTokenStorage } from 'bolt-diy-to-github/src/services/storage/SecureTokenStorage';
import { TokenEncryptionService } from 'bolt-diy-to-github/src/security/TokenEncryptionService';

class SecureTokenManager {
  private tokenStorage: SecureTokenStorage;
  private encryptionService: TokenEncryptionService;

  constructor() {
    this.tokenStorage = new SecureTokenStorage();
    this.encryptionService = new TokenEncryptionService();
  }

  // Store token with additional security measures
  async storeTokenSecurely(username: string, token: string, password: string): Promise<void> {
    try {
      // Validate token format
      if (!this.isValidGitHubToken(token)) {
        throw new Error('Invalid GitHub token format');
      }

      // Check token strength (basic check)
      if (token.length < 40) {
        throw new Error('Token appears too short to be valid');
      }

      // Store with encryption
      await this.tokenStorage.storeToken(token, password, username);

      console.log(`Token securely stored for user: ${username}`);
    } catch (error) {
      console.error('Failed to store token securely:', error);
      throw error;
    }
  }

  // Retrieve token with security checks
  async retrieveTokenSecurely(username: string, password: string): Promise<string | null> {
    try {
      // Check if token exists
      if (!this.tokenStorage.hasToken(username)) {
        console.log(`No token found for user: ${username}`);
        return null;
      }

      // Retrieve and decrypt token
      const token = await this.tokenStorage.retrieveToken(password, username);

      // Validate retrieved token
      if (!this.isValidGitHubToken(token)) {
        console.warn(`Invalid token format retrieved for user: ${username}`);
        // Remove invalid token
        this.tokenStorage.removeToken(username);
        return null;
      }

      return token;
    } catch (error) {
      console.error('Failed to retrieve token:', error);

      // If it's a decryption error, the password might be wrong
      if (error instanceof Error && error.message.includes('Failed to decrypt')) {
        console.log('Incorrect password provided for token decryption');
      }

      return null;
    }
  }

  // Rotate token (store new, remove old)
  async rotateToken(username: string, oldPassword: string, newPassword: string, newToken: string): Promise<boolean> {
    try {
      // First, verify we can retrieve the old token
      const oldToken = await this.retrieveTokenSecurely(username, oldPassword);
      if (!oldToken) {
        throw new Error('Cannot rotate token: old token not accessible');
      }

      // Store new token
      await this.storeTokenSecurely(username, newToken, newPassword);

      console.log(`Token rotated successfully for user: ${username}`);
      return true;
    } catch (error) {
      console.error('Failed to rotate token:', error);
      return false;
    }
  }

  // Validate GitHub token format
  private isValidGitHubToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Support both classic PATs and fine-grained PATs
    const classicPatRegex = /^ghp_[a-zA-Z0-9]{36}$/;
    const fineGrainedPatRegex = /^github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}$/;

    return classicPatRegex.test(token) || fineGrainedPatRegex.test(token);
  }

  // Remove token securely
  removeToken(username: string): void {
    try {
      this.tokenStorage.removeToken(username);
      console.log(`Token removed for user: ${username}`);
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  }
}
```

### 5.2 Environment-Based Configuration

```typescript
// config/auth-config.ts
export interface AuthConfig {
  githubApiBaseUrl: string;
  userAgent: string;
  timeoutMs: number;
  maxRetries: number;
  encryptionIterations: number;
}

export function getAuthConfig(): AuthConfig {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    githubApiBaseUrl: process.env.GITHUB_API_BASE_URL || 'https://api.github.com',
    userAgent: process.env.USER_AGENT || 'bolt-diy-to-github-client/1.0.0',
    timeoutMs: isProduction ? 10000 : 30000, // 10s in production, 30s in development
    maxRetries: isProduction ? 3 : 1, // Fewer retries in production
    encryptionIterations: isProduction ? 100000 : 1000 // Fewer iterations in development for speed
  };
}

// Usage in services
import { getAuthConfig } from '../config/auth-config';

class ConfigurableGitHubAuthService {
  private config: AuthConfig;

  constructor() {
    this.config = getAuthConfig();
  }

  async authenticate(token: string): Promise<AuthResult> {
    // Use configuration values
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.githubApiBaseUrl}/user`, {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': this.config.userAgent
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle response...
    } catch (error) {
      clearTimeout(timeoutId);
      // Handle error...
    }
  }
}
```

## 6. Performance Optimization

### 6.1 Caching Authentication Results

```typescript
import { AuthResult } from 'bolt-diy-to-github/src/types/github';

class CachedGitHubAuthService {
  private authService: GitHubPATAuthService;
  private authCache: Map<string, { result: AuthResult; timestamp: number }>;
  private cacheTtlMs: number;

  constructor(cacheTtlMinutes: number = 5) {
    this.authService = new GitHubPATAuthService();
    this.authCache = new Map();
    this.cacheTtlMs = cacheTtlMinutes * 60 * 1000;
  }

  async authenticate(token: string): Promise<AuthResult> {
    const now = Date.now();

    // Check cache first
    const cached = this.authCache.get(token);
    if (cached && (now - cached.timestamp) < this.cacheTtlMs) {
      console.log('Returning cached authentication result');
      return cached.result;
    }

    // Perform authentication
    const result = await this.authService.authenticate(token);

    // Cache successful results
    if (result.authenticated) {
      this.authCache.set(token, {
        result,
        timestamp: now
      });
      console.log('Cached authentication result');
    } else {
      // Remove failed authentications from cache
      this.authCache.delete(token);
    }

    return result;
  }

  // Clear expired cache entries
  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [token, entry] of this.authCache.entries()) {
      if ((now - entry.timestamp) >= this.cacheTtlMs) {
        this.authCache.delete(token);
      }
    }
  }

  // Manual cache cleanup
  clearCache(): void {
    this.authCache.clear();
    console.log('Authentication cache cleared');
  }
}
```

### 6.2 Batch Operations

```typescript
class BatchGitHubOperations {
  private client: GitHubClient;

  constructor(token: string) {
    this.client = new GitHubClient(token);
  }

  // Batch repository creation
  async createRepositories(repositoryConfigs: Array<{
    name: string;
    description: string;
    private: boolean;
  }>): Promise<Array<{ success: boolean; repo?: any; error?: string }>> {
    const results: Array<{ success: boolean; repo?: any; error?: string }> = [];

    // Process in parallel with controlled concurrency
    const batchSize = 5;
    for (let i = 0; i < repositoryConfigs.length; i += batchSize) {
      const batch = repositoryConfigs.slice(i, i + batchSize);

      const batchPromises = batch.map(async (config) => {
        try {
          const repo = await this.client.repositories.create(config);
          return { success: true, repo };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  // Batch branch creation
  async createBranches(
    owner: string,
    repo: string,
    branchConfigs: Array<{
      name: string;
      sourceSha: string;
    }>
  ): Promise<Array<{ success: boolean; branch?: any; error?: string }>> {
    const results: Array<{ success: boolean; branch?: any; error?: string }> = [];

    // Process with concurrency limit
    const concurrencyLimit = 3;
    for (let i = 0; i < branchConfigs.length; i += concurrencyLimit) {
      const batch = branchConfigs.slice(i, i + concurrencyLimit);

      const batchPromises = batch.map(async (config) => {
        try {
          const branch = await this.client.branches.create(
            owner,
            repo,
            config.name,
            config.sourceSha
          );
          return { success: true, branch };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }
}

// Usage
async function batchCreateRepositories(token: string) {
  const batchOps = new BatchGitHubOperations(token);

  const reposToCreate = [
    { name: 'project-alpha', description: 'Alpha project', private: true },
    { name: 'project-beta', description: 'Beta project', private: false },
    { name: 'project-gamma', description: 'Gamma project', private: true },
    // ... more repositories
  ];

  try {
    const results = await batchOps.createRepositories(reposToCreate);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`Created ${successful.length} repositories successfully`);
    console.log(`${failed.length} repositories failed to create`);

    failed.forEach((result, index) => {
      console.error(`Failed to create repository ${index + 1}: ${result.error}`);
    });

    return successful.map(r => r.repo);
  } catch (error) {
    console.error('Batch creation failed:', error);
    throw error;
  }
}
```

## 7. Monitoring and Logging

### 7.1 Structured Logging

```typescript
interface AuthLogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  operation: string;
  userId?: string;
  tokenId?: string; // Only store first/last chars for security
  success: boolean;
  errorCode?: string;
  durationMs?: number;
  metadata?: Record<string, any>;
}

class AuthLogger {
  private logs: AuthLogEntry[] = [];
  private maxLogs: number = 1000;

  log(entry: Omit<AuthLogEntry, 'timestamp'>): void {
    const logEntry: AuthLogEntry = {
      timestamp: new Date(),
      ...entry
    };

    this.logs.push(logEntry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Output to console
    const logMessage = `[${logEntry.timestamp.toISOString()}] ${logEntry.level.toUpperCase()}: ${logEntry.operation}`;
    if (logEntry.success) {
      console.log(logMessage);
    } else {
      console.error(`${logMessage} - ${logEntry.errorCode || 'Unknown error'}`);
    }
  }

  getLogs(filter?: Partial<AuthLogEntry>): AuthLogEntry[] {
    if (!filter) {
      return [...this.logs];
    }

    return this.logs.filter(log => {
      return Object.entries(filter).every(([key, value]) => {
        return log[key as keyof AuthLogEntry] === value;
      });
    });
  }

  getStats(): {
    total: number;
    successful: number;
    failed: number;
    errorCodes: Record<string, number>;
    averageDurationMs: number;
  } {
    const total = this.logs.length;
    const successful = this.logs.filter(log => log.success).length;
    const failed = total - successful;

    const errorCodes: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;

    this.logs.forEach(log => {
      if (log.errorCode) {
        errorCodes[log.errorCode] = (errorCodes[log.errorCode] || 0) + 1;
      }

      if (log.durationMs !== undefined) {
        totalDuration += log.durationMs;
        durationCount++;
      }
    });

    return {
      total,
      successful,
      failed,
      errorCodes,
      averageDurationMs: durationCount > 0 ? totalDuration / durationCount : 0
    };
  }
}

// Usage in authentication service
class MonitoredGitHubAuthService {
  private authService: GitHubPATAuthService;
  private logger: AuthLogger;

  constructor() {
    this.authService = new GitHubPATAuthService();
    this.logger = new AuthLogger();
  }

  async authenticate(token: string, userId?: string): Promise<AuthResult> {
    const startTime = Date.now();
    let errorCode: string | undefined;

    try {
      this.logger.log({
        level: 'info',
        operation: 'auth_start',
        userId,
        success: true,
        tokenId: this.maskToken(token)
      });

      const result = await this.authService.authenticate(token);

      const duration = Date.now() - startTime;
      errorCode = result.error ? this.getErrorCode(result.error) : undefined;

      this.logger.log({
        level: result.authenticated ? 'info' : 'warn',
        operation: 'auth_complete',
        userId,
        success: result.authenticated,
        errorCode,
        durationMs: duration,
        tokenId: this.maskToken(token)
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      errorCode = 'INTERNAL_ERROR';

      this.logger.log({
        level: 'error',
        operation: 'auth_error',
        userId,
        success: false,
        errorCode,
        durationMs: duration,
        tokenId: this.maskToken(token),
        metadata: {
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      throw error;
    }
  }

  private maskToken(token: string): string {
    if (!token) return '';
    if (token.length <= 8) return token;
    return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
  }

  private getErrorCode(errorMessage: string): string {
    if (errorMessage.includes('Invalid token format')) return 'INVALID_FORMAT';
    if (errorMessage.includes('Invalid token credentials')) return 'INVALID_CREDENTIALS';
    if (errorMessage.includes('Network error')) return 'NETWORK_ERROR';
    if (errorMessage.includes('GitHub API error')) {
      const match = errorMessage.match(/GitHub API error: (\d+)/);
      return `API_ERROR_${match?.[1] || 'UNKNOWN'}`;
    }
    return 'UNKNOWN_ERROR';
  }

  getAuthStats() {
    return this.logger.getStats();
  }

  getAuthLogs(filter?: Partial<AuthLogEntry>) {
    return this.logger.getLogs(filter);
  }
}
```

## 8. Testing and Validation

### 8.1 Integration Testing Setup

```typescript
// test/setup.ts
import { EnhancedGitHubPATAuthService } from '../src/services/validation/EnhancedGitHubPATAuthService';
import { SecureTokenStorage } from '../src/services/storage/SecureTokenStorage';

// Test utilities
export class TestAuthUtils {
  static createValidToken(): string {
    return 'ghp_validtoken12345678901234567890123456';
  }

  static createInvalidToken(): string {
    return 'invalid_token_format';
  }

  static createMockUser(login: string = 'test-user'): any {
    return {
      login,
      id: 123456,
      node_id: 'MDQ6VXNlcjEyMzQ1Ng==',
      avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4',
      url: 'https://api.github.com/users/test-user',
      html_url: 'https://github.com/test-user',
      type: 'User',
      site_admin: false,
      name: 'Test User',
      company: null,
      blog: '',
      location: 'San Francisco',
      email: null,
      hireable: null,
      bio: null,
      twitter_username: null,
      public_repos: 10,
      public_gists: 5,
      followers: 20,
      following: 30,
      created_at: '2020-01-01T00:00:00Z',
      updated_at: '2021-01-01T00:00:00Z'
    };
  }

  static async setupTestStorage(): Promise<SecureTokenStorage> {
    const storage = new SecureTokenStorage();
    // Clear any existing test data
    const keys = storage.getTokenKeys();
    keys.forEach(key => storage.removeToken(key));
    return storage;
  }
}

// Example test
describe('EnhancedGitHubPATAuthService Integration', () => {
  let authService: EnhancedGitHubPATAuthService;
  let tokenStorage: SecureTokenStorage;

  beforeEach(async () => {
    authService = new EnhancedGitHubPATAuthService();
    tokenStorage = await TestAuthUtils.setupTestStorage();
  });

  afterEach(() => {
    // Cleanup
    const keys = tokenStorage.getTokenKeys();
    keys.forEach(key => tokenStorage.removeToken(key));
  });

  it('should store, retrieve, and authenticate with token', async () => {
    const username = 'test-user';
    const password = 'test-password';
    const token = TestAuthUtils.createValidToken();

    // Mock successful authentication
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(TestAuthUtils.createMockUser(username))
    });

    // Store token
    await tokenStorage.storeToken(token, password, username);

    // Retrieve token
    const retrievedToken = await tokenStorage.retrieveToken(password, username);
    expect(retrievedToken).toBe(token);

    // Authenticate with stored token
    const authResult = await authService.authenticateWithStoredToken(username);
    expect(authResult.authenticated).toBe(true);
    expect(authResult.user.login).toBe(username);
  });
});
```

This comprehensive usage guide provides practical examples and best practices for implementing GitHub authentication in your applications. It covers everything from basic authentication flows to advanced security and performance optimization techniques.