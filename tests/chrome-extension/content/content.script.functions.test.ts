/**
 * Unit tests for Bolt.DIY Chrome Extension Content Script Functions
 *
 * These tests import and test the actual functions from the content script
 */

// Set environment to test to prevent content script initialization
process.env.NODE_ENV = 'test';

// Set test flag on window object as well for additional detection
if (typeof window !== 'undefined') {
  (window as any).__TEST__ = true;
}

// Set test flag on globalThis for additional detection
if (typeof globalThis !== 'undefined') {
  (globalThis as any).__TEST__ = true;
}

// Mock DOM APIs before importing the content script
const mockQuerySelector = jest.fn();
const mockQuerySelectorAll = jest.fn();

// Create a mock document object
const mockDocument = {
  title: 'My Bolt Project - Bolt.DIY',
  querySelector: mockQuerySelector,
  querySelectorAll: mockQuerySelectorAll,
};

// Create a mock window object
const mockWindow = {
  location: {
    href: 'https://bolt.diy/project/12345',
    hostname: 'bolt.diy',
    pathname: '/project/12345'
  },
  btoa: (str: string) => Buffer.from(str).toString('base64')
};

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    onMessage: {
      addListener: jest.fn()
    }
  }
};

// Set up global mocks before importing
global.document = mockDocument as any;
global.window = mockWindow as any;
global.chrome = mockChrome as any;

// Import the functions after setting up mocks
const {
  isBoltDiyProjectPage,
  isBoltDiyExportPage,
  extractProjectId,
  extractProjectName,
  extractProjectDescription,
  extractProjectMetadata,
  extractDependencies,
  extractEnvironmentConfig,
  extractFileStructure
} = require('../../../src/chrome-extension/content/content.js');

