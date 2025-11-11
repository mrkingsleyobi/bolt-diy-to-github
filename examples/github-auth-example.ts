import { GitHubPATAuthService } from './services/GitHubPATAuthService.js';

async function example() {
  const authService = new GitHubPATAuthService();

  // Example of validating a token format
  const validToken = 'ghp_validtoken12345678901234567890123456';
  const isValid = authService.validateToken(validToken);
  console.log(`Token format is valid: ${isValid}`);

  // Example of authenticating with GitHub (this would require a real token)
  try {
    const result = await authService.authenticate(validToken);
    if (result.authenticated) {
      console.log('Authentication successful!');
      console.log('User:', result.user?.login);
    } else {
      console.log('Authentication failed:', result.error);
    }
  } catch (error) {
    console.error('Unexpected error during authentication:', error);
  }
}

// Run the example
example().catch(console.error);