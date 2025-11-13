// TruthVerificationService.test.ts - Unit tests for TruthVerificationService
// Phase 4: Environment Configuration Management - Task 12: Integrate truth verification scoring in configuration management

import { TruthVerificationService, TruthVerificationOptions } from '../../src/verification/TruthVerificationService';
import { ConfigurationWorkflowResult } from '../../src/config/ConfigurationWorkflowService';

describe('TruthVerificationService', () => {
  let truthVerificationService: TruthVerificationService;

  beforeEach(() => {
    truthVerificationService = new TruthVerificationService();
  });

  describe('constructor', () => {
    it('should create an instance with default options', () => {
      expect(truthVerificationService).toBeInstanceOf(TruthVerificationService);
      expect(truthVerificationService.getThreshold()).toBe(0.95);
    });

    it('should create an instance with custom options', () => {
      const options: TruthVerificationOptions = {
        threshold: 0.9,
        autoRollback: true,
        weights: {
          validation: 0.4,
          security: 0.3,
          completeness: 0.2,
          consistency: 0.05,
          freshness: 0.05
        }
      };

      const service = new TruthVerificationService(options);
      expect(service.getThreshold()).toBe(0.9);
    });

    it('should throw an error if weights do not sum to 1.0', () => {
      const options: TruthVerificationOptions = {
        weights: {
          validation: 0.5,
          security: 0.5,
          completeness: 0.5, // This makes the sum > 1.0
          consistency: 0.0,
          freshness: 0.0
        }
      };

      expect(() => new TruthVerificationService(options)).toThrow('Truth verification weights must sum to 1.0');
    });
  });

  describe('verifyConfigurationResult', () => {
    it('should verify a configuration result with high truth score', () => {
      const result: ConfigurationWorkflowResult = {
        success: true,
        config: {
          environment: 'testing',
          github: {
            repository: 'test-repo',
            owner: 'test-owner'
          },
          deployment: {
            target: 'github-pages'
          },
          security: {
            encryptionEnabled: true
          }
        },
        truthScore: 0.98
      };

      const verification = truthVerificationService.verifyConfigurationResult(result);

      expect(verification.score).toBeGreaterThan(0.95);
      expect(verification.meetsThreshold).toBe(true);
      expect(verification.recommendations).toContain('Configuration truth score is excellent - no improvements needed');
    });

    it('should verify a configuration result with low truth score', () => {
      const result: ConfigurationWorkflowResult = {
        success: false,
        config: {
          environment: 'invalid-env',
          github: {
            token: 'exposed-token', // Security violation
            repository: 'test-repo'
            // Missing owner
          },
          deployment: {
            target: 'invalid-target'
          },
          security: {
            encryptionEnabled: false // Security violation
          }
        },
        validation: {
          valid: false,
          errors: ['Invalid environment', 'Invalid deployment target'],
          warnings: []
        },
        error: 'Configuration validation failed',
        truthScore: 0.3
      };

      const verification = truthVerificationService.verifyConfigurationResult(result);

      expect(verification.score).toBeLessThan(0.95);
      expect(verification.meetsThreshold).toBe(false);
      expect(verification.recommendations).toContain('Overall truth score 0.30 is below threshold 0.95');
      expect(verification.recommendations).toContain('Improve configuration validation - fix validation errors');
      expect(verification.recommendations).toContain('Address security vulnerabilities - enable encryption, review limits');
      expect(verification.recommendations).toContain('Complete missing required configuration properties');
    });

    it('should verify consistency between configuration results', () => {
      const currentResult: ConfigurationWorkflowResult = {
        success: true,
        config: {
          environment: 'testing',
          github: {
            repository: 'test-repo',
            owner: 'test-owner'
          },
          deployment: {
            target: 'github-pages'
          }
        },
        truthScore: 0.95
      };

      const previousResult: ConfigurationWorkflowResult = {
        success: true,
        config: {
          environment: 'testing',
          github: {
            repository: 'test-repo',
            owner: 'test-owner'
          },
          deployment: {
            target: 'github-pages'
          }
        },
        truthScore: 0.95
      };

      const verification = truthVerificationService.verifyConfigurationResult(currentResult, previousResult);

      // With consistent configs, we expect a high consistency score
      expect(verification.factors.consistency).toBeGreaterThan(0.9);
    });

    it('should handle verification with missing configuration', () => {
      const result: ConfigurationWorkflowResult = {
        success: false,
        error: 'Configuration not found',
        truthScore: 0.1
      };

      const verification = truthVerificationService.verifyConfigurationResult(result);

      expect(verification.score).toBeLessThan(0.5);
      expect(verification.meetsThreshold).toBe(false);
    });
  });

  describe('calculateSecurityScore', () => {
    it('should calculate high security score for secure configuration', () => {
      const result: ConfigurationWorkflowResult = {
        success: true,
        config: {
          github: {
            repository: 'test-repo',
            owner: 'test-owner'
            // No exposed token
          },
          security: {
            encryptionEnabled: true,
            authTimeout: 300000,
            rateLimit: 100
          },
          limits: {
            maxFileSize: 10485760,
            maxConnections: 10
          }
        }
      };

      // Access private method through reflection for testing
      const securityScore = (truthVerificationService as any).calculateSecurityScore(result);
      expect(securityScore).toBeGreaterThan(0.8);
    });

    it('should calculate low security score for insecure configuration', () => {
      const result: ConfigurationWorkflowResult = {
        success: true,
        config: {
          github: {
            token: 'exposed-token', // Exposed token
            repository: 'test-repo',
            owner: 'test-owner'
          },
          security: {
            encryptionEnabled: false, // Encryption disabled
            authTimeout: 1000, // Too short timeout
            rateLimit: 10000 // Too high rate limit
          },
          limits: {
            maxFileSize: 1000000000, // Too large file size
            maxConnections: 1000 // Too many connections
          }
        }
      };

      // Access private method through reflection for testing
      const securityScore = (truthVerificationService as any).calculateSecurityScore(result);
      expect(securityScore).toBeLessThan(0.5);
    });
  });

  describe('calculateCompletenessScore', () => {
    it('should calculate high completeness score for complete configuration', () => {
      const result: ConfigurationWorkflowResult = {
        success: true,
        config: {
          environment: 'testing',
          github: {
            repository: 'test-repo',
            owner: 'test-owner'
          },
          deployment: {
            target: 'github-pages'
          }
        }
      };

      // Access private method through reflection for testing
      const completenessScore = (truthVerificationService as any).calculateCompletenessScore(result);
      expect(completenessScore).toBe(1.0); // All required properties present
    });

    it('should calculate low completeness score for incomplete configuration', () => {
      const result: ConfigurationWorkflowResult = {
        success: true,
        config: {
          environment: 'testing'
          // Missing github.repository, github.owner, deployment.target
        }
      };

      // Access private method through reflection for testing
      const completenessScore = (truthVerificationService as any).calculateCompletenessScore(result);
      expect(completenessScore).toBe(0.0); // No required properties present
    });
  });

  describe('meetsThreshold', () => {
    it('should return true for scores that meet threshold', () => {
      expect(truthVerificationService.meetsThreshold(0.95)).toBe(true);
      expect(truthVerificationService.meetsThreshold(0.98)).toBe(true);
      expect(truthVerificationService.meetsThreshold(1.0)).toBe(true);
    });

    it('should return false for scores that do not meet threshold', () => {
      expect(truthVerificationService.meetsThreshold(0.94)).toBe(false);
      expect(truthVerificationService.meetsThreshold(0.5)).toBe(false);
      expect(truthVerificationService.meetsThreshold(0.0)).toBe(false);
    });
  });
});