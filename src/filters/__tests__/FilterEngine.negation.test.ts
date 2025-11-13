import { FilterEngine } from '../FilterEngine';
import { FilterConfig, FileMetadata } from '../../types/filters';

describe('FilterEngine Complex Negation Patterns', () => {
  let engine: FilterEngine;

  beforeEach(() => {
    engine = new FilterEngine();
  });

  test('should handle negated include patterns as exclude patterns', async () => {
    const config: FilterConfig = {
      include: ['**/*.ts', '!**/*.test.ts', '!**/*.d.ts'], // Include all .ts files except test and declaration files
      maxSize: 10000
    };

    const files: FileMetadata[] = [
      { path: 'src/index.ts', size: 1000, contentType: 'text/typescript' },
      { path: 'src/index.test.ts', size: 500, contentType: 'text/typescript' },
      { path: 'src/types/index.d.ts', size: 200, contentType: 'text/typescript' },
      { path: 'src/utils/helper.ts', size: 800, contentType: 'text/typescript' },
      { path: 'src/components/App.tsx', size: 1200, contentType: 'text/typescript' }
    ];

    const result = await engine.filter(config, files);

    // Should include .ts files that don't match negation patterns
    expect(result.included).toContain('src/index.ts');
    expect(result.included).toContain('src/utils/helper.ts');
    expect(result.included).toHaveLength(2);

    // Should exclude files that match negation patterns or don't match include patterns
    expect(result.excluded).toContain('src/index.test.ts');
    expect(result.excluded).toContain('src/types/index.d.ts');
    expect(result.excluded).toContain('src/components/App.tsx'); // Not .ts extension
    expect(result.excluded).toHaveLength(3);

    // Check reasons
    expect(result.reasons['src/index.test.ts']).toContain('exclude pattern');
    expect(result.reasons['src/types/index.d.ts']).toContain('exclude pattern');
    expect(result.reasons['src/components/App.tsx']).toContain('not match any include pattern');
  });

  test('should handle complex negation with brace expansion', async () => {
    const config: FilterConfig = {
      include: ['src/**/*.{ts,tsx}', '!src/**/*.{test,spec}.{ts,tsx}'],
      maxSize: 5000
    };

    const files: FileMetadata[] = [
      { path: 'src/index.ts', size: 1000, contentType: 'text/typescript' },
      { path: 'src/components/App.tsx', size: 2000, contentType: 'text/typescript' },
      { path: 'src/utils/helper.test.ts', size: 500, contentType: 'text/typescript' },
      { path: 'src/models/user.spec.tsx', size: 600, contentType: 'text/typescript' },
      { path: 'test/unit.test.ts', size: 300, contentType: 'text/typescript' },
      { path: 'src/data.json', size: 400, contentType: 'application/json' }
    ];

    const result = await engine.filter(config, files);

    // Should include .ts/.tsx files in src that don't match negation patterns
    expect(result.included).toContain('src/index.ts');
    expect(result.included).toContain('src/components/App.tsx');
    expect(result.included).toHaveLength(2);

    // Should exclude files that match negation patterns or are not in allowed extensions
    expect(result.excluded).toContain('src/utils/helper.test.ts');
    expect(result.excluded).toContain('src/models/user.spec.tsx');
    expect(result.excluded).toContain('test/unit.test.ts'); // Not in src
    expect(result.excluded).toContain('src/data.json'); // Not .ts/.tsx
    expect(result.excluded).toHaveLength(4);

    // Check reasons
    expect(result.reasons['src/utils/helper.test.ts']).toContain('exclude pattern');
    expect(result.reasons['src/models/user.spec.tsx']).toContain('exclude pattern');
    expect(result.reasons['test/unit.test.ts']).toContain('not match any include pattern');
    expect(result.reasons['src/data.json']).toContain('not match any include pattern');
  });

  test('should handle multiple levels of negation', async () => {
    const config: FilterConfig = {
      include: [
        '**/*.{js,ts,jsx,tsx}',
        '!**/node_modules/**',
        '!**/*.test.*',
        '!**/dist/**',
        '!**/*.min.*'
      ],
      maxSize: 10000
    };

    const files: FileMetadata[] = [
      { path: 'src/index.ts', size: 2000, contentType: 'text/typescript' },
      { path: 'src/App.jsx', size: 1500, contentType: 'text/javascript' },
      { path: 'node_modules/react/index.js', size: 1000, contentType: 'application/javascript' },
      { path: 'src/index.test.js', size: 500, contentType: 'application/javascript' },
      { path: 'dist/bundle.min.js', size: 5000, contentType: 'application/javascript' },
      { path: 'src/utils.min.js', size: 300, contentType: 'application/javascript' },
      { path: 'src/styles.css', size: 800, contentType: 'text/css' }
    ];

    const result = await engine.filter(config, files);

    // Should include files that match allowed extensions and don't match negation patterns
    expect(result.included).toContain('src/index.ts');
    expect(result.included).toContain('src/App.jsx');
    expect(result.included).toHaveLength(2);

    // Should exclude files that match any negation pattern or are not in allowed extensions
    expect(result.excluded).toContain('node_modules/react/index.js');
    expect(result.excluded).toContain('src/index.test.js');
    expect(result.excluded).toContain('dist/bundle.min.js');
    expect(result.excluded).toContain('src/utils.min.js');
    expect(result.excluded).toContain('src/styles.css');
    expect(result.excluded).toHaveLength(5);

    // Check reasons
    expect(result.reasons['node_modules/react/index.js']).toContain('exclude pattern');
    expect(result.reasons['src/index.test.js']).toContain('exclude pattern');
    expect(result.reasons['dist/bundle.min.js']).toContain('exclude pattern');
    expect(result.reasons['src/utils.min.js']).toContain('exclude pattern');
    expect(result.reasons['src/styles.css']).toContain('not match any include pattern');
  });

  test('should handle negation patterns with directory restrictions', async () => {
    const config: FilterConfig = {
      include: [
        'src/**/*.{ts,tsx}',
        '!src/test/**/*',
        '!src/**/fixtures/**/*'
      ]
    };

    const files: FileMetadata[] = [
      { path: 'src/index.ts', size: 1000, contentType: 'text/typescript' },
      { path: 'src/components/Button.tsx', size: 800, contentType: 'text/typescript' },
      { path: 'src/test/utils.test.ts', size: 500, contentType: 'text/typescript' },
      { path: 'src/data/fixtures/sample.ts', size: 200, contentType: 'text/typescript' },
      { path: 'test/index.test.ts', size: 300, contentType: 'text/typescript' }
    ];

    const result = await engine.filter(config, files);

    // Should include files in src that match extensions and don't match negation patterns
    expect(result.included).toContain('src/index.ts');
    expect(result.included).toContain('src/components/Button.tsx');
    expect(result.included).toHaveLength(2);

    // Should exclude files that match negation patterns
    expect(result.excluded).toContain('src/test/utils.test.ts');
    expect(result.excluded).toContain('src/data/fixtures/sample.ts');
    expect(result.excluded).toContain('test/index.test.ts'); // Not in src/
    expect(result.excluded).toHaveLength(3);

    // Check reasons
    expect(result.reasons['src/test/utils.test.ts']).toContain('exclude pattern');
    expect(result.reasons['src/data/fixtures/sample.ts']).toContain('exclude pattern');
    expect(result.reasons['test/index.test.ts']).toContain('not match any include pattern');
  });

  test('should handle negation patterns with size and content type filters', async () => {
    const config: FilterConfig = {
      include: [
        '**/*.{js,ts}',
        '!**/*.min.js'
      ],
      exclude: ['**/legacy/**'],
      maxSize: 2000,
      contentTypes: ['text/javascript', 'text/typescript', 'application/javascript']
    };

    const files: FileMetadata[] = [
      { path: 'src/index.js', size: 1500, contentType: 'text/javascript' },
      { path: 'src/lib.min.js', size: 3000, contentType: 'application/javascript' },
      { path: 'src/utils.ts', size: 1800, contentType: 'text/typescript' },
      { path: 'legacy/old.js', size: 1000, contentType: 'text/javascript' },
      { path: 'dist/bundle.js', size: 2500, contentType: 'application/javascript' },
      { path: 'src/config.json', size: 500, contentType: 'application/json' }
    ];

    const result = await engine.filter(config, files);

    // Should include files that pass all filters
    expect(result.included).toContain('src/index.js');
    expect(result.included).toContain('src/utils.ts');
    expect(result.included).toHaveLength(2);

    // Should exclude files for various reasons
    expect(result.excluded).toContain('src/lib.min.js'); // Negation pattern
    expect(result.excluded).toContain('legacy/old.js'); // Explicit exclude pattern
    expect(result.excluded).toContain('dist/bundle.js'); // Size limit
    expect(result.excluded).toContain('src/config.json'); // Content type
    expect(result.excluded).toHaveLength(4);

    // Check reasons
    expect(result.reasons['src/lib.min.js']).toContain('exclude pattern');
    expect(result.reasons['legacy/old.js']).toContain('exclude pattern');
    expect(result.reasons['dist/bundle.js']).toContain('above maximum');
    expect(result.reasons['src/config.json']).toContain('not match any include pattern');
  });
});