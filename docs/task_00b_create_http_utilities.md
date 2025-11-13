# Task 00b: Create HTTP Utility Functions

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need HTTP utility functions to handle API requests for our GitHub client.

## Current System State
- TypeScript project with fetch API available
- Existing GitHub PAT authentication service uses fetch
- Jest testing framework in place

## Your Task
Create HTTP utility functions for making API requests with proper error handling and response parsing.

## Test First (RED Phase)
```typescript
// Test for HTTP utilities
import { HttpClient } from '../src/utils/http';

describe('HttpClient', () => {
  it('should create an instance with default options', () => {
    const client = new HttpClient();
    expect(client).toBeInstanceOf(HttpClient);
  });

  it('should make a GET request with proper headers', async () => {
    const client = new HttpClient();
    // This will fail until we implement the method
    await expect(client.get('/test')).rejects.toThrow();
  });
});
```

Minimal Implementation (GREEN Phase)
```typescript
// HTTP utility functions
export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = 'https://api.github.com', defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'User-Agent': 'bolt-diy-to-github-client',
      'Accept': 'application/vnd.github.v3+json',
      ...defaultHeaders
    };
  }

  async get(path: string, headers: Record<string, string> = {}): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { ...this.defaultHeaders, ...headers }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async post(path: string, data: any, headers: Record<string, string> = {}): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
        ...headers
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async delete(path: string, headers: Record<string, string> = {}): Promise<void> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { ...this.defaultHeaders, ...headers }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}
```

Refactored Solution (REFACTOR Phase)
```typescript
// HTTP utility functions
export interface HttpClientOptions {
  baseUrl?: string;
  userAgent?: string;
  timeout?: number;
}

export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(options: HttpClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'https://api.github.com';
    this.timeout = options.timeout || 10000;
    this.defaultHeaders = {
      'User-Agent': options.userAgent || 'bolt-diy-to-github-client',
      'Accept': 'application/vnd.github.v3+json'
    };
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...init,
        headers: { ...this.defaultHeaders, ...init.headers },
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get(path: string, headers: Record<string, string> = {}): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.request(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async post(path: string, data: any, headers: Record<string, string> = {}): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async delete(path: string, headers: Record<string, string> = {}): Promise<void> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.request(url, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}
```

Verification Commands
```bash
npm run typecheck
npm run test
```

Success Criteria
[ ] HTTP client class is created
[ ] GET, POST, and DELETE methods implemented
[ ] Proper error handling with descriptive messages
[ ] Timeout support for requests
[ ] Tests written and initially fail as expected
[ ] Implementation makes tests pass
[ ] Code compiles without warnings

Dependencies Confirmed
[fetch API available in Node.js environment]
[TypeScript compiler in package.json]

Next Task
task_01_implement_github_client.md