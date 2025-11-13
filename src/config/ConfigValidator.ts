// ConfigValidator.ts - Configuration validation with schema validation
// Phase 4: Environment Configuration Management - Task 11: Implement Environment Configuration Service (ConfigValidator component)

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /**
   * Whether validation passed
   */
  valid: boolean;

  /**
   * Validation errors
   */
  errors: string[];

  /**
   * Validation warnings
   */
  warnings: string[];
}

/**
 * Configuration schema definition
 */
export interface ConfigSchema {
  /**
   * Schema properties
   */
  properties: Record<string, ConfigProperty>;

  /**
   * Required properties
   */
  required?: string[];

  /**
   * Additional validation rules
   */
  rules?: ConfigValidationRule[];
}

/**
 * Configuration property definition
 */
export interface ConfigProperty {
  /**
   * Property type
   */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';

  /**
   * Property description
   */
  description?: string;

  /**
   * Default value
   */
  default?: any;

  /**
   * Whether property is required
   */
  required?: boolean;

  /**
   * Validation constraints
   */
  constraints?: PropertyConstraints;
}

/**
 * Property constraints
 */
export interface PropertyConstraints {
  /**
   * Minimum value (for numbers) or length (for strings/arrays)
   */
  min?: number;

  /**
   * Maximum value (for numbers) or length (for strings/arrays)
   */
  max?: number;

  /**
   * Regular expression pattern (for strings)
   */
  pattern?: RegExp;

  /**
   * Enum values (for strings/numbers)
   */
  enum?: any[];

  /**
   * Nested properties (for objects)
   */
  properties?: Record<string, ConfigProperty>;

  /**
   * Array item type (for arrays)
   */
  items?: ConfigProperty;
}

/**
 * Configuration validation rule
 */
export interface ConfigValidationRule {
  /**
   * Rule name
   */
  name: string;

  /**
   * Rule description
   */
  description: string;

  /**
   * Validation function
   */
  validate: (config: any) => boolean | string;
}

/**
 * Configuration validator interface
 */
export interface ConfigValidator {
  /**
   * Validate configuration against schema
   * @param config - Configuration to validate
   * @param schema - Configuration schema
   * @returns Validation result
   */
  validate(config: any, schema: ConfigSchema): ConfigValidationResult;

  /**
   * Validate configuration property
   * @param value - Property value
   * @param property - Property definition
   * @param path - Property path for error reporting
   * @returns Validation result
   */
  validateProperty(value: any, property: ConfigProperty, path: string): string[];
}

/**
 * Configuration validator implementation
 */
export class ConfigValidatorImpl implements ConfigValidator {
  /**
   * Validate configuration against schema
   * @param config - Configuration to validate
   * @param schema - Configuration schema
   * @returns Validation result
   */
  validate(config: any, schema: ConfigSchema): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

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
          } else if (result === false) {
            errors.push(`Validation rule '${rule.name}' failed`);
          }
        } catch (error) {
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
  validateProperty(value: any, property: ConfigProperty, path: string): string[] {
    const errors: string[] = [];

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
  private validateType(
    value: any,
    expectedType: string,
    path: string,
    errors: string[]
  ): boolean {
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
  private getType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  /**
   * Validate property constraints
   * @param value - Property value
   * @param constraints - Property constraints
   * @param path - Property path
   * @param errors - Error array to populate
   */
  private validateConstraints(
    value: any,
    constraints: PropertyConstraints,
    path: string,
    errors: string[]
  ): void {
    // Validate min constraint
    if (constraints.min !== undefined) {
      if (typeof value === 'number' && value < constraints.min) {
        errors.push(`Property '${path}' must be at least ${constraints.min}`);
      } else if ((typeof value === 'string' || Array.isArray(value)) && value.length < constraints.min) {
        errors.push(`Property '${path}' must have at least ${constraints.min} characters/items`);
      }
    }

    // Validate max constraint
    if (constraints.max !== undefined) {
      if (typeof value === 'number' && value > constraints.max) {
        errors.push(`Property '${path}' must be at most ${constraints.max}`);
      } else if ((typeof value === 'string' || Array.isArray(value)) && value.length > constraints.max) {
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
  createDefaultSchema(): ConfigSchema {
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