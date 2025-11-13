import { EntryFilter } from '../../../src/utils/zip/EntryFilter';
import { StreamEntry } from '../../../src/types/streaming';
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

  beforeEach(() => {
    filter = new EntryFilter();
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
      'dir\\..\\..\\..\\windows\\win.ini'
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
      '\\\\network\\share\\file.txt' // UNC path
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
      'data.json\u0000.png'
      // 'test.txt%00.png' // URL encoded null byte - this won't be caught as it's not an actual null byte
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

    // Test that entries with dangerous extensions are blocked when content type filtering is active
    const dangerousEntry = createMaliciousStreamEntry('virus.exe', 1000000); // Large file that might be blocked by size
    expect(filter.matches(dangerousEntry)).toBe(false);

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
});