import { CloudEnvironmentAdapter } from '../../../src/config/adapters/CloudEnvironmentAdapter';
import { CICDEnvironmentAdapter } from '../../../src/config/adapters/CICDEnvironmentAdapter';
import { EnvironmentType } from '../../../src/config/EnvironmentAdapter';

describe('EnvironmentAdapters', () => {
  describe('CloudEnvironmentAdapter', () => {
    let adapter: CloudEnvironmentAdapter;

    beforeEach(() => {
      adapter = new CloudEnvironmentAdapter();
    });

    test('should return cloud environment type', () => {
      expect(adapter.getEnvironment()).toBe(EnvironmentType.PRODUCTION);
    });

    test('should provide configuration sources', () => {
      const sources = adapter.getConfigurationSources();
      expect(sources).toHaveLength(4);
      expect(sources[0].name).toBe('cloud-secure-storage');
      expect(sources[1].name).toBe('cloud-environment-variables');
    });

    test('should transform configuration for cloud environment', () => {
      const config = {};
      const transformed = adapter.transformConfiguration(config);

      expect(transformed.debug).toBe(false);
      expect(transformed.hotReload).toBe(false);
      expect(transformed.cloud).toBeDefined();
    });

    test('should validate cloud configuration', () => {
      const config = {
        api: { baseUrl: 'https://api.example.com' },
        security: { ssl: true },
        logging: { level: 'warn' },
        monitoring: { enabled: true },
        cloud: { provider: 'aws', autoScaling: true }
      };

      const result = adapter.validateConfiguration(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('CICDEnvironmentAdapter', () => {
    let adapter: CICDEnvironmentAdapter;

    beforeEach(() => {
      adapter = new CICDEnvironmentAdapter();
    });

    test('should return CI/CD environment type', () => {
      expect(adapter.getEnvironment()).toBe(EnvironmentType.TESTING);
    });

    test('should provide configuration sources', () => {
      const sources = adapter.getConfigurationSources();
      expect(sources).toHaveLength(3);
      expect(sources[0].name).toBe('cicd-environment-variables');
      expect(sources[1].name).toBe('cicd-config');
    });

    test('should transform configuration for CI/CD environment', () => {
      const config = {};
      const transformed = adapter.transformConfiguration(config);

      expect(transformed.debug).toBe(false);
      expect(transformed.hotReload).toBe(false);
      expect(transformed.cicdMode).toBe(true);
    });

    test('should validate CI/CD configuration', () => {
      const config = {
        cicdMode: true,
        database: { filename: ':memory:' },
        logging: { level: 'info' },
        cicd: { pipeline: 'github-actions', parallel: true },
        timeouts: { test: 300000, build: 1800000, deploy: 900000 }
      };

      const result = adapter.validateConfiguration(config);
      expect(result.valid).toBe(true);
    });
  });
});