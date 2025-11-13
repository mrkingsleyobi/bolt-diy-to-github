"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GitHubPATAuthService_js_1 = require("../services/GitHubPATAuthService.js");
const GitHubAppAuthService_js_1 = require("../services/GitHubAppAuthService.js");
// Example usage of GitHub PAT Authentication Service
async function patExample() {
    const patService = new GitHubPATAuthService_js_1.GitHubPATAuthService();
    // Example of validating a token format
    const validToken = 'ghp_validtoken12345678901234567890123456';
    const isValid = patService.validateToken(validToken);
    console.log(`PAT format is valid: ${isValid}`);
    // Example of authenticating with GitHub (this would require a real token)
    try {
        const result = await patService.authenticate(validToken);
        if (result.authenticated) {
            console.log('PAT Authentication successful!');
            console.log('User:', result.user?.login);
        }
        else {
            console.log('PAT Authentication failed:', result.error);
        }
    }
    catch (error) {
        console.error('Unexpected error during PAT authentication:', error);
    }
}
// Example usage of GitHub App Authentication Service
async function appExample() {
    // Initialize the service with your GitHub App credentials
    const appService = new GitHubAppAuthService_js_1.GitHubAppAuthService(process.env.GITHUB_APP_CLIENT_ID || 'your-client-id', process.env.GITHUB_APP_CLIENT_SECRET || 'your-client-secret');
    // Example of validating a token format
    const validToken = 'ghu_validtoken12345678901234567890123456';
    const isValid = appService.validateToken(validToken);
    console.log(`App token format is valid: ${isValid}`);
    // Example of authenticating with GitHub (this would require a real token)
    try {
        const result = await appService.authenticate(validToken);
        if (result.authenticated) {
            console.log('App Authentication successful!');
            console.log('User:', result.user?.login);
        }
        else {
            console.log('App Authentication failed:', result.error);
        }
    }
    catch (error) {
        console.error('Unexpected error during app authentication:', error);
    }
}
// Run the examples
patExample().catch(console.error);
appExample().catch(console.error);
//# sourceMappingURL=github-auth-example.js.map