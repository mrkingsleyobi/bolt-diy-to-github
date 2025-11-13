// ConfigValidator.test.ts - Unit tests for ConfigValidator
// Phase 4: Environment Configuration Management - Task 8: Create security validation test cases for configuration management

import { ConfigValidatorImpl, ConfigSchema, ConfigProperty } from '../../src/config/ConfigValidator';

describe('ConfigValidatorImpl', () => {
  let configValidator: ConfigValidatorImpl;

  beforeEach(() => {
    configValidator = new ConfigValidatorImpl();
  });

  describe('validate', () => {
    it('should validate a correct configuration against schema', () => {
      const config = {
        environment: 'development',
        github: {
          token: 'ghp_test-token',
          repository: 'test-repo',
          owner: 'test-owner'
        },
        deployment: {
          target: 'github-pages',
          region: 'us-east-1'
        }
      };

      const schema: ConfigSchema = {
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
            },
            required: true
          }
        },
        required: ['environment']
      };

      const result = configValidator.validate(config, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return errors for missing required properties', () => {
      const config = {
        github: {
          repository: 'test-repo'
          // missing token and owner
        }
        // missing environment (required)
      };

      const schema: ConfigSchema = {
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
          environment: {
            type: 'string',
            description: 'Environment type',
            constraints: {
              enum: ['development', 'testing', 'staging', 'production']
            },
            required: true
          }
        },
        required: ['environment']
      };

      const result = configValidator.validate(config, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Required property 'environment' is missing");
      expect(result.errors).toContain("Required property 'github.token' is missing");
      expect(result.errors).toContain("Required property 'github.owner' is missing");
    });

    it('should return errors for invalid property types', () => {
      const config = {
        environment: 123, // should be string
        github: {
          token: 'ghp_test-token',
          repository: 'test-repo',
          owner: 'test-owner'
        }
      };

      const schema: ConfigSchema = {
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
          environment: {
            type: 'string',
            description: 'Environment type',
            constraints: {
              enum: ['development', 'testing', 'staging', 'production']
            },
            required: true
          }
        },
        required: ['environment']
      };

      const result = configValidator.validate(config, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Property 'environment' expected type 'string' but got 'number'");
    });

    it('should return errors for enum constraint violations', () => {
      const config = {
        environment: 'invalid-env', // not in enum
        github: {
          token: 'ghp_test-token',
          repository: 'test-repo',
          owner: 'test-owner'
        }
      };

      const schema: ConfigSchema = {
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
          environment: {
            type: 'string',
            description: 'Environment type',
            constraints: {
              enum: ['development', 'testing', 'staging', 'production']
            },
            required: true
          }
        },
        required: ['environment']
      };

      const result = configValidator.validate(config, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Property 'environment' must be one of: development, testing, staging, production");
    });

    it('should validate custom rules', () => {
      const config = {
        environment: 'development',
        github: {
          token: 'ghp_test-token',
          repository: 'test-repo',
          owner: 'test-owner'
        }
      };

      const schema: ConfigSchema = {
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
          environment: {
            type: 'string',
            description: 'Environment type',
            constraints: {
              enum: ['development', 'testing', 'staging', 'production']
            },
            required: true
          }
        },
        required: ['environment'],
        rules: [
          {
            name: 'github-token-format',
            description: 'GitHub token must start with ghp_',
            validate: (config: any) => {
              if (config.github && config.github.token && !config.github.token.startsWith('ghp_')) {
                return 'GitHub token must start with ghp_';
              }
              return true;
            }
          }
        ]
      };

      const result = configValidator.validate(config, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for custom rule violations', () => {
      const config = {
        environment: 'development',
        github: {
          token: 'invalid-token', // doesn't start with ghp_
          repository: 'test-repo',
          owner: 'test-owner'
        }
      };

      const schema: ConfigSchema = {
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
          environment: {
            type: 'string',
            description: 'Environment type',
            constraints: {
              enum: ['development', 'testing', 'staging', 'production']
            },
            required: true
          }
        },
        required: ['environment'],
        rules: [
          {
            name: 'github-token-format',
            description: 'GitHub token must start with ghp_',
            validate: (config: any) => {
              if (config.github && config.github.token && !config.github.token.startsWith('ghp_')) {
                return 'GitHub token must start with ghp_';
              }
              return true;
            }
          }
        ]
      };

      const result = configValidator.validate(config, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('GitHub token must start with ghp_');
    });
  });

  describe('validateProperty', () => {
    it('should validate string properties with pattern constraint', () => {
      const property: ConfigProperty = {
        type: 'string',
        description: 'API URL',
        constraints: {
          pattern: /^https:\/\/.+$/ as unknown as RegExp // Type assertion for testing
        }
      };

      // Mock the pattern test for testing purposes
      const mockPattern = { test: jest.fn() };
      property.constraints!.pattern = mockPattern as unknown as RegExp;

      // Test valid URL
      mockPattern.test.mockReturnValue(true);
      let errors = configValidator.validateProperty('https://api.example.com', property, 'apiUrl');
      expect(errors).toHaveLength(0);

      // Test invalid URL
      mockPattern.test.mockReturnValue(false);
      errors = configValidator.validateProperty('http://api.example.com', property, 'apiUrl');
      expect(errors).toContain('Property \'apiUrl\' does not match pattern /https:\\/\\/.+/');
    });

    it('should validate number properties with min/max constraints', () => {
      const property: ConfigProperty = {
        type: 'number',
        description: 'Sync interval',
        constraints: {
          min: 1000,
          max: 3600000
        }
      };

      // Test valid value
      let errors = configValidator.validateProperty(30000, property, 'syncInterval');
      expect(errors).toHaveLength(0);

      // Test value below minimum
      errors = configValidator.validateProperty(500, property, 'syncInterval');
      expect(errors).toContain('Property \'syncInterval\' must be at least 1000');

      // Test value above maximum
      errors = configValidator.validateProperty(5000000, property, 'syncInterval');
      expect(errors).toContain('Property \'syncInterval\' must be at most 3600000');
    });

    it('should validate array properties with min/max length constraints', () => {
      const property: ConfigProperty = {
        type: 'array',
        description: 'Feature flags',
        constraints: {
          min: 1,
          max: 5
        }
      };

      // Test valid array
      let errors = configValidator.validateProperty(['feature1', 'feature2'], property, 'features');
      expect(errors).toHaveLength(0);

      // Test array below minimum length
      errors = configValidator.validateProperty([], property, 'features');
      expect(errors).toContain('Property \'features\' must have at least 1 characters/items');

      // Test array above maximum length
      errors = configValidator.validateProperty(['1', '2', '3', '4', '5', '6'], property, 'features');
      expect(errors).toContain('Property \'features\' must have at most 5 characters/items');
    });

    it('should validate nested object properties', () => {
      const property: ConfigProperty = {
        type: 'object',
        description: 'GitHub configuration',
        constraints: {
          properties: {
            token: {
              type: 'string',
              description: 'GitHub token',
              required: true
            },
            repository: {
              type: 'string',
              description: 'Repository name'
            }
          }
        }
      };

      // Test valid nested object
      const validConfig = {
        token: 'ghp_test-token',
        repository: 'test-repo'
      };
      let errors = configValidator.validateProperty(validConfig, property, 'github');
      expect(errors).toHaveLength(0);

      // Test nested object with missing required property
      const invalidConfig = {
        repository: 'test-repo'
        // missing token
      };
      errors = configValidator.validateProperty(invalidConfig, property, 'github');
      expect(errors).toContain("Required property 'github.token' is missing");
    });

    it('should validate array items', () => {
      const property: ConfigProperty = {
        type: 'array',
        description: 'List of numbers',
        constraints: {
          items: {
            type: 'number',
            description: 'Number item'
          }
        }
      };

      // Test valid array items
      let errors = configValidator.validateProperty([1, 2, 3], property, 'numbers');
      expect(errors).toHaveLength(0);

      // Test array with invalid item type
      errors = configValidator.validateProperty([1, 'invalid', 3], property, 'numbers');
      expect(errors).toContain("Property 'numbers[1]' expected type 'number' but got 'string'");
    });
  });

  describe('createDefaultSchema', () => {
    it('should create a default configuration schema', () => {
      const schema = configValidator.createDefaultSchema();

      expect(schema).toBeDefined();
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('environment');

      // Check that all expected properties are present
      expect(schema.properties.github).toBeDefined();
      expect(schema.properties.deployment).toBeDefined();
      expect(schema.properties.environment).toBeDefined();
      expect(schema.properties.apiUrl).toBeDefined();
      expect(schema.properties.syncInterval).toBeDefined();
      expect(schema.properties.logLevel).toBeDefined();
      expect(schema.properties.features).toBeDefined();
      expect(schema.properties.limits).toBeDefined();
      expect(schema.properties.security).toBeDefined();

      // Check nested properties
      expect(schema.properties.github.constraints?.properties?.token).toBeDefined();
      expect(schema.properties.github.constraints?.properties?.repository).toBeDefined();
      expect(schema.properties.github.constraints?.properties?.owner).toBeDefined();

      // Check constraints
      expect(schema.properties.environment.constraints?.enum).toEqual(['development', 'testing', 'staging', 'production']);
      expect(schema.properties.deployment.constraints?.properties?.target.constraints?.enum).toEqual(['vercel', 'netlify', 'github-pages', 'custom']);
    });
  });
});