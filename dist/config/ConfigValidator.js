"use strict";
// ConfigValidator.ts - Configuration validation with schema validation
// Phase 4: Environment Configuration Management - Task 11: Implement Environment Configuration Service (ConfigValidator component)
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigValidatorImpl = void 0;
/**
 * Configuration validator implementation
 */
class ConfigValidatorImpl {
    /**
     * Validate configuration against schema
     * @param config - Configuration to validate
     * @param schema - Configuration schema
     * @returns Validation result
     */
    validate(config, schema) {
        const errors = [];
        const warnings = [];
        // Validate required properties
        if (schema.required) {
            for (const requiredProp of schema.required) {
                if (!(requiredProp in config)) {
                    errors.push(`Required property '${requiredProp}' is missing`);
                }
            }
        }
        // Validate properties
        if (schema.properties) {
            for (const [propName, propDef] of Object.entries(schema.properties)) {
                const propValue = config[propName];
                const propErrors = this.validateProperty(propValue, propDef, propName);
                errors.push(...propErrors);
            }
        }
        // Validate custom rules
        if (schema.rules) {
            for (const rule of schema.rules) {
                try {
                    const result = rule.validate(config);
                    if (typeof result === 'string') {
                        errors.push(result);
                    }
                    else if (result === false) {
                        errors.push(`Validation rule '${rule.name}' failed`);
                    }
                }
                catch (error) {
                    errors.push(`Error in validation rule '${rule.name}': ${error.message}`);
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Validate configuration property
     * @param value - Property value
     * @param property - Property definition
     * @param path - Property path for error reporting
     * @returns Validation errors
     */
    validateProperty(value, property, path) {
        const errors = [];
        // Check if value is undefined
        if (value === undefined) {
            if (property.required) {
                errors.push(`Required property '${path}' is missing`);
            }
            return errors;
        }
        // Validate type
        if (!this.validateType(value, property.type, path, errors)) {
            return errors;
        }
        // Validate constraints
        if (property.constraints) {
            this.validateConstraints(value, property.constraints, path, errors);
        }
        return errors;
    }
    /**
     * Validate property type
     * @param value - Property value
     * @param expectedType - Expected type
     * @param path - Property path
     * @param errors - Error array to populate
     * @returns True if type is valid, false otherwise
     */
    validateType(value, expectedType, path, errors) {
        const actualType = this.getType(value);
        if (actualType !== expectedType) {
            errors.push(`Property '${path}' expected type '${expectedType}' but got '${actualType}'`);
            return false;
        }
        return true;
    }
    /**
     * Get actual type of value
     * @param value - Value to check
     * @returns Type as string
     */
    getType(value) {
        if (value === null)
            return 'null';
        if (Array.isArray(value))
            return 'array';
        return typeof value;
    }
    /**
     * Validate property constraints
     * @param value - Property value
     * @param constraints - Property constraints
     * @param path - Property path
     * @param errors - Error array to populate
     */
    validateConstraints(value, constraints, path, errors) {
        // Validate min constraint
        if (constraints.min !== undefined) {
            if (typeof value === 'number' && value < constraints.min) {
                errors.push(`Property '${path}' must be at least ${constraints.min}`);
            }
            else if ((typeof value === 'string' || Array.isArray(value)) && value.length < constraints.min) {
                errors.push(`Property '${path}' must have at least ${constraints.min} characters/items`);
            }
        }
        // Validate max constraint
        if (constraints.max !== undefined) {
            if (typeof value === 'number' && value > constraints.max) {
                errors.push(`Property '${path}' must be at most ${constraints.max}`);
            }
            else if ((typeof value === 'string' || Array.isArray(value)) && value.length > constraints.max) {
                errors.push(`Property '${path}' must have at most ${constraints.max} characters/items`);
            }
        }
        // Validate pattern constraint
        if (constraints.pattern && typeof value === 'string') {
            if (!constraints.pattern.test(value)) {
                errors.push(`Property '${path}' does not match pattern ${constraints.pattern}`);
            }
        }
        // Validate enum constraint
        if (constraints.enum && !constraints.enum.includes(value)) {
            errors.push(`Property '${path}' must be one of: ${constraints.enum.join(', ')}`);
        }
        // Validate nested properties for objects
        if (constraints.properties && typeof value === 'object' && value !== null && !Array.isArray(value)) {
            for (const [propName, propDef] of Object.entries(constraints.properties)) {
                const propValue = value[propName];
                const propErrors = this.validateProperty(propValue, propDef, `${path}.${propName}`);
                errors.push(...propErrors);
            }
        }
        // Validate array items
        if (constraints.items && Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                const itemErrors = this.validateProperty(value[i], constraints.items, `${path}[${i}]`);
                errors.push(...itemErrors);
            }
        }
    }
    /**
     * Create default configuration schema
     * @returns Configuration schema
     */
    createDefaultSchema() {
        return {
            properties: {
                github: {
                    type: 'object',
                    description: 'GitHub integration configuration',
                    constraints: {
                        properties: {
                            token: {
                                type: 'string',
                                description: 'GitHub personal access token',
                                required: true
                            },
                            repository: {
                                type: 'string',
                                description: 'Repository name',
                                required: true
                            },
                            owner: {
                                type: 'string',
                                description: 'Repository owner',
                                required: true
                            }
                        }
                    }
                },
                deployment: {
                    type: 'object',
                    description: 'Deployment configuration',
                    constraints: {
                        properties: {
                            target: {
                                type: 'string',
                                description: 'Deployment target platform',
                                constraints: {
                                    enum: ['vercel', 'netlify', 'github-pages', 'custom']
                                }
                            },
                            region: {
                                type: 'string',
                                description: 'Deployment region'
                            }
                        }
                    }
                },
                environment: {
                    type: 'string',
                    description: 'Environment type',
                    constraints: {
                        enum: ['development', 'testing', 'staging', 'production']
                    }
                },
                apiUrl: {
                    type: 'string',
                    description: 'API endpoint URL',
                    constraints: {
                        pattern: /^https?:\/\/.+$/
                    }
                },
                syncInterval: {
                    type: 'number',
                    description: 'Synchronization interval in milliseconds',
                    constraints: {
                        min: 1000,
                        max: 3600000
                    }
                },
                logLevel: {
                    type: 'string',
                    description: 'Logging level',
                    constraints: {
                        enum: ['debug', 'info', 'warn', 'error']
                    }
                },
                features: {
                    type: 'object',
                    description: 'Feature flags'
                },
                limits: {
                    type: 'object',
                    description: 'System limits',
                    constraints: {
                        properties: {
                            maxFileSize: {
                                type: 'number',
                                description: 'Maximum file size in bytes',
                                constraints: {
                                    min: 1024,
                                    max: 104857600
                                }
                            },
                            maxConnections: {
                                type: 'number',
                                description: 'Maximum concurrent connections',
                                constraints: {
                                    min: 1,
                                    max: 100
                                }
                            },
                            syncTimeout: {
                                type: 'number',
                                description: 'Synchronization timeout in milliseconds',
                                constraints: {
                                    min: 1000,
                                    max: 300000
                                }
                            }
                        }
                    }
                },
                security: {
                    type: 'object',
                    description: 'Security configuration',
                    constraints: {
                        properties: {
                            encryptionEnabled: {
                                type: 'boolean',
                                description: 'Whether encryption is enabled'
                            },
                            authTimeout: {
                                type: 'number',
                                description: 'Authentication timeout in milliseconds',
                                constraints: {
                                    min: 1000,
                                    max: 86400000
                                }
                            },
                            rateLimit: {
                                type: 'number',
                                description: 'Rate limit requests per minute',
                                constraints: {
                                    min: 1,
                                    max: 10000
                                }
                            }
                        }
                    }
                }
            },
            required: ['environment']
        };
    }
}
exports.ConfigValidatorImpl = ConfigValidatorImpl;
//# sourceMappingURL=ConfigValidator.js.map