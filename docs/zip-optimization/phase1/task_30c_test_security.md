# Task 30c: Test Security

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. The streaming components have been implemented and validated, but need comprehensive security tests. This task creates tests for security vulnerabilities and protection mechanisms following London School TDD principles.

## Current System State
- All streaming components implemented with validation
- Validation tests created
- No comprehensive security tests yet

## Your Task
Create comprehensive security tests for all streaming components following London School TDD principles.

## Test First (RED Phase)
```typescript
import { EntryFilter } from '../../src/utils/zip/EntryFilter';
import { StreamingZipExtractor } from '../../src/utils/zip/StreamingZipExtractor';

describe('Security', () => {
  it('should prevent path traversal attacks', () => {
    const filter = new EntryFilter();
    const entry = { name: '../etc/passwd', size: 100, isDirectory: false };
    expect(filter.matches(entry)).toBe(false);
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
// This task is about writing tests, so there's no implementation to show here.
// The tests above would initially fail because we haven't implemented security features yet.
```

## Refactored Solution (REFACTOR Phase)
```typescript
import { EntryFilter } from '../../src/utils/zip/EntryFilter';
import { StreamingZipExtractor } from '../../src/utils/zip/StreamingZipExtractor';
import { MemoryEfficientProcessor } from '../../src/utils/zip/MemoryEfficientProcessor';
import { BackpressureHandler } from '../../src/utils/zip/BackpressureHandler';
import { ChunkedProcessor } from '../../src/utils/zip/ChunkedProcessor';
import { StreamEntry } from '../../src/types/streaming';
import { Readable } from 'stream';

// Helper function to create malicious stream entries
const createMaliciousStreamEntry = (name: string, size: number = 100): StreamEntry => {
  return {
    name,
    size,
    isDirectory: false,
    stream: new Readable({
      read() {
        this.push(Buffer.from('malicious content'));
        this.push(null);
      }
    })
  };
};

// Helper function to create valid stream entries
const createValidStreamEntry = (name: string = 'test.txt', size: number = 100): StreamEntry => {
  return {
    name,
    size,
    isDirectory: false,
    stream: new Readable({
      read() {
        this.push(Buffer.from('valid content'));
        this.push(null);
      }
    })
  };
};

describe('Security', () => {
  let filter: EntryFilter;
  let extractor: StreamingZipExtractor;
  let processor: MemoryEfficientProcessor;
  let handler: BackpressureHandler;
  let chunker: ChunkedProcessor;

  beforeEach(() => {
    filter = new EntryFilter();
    extractor = new StreamingZipExtractor();
    processor = new MemoryEfficientProcessor();
    handler = new BackpressureHandler();
    chunker = new ChunkedProcessor();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should prevent path traversal attacks', () => {
    // Test various path traversal patterns
    const maliciousEntries = [
      '../etc/passwd',
      '..\\windows\\system32\\config\\sam',
      '../../etc/shadow',
      '..\\..\\windows\\win.ini',
      '../../../etc/hosts',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      './../etc/passwd',
      '.\\..\\windows\\system32\\config\\sam',
      'dir/../../../etc/passwd',
      'dir\\..\\..\\..\\windows\\win.ini',
      '%2e%2e%2fetc%2fpasswd', // URL encoded
      '%2e%2e\\windows\\system32\\config\\sam'
    ];

    maliciousEntries.forEach(maliciousName => {
      const entry = createMaliciousStreamEntry(maliciousName);
      expect(filter.matches(entry)).toBe(false);
    });

    // Test that valid entries are still allowed
    const validEntry = createValidStreamEntry('valid.txt');
    expect(filter.matches(validEntry)).toBe(true);

    const nestedValidEntry = createValidStreamEntry('src/utils/helper.js');
    expect(filter.matches(nestedValidEntry)).toBe(true);
  });

  it('should prevent absolute path attacks', () => {
    // Test various absolute path patterns
    const absolutePaths = [
      '/etc/passwd',
      '\\windows\\system32\\config\\sam',
      'C:\\windows\\win.ini',
      'D:/etc/hosts',
      '/usr/bin/bash',
      '\\\\network\\share\\file.txt', // UNC path
      'c:/windows/system32/drivers/etc/hosts'
    ];

    absolutePaths.forEach(absolutePath => {
      const entry = createMaliciousStreamEntry(absolutePath);
      expect(filter.matches(entry)).toBe(false);
    });

    // Test that relative paths are still allowed
    const relativeEntry = createValidStreamEntry('relative/path/file.txt');
    expect(filter.matches(relativeEntry)).toBe(true);
  });

  it('should prevent null byte injection attacks', () => {
    // Test null byte injection patterns
    const nullByteEntries = [
      'file.txt\u0000.jpg',
      'script.js\u0000',
      'data.json\u0000.png',
      'test.txt%00.png', // URL encoded null byte
      'file.txt\\u0000', // Escaped null byte
      'document.pdf\u0000.exe'
    ];

    nullByteEntries.forEach(nullByteName => {
      const entry = createMaliciousStreamEntry(nullByteName);
      expect(filter.matches(entry)).toBe(false);
    });

    // Test that valid entries without null bytes are still allowed
    const validEntry = createValidStreamEntry('valid.txt');
    expect(filter.matches(validEntry)).toBe(true);
  });

  it('should prevent overly long path attacks', () => {
    // Test extremely long path names
    const longPath = 'a'.repeat(10000) + '.txt'; // 10,000 characters + extension
    const entry = createMaliciousStreamEntry(longPath);
    expect(filter.matches(entry)).toBe(false);

    // Test moderately long but reasonable paths are allowed
    const reasonablePath = 'a'.repeat(200) + '.txt'; // 200 characters + extension
    const reasonableEntry = createValidStreamEntry(reasonablePath);
    expect(filter.matches(reasonableEntry)).toBe(true);
  });

  it('should prevent directory traversal with special characters', () => {
    // Test path traversal with special characters
    const specialCharEntries = [
      '..//etc/passwd',
      '..\\\\windows\\system32\\config\\sam',
      '..\\/etc/shadow',
      '..\\\\/windows/win.ini',
      './..\\..\\etc/hosts',
      '.../etc/passwd', // Three dots
      '...\\windows\\win.ini',
      '. ..\\etc/passwd', // Space in path
      '.. .\\windows\\win.ini'
    ];

    specialCharEntries.forEach(specialCharName => {
      const entry = createMaliciousStreamEntry(specialCharName);
      expect(filter.matches(entry)).toBe(false);
    });

    // Test that normal paths with special characters are still allowed
    const validEntry = createValidStreamEntry('file-with-dashes_and_underscores.txt');
    expect(filter.matches(validEntry)).toBe(true);
  });

  it('should prevent file extension attacks', () => {
    // Test dangerous file extensions
    const dangerousExtensions = [
      'script.exe',
      'malware.bat',
      'virus.com',
      'trojan.scr',
      'backdoor.pif',
      'payload.msi',
      'exploit.hta',
      'dangerous.jar',
      'risky.sh',
      'unsafe.command'
    ];

    dangerousExtensions.forEach(dangerousName => {
      const entry = createMaliciousStreamEntry(dangerousName);
      // By default, filter should allow all files
      // But when configured to block dangerous extensions, should block them
      expect(filter.matches(entry)).toBe(true); // Default behavior
    });

    // Configure filter to block dangerous extensions
    filter.setExtensions(['txt', 'js', 'json', 'md', 'ts']); // Safe extensions only

    dangerousExtensions.forEach(dangerousName => {
      const entry = createMaliciousStreamEntry(dangerousName);
      expect(filter.matches(entry)).toBe(false); // Should now block dangerous extensions
    });

    // Test that safe extensions are still allowed
    const safeEntry = createValidStreamEntry('safe.txt');
    expect(filter.matches(safeEntry)).toBe(true);
  });

  it('should prevent content type attacks', () => {
    // Configure filter to allow only safe content types
    filter.setContentTypes(['text/plain', 'application/json', 'text/javascript']);

    // Test dangerous content types
    const dangerousEntries = [
      createMaliciousStreamEntry('virus.exe'), // Would be application/octet-stream
      createMaliciousStreamEntry('malware.bat'), // Would be text/plain but dangerous extension
      createMaliciousStreamEntry('trojan.scr') // Would be application/octet-stream
    ];

    dangerousEntries.forEach(entry => {
      expect(filter.matches(entry)).toBe(false);
    });

    // Test that safe content types are still allowed
    const safeEntry = createValidStreamEntry('safe.txt'); // text/plain
    expect(filter.matches(safeEntry)).toBe(true);

    const jsonEntry = createValidStreamEntry('data.json'); // application/json
    expect(filter.matches(jsonEntry)).toBe(true);

    const jsEntry = createValidStreamEntry('script.js'); // text/javascript
    expect(filter.matches(jsEntry)).toBe(true);
  });

  it('should prevent size-based attacks', () => {
    // Configure filter with reasonable size limits
    filter.setSizeLimits(1024, 10 * 1024 * 1024); // 1KB to 10MB

    // Test files that are too small
    const tooSmallEntry = createMaliciousStreamEntry('tiny.txt', 100); // 100 bytes
    expect(filter.matches(tooSmallEntry)).toBe(false);

    // Test files that are too large
    const tooLargeEntry = createMaliciousStreamEntry('huge.dat', 100 * 1024 * 1024); // 100MB
    expect(filter.matches(tooLargeEntry)).toBe(false);

    // Test files within reasonable size range
    const reasonableEntry = createValidStreamEntry('normal.txt', 5 * 1024 * 1024); // 5MB
    expect(filter.matches(reasonableEntry)).toBe(true);
  });

  it('should prevent directory traversal with unicode characters', () => {
    // Test path traversal with unicode characters
    const unicodeEntries = [
      '..\u202e/etc/passwd', // RTL override
      '\u202d..\u202c/windows/system32/config/sam', // LTR override
      '..\u002fetc/shadow', // Unicode slash
      '..\u005cwindows/win.ini', // Unicode backslash
      '\u002e\u002e/etc/hosts' // Unicode dots
    ];

    unicodeEntries.forEach(unicodeName => {
      const entry = createMaliciousStreamEntry(unicodeName);
      expect(filter.matches(entry)).toBe(false);
    });

    // Test that normal unicode in filenames is still allowed
    const validUnicodeEntry = createValidStreamEntry('café.txt');
    expect(filter.matches(validUnicodeEntry)).toBe(true);

    const emojiEntry = createValidStreamEntry('file📄.txt');
    expect(filter.matches(emojiEntry)).toBe(true);
  });

  it('should prevent resource exhaustion attacks', async () => {
    // Test with memory limits to prevent resource exhaustion
    const smallMemoryLimit = 1024 * 1024; // 1MB
    const processorWithLimit = new MemoryEfficientProcessor(smallMemoryLimit);
    const chunkerWithLimit = new ChunkedProcessor(smallMemoryLimit);

    // Create a large buffer that exceeds memory limits
    const largeBuffer = Buffer.alloc(10 * 1024 * 1024, 'a'); // 10MB

    // Processing should fail due to memory limits, preventing resource exhaustion
    await expect(processorWithLimit.processInChunks(largeBuffer))
      .rejects
      .toThrow(/Memory limit exceeded/);

    await expect(chunkerWithLimit.processInChunks(largeBuffer))
      .rejects
      .toThrow(/Memory limit exceeded/);

    // Test with reasonable data that should succeed
    const reasonableBuffer = Buffer.alloc(100 * 1024, 'a'); // 100KB
    await expect(processorWithLimit.processInChunks(reasonableBuffer))
      .resolves
      .toBeDefined();

    await expect(chunkerWithLimit.processInChunks(reasonableBuffer))
      .resolves
      .toBeDefined();
  });

  it('should prevent symbolic link attacks', () => {
    // Test symbolic link patterns (if they could be represented in ZIP)
    const symlinkEntries = [
      'symlink->/etc/passwd',
      'link->\\windows\\system32\\config\\sam',
      'shortcut->/usr/bin/bash'
    ];

    symlinkEntries.forEach(symlinkName => {
      const entry = createMaliciousStreamEntry(symlinkName);
      expect(filter.matches(entry)).toBe(false);
    });

    // Test that normal entries are still allowed
    const normalEntry = createValidStreamEntry('normal.txt');
    expect(filter.matches(normalEntry)).toBe(true);
  });

  it('should prevent globbing attacks', () => {
    // Configure filter with glob patterns to prevent globbing attacks
    filter.addExcludePattern('**/.*'); // Exclude hidden files
    filter.addExcludePattern('**/*.{exe,bat,com,scr,pif,hta,msi}'); // Exclude dangerous extensions

    // Test hidden files and dangerous extensions
    const maliciousEntries = [
      createMaliciousStreamEntry('.bashrc'),
      createMaliciousStreamEntry('.ssh/id_rsa'),
      createMaliciousStreamEntry('virus.exe'),
      createMaliciousStreamEntry('malware.bat'),
      createMaliciousStreamEntry('trojan.scr')
    ];

    maliciousEntries.forEach(entry => {
      expect(filter.matches(entry)).toBe(false);
    });

    // Test that normal files are still allowed
    const normalEntry = createValidStreamEntry('document.txt');
    expect(filter.matches(normalEntry)).toBe(true);

    const readmeEntry = createValidStreamEntry('README.md');
    expect(filter.matches(readmeEntry)).toBe(true);
  });

  it('should maintain security during integration', async () => {
    // Test security across integrated components
    const maliciousEntry = createMaliciousStreamEntry('../../../etc/passwd');

    // Entry should be filtered out at the filter level
    expect(filter.matches(maliciousEntry)).toBe(false);

    // Even if it somehow got through, memory processor should handle it safely
    const processorWithLimit = new MemoryEfficientProcessor(1024 * 1024); // 1MB limit
    const chunkerWithLimit = new ChunkedProcessor(1024 * 1024); // 1MB limit

    // Create a stream that tries to consume excessive memory
    const maliciousStream = new Readable({
      read() {
        // Try to push a very large chunk to consume memory
        const largeChunk = Buffer.alloc(5 * 1024 * 1024, 'x'); // 5MB chunk
        this.push(largeChunk);
        this.push(null);
      }
    });

    // Backpressure handler should prevent memory exhaustion
    const handlerWithLimit = new BackpressureHandler(2 * 1024 * 1024); // 2MB limit
    const controlledStream = handlerWithLimit.applyBackpressure(maliciousStream, 64 * 1024); // 64KB high water mark

    // Processing should respect memory limits
    await expect(processorWithLimit.processStream(controlledStream))
      .rejects
      .toThrow(/Memory limit exceeded/);

    // Chunked processor should also respect limits
    const maliciousBuffer = Buffer.alloc(5 * 1024 * 1024, 'x'); // 5MB buffer
    await expect(chunkerWithLimit.processInChunks(maliciousBuffer))
      .rejects
      .toThrow(/Memory limit exceeded/);
  });

  it('should prevent directory listing attacks', () => {
    // Test directory entries with traversal patterns
    const maliciousDirEntries = [
      '../',
      '..\\',
      '../../',
      '..\\..\\',
      '/etc/',
      'C:\\windows\\',
      '../../../'
    ];

    maliciousDirEntries.forEach(maliciousDirName => {
      const entry = {
        name: maliciousDirName,
        size: 0,
        isDirectory: true,
        stream: new Readable()
      };
      expect(filter.matches(entry)).toBe(false);
    });

    // Test that normal directories are still allowed
    const normalDirEntry = {
      name: 'src/',
      size: 0,
      isDirectory: true,
      stream: new Readable()
    };
    expect(filter.matches(normalDirEntry)).toBe(true);

    const nestedDirEntry = {
      name: 'src/utils/',
      size: 0,
      isDirectory: true,
      stream: new Readable()
    };
    expect(filter.matches(nestedDirEntry)).toBe(true);
  });

  it('should prevent file name encoding attacks', () => {
    // Test various encoding attacks
    const encodingAttacks = [
      'file%2etxt', // URL encoded dot
      'file%2f.txt', // URL encoded slash
      'file%5c.txt', // URL encoded backslash
      '%2e%2e%2fetc%2fpasswd', // Double encoding
      'file%252etxt', // Double percent encoding
      'file%C0%AE%C0%AE%C0%AFetc%C0%AFpasswd' // UTF-8 encoded traversal
    ];

    encodingAttacks.forEach(attackName => {
      const entry = createMaliciousStreamEntry(attackName);
      expect(filter.matches(entry)).toBe(false);
    });

    // Test that normal encoded names are handled correctly
    const normalEncodedEntry = createValidStreamEntry('file%20name.txt'); // Space encoded
    expect(filter.matches(normalEncodedEntry)).toBe(true);
  });

  it('should provide security telemetry', () => {
    // Test that security violations can be tracked
    const maliciousEntry = createMaliciousStreamEntry('../../../etc/passwd');
    const isBlocked = !filter.matches(maliciousEntry);

    // In a real implementation, we would track security events
    expect(isBlocked).toBe(true); // Should be blocked

    // Verify that security configuration is accessible
    filter.setExtensions(['txt', 'js']);
    const config = filter.getConfig();
    expect(config.extensions).toEqual(['txt', 'js']);
  });

  it('should handle security edge cases gracefully', () => {
    // Test with empty names
    const emptyEntry = createMaliciousStreamEntry('');
    expect(filter.matches(emptyEntry)).toBe(false);

    // Test with special filesystem names
    const specialNames = [
      '.',
      '..',
      '...',
      '....',
      '.git',
      '.svn',
      '.DS_Store',
      'Thumbs.db'
    ];

    specialNames.forEach(specialName => {
      const entry = createMaliciousStreamEntry(specialName);
      expect(filter.matches(entry)).toBe(false);
    });

    // Test that normal dot files can be allowed if configured
    filter.addIncludePattern('**/.gitignore'); // Allow .gitignore specifically
    const gitignoreEntry = createValidStreamEntry('.gitignore');
    expect(filter.matches(gitignoreEntry)).toBe(true);
  });
});
```

## Verification Commands
```bash
# Run the security tests
npm test -- src/utils/zip/security.test.ts
```

## Success Criteria
- [ ] Security tests created following London School TDD
- [ ] Tests prevent path traversal attacks
- [ ] Tests prevent absolute path attacks
- [ ] Tests prevent null byte injection attacks
- [ ] Tests prevent overly long path attacks
- [ ] Tests prevent directory traversal with special characters
- [ ] Tests prevent file extension attacks
- [ ] Tests prevent content type attacks
- [ ] Tests prevent size-based attacks
- [ ] Tests prevent directory traversal with unicode characters
- [ ] Tests prevent resource exhaustion attacks
- [ ] Tests prevent symbolic link attacks
- [ ] Tests prevent globbing attacks
- [ ] Tests verify security during integration
- [ ] Tests prevent directory listing attacks
- [ ] Tests prevent file name encoding attacks
- [ ] Tests provide security telemetry
- [ ] Tests handle security edge cases gracefully
- [ ] All tests pass
- [ ] Code coverage is high

## Dependencies Confirmed
- Jest testing framework
- All streaming component implementations
- StreamEntry type
- Node.js Readable stream API
- TypeScript compiler installed

## Next Task
task_40a_update_documentation.md