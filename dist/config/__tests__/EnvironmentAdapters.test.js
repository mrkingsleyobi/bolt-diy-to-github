"use strict";
// EnvironmentAdapters.test.ts - Tests for environment adapters
Object.defineProperty(exports, "__esModule", { value: true });
const CloudEnvironmentAdapter_1 = require("../adapters/CloudEnvironmentAdapter");
const CICDEnvironmentAdapter_1 = require("../adapters/CICDEnvironmentAdapter");
const EnvironmentAdapter_1 = require("../EnvironmentAdapter");
describe('CloudEnvironmentAdapter', () => {
    let adapter;
    beforeEach(() => {
        adapter = new CloudEnvironmentAdapter_1.CloudEnvironmentAdapter();
    });
    test('should return correct environment type', () => {
        expect(adapter.getEnvironment()).toBe(EnvironmentAdapter_1.EnvironmentType.PRODUCTION);
    });
    test('should provide configuration sources', () => {
        const sources = adapter.getConfigurationSources();
        expect(sources).toHaveLength(4);
        expect(sources[0].name).toBe('cloud-secure-storage');
        expect(sources[1].name).toBe('cloud-environment-variables');
        expect(sources[2].name).toBe('remote-cloud-config');
        expect(sources[3].name).toBe('cloud-metadata-service');
    });
    test('should transform configuration correctly', () => {
        const inputConfig = {};
        const transformedConfig = adapter.transformConfiguration(inputConfig);
        expect(transformedConfig.debug).toBe(false);
        expect(transformedConfig.logging.level).toBe('warn');
        expect(transformedConfig.hotReload).toBe(false);
        expect(transformedConfig.monitoring.enabled).toBe(true);
        expect(transformedConfig.security.ssl).toBe(true);
    });
    test('should validate configuration correctly', () => {
        const validConfig = {
            api: {
                baseUrl: 'https://api.example.com'
            },
            security: {
                ssl: true,
                cors: {
                    enabled: true
                }
            },
            logging: {
                level: 'warn'
            },
            monitoring: {
                enabled: true
            },
            cloud: {
                provider: 'aws',
                autoScaling: true
            }
        };
        const result = adapter.validateConfiguration(validConfig);
        expect(result.valid).toBe(true);
    });
    test('should detect cloud provider correctly', () => {
        // This test would need to mock environment variables to test different providers
        const config = {};
        const transformed = adapter.transformConfiguration(config);
        expect(transformed.cloud).toBeDefined();
    });
});
describe('CICDEnvironmentAdapter', () => {
    let adapter;
    beforeEach(() => {
        adapter = new CICDEnvironmentAdapter_1.CICDEnvironmentAdapter();
    });
    test('should return correct environment type', () => {
        expect(adapter.getEnvironment()).toBe(EnvironmentAdapter_1.EnvironmentType.TESTING);
    });
    test('should provide configuration sources', () => {
        const sources = adapter.getConfigurationSources();
        expect(sources).toHaveLength(3);
        expect(sources[0].name).toBe('cicd-environment-variables');
        expect(sources[1].name).toBe('cicd-config');
        expect(sources[2].name).toBe('in-memory-cicd-config');
    });
    test('should transform configuration correctly', () => {
        const inputConfig = {};
        const transformedConfig = adapter.transformConfiguration(inputConfig);
        expect(transformedConfig.debug).toBe(false);
        expect(transformedConfig.logging.level).toBe('info');
        expect(transformedConfig.hotReload).toBe(false);
        expect(transformedConfig.cicdMode).toBe(true);
        expect(transformedConfig.database.filename).toBe(':memory:');
    });
    test('should validate configuration correctly', () => {
        const validConfig = {
            cicdMode: true,
            database: {
                filename: ':memory:'
            },
            logging: {
                level: 'info'
            },
            timeouts: {
                test: 300000,
                build: 1800000,
                deploy: 900000
            }
        };
        const result = adapter.validateConfiguration(validConfig);
        expect(result.valid).toBe(true);
    });
    test('should detect CI pipeline correctly', () => {
        // This test would need to mock environment variables to test different pipelines
        const config = {};
        const transformed = adapter.transformConfiguration(config);
        expect(transformed.cicd).toBeDefined();
    });
});
//# sourceMappingURL=EnvironmentAdapters.test.js.map