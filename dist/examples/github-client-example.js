"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Example usage of the GitHubClient
const GitHubClient_1 = require("../github/GitHubClient");
async function example() {
    try {
        // Initialize with a GitHub Personal Access Token
        // Note: In a real application, you would load this from environment variables
        const token = 'ghp_your_personal_access_token_here';
        const client = new GitHubClient_1.GitHubClient(token);
        // List repositories
        console.log('Listing repositories...');
        const repos = await client.repositories.list();
        console.log(`Found ${repos.length} repositories`);
        // Create a new repository (uncomment to use)
        // console.log('Creating repository...');
        // const newRepo = await client.repositories.create({
        //   name: 'test-repo-from-client',
        //   description: 'A test repository created from our GitHub client',
        //   private: false
        // });
        // console.log(`Created repository: ${newRepo.name}`);
        // List branches in a repository (using a public repository as an example)
        console.log('Listing branches...');
        const branches = await client.branches.list('octocat', 'Hello-World');
        console.log(`Found ${branches.length} branches`);
        console.log('Example completed successfully!');
    }
    catch (error) {
        console.error('Error in example:', error);
    }
}
// Run the example if this file is executed directly
if (require.main === module) {
    example();
}
//# sourceMappingURL=github-client-example.js.map