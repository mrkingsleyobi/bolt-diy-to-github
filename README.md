# bolt-diy-to-github

A TypeScript library for authenticating with GitHub using Personal Access Tokens (PATs).

## Features

- **Token Validation**: Validates GitHub PAT format using regex
- **GitHub API Authentication**: Authenticates with GitHub API using PATs
- **Comprehensive Error Handling**: Detailed error messages for troubleshooting
- **TypeScript Support**: Full type safety with TypeScript interfaces
- **London School TDD**: Implementation following Test-Driven Development principles
- **Comprehensive Test Coverage**: Extensive test suite with edge cases

## Installation

```bash
npm install bolt-diy-to-github
```

## Usage

```typescript
import { GitHubPATAuthService } from 'bolt-diy-to-github';

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

## API

### GitHubPATAuthService

#### `validateToken(token: string): boolean`

Validates the format of a GitHub Personal Access Token.

- **token**: The token to validate
- **Returns**: `true` if the token format is valid, `false` otherwise

#### `authenticate(token: string): Promise<AuthResult>`

Authenticates with GitHub API using a Personal Access Token.

- **token**: The GitHub PAT to use for authentication
- **Returns**: A promise that resolves to an `AuthResult` object

### Types

#### `GitHubUser`

Interface representing a GitHub user object with all standard properties.

#### `AuthResult`

Interface representing the result of an authentication attempt:
```typescript
{
  authenticated: boolean;
  user?: GitHubUser;
  error?: string;
}
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/services/__tests__/githubAuth.london.tdd.test.ts
```

### Type Checking

```bash
npm run typecheck
```

## London School TDD Approach

This implementation follows the London School Test-Driven Development methodology:

1. **Outside-In Development**: Tests are written from the consumer's perspective
2. **Mock-First Approach**: External dependencies are mocked to isolate units
3. **Interaction Testing**: Focus on behavior and interactions rather than implementation details

## Test Coverage

The test suite includes comprehensive coverage for:

- Token validation with various input scenarios
- Authentication flow with mock API responses
- Error handling for different failure modes
- Edge cases and boundary conditions
- Integration points with the GitHub API

## License

ISC