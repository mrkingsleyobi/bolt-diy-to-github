// GitHub Client exports
export { GitHubClient } from './GitHubClient';
export { RepositoryService } from './repositories/RepositoryService';
export { BranchService } from './branches/BranchService';

// Types
export type {
  Repository,
  Branch,
  Owner,
  License,
  GitHubUser,
  AuthResult,
  GitHubError,
  GitHubClientOptions
} from './types/github';