import { EntryFilter, EntryFilterConfig } from '../../../src/utils/zip/EntryFilter';
import { StreamEntry } from '../../../src/types/streaming';

// Mock implementations for testing
const createMockStreamEntry = (name: string, size: number, isDirectory: boolean = false): StreamEntry => {
  return {
    name,
    size,
    isDirectory,
    stream: {} as any // Mock stream
  };
};

describe('EntryFilter', () => {
  let filter: EntryFilter;

  beforeEach(() => {
    filter = new EntryFilter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create an entry filter instance', () => {
    expect(filter).toBeInstanceOf(EntryFilter);
  });

  it('should match entries with no criteria', () => {
    const entry = createMockStreamEntry('test.txt', 100);
    expect(filter.matches(entry)).toBe(true);
  });

  it('should handle directory entries with no criteria', () => {
    const entry = createMockStreamEntry('test/', 0, true);
    expect(filter.matches(entry)).toBe(true);
  });

  it('should add include patterns', () => {
    filter.addIncludePattern('**/*.js');
    const entry = createMockStreamEntry('src/index.js', 100);
    expect(filter.matches(entry)).toBe(true);
  });

  it('should add exclude patterns', () => {
    filter.addExcludePattern('**/*.tmp');
    const entry = createMockStreamEntry('temp/file.tmp', 100);
    expect(filter.matches(entry)).toBe(false);
  });

  it('should set size limits', () => {
    filter.setSizeLimits(50, 150);

    const smallEntry = createMockStreamEntry('small.txt', 25);
    expect(filter.matches(smallEntry)).toBe(false);

    const mediumEntry = createMockStreamEntry('medium.txt', 100);
    expect(filter.matches(mediumEntry)).toBe(true);

    const largeEntry = createMockStreamEntry('large.txt', 200);
    expect(filter.matches(largeEntry)).toBe(false);
  });

  it('should set content types', () => {
    filter.setContentTypes(['text/plain']);

    const textEntry = createMockStreamEntry('document.txt', 100);
    expect(filter.matches(textEntry)).toBe(true);

    const imageEntry = createMockStreamEntry('image.jpg', 100);
    expect(filter.matches(imageEntry)).toBe(false);
  });

  it('should set file extensions', () => {
    filter.setExtensions(['js', 'ts']);

    const jsEntry = createMockStreamEntry('index.js', 100);
    expect(filter.matches(jsEntry)).toBe(true);

    const tsEntry = createMockStreamEntry('module.ts', 100);
    expect(filter.matches(tsEntry)).toBe(true);

    const pyEntry = createMockStreamEntry('script.py', 100);
    expect(filter.matches(pyEntry)).toBe(false);
  });

  it('should set custom filter function', () => {
    const customFilter = jest.fn().mockReturnValue(true);
    filter.setCustomFilter(customFilter);

    const entry = createMockStreamEntry('test.txt', 100);
    const result = filter.matches(entry);

    expect(customFilter).toHaveBeenCalledWith(entry);
    expect(result).toBe(true);
  });

  it('should handle include patterns', () => {
    const config: EntryFilterConfig = {
      include: ['src/**/*.js', 'lib/**/*.ts']
    };
    filter = new EntryFilter(config);

    const jsEntry = createMockStreamEntry('src/index.js', 100);
    expect(filter.matches(jsEntry)).toBe(true);

    const tsEntry = createMockStreamEntry('lib/module.ts', 100);
    expect(filter.matches(tsEntry)).toBe(true);

    const pyEntry = createMockStreamEntry('scripts/main.py', 100);
    expect(filter.matches(pyEntry)).toBe(false);
  });

  it('should handle exclude patterns', () => {
    const config: EntryFilterConfig = {
      exclude: ['**/*.log', '**/temp/**']
    };
    filter = new EntryFilter(config);

    const logEntry = createMockStreamEntry('app.log', 100);
    expect(filter.matches(logEntry)).toBe(false);

    const tempEntry = createMockStreamEntry('temp/cache.dat', 100);
    expect(filter.matches(tempEntry)).toBe(false);

    const normalEntry = createMockStreamEntry('src/index.js', 100);
    expect(filter.matches(normalEntry)).toBe(true);
  });

  it('should handle combined include and exclude patterns', () => {
    const config: EntryFilterConfig = {
      include: ['src/**/*'],
      exclude: ['**/*.test.js']
    };
    filter = new EntryFilter(config);

    const srcEntry = createMockStreamEntry('src/index.js', 100);
    expect(filter.matches(srcEntry)).toBe(true);

    const testEntry = createMockStreamEntry('src/module.test.js', 100);
    expect(filter.matches(testEntry)).toBe(false);

    const outsideEntry = createMockStreamEntry('lib/helper.js', 100);
    expect(filter.matches(outsideEntry)).toBe(false);
  });

  it('should get filter configuration', () => {
    filter.addIncludePattern('**/*.js');
    filter.addExcludePattern('**/*.test.js');
    filter.setSizeLimits(100, 1000);
    filter.setContentTypes(['text/javascript']);
    filter.setExtensions(['js']);

    const config = filter.getConfig();
    expect(config.include).toContain('**/*.js');
    expect(config.exclude).toContain('**/*.test.js');
    expect(config.minSize).toBe(100);
    expect(config.maxSize).toBe(1000);
    expect(config.contentTypes).toContain('text/javascript');
    expect(config.extensions).toContain('js');
  });

  it('should filter entries array', () => {
    filter.addIncludePattern('**/*.js');

    const entries = [
      createMockStreamEntry('index.js', 100),
      createMockStreamEntry('README.md', 100),
      createMockStreamEntry('app.js', 100)
    ];

    const filtered = filter.filterEntries(entries);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].name).toBe('index.js');
    expect(filtered[1].name).toBe('app.js');
  });

  it('should create filter transform stream', () => {
    const transform = filter.createFilterTransform();
    expect(transform).toBeDefined();
  });

  it('should check if filter has criteria', () => {
    expect(filter.hasCriteria()).toBe(false);

    filter.addIncludePattern('**/*.js');
    expect(filter.hasCriteria()).toBe(true);
  });

  it('should handle files with no extension', () => {
    filter.setExtensions(['txt']);

    const noExtEntry = createMockStreamEntry('README', 100);
    expect(filter.matches(noExtEntry)).toBe(false);

    const txtEntry = createMockStreamEntry('README.txt', 100);
    expect(filter.matches(txtEntry)).toBe(true);
  });

  it('should handle custom filter returning false', () => {
    const customFilter = jest.fn().mockReturnValue(false);
    filter.setCustomFilter(customFilter);

    const entry = createMockStreamEntry('test.txt', 100);
    const result = filter.matches(entry);

    expect(customFilter).toHaveBeenCalledWith(entry);
    expect(result).toBe(false);
  });
});