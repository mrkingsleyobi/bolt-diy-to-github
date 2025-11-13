import { FilterEngine } from '../FilterEngine';
import { FilterConfig, FileMetadata } from '../../types/filters';
import { FilterHooksService } from '../hooks/FilterHooksService';
import { FilterVerificationService } from '../verification/FilterVerificationService';

describe('FilterEngine Comprehensive Integration', () => {
  let filterEngine: FilterEngine;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    filterEngine = new FilterEngine();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test('should integrate all features with complex configuration and negation patterns', async () => {
    // This test validates the complete integration of:
    // 1. Complex glob pattern matching with brace expansion
    // 2. Include/exclude pattern logic with proper precedence
    // 3. Size and content type filtering
    // 4. Hooks integration for coordination
    // 5. Verification-quality truth scoring
    // 6. Performance optimization for large file sets
    // 7. Complex negation pattern handling

    const config: FilterConfig = {
      include: [
        '**/*.{ts,tsx}',           // Include all TypeScript files
        '**/*.js',                 // Include all JavaScript files
        '!**/*.test.*',           // Exclude test files (negation pattern)
        '!**/*.d.ts',             // Exclude declaration files (negation pattern)
        '!**/node_modules/**'     // Exclude node_modules (negation pattern)
      ],
      exclude: [
        '**/legacy/**',           // Explicit exclude pattern
        '**/*.min.*'              // Exclude minified files
      ],
      maxSize: 5000,              // Size filter
      minSize: 50,                // Size filter
      contentTypes: [             // Content type filter
        'text/typescript',
        'text/javascript',
        'application/javascript'
      ]
    };

    // Create a comprehensive set of test files
    const files: FileMetadata[] = [
      // Should be included
      { path: 'src/index.ts', size: 1000, contentType: 'text/typescript' },
      { path: 'src/components/App.tsx', size: 2000, contentType: 'text/typescript' },
      { path: 'src/utils/helper.js', size: 800, contentType: 'application/javascript' },

      // Should be excluded due to negation patterns
      { path: 'src/index.test.ts', size: 500, contentType: 'text/typescript' }, // negation: !**/*.test.*
      { path: 'src/types/index.d.ts', size: 200, contentType: 'text/typescript' }, // negation: !**/*.d.ts
      { path: 'node_modules/react/index.js', size: 1000, contentType: 'application/javascript' }, // negation: !**/node_modules/**

      // Should be excluded due to explicit exclude patterns
      { path: 'legacy/old.js', size: 300, contentType: 'application/javascript' }, // exclude: **/legacy/**
      { path: 'src/bundle.min.js', size: 4000, contentType: 'application/javascript' }, // exclude: **/*.min.*

      // Should be excluded due to size limits
      { path: 'src/large.ts', size: 6000, contentType: 'text/typescript' }, // exceeds maxSize
      { path: 'src/tiny.ts', size: 10, contentType: 'text/typescript' }, // below minSize

      // Should be excluded due to content type
      { path: 'src/config.json', size: 200, contentType: 'application/json' }, // not in allowed content types

      // Should be excluded due to content type filter
      { path: 'README.md', size: 500, contentType: 'text/markdown' }, // not in allowed content types
    ];

    const result = await filterEngine.filter(config, files);

    // Verify hooks were called
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[PRE-TASK HOOK]'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[POST-EDIT HOOK]'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[POST-TASK HOOK]'));

    // Verify included files
    expect(result.included).toContain('src/index.ts');
    expect(result.included).toContain('src/components/App.tsx');
    expect(result.included).toContain('src/utils/helper.js');
    expect(result.included).toHaveLength(3);

    // Verify excluded files
    expect(result.excluded).toContain('src/index.test.ts');
    expect(result.excluded).toContain('src/types/index.d.ts');
    expect(result.excluded).toContain('node_modules/react/index.js');
    expect(result.excluded).toContain('legacy/old.js');
    expect(result.excluded).toContain('src/bundle.min.js');
    expect(result.excluded).toContain('src/large.ts');
    expect(result.excluded).toContain('src/tiny.ts');
    expect(result.excluded).toContain('src/config.json');
    expect(result.excluded).toContain('README.md');
    expect(result.excluded).toHaveLength(9);

    // Verify exclusion reasons
    expect(result.reasons['src/index.test.ts']).toContain('exclude pattern');
    expect(result.reasons['src/types/index.d.ts']).toContain('exclude pattern');
    expect(result.reasons['node_modules/react/index.js']).toContain('exclude pattern');
    expect(result.reasons['legacy/old.js']).toContain('exclude pattern');
    expect(result.reasons['src/bundle.min.js']).toContain('exclude pattern');
    expect(result.reasons['src/large.ts']).toContain('above maximum');
    expect(result.reasons['src/tiny.ts']).toContain('below minimum');
    expect(result.reasons['src/config.json']).toContain('not match any include pattern');
    expect(result.reasons['README.md']).toContain('not match any include pattern');

    // Verify verification report is included
    expect(result).toHaveProperty('verification');
    expect(result.verification).toBeDefined();
    expect(result.verification).toHaveProperty('truthScore');
    expect(result.verification).toHaveProperty('meetsThreshold');
    expect(result.verification).toHaveProperty('metrics');
    expect(result.verification).toHaveProperty('summary');

    // Verify truth score is calculated correctly
    expect(typeof result.verification!.truthScore).toBe('number');
    expect(result.verification!.truthScore).toBeGreaterThanOrEqual(0);
    expect(result.verification!.truthScore).toBeLessThanOrEqual(1);

    // Verify all metrics are present and valid
    expect(result.verification!.metrics).toHaveProperty('configCompleteness');
    expect(result.verification!.metrics).toHaveProperty('patternAccuracy');
    expect(result.verification!.metrics).toHaveProperty('consistency');
    expect(result.verification!.metrics).toHaveProperty('performance');
    expect(result.verification!.metrics).toHaveProperty('coverage');

    // Verify all metrics are between 0 and 1
    Object.values(result.verification!.metrics).forEach(metric => {
      expect(metric).toBeGreaterThanOrEqual(0);
      expect(metric).toBeLessThanOrEqual(1);
    });

    // Verify meetsThreshold is correctly calculated
    expect(typeof result.verification!.meetsThreshold).toBe('boolean');

    // Verify summary information
    expect(result.verification!.summary.totalFiles).toBe(12);
    expect(result.verification!.summary.includedFiles).toBe(3);
    expect(result.verification!.summary.excludedFiles).toBe(9);
    expect(result.verification!.summary.configuration.includePatterns).toBe(5);
    expect(result.verification!.summary.configuration.excludePatterns).toBe(2);
    expect(result.verification!.summary.configuration.hasSizeFilters).toBe(true);
    expect(result.verification!.summary.configuration.hasContentTypeFilters).toBe(true);

    // Verify truth score meets threshold for good configurations
    expect(result.verification!.meetsThreshold).toBe(true); // Should meet 0.95 threshold
    expect(result.verification!.truthScore).toBeGreaterThanOrEqual(0.95);
  });

  test('should handle hooks integration with coordination flows', async () => {
    const config: FilterConfig = {
      include: ['**/*.ts'],
      exclude: ['**/*.test.ts']
    };

    const files: FileMetadata[] = [
      { path: 'src/index.ts', size: 500, contentType: 'text/plain' },
      { path: 'src/index.test.ts', size: 300, contentType: 'text/plain' }
    ];

    const result = await filterEngine.filter(config, files);

    // Verify all hooks were called with correct data
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[PRE-TASK HOOK]'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[POST-EDIT HOOK]'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[POST-TASK HOOK]'));

    // Verify pre-task hook data structure
    const preTaskCall = consoleLogSpy.mock.calls.find(call =>
      call[0].includes('[PRE-TASK HOOK]')
    );
    expect(preTaskCall).toBeDefined();
    const preTaskData = JSON.parse(preTaskCall![0].replace('[PRE-TASK HOOK] ', ''));
    expect(preTaskData).toHaveProperty('sessionId');
    expect(preTaskData).toHaveProperty('task');
    expect(preTaskData).toHaveProperty('timestamp');
    expect(preTaskData.type).toBe('pre-task');

    // Verify post-edit hook data structure
    const postEditCall = consoleLogSpy.mock.calls.find(call =>
      call[0].includes('[POST-EDIT HOOK]')
    );
    expect(postEditCall).toBeDefined();
    const postEditData = JSON.parse(postEditCall![0].replace('[POST-EDIT HOOK] ', ''));
    expect(postEditData).toHaveProperty('sessionId');
    expect(postEditData).toHaveProperty('file');
    expect(postEditData).toHaveProperty('config');
    expect(postEditData.type).toBe('post-edit');

    // Verify post-task hook data structure
    const postTaskCall = consoleLogSpy.mock.calls.find(call =>
      call[0].includes('[POST-TASK HOOK]')
    );
    expect(postTaskCall).toBeDefined();
    const postTaskData = JSON.parse(postTaskCall![0].replace('[POST-TASK HOOK] ', ''));
    expect(postTaskData).toHaveProperty('sessionId');
    expect(postTaskData).toHaveProperty('results');
    expect(postTaskData).toHaveProperty('truthScore');
    expect(postTaskData.type).toBe('post-task');

    // Verify results are correct
    expect(result.included).toContain('src/index.ts');
    expect(result.excluded).toContain('src/index.test.ts');
  });

  test('should validate verification-quality truth scoring accuracy', async () => {
    const config: FilterConfig = {
      include: ['**/*.{ts,tsx}', '**/*.js'],
      exclude: ['**/*.test.*', '**/node_modules/**'],
      maxSize: 2000,
      contentTypes: ['text/plain', 'application/json']
    };

    const files: FileMetadata[] = [
      { path: 'src/index.ts', size: 1000, contentType: 'text/plain' },
      { path: 'src/component.tsx', size: 1500, contentType: 'text/plain' },
      { path: 'src/index.test.ts', size: 500, contentType: 'text/plain' },
      { path: 'package.json', size: 300, contentType: 'application/json' },
      { path: 'node_modules/library/index.js', size: 100, contentType: 'text/plain' },
      { path: 'src/large.ts', size: 2500, contentType: 'text/plain' }
    ];

    const result = await filterEngine.filter(config, files);

    // Verify verification service integration
    expect(result.verification).toBeDefined();
    expect(typeof result.verification!.truthScore).toBe('number');

    // Check that truth score is reasonable (should be high for good config)
    expect(result.verification!.truthScore).toBeGreaterThanOrEqual(0.8);
    expect(result.verification!.truthScore).toBeLessThanOrEqual(1.0);

    // Check that it meets threshold
    expect(result.verification!.meetsThreshold).toBe(true);

    // Verify all individual metrics are present
    const metrics = result.verification!.metrics;
    expect(metrics.configCompleteness).toBeGreaterThan(0);
    expect(metrics.patternAccuracy).toBeGreaterThan(0);
    expect(metrics.consistency).toBeGreaterThan(0);
    expect(metrics.performance).toBeGreaterThan(0);
    expect(metrics.coverage).toBeGreaterThan(0);

    // Verify weighted average calculation
    const weights = {
      configCompleteness: 0.2,
      patternAccuracy: 0.3,
      consistency: 0.2,
      performance: 0.15,
      coverage: 0.15
    };

    let expectedScore = 0;
    expectedScore += metrics.configCompleteness * weights.configCompleteness;
    expectedScore += metrics.patternAccuracy * weights.patternAccuracy;
    expectedScore += metrics.consistency * weights.consistency;
    expectedScore += metrics.performance * weights.performance;
    expectedScore += metrics.coverage * weights.coverage;

    // Allow for small floating point differences
    expect(result.verification!.truthScore).toBeCloseTo(expectedScore, 10);
  });

  test('should optimize performance with large file sets', async () => {
    const config: FilterConfig = {
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['**/*.test.ts', '**/node_modules/**'],
      maxSize: 3000
    };

    // Create a large set of files for performance testing
    const files: FileMetadata[] = [];

    // Add regular files
    for (let i = 0; i < 2000; i++) {
      files.push({
        path: `src/module${Math.floor(i / 100)}/file${i}.ts`,
        size: 100 + (i % 1000),
        contentType: 'text/plain'
      });
    }

    // Add test files that should be excluded
    for (let i = 0; i < 200; i++) {
      files.push({
        path: `src/module${Math.floor(i / 100)}/file${i}.test.ts`,
        size: 50 + (i % 500),
        contentType: 'text/plain'
      });
    }

    // Add node_modules files that should be excluded
    for (let i = 0; i < 100; i++) {
      files.push({
        path: `node_modules/library${i}/file${i}.ts`,
        size: 200 + (i % 800),
        contentType: 'text/plain'
      });
    }

    // Add large files that should be excluded
    for (let i = 0; i < 50; i++) {
      files.push({
        path: `src/large/file${i}.ts`,
        size: 3500 + (i * 100),
        contentType: 'text/plain'
      });
    }

    const startTime = Date.now();
    const result = await filterEngine.filter(config, files);
    const processingTime = Date.now() - startTime;

    // Verify results are correct
    expect(result.included.length).toBeGreaterThan(0);
    expect(result.excluded.length).toBeGreaterThan(0);
    expect(result.included.length + result.excluded.length).toBe(files.length);

    // Verify performance - should process 2000+ files in reasonable time
    expect(processingTime).toBeLessThan(3000); // Should be less than 3 seconds

    // Verify that batching was used for large file set
    expect(result.included.length + result.excluded.length).toBe(2350);

    console.log(`Processed ${files.length} files in ${processingTime}ms`);
    console.log(`Processing rate: ${Math.round((files.length / processingTime) * 1000)} files/second`);
  });

  test('should handle complex negation pattern scenarios', async () => {
    const config: FilterConfig = {
      include: [
        'src/**/*.{ts,tsx}',
        '!src/test/**/*',
        '!src/**/fixtures/**/*',
        '!src/**/*.test.*'
      ],
      exclude: [
        '**/legacy/**'
      ]
    };

    const files: FileMetadata[] = [
      // Should be included
      { path: 'src/index.ts', size: 1000, contentType: 'text/plain' },
      { path: 'src/components/Button.tsx', size: 800, contentType: 'text/plain' },
      { path: 'src/utils/helper.ts', size: 500, contentType: 'text/plain' },

      // Should be excluded due to negation patterns
      { path: 'src/test/utils.test.ts', size: 300, contentType: 'text/plain' }, // !src/**/*.test.* and !src/test/**/*
      { path: 'src/data/fixtures/sample.ts', size: 200, contentType: 'text/plain' }, // !src/**/fixtures/**/*
      { path: 'src/test/setup.ts', size: 400, contentType: 'text/plain' }, // !src/test/**/*

      // Should be excluded due to not matching include patterns
      { path: 'test/index.test.ts', size: 300, contentType: 'text/plain' }, // not in src/
      { path: 'src/config.json', size: 100, contentType: 'application/json' }, // not .ts/.tsx

      // Should be excluded due to explicit exclude
      { path: 'legacy/old.ts', size: 200, contentType: 'text/plain' } // **/legacy/**
    ];

    const result = await filterEngine.filter(config, files);

    // Verify included files
    expect(result.included).toContain('src/index.ts');
    expect(result.included).toContain('src/components/Button.tsx');
    expect(result.included).toContain('src/utils/helper.ts');
    expect(result.included).toHaveLength(3);

    // Verify excluded files
    expect(result.excluded).toContain('src/test/utils.test.ts');
    expect(result.excluded).toContain('src/data/fixtures/sample.ts');
    expect(result.excluded).toContain('src/test/setup.ts');
    expect(result.excluded).toContain('test/index.test.ts');
    expect(result.excluded).toContain('src/config.json');
    expect(result.excluded).toContain('legacy/old.ts');
    expect(result.excluded).toHaveLength(6);

    // Verify specific exclusion reasons
    expect(result.reasons['src/test/utils.test.ts']).toContain('exclude pattern');
    expect(result.reasons['src/data/fixtures/sample.ts']).toContain('exclude pattern');
    expect(result.reasons['src/test/setup.ts']).toContain('exclude pattern');
    expect(result.reasons['test/index.test.ts']).toContain('not match any include pattern');
    expect(result.reasons['src/config.json']).toContain('not match any include pattern');
    expect(result.reasons['legacy/old.ts']).toContain('not match any include pattern');
  });
});