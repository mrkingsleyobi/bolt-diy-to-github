"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EnvironmentConfigurationProvider_1 = require("../providers/EnvironmentConfigurationProvider");
describe('EnvironmentConfigurationProvider - Comprehensive Tests', () => {
    let provider;
    const originalEnv = process.env;
    beforeEach(() => {
        // Reset environment variables
        process.env = { ...originalEnv };
        provider = new EnvironmentConfigurationProvider_1.EnvironmentConfigurationProvider('test-env-provider', 'TEST_');
    });
    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;
    });
    // Test constructor and basic functionality
    describe('Constructor and Basic Functionality', () => {
        it('should create instance with name and prefix', () => {
            const providerWithPrefix = new EnvironmentConfigurationProvider_1.EnvironmentConfigurationProvider('test-provider', 'TEST_');
            expect(providerWithPrefix.getName()).toBe('test-provider');
            const providerWithoutPrefix = new EnvironmentConfigurationProvider_1.EnvironmentConfigurationProvider('test-provider');
            expect(providerWithoutPrefix.getName()).toBe('test-provider');
        });
        it('should return correct provider name', () => {
            expect(provider.getName()).toBe('test-env-provider');
        });
    });
    // Test load method with various scenarios
    describe('load', () => {
        it('should load configuration from environment variables with prefix', async () => {
            // Set up test environment variables
            process.env.TEST_DATABASE_HOST = 'localhost';
            process.env.TEST_DATABASE_PORT = '5432';
            process.env.TEST_API_BASE_URL = 'https://api.example.com';
            process.env.TEST_FEATURES_AUTH = 'true';
            process.env.TEST_FEATURES_CACHE = 'false';
            process.env.TEST_LIMITS_MAX_CONNECTIONS = '100';
            const config = await provider.load();
            expect(config).toEqual({
                database: {
                    host: 'localhost',
                    port: 5432
                },
                api: {
                    base: {
                        url: 'https://api.example.com'
                    }
                },
                features: {
                    auth: true,
                    cache: false
                },
                limits: {
                    max: {
                        connections: 100
                    }
                }
            });
        });
        it('should handle environment variables without prefix when no prefix specified', async () => {
            const providerWithoutPrefix = new EnvironmentConfigurationProvider_1.EnvironmentConfigurationProvider('test-provider');
            // Set up test environment variables without prefix
            process.env.DATABASE_HOST = 'localhost';
            process.env.DATABASE_PORT = '5432';
            process.env.API_BASE_URL = 'https://api.example.com';
            const config = await providerWithoutPrefix.load();
            expect(config).toEqual({
                database: {
                    host: 'localhost',
                    port: 5432
                },
                api: {
                    base: {
                        url: 'https://api.example.com'
                    }
                }
            });
        });
        it('should convert environment variable types correctly', async () => {
            process.env.TEST_STRING_VALUE = 'test-string';
            process.env.TEST_NUMBER_VALUE = '42';
            process.env.TEST_FLOAT_VALUE = '3.14';
            process.env.TEST_BOOLEAN_TRUE = 'true';
            process.env.TEST_BOOLEAN_FALSE = 'false';
            process.env.TEST_BOOLEAN_UPPERCASE = 'TRUE';
            process.env.TEST_BOOLEAN_ONE = '1';
            process.env.TEST_BOOLEAN_ZERO = '0';
            process.env.TEST_JSON_OBJECT = '{"key": "value", "number": 123}';
            process.env.TEST_JSON_ARRAY = '[1, 2, 3, "test"]';
            process.env.TEST_EMPTY_VALUE = '';
            const config = await provider.load();
            expect(config).toEqual({
                string: {
                    value: 'test-string'
                },
                number: {
                    value: 42
                },
                float: {
                    value: 3.14
                },
                boolean: {
                    true: true,
                    false: false,
                    uppercase: true,
                    one: 1, // Not converted to boolean since it's not "true" or "false"
                    zero: 0 // Not converted to boolean since it's not "true" or "false"
                },
                json: {
                    object: { key: 'value', number: 123 },
                    array: [1, 2, 3, 'test']
                },
                empty: {
                    value: ''
                }
            });
        });
        it('should handle special characters in environment variable names', async () => {
            // Environment variables with special characters in names get converted
            process.env.TEST_KEY_WITH_DASHES = 'dash-value';
            process.env.TEST_KEY_WITH_MIXED_CASE = 'mixed-case-value';
            process.env.TEST_KEY123 = 'numeric-value';
            const config = await provider.load();
            expect(config).toEqual({
                key: {
                    with: {
                        dashes: 'dash-value'
                    },
                    with: {
                        mixed: {
                            case: 'mixed-case-value'
                        }
                    }
                },
                key123: 'numeric-value'
            });
        });
        it('should handle nested environment variables correctly', async () => {
            process.env.TEST_NESTED_DEEP_VALUE = 'deep-value';
            process.env.TEST_NESTED_DEEP_OBJECT_KEY = 'object-value';
            process.env.TEST_NESTED_ARRAY_0 = 'first';
            process.env.TEST_NESTED_ARRAY_1 = 'second';
            process.env.TEST_NESTED_ARRAY_2 = 'third';
            const config = await provider.load();
            expect(config).toEqual({
                nested: {
                    deep: {
                        value: 'deep-value',
                        object: {
                            key: 'object-value'
                        }
                    },
                    array: {
                        0: 'first',
                        1: 'second',
                        2: 'third'
                    }
                }
            });
        });
        it('should handle empty environment gracefully', async () => {
            // Clear all TEST_ prefixed environment variables
            Object.keys(process.env)
                .filter(key => key.startsWith('TEST_'))
                .forEach(key => delete process.env[key]);
            const config = await provider.load();
            expect(config).toEqual({});
        });
        it('should handle environment with only non-prefixed variables', async () => {
            // Set environment variables without the TEST_ prefix
            process.env.DATABASE_HOST = 'localhost';
            process.env.API_KEY = 'secret-key';
            // Should not load these since we're using TEST_ prefix
            const config = await provider.load();
            expect(config).toEqual({});
        });
        it('should handle complex JSON values correctly', async () => {
            process.env.TEST_COMPLEX_OBJECT = JSON.stringify({
                nested: {
                    array: [1, 2, { deep: 'value' }],
                    boolean: true,
                    nullValue: null
                }
            });
            process.env.TEST_COMPLEX_ARRAY = JSON.stringify([
                'string',
                42,
                true,
                { key: 'value' },
                [1, 2, 3]
            ]);
            const config = await provider.load();
            expect(config).toEqual({
                complex: {
                    object: {
                        nested: {
                            array: [1, 2, { deep: 'value' }],
                            boolean: true,
                            nullValue: null
                        }
                    },
                    array: [
                        'string',
                        42,
                        true,
                        { key: 'value' },
                        [1, 2, 3]
                    ]
                }
            });
        });
    });
    // Test save method
    describe('save', () => {
        it('should throw error when trying to save to environment variables', async () => {
            const config = { test: 'value' };
            await expect(provider.save(config))
                .rejects.toThrow('Saving to environment variables is not supported');
        });
    });
    // Test isAvailable method
    describe('isAvailable', () => {
        it('should always return true for environment variables', async () => {
            const available = await provider.isAvailable();
            expect(available).toBe(true);
        });
        it('should return true even with empty environment', async () => {
            // Clear environment
            process.env = {};
            const available = await provider.isAvailable();
            expect(available).toBe(true);
        });
    });
    // Test edge cases and error conditions
    describe('Edge Cases and Error Conditions', () => {
        it('should handle environment variable names that create circular references', async () => {
            // This test ensures that the provider handles edge cases in key parsing
            process.env.TEST_A_B_C = 'value1';
            process.env.TEST_A_B = 'value2';
            const config = await provider.load();
            expect(config).toEqual({
                a: {
                    b: {
                        c: 'value1'
                    }
                }
            });
            // Note: TEST_A_B might be overridden by the nested structure from TEST_A_B_C
            // The exact behavior depends on the implementation order
        });
        it('should handle very long environment variable names', async () => {
            const longKey = 'TEST_' + 'A'.repeat(1000) + '_VALUE';
            process.env[longKey] = 'long-key-value';
            const config = await provider.load();
            // Should handle long keys without crashing
            expect(config).toBeDefined();
        });
        it('should handle environment variables with unicode characters', async () => {
            process.env.TEST_UNICODE_VALUE = 'Hello 世界 🌍';
            process.env.TEST_UNICODE_KEY = '🔑 value';
            const config = await provider.load();
            expect(config).toEqual({
                unicode: {
                    value: 'Hello 世界 🌍',
                    key: '🔑 value'
                }
            });
        });
        it('should handle environment variables with special values', async () => {
            process.env.TEST_NULL_STRING = 'null';
            process.env.TEST_UNDEFINED_STRING = 'undefined';
            process.env.TEST_EMPTY_STRING = '';
            process.env.TEST_WHITESPACE_STRING = '   ';
            process.env.TEST_NEWLINE_STRING = 'line1\nline2';
            const config = await provider.load();
            expect(config).toEqual({
                null: {
                    string: 'null' // Treated as string, not null value
                },
                undefined: {
                    string: 'undefined' // Treated as string, not undefined value
                },
                empty: {
                    string: ''
                },
                whitespace: {
                    string: '   '
                },
                newline: {
                    string: 'line1\nline2'
                }
            });
        });
        it('should handle invalid JSON in environment variables gracefully', async () => {
            process.env.TEST_INVALID_JSON = '{"invalid": json}'; // Missing quotes
            process.env.TEST_PARTIAL_JSON = '{"partial": true'; // Incomplete JSON
            const config = await provider.load();
            // Should treat invalid JSON as strings
            expect(config).toEqual({
                invalid: {
                    json: '{"invalid": json}' // Kept as string
                },
                partial: {
                    json: '{"partial": true' // Kept as string
                }
            });
        });
        it('should handle mixed case environment variable names', async () => {
            process.env.TEST_Mixed_Case_Key = 'mixed-case-value';
            process.env.test_lowercase = 'lowercase-value';
            process.env.TEST_UPPERCASE = 'uppercase-value';
            const config = await provider.load();
            expect(config).toEqual({
                mixed: {
                    case: {
                        key: 'mixed-case-value'
                    }
                },
                lowercase: 'lowercase-value',
                uppercase: 'uppercase-value'
            });
        });
    });
    // Test performance with large environment
    describe('Performance with Large Environment', () => {
        it('should handle large number of environment variables efficiently', async () => {
            // Create 1000 environment variables
            for (let i = 0; i < 1000; i++) {
                process.env[`TEST_KEY_${i}`] = `value-${i}`;
            }
            const startTime = performance.now();
            const config = await provider.load();
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Should complete in reasonable time (less than 100ms for 1000 variables)
            expect(duration).toBeLessThan(100);
            // Should have loaded all variables
            expect(Object.keys(config)).toHaveLength(1000);
            expect(config.key_0).toBe('value-0');
            expect(config.key_999).toBe('value-999');
        });
        it('should handle deeply nested environment variables efficiently', async () => {
            // Create deeply nested environment variables
            process.env.TEST_LEVEL1_LEVEL2_LEVEL3_LEVEL4_LEVEL5_VALUE = 'deep-value';
            // Create many siblings at each level
            for (let i = 0; i < 100; i++) {
                process.env[`TEST_LEVEL1_ITEM_${i}`] = `item-${i}`;
            }
            const startTime = performance.now();
            const config = await provider.load();
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Should complete quickly
            expect(duration).toBeLessThan(50);
            // Should have correct structure
            expect(config.level1.level2.level3.level4.level5.value).toBe('deep-value');
            expect(config.level1.item_0).toBe('item-0');
            expect(config.level1.item_99).toBe('item-99');
        });
    });
    // Test security aspects
    describe('Security Aspects', () => {
        it('should not expose non-prefixed environment variables', async () => {
            // Set both prefixed and non-prefixed variables
            process.env.TEST_PUBLIC_CONFIG = 'public-value';
            process.env.SECRET_PRIVATE_CONFIG = 'private-value';
            process.env.DATABASE_PASSWORD = 'super-secret-password';
            const config = await provider.load();
            // Should only load prefixed variables
            expect(config).toEqual({
                public: {
                    config: 'public-value'
                }
            });
            // Should not contain non-prefixed variables
            expect(JSON.stringify(config)).not.toContain('SECRET_PRIVATE_CONFIG');
            expect(JSON.stringify(config)).not.toContain('DATABASE_PASSWORD');
            expect(JSON.stringify(config)).not.toContain('private-value');
            expect(JSON.stringify(config)).not.toContain('super-secret-password');
        });
        it('should handle potentially malicious environment variable names', async () => {
            // Test various potentially problematic names
            process.env['TEST_CONSTRUCTOR'] = 'constructor-value';
            process.env['TEST___PROTO__'] = 'proto-value';
            process.env['TEST_TO_STRING'] = 'tostring-value';
            process.env['TEST_VALUE_OF'] = 'valueof-value';
            const config = await provider.load();
            // Should handle them safely without prototype pollution
            expect(config.constructor).toBe('constructor-value');
            expect(config.__proto__).toBe('proto-value');
            expect(config.to).toEqual({ string: 'tostring-value' });
            expect(config.value).toEqual({ of: 'valueof-value' });
            // Should not affect object prototype
            expect({}.constructor).toBeDefined();
            expect({}.__proto__).toBeDefined();
        });
        it('should not execute code in environment variable values', async () => {
            // Set environment variables that look like code
            process.env.TEST_FUNCTION_STRING = 'function() { return "malicious"; }';
            process.env.TEST_JAVASCRIPT_STRING = 'alert("xss")';
            process.env.TEST_HTML_STRING = '<script>alert("xss")</script>';
            const config = await provider.load();
            // Should treat them as plain strings
            expect(config).toEqual({
                function: {
                    string: 'function() { return "malicious"; }'
                },
                javascript: {
                    string: 'alert("xss")'
                },
                html: {
                    string: '<script>alert("xss")</script>'
                }
            });
            // Should not execute any code
            expect(typeof config.function.string).toBe('string');
            expect(config.function.string).not.toContain('malicious');
        });
    });
    // Test integration scenarios
    describe('Integration Scenarios', () => {
        it('should work with realistic configuration scenarios', async () => {
            // Simulate a realistic environment configuration for a web application
            process.env.TEST_APP_NAME = 'MyWebApp';
            process.env.TEST_APP_VERSION = '1.2.3';
            process.env.TEST_APP_ENVIRONMENT = 'production';
            process.env.TEST_SERVER_HOST = '0.0.0.0';
            process.env.TEST_SERVER_PORT = '8080';
            process.env.TEST_SERVER_SSL_ENABLED = 'true';
            process.env.TEST_DATABASE_HOST = 'db.example.com';
            process.env.TEST_DATABASE_PORT = '5432';
            process.env.TEST_DATABASE_NAME = 'myapp_production';
            process.env.TEST_DATABASE_SSL = 'true';
            process.env.TEST_DATABASE_POOL_MIN = '5';
            process.env.TEST_DATABASE_POOL_MAX = '20';
            process.env.TEST_REDIS_HOST = 'redis.example.com';
            process.env.TEST_REDIS_PORT = '6379';
            process.env.TEST_REDIS_PASSWORD = 'redis-secret-password';
            process.env.TEST_API_GITHUB_TOKEN = 'ghp_api-token-1234567890123456789012';
            process.env.TEST_API_STRIPE_SECRET_KEY = 'sk_live_secret-key-for-stripe';
            process.env.TEST_FEATURES_AUTHENTICATION = 'true';
            process.env.TEST_FEATURES_PAYMENTS = 'true';
            process.env.TEST_FEATURES_EMAILS = 'true';
            process.env.TEST_FEATURES_ANALYTICS = 'false';
            process.env.TEST_LOGGING_LEVEL = 'warn';
            process.env.TEST_LOGGING_FORMAT = 'json';
            process.env.TEST_CACHE_TTL = '3600';
            process.env.TEST_CACHE_ENABLED = 'true';
            process.env.TEST_RATE_LIMIT_WINDOW_MS = '900000';
            process.env.TEST_RATE_LIMIT_MAX_REQUESTS = '100';
            const config = await provider.load();
            expect(config).toEqual({
                app: {
                    name: 'MyWebApp',
                    version: '1.2.3',
                    environment: 'production'
                },
                server: {
                    host: '0.0.0.0',
                    port: 8080,
                    ssl: {
                        enabled: true
                    }
                },
                database: {
                    host: 'db.example.com',
                    port: 5432,
                    name: 'myapp_production',
                    ssl: true,
                    pool: {
                        min: 5,
                        max: 20
                    }
                },
                redis: {
                    host: 'redis.example.com',
                    port: 6379,
                    password: 'redis-secret-password'
                },
                api: {
                    github: {
                        token: 'ghp_api-token-1234567890123456789012'
                    },
                    stripe: {
                        secret: {
                            key: 'sk_live_secret-key-for-stripe'
                        }
                    }
                },
                features: {
                    authentication: true,
                    payments: true,
                    emails: true,
                    analytics: false
                },
                logging: {
                    level: 'warn',
                    format: 'json'
                },
                cache: {
                    ttl: 3600,
                    enabled: true
                },
                rate: {
                    limit: {
                        window: {
                            ms: 900000
                        },
                        max: {
                            requests: 100
                        }
                    }
                }
            });
        });
        it('should handle environment variables for different deployment targets', async () => {
            // Test configuration for different environments
            const testEnvironments = [
                {
                    name: 'development',
                    vars: {
                        'TEST_ENV': 'development',
                        'TEST_DEBUG': 'true',
                        'TEST_DATABASE_HOST': 'localhost',
                        'TEST_DATABASE_PORT': '5432',
                        'TEST_LOGGING_LEVEL': 'debug'
                    }
                },
                {
                    name: 'staging',
                    vars: {
                        'TEST_ENV': 'staging',
                        'TEST_DEBUG': 'false',
                        'TEST_DATABASE_HOST': 'staging-db.example.com',
                        'TEST_DATABASE_PORT': '5432',
                        'TEST_LOGGING_LEVEL': 'info'
                    }
                },
                {
                    name: 'production',
                    vars: {
                        'TEST_ENV': 'production',
                        'TEST_DEBUG': 'false',
                        'TEST_DATABASE_HOST': 'prod-db.example.com',
                        'TEST_DATABASE_PORT': '5432',
                        'TEST_LOGGING_LEVEL': 'warn'
                    }
                }
            ];
            for (const env of testEnvironments) {
                // Set environment variables for this environment
                Object.entries(env.vars).forEach(([key, value]) => {
                    process.env[key] = value;
                });
                const config = await provider.load();
                expect(config.env).toBe(env.name);
                expect(typeof config.debug).toBe('boolean');
                expect(config.database.host).toContain(env.name === 'development' ? 'localhost' : 'example.com');
                expect(typeof config.logging.level).toBe('string');
                // Clean up for next iteration
                Object.keys(env.vars).forEach(key => delete process.env[key]);
            }
        });
    });
});
//# sourceMappingURL=EnvironmentConfigurationProvider.comprehensive.test.js.map