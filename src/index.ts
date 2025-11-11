export { GitHubPATAuthService } from './services/GitHubPATAuthService.js';
export { GitHubClient } from './github/GitHubClient.js';
export type { GitHubUser, AuthResult } from './types/github.js';
export type {
  Repository,
  Branch,
  Owner,
  License,
  GitHubError,
  GitHubClientOptions
} from './github/types/github.js';

// Enhanced security exports
export { TokenEncryptionService } from './security/TokenEncryptionService.js';
export { SecureTokenStorage } from './services/storage/SecureTokenStorage.js';
export { EnhancedGitHubPATAuthService } from './services/validation/EnhancedGitHubPATAuthService.js';