describe('Bolt.DIY Content Script Functions', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockQuerySelector.mockReturnValue(null);
    mockQuerySelectorAll.mockReturnValue([]);

    // Reset document title
    mockDocument.title = 'My Bolt Project - Bolt.DIY';

    // Reset window location
    mockWindow.location.href = 'https://bolt.diy/project/12345';
    mockWindow.location.hostname = 'bolt.diy';
    mockWindow.location.pathname = '/project/12345';
  });

  describe('isBoltDiyProjectPage', () => {
    it('should return true for valid Bolt.DIY project URLs', () => {
      mockWindow.location.href = 'https://bolt.diy/project/12345';
      expect(isBoltDiyProjectPage()).toBe(true);
    });

    it('should return true for Bolt.DIY app URLs', () => {
      mockWindow.location.href = 'https://bolt.diy/app/my-app';
      expect(isBoltDiyProjectPage()).toBe(true);
    });

    it('should return false for non-Bolt.DIY URLs', () => {
      mockWindow.location.href = 'https://example.com/project/12345';
      expect(isBoltDiyProjectPage()).toBe(false);
    });

    it('should return true when project elements are found', () => {
      mockQuerySelectorAll.mockReturnValue([{ dataset: { projectId: '123' } }]);
      expect(isBoltDiyProjectPage()).toBe(true);
    });
  });

  describe('isBoltDiyExportPage', () => {
    it('should return true for export URLs', () => {
      mockWindow.location.href = 'https://bolt.diy/project/12345/export';
      expect(isBoltDiyExportPage()).toBe(true);
    });

    it('should return true for download URLs', () => {
      mockWindow.location.href = 'https://bolt.diy/project/12345/download';
      expect(isBoltDiyExportPage()).toBe(true);
    });

    it('should return true for sync URLs', () => {
      mockWindow.location.href = 'https://bolt.diy/project/12345/sync';
      expect(isBoltDiyExportPage()).toBe(true);
    });

    it('should return false for regular project URLs', () => {
      mockWindow.location.href = 'https://bolt.diy/project/12345';
      expect(isBoltDiyExportPage()).toBe(false);
    });

    it('should return true when export elements are found', () => {
      mockQuerySelectorAll.mockReturnValue([{ dataset: { export: 'true' } }]);
      expect(isBoltDiyExportPage()).toBe(true);
    });
  });

  describe('extractProjectId', () => {
    it('should extract project ID from URL', () => {
      mockWindow.location.href = 'https://bolt.diy/project/abc123';
      expect(extractProjectId()).toBe('abc123');
    });

    it('should extract app ID from URL', () => {
      mockWindow.location.href = 'https://bolt.diy/app/my-app';
      expect(extractProjectId()).toBe('my-app');
    });

    it('should extract project ID from data attributes', () => {
      // Test with URL that doesn't match the pattern so it falls back to data attributes
      mockWindow.location.href = 'https://bolt.diy/project/';
      mockQuerySelector.mockReturnValue({ getAttribute: () => 'data-project-id-67890' });
      expect(extractProjectId()).toBe('data-project-id-67890');
    });

    it('should generate fallback ID when no other ID is found', () => {
      // Test with URL that doesn't match the pattern and no data attributes
      mockWindow.location.href = 'https://bolt.diy/project/';
      mockQuerySelector.mockReturnValue(null);
      const fallbackId = extractProjectId();
      expect(typeof fallbackId).toBe('string');
      // The fallback uses btoa which generates different length based on input
      expect(fallbackId.length).toBeGreaterThan(0);
    });
  });

  describe('extractProjectName', () => {
    it('should extract name from title with Bolt.DIY suffix', () => {
      mockDocument.title = 'My Project - Bolt.DIY';
      // The actual implementation checks if title includes 'Bolt.DIY'
      // If it does, it removes the suffix/prefix and returns the result
      expect(extractProjectName()).toBe('My Project');
    });

    it('should extract name from title with Bolt.DIY prefix', () => {
      mockDocument.title = 'Bolt.DIY - My Project';
      expect(extractProjectName()).toBe('My Project');
    });

    it('should return title as is when no Bolt.DIY suffix', () => {
      mockDocument.title = 'My Standalone Project';
      expect(extractProjectName()).toBe('My Standalone Project');
    });

    it('should extract name from h1 elements', () => {
      mockDocument.title = 'Bolt.DIY Dashboard';
      mockQuerySelectorAll.mockReturnValue([
        { textContent: 'Bolt.DIY Dashboard' },
        { textContent: 'My Actual Project Title' },
        { textContent: 'Bolt Navigation' }
      ]);
      expect(extractProjectName()).toBe('My Actual Project Title');
    });

    it('should use project ID as fallback', () => {
      mockDocument.title = 'Bolt.DIY Dashboard';
      mockQuerySelectorAll.mockReturnValue([
        { textContent: 'Bolt.DIY Dashboard' },
        { textContent: 'Bolt Navigation' }
      ]);
      const projectName = extractProjectName();
      expect(projectName).toContain('Bolt Project');
    });
  });

  describe('extractProjectDescription', () => {
    it('should extract description from meta description tag', () => {
      const description = 'This is a sample project description';
      mockQuerySelector.mockReturnValue({ getAttribute: () => description });
      expect(extractProjectDescription()).toBe(description);
    });

    it('should extract description from paragraph elements', () => {
      const description = 'This paragraph has the right length to be considered a project description. It contains enough information to be meaningful but is not too long.';
      mockQuerySelector.mockReturnValue(null);
      mockQuerySelectorAll.mockReturnValue([
        { textContent: 'Too short' },
        { textContent: description },
        { textContent: 'This paragraph is way too long to be a good project description. '.repeat(20) }
      ]);
      expect(extractProjectDescription()).toBe(description);
    });

    it('should use fallback description when no suitable description is found', () => {
      mockQuerySelector.mockReturnValue(null);
      mockQuerySelectorAll.mockReturnValue([]);
      const description = extractProjectDescription();
      expect(description).toContain('Bolt.DIY project synced on');
    });
  });

  describe('extractProjectMetadata', () => {
    it('should extract version information', () => {
      mockQuerySelectorAll.mockImplementation((selector) => {
        if (selector.includes('version')) {
          return [{ textContent: '2.1.0' }];
        }
        return [];
      });

      const metadata = extractProjectMetadata();
      expect(metadata.version).toBe('2.1.0');
    });

    it('should extract framework information', () => {
      mockQuerySelector.mockImplementation((selector) => {
        if (selector === '[class*="react"]') {
          return {};
        }
        return null;
      });

      const metadata = extractProjectMetadata();
      expect(metadata.framework).toBe('React');
    });

    it('should return default metadata when no information is found', () => {
      mockQuerySelector.mockReturnValue(null);
      mockQuerySelectorAll.mockReturnValue([]);

      const metadata = extractProjectMetadata();
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.createdAt).toBeDefined();
      expect(metadata.updatedAt).toBeDefined();
    });
  });

  describe('extractDependencies', () => {
    it('should parse JSON dependency data', () => {
      const depData = {
        dependencies: { react: '^18.0.0' },
        devDependencies: { '@types/react': '^18.0.0' }
      };

      mockQuerySelectorAll.mockReturnValue([{
        textContent: JSON.stringify(depData)
      }]);

      const dependencies = extractDependencies();
      expect(dependencies.production).toHaveProperty('react');
      expect(dependencies.development).toHaveProperty('@types/react');
    });

    it('should detect common libraries from src attributes', () => {
      mockQuerySelectorAll.mockReturnValue([]);
      mockQuerySelector.mockImplementation((selector) => {
        if (selector.includes('react')) {
          return { src: '/node_modules/react/index.js' };
        }
        return null;
      });

      const dependencies = extractDependencies();
      expect(dependencies.production).toHaveProperty('react');
    });

    it('should return empty dependencies when no information is found', () => {
      mockQuerySelector.mockReturnValue(null);
      mockQuerySelectorAll.mockReturnValue([]);

      const dependencies = extractDependencies();
      expect(Object.keys(dependencies.production)).toHaveLength(0);
      expect(Object.keys(dependencies.development)).toHaveLength(0);
    });
  });

  describe('extractEnvironmentConfig', () => {
    it('should parse JSON environment data', () => {
      const envData = {
        development: { API_URL: 'http://localhost:3000' },
        production: { API_URL: 'https://api.example.com' }
      };

      mockQuerySelectorAll.mockReturnValue([{
        textContent: JSON.stringify(envData)
      }]);

      const config = extractEnvironmentConfig();
      expect(config.environments.development).toHaveProperty('API_URL');
      expect(config.environments.production).toHaveProperty('API_URL');
    });

    it('should extract environment variables from data attributes', () => {
      mockQuerySelectorAll.mockImplementation((selector) => {
        if (selector.includes('env-var')) {
          return [{
            getAttribute: (attr: string) => {
              if (attr === 'data-env-var') return 'NODE_ENV';
              if (attr === 'data-env-value') return 'development';
              return null;
            },
            textContent: 'development'
          }];
        }
        return [];
      });

      const config = extractEnvironmentConfig();
      expect(config.variables).toHaveProperty('NODE_ENV');
    });

    it('should return default config when no information is found', () => {
      mockQuerySelector.mockReturnValue(null);
      mockQuerySelectorAll.mockReturnValue([]);

      const config = extractEnvironmentConfig();
      expect(config.environments).toHaveProperty('development');
      expect(config.environments).toHaveProperty('staging');
      expect(config.environments).toHaveProperty('production');
      expect(config.variables).toBeDefined();
    });
  });

  describe('extractFileStructure', () => {
    it('should return consistent file structure', () => {
      const fileStructure = extractFileStructure();

      expect(Array.isArray(fileStructure)).toBe(true);
      expect(fileStructure.length).toBeGreaterThan(0);

      const fileNames = fileStructure.map(f => f.name);
      expect(fileNames).toContain('index.html');
      expect(fileNames).toContain('package.json');
      expect(fileNames).toContain('README.md');

      const indexFile = fileStructure.find(f => f.name === 'index.html');
      expect(indexFile).toHaveProperty('type', 'file');
      expect(indexFile).toHaveProperty('size');
    });
  });

  describe('Error Handling', () => {
    it('should handle DOM query errors gracefully', () => {
      mockQuerySelector.mockImplementation(() => {
        throw new Error('DOM error');
      });

      expect(() => extractProjectName()).not.toThrow();
      expect(() => extractProjectMetadata()).not.toThrow();
      expect(() => extractDependencies()).not.toThrow();
    });

    it('should handle malformed URLs gracefully', () => {
      mockWindow.location.href = 'invalid-url';
      expect(() => isBoltDiyProjectPage()).not.toThrow();
      expect(() => isBoltDiyExportPage()).not.toThrow();
    });
  });
});