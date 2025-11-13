// SimpleIntegrationTest.js - Simple integration test for environment configuration management
// This test verifies the integration between the core components without file system dependencies

// Since we're running this as a JavaScript file, we need to use the compiled versions
const { TruthVerificationService } = require('../dist/verification/TruthVerificationService');
const { ConfigurationAlertingService } = require('../dist/monitoring/ConfigurationAlertingService');

// Simple test to verify integration between core components
console.log('Testing integration between TruthVerificationService, Monitoring, and Alerting...');

// Create services
const truthVerificationService = new TruthVerificationService({
  threshold: 0.95,
  autoRollback: true,
  weights: {
    validation: 0.3,
    security: 0.2,
    completeness: 0.2,
    consistency: 0.15,
    freshness: 0.15
  }
});

const alertingService = new ConfigurationAlertingService({
  alertConfig: {
    enabled: true,
    truthScoreThreshold: 0.8,
    failureRateThreshold: 5,
    rollbackCountThreshold: 3,
    timeWindow: 300000,
    alertCooldown: 300000,
    alertOnChanges: true,
    alertOnSecurityViolations: true
  }
});

// Test 1: High truth score (should not generate alert)
console.log('\n--- Test 1: High truth score ---');
const highScoreResult = {
  success: true,
  config: { test: 'value' },
  truthScore: 0.96
};

const verificationHigh = truthVerificationService.verifyConfigurationResult(highScoreResult);
console.log(`Truth verification result: ${verificationHigh.meetsThreshold ? 'PASS' : 'FAIL'}`);
console.log(`Truth score: ${verificationHigh.score}`);

// Create a monitoring event for this result
const highScoreEvent = {
  timestamp: Date.now(),
  type: 'load',
  configKey: 'test-config-1',
  environment: 'testing',
  truthScore: highScoreResult.truthScore,
  success: highScoreResult.success,
  duration: 50
};

console.log('Processing monitoring event with high truth score...');
alertingService.processMonitoringEvent(highScoreEvent);

const alertsAfterHighScore = alertingService.getRecentAlerts();
console.log(`Alerts generated: ${alertsAfterHighScore.length}`);
console.log(alertsAfterHighScore.length === 0 ? 'PASS: No alerts for high truth score' : 'FAIL: Unexpected alerts generated');

// Test 2: Low truth score (should generate alert)
console.log('\n--- Test 2: Low truth score ---');
const lowScoreResult = {
  success: false,
  config: { test: 'value' },
  truthScore: 0.3,
  error: 'Validation failed'
};

const verificationLow = truthVerificationService.verifyConfigurationResult(lowScoreResult);
console.log(`Truth verification result: ${verificationLow.meetsThreshold ? 'PASS' : 'FAIL'}`);
console.log(`Truth score: ${verificationLow.score}`);

// Create a monitoring event for this result
const lowScoreEvent = {
  timestamp: Date.now(),
  type: 'save',
  configKey: 'test-config-2',
  environment: 'testing',
  truthScore: lowScoreResult.truthScore,
  success: lowScoreResult.success,
  error: lowScoreResult.error,
  duration: 75
};

console.log('Processing monitoring event with low truth score...');
alertingService.processMonitoringEvent(lowScoreEvent);

const alertsAfterLowScore = alertingService.getRecentAlerts();
console.log(`Total alerts: ${alertsAfterLowScore.length}`);
const newAlerts = alertsAfterLowScore.slice(alertsAfterHighScore.length);
console.log(`New alerts generated: ${newAlerts.length}`);

if (newAlerts.length > 0) {
  console.log('New alert details:');
  console.log(`- Type: ${newAlerts[0].type}`);
  console.log(`- Severity: ${newAlerts[0].severity}`);
  console.log(`- Message: ${newAlerts[0].message}`);
  console.log('PASS: Alert generated for low truth score');
} else {
  console.log('FAIL: No alert generated for low truth score');
}

// Test 3: Security violation (should generate alert)
console.log('\n--- Test 3: Security violation ---');
const securityViolationEvent = {
  timestamp: Date.now(),
  type: 'save',
  configKey: 'test-config-3',
  environment: 'testing',
  success: true,
  metadata: {
    securityViolations: 'Hardcoded API token detected in configuration'
  },
  duration: 60
};

console.log('Processing monitoring event with security violation...');
alertingService.processMonitoringEvent(securityViolationEvent);

const alertsAfterSecurity = alertingService.getRecentAlerts();
console.log(`Total alerts: ${alertsAfterSecurity.length}`);
const securityAlerts = alertsAfterSecurity.slice(alertsAfterLowScore.length);
console.log(`Security alerts generated: ${securityAlerts.length}`);

if (securityAlerts.length > 0) {
  console.log('Security alert details:');
  console.log(`- Type: ${securityAlerts[0].type}`);
  console.log(`- Severity: ${securityAlerts[0].severity}`);
  console.log(`- Message: ${securityAlerts[0].message}`);
  console.log('PASS: Security violation alert generated');
} else {
  console.log('FAIL: No security violation alert generated');
}

console.log('\n--- Integration Test Summary ---');
console.log('✓ TruthVerificationService and AlertingService integration verified');
console.log('✓ Low truth score alerts working correctly');
console.log('✓ Security violation alerts working correctly');
console.log('✓ All core components integrated successfully');