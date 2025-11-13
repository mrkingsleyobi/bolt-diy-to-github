// Example usage of GitHub File Operations
import { GitHubClient } from '../github/GitHubClient';

async function fileOperationsExample() {
  try {
    // Initialize GitHub client with token
    // Note: In a real application, you would load this from a secure source
    const token = process.env.GITHUB_TOKEN || 'your-github-token-here';
    const github = new GitHubClient(token);

    const owner = 'your-username';
    const repo = 'your-repository';
    const branch = 'main';

    // Example 1: Create a new file
    console.log('Creating a new file...');
    const createResult = await github.files.create(owner, repo, 'example.txt', {
      message: 'Create example file',
      content: Buffer.from('Hello, GitHub!').toString('base64'),
      branch: branch
    });
    console.log('File created:', createResult.content.path);

    // Example 2: Get file content
    console.log('Getting file content...');
    const fileContent = await github.files.get(owner, repo, 'example.txt', branch);
    console.log('File content:', Buffer.from(fileContent.content, 'base64').toString());

    // Example 3: Update the file
    console.log('Updating file...');
    const updateResult = await github.files.update(owner, repo, 'example.txt', {
      message: 'Update example file',
      content: Buffer.from('Hello, GitHub! Updated content.').toString('base64'),
      sha: fileContent.sha, // Required for updates
      branch: branch
    });
    console.log('File updated:', updateResult.content.path);

    // Example 4: Batch operations
    console.log('Performing batch operations...');
    const batchResults = await github.files.batch(owner, repo, [
      {
        path: 'file1.txt',
        operation: 'create',
        content: Buffer.from('Content of file 1').toString('base64'),
        message: 'Create file 1'
      },
      {
        path: 'file2.txt',
        operation: 'create',
        content: Buffer.from('Content of file 2').toString('base64'),
        message: 'Create file 2'
      }
    ]);

    console.log('Batch operations completed:');
    batchResults.forEach(result => {
      console.log(`  ${result.path}: ${result.success ? 'Success' : 'Failed'}`);
      if (!result.success && result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });

    // Example 5: Delete a file
    console.log('Deleting file...');
    const deleteResult = await github.files.delete(owner, repo, 'example.txt', {
      message: 'Delete example file',
      sha: updateResult.content.sha, // Required for deletion
      branch: branch
    });
    console.log('File deleted successfully');

  } catch (error) {
    console.error('Error in file operations example:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  fileOperationsExample();
}

export { fileOperationsExample };