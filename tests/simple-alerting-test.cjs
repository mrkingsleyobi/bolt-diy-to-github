// Simple JavaScript test to verify ConfigurationAlertingService functionality
const { ConfigurationAlertingService } = require('../dist/monitoring/ConfigurationAlertingService');

// Create an instance of the service
const alertingService = new ConfigurationAlertingService();

// Create a test event
const testEvent = {
  timestamp: Date.now(),
  type: 'load',
  configKey: 'test-config',
  environment: 'testing',
  truthScore: 0.5, // Below threshold (0.8)
  success: true
};

console.log('Testing ConfigurationAlertingService...');
console.log('Processing monitoring event with low truth score...');

// Process the event
alertingService.processMonitoringEvent(testEvent);

// Check if alert was generated
const alerts = alertingService.getRecentAlerts();
console.log(`Number of alerts generated: ${alerts.length}`);

if (alerts.length > 0) {
  console.log('Alert details:');
  console.log(`- Type: ${alerts[0].type}`);
  console.log(`- Severity: ${alerts[0].severity}`);
  console.log(`- Message: ${alerts[0].message}`);
  console.log('Test PASSED: Alerting service is working correctly!');
} else {
  console.log('Test FAILED: No alert was generated');
}

// Test with high truth score (should not generate alert)
const highScoreEvent = {
  timestamp: Date.now(),
  type: 'save',
  configKey: 'test-config-2',
  environment: 'testing',
  truthScore: 0.9, // Above threshold (0.8)
  success: true
};

console.log('\nTesting with high truth score (should not generate alert)...');
alertingService.processMonitoringEvent(highScoreEvent);

const alertsAfterHighScore = alertingService.getRecentAlerts();
console.log(`Number of alerts after high score event: ${alertsAfterHighScore.length - alerts.length}`);

if (alertsAfterHighScore.length === alerts.length) {
  console.log('Test PASSED: No additional alert generated for high truth score');
} else {
  console.log('Test FAILED: Unexpected alert generated for high truth score');
}