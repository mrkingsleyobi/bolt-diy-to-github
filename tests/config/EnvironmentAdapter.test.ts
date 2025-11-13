// EnvironmentAdapter.test.ts - Tests for Environment Adapters
// Phase 4: Environment Configuration Management - Task 15: Write Environment Adapter Tests

import {
  DevelopmentEnvironmentAdapter,
  TestingEnvironmentAdapter,
  StagingEnvironmentAdapter,
  ProductionEnvironmentAdapter
} from '../../src/config';
import { EnvironmentType } from '../../src/config/EnvironmentAdapter';

describe('Environment Adapters', () => {
  describe('DevelopmentEnvironmentAdapter', () => {
    let adapter: DevelopmentEnvironmentAdapter;

    beforeEach(() => {
      adapter = new DevelopmentEnvironmentAdapter();
    });

    it('should return development environment', () => {
      expect(adapter.getEnvironment()).toBe(EnvironmentType.DEVELOPMENT);
    });

    it('should provide development configuration sources', () => {
      const sources = adapter.getConfigurationSources();
      expect(sources.length).toBeGreaterThan(0);
      expect(sources.some(s => s.name === 'local-config')).toBe(true);
      expect(sources.some(s => s.name === 'environment-variables')).toBe(true);
    });

    it('should transform configuration for development', () => {
      const config = adapter.transformConfiguration({});
      expect(config.debug).toBe(true);
      expect(config.hotReload).toBe(true);
    });

    it('should validate development configuration', () => {
      const result = adapter.validateConfiguration({});
      expect(result.valid).toBe(true);
    });
  });

  describe('TestingEnvironmentAdapter', () => {
    let adapter: TestingEnvironmentAdapter;

    beforeEach(() => {
      adapter = new TestingEnvironmentAdapter();
    });

    it('should return testing environment', () => {
      expect(adapter.getEnvironment()).toBe(EnvironmentType.TESTING);
    });

    it('should provide testing configuration sources', () => {
      const sources = adapter.getConfigurationSources();
      expect(sources.length).toBeGreaterThan(0);
      expect(sources.some(s => s.name === 'test-config')).toBe(true);
      expect(sources.some(s => s.name === 'test-environment-variables')).toBe(true);
    });

    it('should transform configuration for testing', () => {
      const config = adapter.transformConfiguration({});
      expect(config.debug).toBe(false);
      expect(config.testMode).toBe(true);
      expect(config.hotReload).toBe(false);
    });

    it('should validate testing configuration', () => {
      const config = { testMode: true, database: { filename: ':memory:' }, logging: { level: 'error' } };
      const result = adapter.validateConfiguration(config);
      expect(result.valid).toBe(true);
    });

    it('should detect errors in testing configuration', () => {
      const config = { testMode: false };
      const result = adapter.validateConfiguration(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Test mode must be enabled in testing environment');
    });
  });

  describe('StagingEnvironmentAdapter', () => {
    let adapter: StagingEnvironmentAdapter;

    beforeEach(() => {
      adapter = new StagingEnvironmentAdapter();
    });

    it('should return staging environment', () => {
      expect(adapter.getEnvironment()).toBe(EnvironmentType.STAGING);
    });

    it('should provide staging configuration sources', () => {
      const sources = adapter.getConfigurationSources();
      expect(sources.length).toBeGreaterThan(0);
      expect(sources.some(s => s.name === 'staging-config')).toBe(true);
      expect(sources.some(s => s.name === 'staging-environment-variables')).toBe(true);
    });

    it('should transform configuration for staging', () => {
      const config = adapter.transformConfiguration({});
      expect(config.debug).toBe(false);
      expect(config.hotReload).toBe(false);
    });

    it('should validate staging configuration', () => {
      const config = { api: { baseUrl: 'https://api-staging.example.com' }, logging: { level: 'info' } };
      const result = adapter.validateConfiguration(config);
      expect(result.valid).toBe(true);
    });

    it('should detect warnings in staging configuration', () => {
      const config = { api: { baseUrl: 'http://api-staging.example.com' }, logging: { level: 'info' } };
      const result = adapter.validateConfiguration(config);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('API base URL should use HTTPS in staging environment');
    });
  });

  describe('ProductionEnvironmentAdapter', () => {
    let adapter: ProductionEnvironmentAdapter;

    beforeEach(() => {
      adapter = new ProductionEnvironmentAdapter();
    });

    it('should return production environment', () => {
      expect(adapter.getEnvironment()).toBe(EnvironmentType.PRODUCTION);
    });

    it('should provide production configuration sources', () => {
      const sources = adapter.getConfigurationSources();
      expect(sources.length).toBeGreaterThan(0);
      expect(sources.some(s => s.name === 'secure-storage')).toBe(true);
      expect(sources.some(s => s.name === 'production-environment-variables')).toBe(true);
    });

    it('should transform configuration for production', () => {
      const config = adapter.transformConfiguration({});
      expect(config.debug).toBe(false);
      expect(config.hotReload).toBe(false);
    });

    it('should validate production configuration', () => {
      const config = {
        api: { baseUrl: 'https://api.example.com' },
        logging: { level: 'warn' },
        security: { ssl: true, cors: { enabled: true } },
        monitoring: { enabled: true }
      };
      const result = adapter.validateConfiguration(config);
      expect(result.valid).toBe(true);
    });

    it('should detect errors in production configuration', () => {
      const config = { api: { baseUrl: 'http://api.example.com' } };
      const result = adapter.validateConfiguration(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API base URL must use HTTPS in production environment');
      expect(result.errors).toContain('Security configuration is required for production');
      expect(result.errors).toContain('Logging configuration is required for production');
      expect(result.errors).toContain('Monitoring must be enabled in production environment');
    });
  });
});