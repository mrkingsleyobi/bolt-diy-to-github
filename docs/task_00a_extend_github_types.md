# Task 00a: Extend GitHub Types for Repository Operations

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The project already has basic GitHub types for user authentication, but we need to extend these types to support repository operations.

## Current System State
- GitHubUser and AuthResult types exist in src/types/github.ts
- Basic PAT authentication service is implemented
- TypeScript project with strict type checking enabled

## Your Task
Extend the GitHub types to include repository and branch interfaces needed for our API client implementation.

## Test First (RED Phase)
No test needed for type definitions, but we'll verify they work in subsequent tasks.

Minimal Implementation (GREEN Phase)
```typescript
// Extended GitHub API Types
export interface Repository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: Owner;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  forks_count: number;
  mirror_url: string | null;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: License | null;
  allow_forking: boolean;
  is_template: boolean;
  topics: string[];
  visibility: string;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
}

export interface Owner {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}

export interface License {
  key: string;
  name: string;
  spdx_id: string;
  url: string;
  node_id: string;
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubError {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
  }>;
}

export interface GitHubClientOptions {
  baseUrl?: string;
  userAgent?: string;
  timeout?: number;
}
```

Refactored Solution (REFACTOR Phase)
Same as implementation since this is just type definitions.

Verification Commands
```bash
npm run typecheck
```

Success Criteria
[ ] All existing types still compile
[ ] New repository and branch types are defined
[ ] Code compiles without warnings
[ ] No mocks or stubs - real type definitions only

Dependencies Confirmed
[TypeScript compiler in package.json]
[Existing GitHub types file]

Next Task
task_00b_create_http_utilities.md