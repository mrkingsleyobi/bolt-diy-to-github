// configuration-example.cjs - Example usage of the configuration management system
// CommonJS version for Node.js execution

const { BasicConfigurationManager } = require('../dist/config/BasicConfigurationManager');
const { PayloadEncryptionService } = require('../dist/security/PayloadEncryptionService');
const { MessageAuthenticationService } = require('../dist/security/MessageAuthenticationService');
const { ConfigValidatorImpl } = require('../dist/config/ConfigValidator');

/**
 * Example demonstrating configuration management system usage
 */
async function configurationExample() {
  console.log('=== Configuration Management System Example ===\n');

  // Initialize security services
  const encryptionService = new PayloadEncryptionService();
  const authenticationService = new MessageAuthenticationService();
  authenticationService.setSecretKey('example-secret-key-for-demo');

  // Create configuration manager
  const configManager = new BasicConfigurationManager(
    encryptionService,
    authenticationService
  );

  try {
    // Initialize configuration manager
    await configManager.initialize({
      environment: 'development',
      enableCache: true,
      cacheTTL: 30000, // 30 seconds
      enableHotReload: true,
      hotReloadInterval: 10000 // 10 seconds
    });

    console.log('Configuration manager initialized successfully');

    // Get initial configuration status
    const initialStatus = configManager.getStatus();
    console.log('Initial status:', initialStatus);

    // Set some configuration values
    configManager.set('app.name', 'Configuration Example App');
    configManager.set('app.version', '1.0.0');
    configManager.set('features.newUI', true);
    configManager.set('limits.maxConnections', 100);

    // Get configuration values
    const appName = configManager.get('app.name', 'Default App');
    const appVersion = configManager.get('app.version', '0.0.0');
    const newUI = configManager.get('features.newUI', false);
    const maxConnections = configManager.get('limits.maxConnections', 10);

    console.log('\nConfiguration Values:');
    console.log('- App Name:', appName);
    console.log('- App Version:', appVersion);
    console.log('- New UI Enabled:', newUI);
    console.log('- Max Connections:', maxConnections);

    // Demonstrate configuration validation
    const validator = new ConfigValidatorImpl();
    const schema = validator.createDefaultSchema();

    // Create a sample configuration to validate
    const sampleConfig = {
      environment: 'development',
      github: {
        token: 'ghp_example_token',
        repository: 'example-repo',
        owner: 'example-owner'
      },
      apiUrl: 'https://api.example.com',
      logLevel: 'info'
    };

    const validationResult = validator.validate(sampleConfig, schema);
    console.log('\nValidation Result:');
    console.log('- Valid:', validationResult.valid);
    if (validationResult.errors.length > 0) {
      console.log('- Errors:', validationResult.errors);
    }
    if (validationResult.warnings.length > 0) {
      console.log('- Warnings:', validationResult.warnings);
    }

    // Listen for configuration changes
    configManager.onChange((change) => {
      console.log('\nConfiguration Change Detected:');
      console.log('- Keys changed:', change.keys);
      console.log('- Change source:', change.source);
      console.log('- Timestamp:', new Date(change.timestamp).toISOString());
    });

    // Update a configuration value to trigger the change listener
    configManager.set('app.lastUpdated', new Date().toISOString());

    // Get final status
    const finalStatus = configManager.getStatus();
    console.log('\nFinal Status:');
    console.log('- Loaded:', finalStatus.loaded);
    console.log('- Last Load:', new Date(finalStatus.lastLoad).toISOString());
    console.log('- Sources:', finalStatus.sources);
    console.log('- Cache Size:', finalStatus.cache.size);
    console.log('- Cache Hits:', finalStatus.cache.hits);
    console.log('- Cache Misses:', finalStatus.cache.misses);
    console.log('- Error Count:', finalStatus.errorCount);

    console.log('\n=== Example Completed Successfully ===');

  } catch (error) {
    console.error('Error in configuration example:', error.message);
  }
}

// Run the example
configurationExample().catch(console.error);

module.exports = { configurationExample };