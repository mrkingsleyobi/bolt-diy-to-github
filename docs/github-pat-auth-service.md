# GitHub Personal Access Token Authentication Service

## Overview

This service provides GitHub authentication functionality using Personal Access Tokens (PATs). It validates token formats and authenticates with the GitHub API to verify credentials.

## Implementation Details

### Service Class: GitHubPATAuthService

The `GitHubPATAuthService` class provides two main methods:

1. **validateToken(token: string): boolean** - Validates the format of a GitHub PAT
2. **authenticate(token: string): Promise<AuthResult>** - Authenticates with GitHub API using a PAT

### Token Validation

The service validates PATs using a regular expression that checks for:
- The prefix `ghp_`
- Exactly 36 alphanumeric characters

### Authentication Flow

The authentication process follows these steps:
1. Validate the token format
2. Make a request to the GitHub API `/user` endpoint
3. Handle various response scenarios:
   - Successful authentication (200 OK)
   - Invalid credentials (401 Unauthorized)
   - Other HTTP errors
   - Network errors

## London School TDD Approach

This implementation follows the London School Test-Driven Development methodology, which emphasizes:

### Outside-In Development
- Tests are written from the perspective of the consumer of the service
- Focus on behavior and interactions rather than implementation details
- Mock external dependencies (GitHub API) to isolate the unit under test

### Mock-First Approach
- Create test doubles (mocks) before implementing the actual code
- Define expected behaviors through mock interactions
- Isolate units under test completely

### Interaction Testing
- Verify that the service interacts correctly with the GitHub API
- Test the service's behavior in response to different API responses
- Ensure proper error handling for various failure scenarios

## Test Coverage

The test suite includes comprehensive coverage for:

### Unit Tests
- Token validation with various input scenarios
- Authentication flow with mock API responses
- Error handling for different failure modes

### Edge Cases
- Invalid token formats
- Network errors
- HTTP error responses
- Missing or malformed input

### Integration Points
- GitHub API interaction
- Response parsing
- Error message formatting

## Usage

```typescript
import { GitHubPATAuthService } from './services/GitHubPATAuthService';

const authService = new GitHubPATAuthService();

// Validate a token format
const isValid = authService.validateToken('ghp_your_token_here');

// Authenticate with GitHub
const result = await authService.authenticate('ghp_your_token_here');

if (result.authenticated) {
  console.log('Authentication successful:', result.user);
} else {
  console.error('Authentication failed:', result.error);
}
```

## Types

The service uses TypeScript interfaces for type safety:

- `GitHubUser`: Represents a GitHub user object
- `AuthResult`: Represents the result of an authentication attempt

## Error Handling

The service provides detailed error information for troubleshooting:
- Invalid token format errors
- Network connectivity issues
- GitHub API errors with status codes
- Invalid token credentials