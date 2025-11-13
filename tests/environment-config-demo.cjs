// environment-config-demo.cjs - Demonstration of complete environment configuration management workflow

const {
  EnvironmentConfigurationService,
  ConfigurationWorkflowService,
  PayloadEncryptionService,
  MessageAuthenticationService,
  TokenEncryptionService
} = require('../dist/config');

// Mock GitHub auth services for demo purposes
class MockGitHubPATAuthService {
  async validateToken(token) {
    // In a real implementation, this would call the GitHub API
    return {
      valid: true,
      scopes: ['repo', 'user'],
      expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
    };
  }

  async refreshToken(refreshToken) {
    // In a real implementation, this would refresh the token with GitHub
    return {
      success: true,
      newToken: 'refreshed-github-token',
      expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
    };
  }
}

console.log('=== Environment Configuration Management Demo ===\n');

// Initialize security services
console.log('1. Initializing security services...');
const payloadEncryptionService = new PayloadEncryptionService();
const messageAuthenticationService = new MessageAuthenticationService();
const tokenEncryptionService = new TokenEncryptionService();
const githubPatAuthService = new MockGitHubPATAuthService();

console.log('   ✅ Security services initialized\n');

// Initialize configuration services
console.log('2. Initializing configuration services...');
const environmentConfigService = new EnvironmentConfigurationService(
  payloadEncryptionService,
  messageAuthenticationService,
  tokenEncryptionService,
  'demo-encryption-password-12345',
  githubPatAuthService
);

const workflowService = new ConfigurationWorkflowService(
  {
    storagePath: '/tmp/demo-configs',
    encryptionPassword: 'demo-encryption-password-12345'
  },
  payloadEncryptionService,
  messageAuthenticationService,
  tokenEncryptionService,
  githubPatAuthService
);

console.log('   ✅ Configuration services initialized\n');

// Create a sample configuration
console.log('3. Creating sample configuration...');
const sampleConfig = {
  database: {
    host: 'db.example.com',
    port: 5432,
    name: 'production-db',
    username: 'app-user',
    // Note: In a real scenario, passwords would be encrypted tokens
    password: 'encrypted-db-password-token'
  },
  api: {
    baseUrl: 'https://api.example.com',
    timeout: 5000,
    githubToken: 'encrypted-github-token' // This would be encrypted in practice
  },
  features: {
    enableNewUI: true,
    maxUploadSize: 10485760, // 10MB
    maintenanceMode: false
  },
  environment: 'production',
  version: '1.0.0'
};

console.log('   Sample configuration created:\n', JSON.stringify(sampleConfig, null, 2), '\n');

// Save configuration using workflow service
console.log('4. Saving configuration using workflow service...');
workflowService.saveConfiguration('production', 'app-config', sampleConfig)
  .then((saveResult) => {
    console.log('   ✅ Configuration saved successfully');
    console.log('   Truth score:', saveResult.truthScore?.toFixed(3));
    console.log('   Validation passed:', saveResult.validation?.valid);

    if (saveResult.validation?.errors?.length > 0) {
      console.log('   Validation errors:', saveResult.validation.errors);
    }

    if (saveResult.validation?.warnings?.length > 0) {
      console.log('   Validation warnings:', saveResult.validation.warnings);
    }

    // Load configuration using workflow service
    console.log('\n5. Loading configuration using workflow service...');
    return workflowService.loadConfiguration('production', 'app-config');
  })
  .then((loadResult) => {
    console.log('   ✅ Configuration loaded successfully');
    console.log('   Truth score:', loadResult.truthScore?.toFixed(3));
    console.log('   Configuration loaded:');

    // Show a subset of the loaded configuration for brevity
    const { database, api, features } = loadResult.config;
    console.log('   Database:', { host: database.host, port: database.port, name: database.name });
    console.log('   API:', { baseUrl: api.baseUrl, timeout: api.timeout });
    console.log('   Features:', features);

    // Demonstrate token validation
    console.log('\n6. Validating tokens...');
    const tokensToValidate = {
      github: {
        token: loadResult.config.api.githubToken,
        type: 'github-pat'
      }
    };

    return environmentConfigService.validateTokens(tokensToValidate);
  })
  .then((validationResults) => {
    console.log('   ✅ Token validation completed');
    Object.keys(validationResults).forEach(key => {
      const result = validationResults[key];
      console.log(`   ${key} token valid: ${result.valid}`);
      if (result.scopes) {
        console.log(`   ${key} token scopes:`, result.scopes.join(', '));
      }
    });

    // Demonstrate getting environment configuration directly
    console.log('\n7. Getting environment configuration directly...');
    return environmentConfigService.getEnvironmentConfig('production', 'app-config');
  })
  .then((config) => {
    console.log('   ✅ Direct configuration retrieval successful');
    console.log('   Database host:', config.database.host);
    console.log('   API base URL:', config.api.baseUrl);
    console.log('   New UI enabled:', config.features.enableNewUI);

    console.log('\n=== Demo Completed Successfully ===');
    console.log('The Environment Configuration Management system is working correctly!');
    console.log('All components are properly integrated and functioning.');
  })
  .catch((error) => {
    console.error('❌ Demo failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  });