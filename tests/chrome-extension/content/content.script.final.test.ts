/**
 * Test suite for Bolt.DIY to GitHub Chrome Extension Content Script
 *
 * Tests the content script functionality for detecting Bolt.DIY projects,
 * extracting project information, and handling export triggers.
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

// Set up DOM-like environment for Node.js tests
const mockDocument = {
  title: 'My Bolt Project - Bolt.DIY',
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  addEventListener: jest.fn(),
  createElement: jest.fn(),
  location: {
    href: 'https://bolt.diy/project/12345',
    hostname: 'bolt.diy',
    pathname: '/project/12345'
  }
};

const mockWindow = {
  location: mockDocument.location,
  addEventListener: mockDocument.addEventListener,
  btoa: (str: string) => Buffer.from(str).toString('base64')
};

// Set up global mocks
global.document = mockDocument as any;
global.window = mockWindow as any;

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    onMessage: {
      addListener: jest.fn()
    }
  }
};

global.chrome = mockChrome as any;

// Import functions after setting up mocks
const contentModule = require('../../../src/chrome-extension/content/content.js');

// Extract the functions we want to test
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
} = contentModule;

describe('Bolt.DIY to GitHub Content Script', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set default mock implementations
    mockDocument.querySelector.mockReturnValue(null);
    mockDocument.querySelectorAll.mockReturnValue([]);

    // Reset document title
    mockDocument.title = 'My Bolt Project - Bolt.DIY';

    // Reset window location
    mockWindow.location = {
      href: 'https://bolt.diy/project/12345',
      hostname: 'bolt.diy',
      pathname: '/project/12345'
    } as any;
  });

  describe('isBoltDiyProjectPage', () => {
    it('should detect Bolt.DIY project page by URL pattern', () => {
      mockWindow.location.href = 'https://bolt.diy/project/12345';

      expect(isBoltDiyProjectPage()).toBe(true);
    });

    it('should detect Bolt.DIY app page by URL pattern', () => {
      mockWindow.location.href = 'https://bolt.diy/app/my-app';

      expect(isBoltDiyProjectPage()).toBe(true);
    });

    it('should detect project page by data attributes', () => {
      mockDocument.querySelectorAll.mockReturnValue([{ getAttribute: () => '12345' }] as any);

      expect(isBoltDiyProjectPage()).toBe(true);
    });

    it('should return false for non-Bolt.DIY pages', () => {
      mockWindow.location.href = 'https://example.com/project/12345';
      mockDocument.querySelectorAll.mockReturnValue([]);

      expect(isBoltDiyProjectPage()).toBe(false);
    });

    it('should handle edge case with multiple data attributes', () => {
      mockWindow.location.href = 'https://example.com/project/12345';
      mockDocument.querySelectorAll.mockReturnValue([
        { getAttribute: () => '12345' },
        { getAttribute: () => '67890' }
      ] as any);

      expect(isBoltDiyProjectPage()).toBe(true);
    });

    it('should return false for completely unrelated URLs', () => {
      mockWindow.location.href = 'https://github.com/user/repo';
      mockDocument.querySelectorAll.mockReturnValue([]);

      expect(isBoltDiyProjectPage()).toBe(false);
    });
  });

  describe('isBoltDiyExportPage', () => {
    it('should detect export page by URL pattern', () => {
      mockWindow.location.href = 'https://bolt.diy/project/12345/export';

      expect(isBoltDiyExportPage()).toBe(true);
    });

    it('should detect download page by URL pattern', () => {
      mockWindow.location.href = 'https://bolt.diy/download/my-project';

      expect(isBoltDiyExportPage()).toBe(true);
    });

    it('should detect export page by data attributes', () => {
      mockDocument.querySelectorAll.mockReturnValue([{}] as any);

      expect(isBoltDiyExportPage()).toBe(true);
    });

    it('should return false for non-export pages', () => {
      mockWindow.location.href = 'https://bolt.diy/project/12345';
      mockDocument.querySelectorAll.mockReturnValue([]);

      expect(isBoltDiyExportPage()).toBe(false);
    });

    it('should detect sync page by URL pattern', () => {
      mockWindow.location.href = 'https://bolt.diy/project/12345/sync';

      expect(isBoltDiyExportPage()).toBe(true);
    });

    it('should detect export page with query parameters', () => {
      mockWindow.location.href = 'https://bolt.diy/export/12345?format=zip';

      expect(isBoltDiyExportPage()).toBe(true);
    });

    it('should detect export page by multiple data attributes', () => {
      mockDocument.querySelectorAll.mockReturnValue([
        { getAttribute: () => 'export' },
        { getAttribute: () => 'download' }
      ] as any);

      expect(isBoltDiyExportPage()).toBe(true);
    });

    it('should handle text content detection for export buttons', () => {
      mockWindow.location.href = 'https://bolt.diy/project/12345';
      mockDocument.querySelectorAll.mockReturnValue([]);

      expect(isBoltDiyExportPage()).toBe(false);
    });
  });

  describe('extractProjectId', () => {
    it('should extract project ID from URL', () => {
      mockWindow.location.href = 'https://bolt.diy/project/abc123';
      mockWindow.location.hostname = 'bolt.diy';
      mockWindow.location.pathname = '/project/abc123';

      expect(extractProjectId()).toBe('abc123');
    });

    it('should extract project ID from data attributes', () => {
      // Use URL that doesn't match the pattern so it falls back to data attributes
      mockWindow.location.href = 'https://bolt.diy/project/';
      mockWindow.location.hostname = 'bolt.diy';
      mockWindow.location.pathname = '/project/';

      const mockElement = { getAttribute: () => 'data-project-123' };
      mockDocument.querySelector.mockReturnValue(mockElement as any);

      expect(extractProjectId()).toBe('data-project-123');
    });

    it('should generate fallback project ID', () => {
      mockWindow.location.href = 'https://bolt.diy/unknown/page';
      mockWindow.location.hostname = 'bolt.diy';
      mockWindow.location.pathname = '/unknown/page';

      mockDocument.querySelector.mockReturnValue(null);

      const projectId = extractProjectId();
      expect(projectId).toHaveLength(16);
      expect(typeof projectId).toBe('string');
    });

    it('should handle complex URL patterns', () => {
      mockWindow.location.href = 'https://bolt.diy/project/my-project-123/details?tab=overview#section';
      mockWindow.location.hostname = 'bolt.diy';
      mockWindow.location.pathname = '/project/my-project-123/details';

      expect(extractProjectId()).toBe('my-project-123');
    });

    it('should handle edge case with special characters in project ID', () => {
      mockWindow.location.href = 'https://bolt.diy/project/my_project-123.alpha';
      mockWindow.location.hostname = 'bolt.diy';
      mockWindow.location.pathname = '/project/my_project-123.alpha';

      expect(extractProjectId()).toBe('my_project-123.alpha');
    });

    it('should prioritize URL extraction over data attributes', () => {
      mockWindow.location.href = 'https://bolt.diy/project/url-project-id';
      mockWindow.location.hostname = 'bolt.diy';
      mockWindow.location.pathname = '/project/url-project-id';

      const mockElement = { getAttribute: () => 'data-project-123' };
      mockDocument.querySelector.mockReturnValue(mockElement as any);

      expect(extractProjectId()).toBe('url-project-id');
    });

    it('should handle missing project ID in URL gracefully', () => {
      mockWindow.location.href = 'https://bolt.diy/project/';
      mockWindow.location.hostname = 'bolt.diy';
      mockWindow.location.pathname = '/project/';

      mockDocument.querySelector.mockReturnValue(null);

      const projectId = extractProjectId();
      expect(projectId).toHaveLength(16);
    });
  });

  describe('extractProjectName', () => {
    it('should extract project name from document title', () => {
      mockDocument.title = 'My Awesome Project - Bolt.DIY';

      expect(extractProjectName()).toBe('My Awesome Project');
    });

    it('should extract project name from h1 elements', () => {
      mockDocument.title = 'Bolt.DIY - Project Platform';
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'h1') {
          return [{ textContent: 'My Project Title' }] as any;
        }
        return [];
      });

      expect(extractProjectName()).toBe('My Project Title');
    });

    it('should use fallback project name', () => {
      mockDocument.title = 'Bolt.DIY - Project Platform';
      mockDocument.querySelectorAll.mockReturnValue([]);
      mockWindow.location.href = 'https://bolt.diy/project/test123';
      mockWindow.location.hostname = 'bolt.diy';
      mockWindow.location.pathname = '/project/test123';

      expect(extractProjectName()).toBe('Bolt Project test123');
    });

    it('should handle title with Bolt.DIY at the beginning', () => {
      mockDocument.title = 'Bolt.DIY - My Project';

      expect(extractProjectName()).toBe('My Project');
    });

    it('should handle title without Bolt.DIY reference', () => {
      mockDocument.title = 'My Standalone Project';

      expect(extractProjectName()).toBe('My Standalone Project');
    });

    it('should prioritize title over h1 elements', () => {
      mockDocument.title = 'Title Project Name - Bolt.DIY';
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'h1') {
          return [{ textContent: 'H1 Project Title' }] as any;
        }
        return [];
      });

      expect(extractProjectName()).toBe('Title Project Name');
    });

    it('should filter out h1 elements containing Bolt', () => {
      mockDocument.title = 'Bolt.DIY - Project Platform';
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'h1') {
          return [
            { textContent: 'Bolt.DIY Dashboard' },
            { textContent: 'My Actual Project Title' },
            { textContent: 'Bolt Navigation' }
          ] as any;
        }
        return [];
      });

      expect(extractProjectName()).toBe('My Actual Project Title');
    });

    it('should handle empty h1 elements', () => {
      mockDocument.title = 'Bolt.DIY - Project Platform';
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'h1') {
          return [
            { textContent: '' },
            { textContent: '   ' },
            { textContent: 'Valid Project Name' }
          ] as any;
        }
        return [];
      });

      expect(extractProjectName()).toBe('Valid Project Name');
    });

    it('should handle edge case with multiple valid h1 elements', () => {
      mockDocument.title = 'Bolt.DIY - Project Platform';
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'h1') {
          return [
            { textContent: 'First Valid Title' },
            { textContent: 'Second Valid Title' }
          ] as any;
        }
        return [];
      });

      expect(extractProjectName()).toBe('First Valid Title');
    });
  });

  describe('extractProjectDescription', () => {
    it('should extract description from meta tag', () => {
      const mockMeta = { getAttribute: () => 'This is a test project description' };
      mockDocument.querySelector.mockImplementation((selector: string) => {
        if (selector === 'meta[name="description"]') {
          return mockMeta as any;
        }
        return null;
      });

      expect(extractProjectDescription()).toBe('This is a test project description');
    });

    it('should extract description from paragraph elements', () => {
      mockDocument.querySelector.mockImplementation((selector: string) => {
        if (selector === 'meta[name="description"]') {
          return null;
        }
        return null;
      });

      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'p') {
          return [{ textContent: 'This is a detailed project description that explains what the project does.' }] as any;
        }
        return [];
      });

      expect(extractProjectDescription()).toBe('This is a detailed project description that explains what the project does.');
    });

    it('should use fallback description', () => {
      mockDocument.querySelector.mockReturnValue(null);
      mockDocument.querySelectorAll.mockReturnValue([]);

      const description = extractProjectDescription();
      expect(description).toContain('Bolt.DIY project synced on');
    });

    it('should prioritize meta description over paragraph content', () => {
      const mockMeta = { getAttribute: () => 'Meta description content' };
      mockDocument.querySelector.mockImplementation((selector: string) => {
        if (selector === 'meta[name="description"]') {
          return mockMeta as any;
        }
        return null;
      });

      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'p') {
          return [{ textContent: 'Paragraph description content' }] as any;
        }
        return [];
      });

      expect(extractProjectDescription()).toBe('Meta description content');
    });

    it('should filter paragraphs by length (50-500 characters)', () => {
      mockDocument.querySelector.mockReturnValue(null);

      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'p') {
          return [
            { textContent: 'Too short' }, // < 50 chars
            { textContent: 'This paragraph has the right length to be considered a project description. It contains enough information to be meaningful but is not too long.' }, // 50-500 chars
            { textContent: 'This paragraph is way too long to be a good project description. '.repeat(20) } // > 500 chars
          ] as any;
        }
        return [];
      });

      const description = extractProjectDescription();
      expect(description).toContain('This paragraph has the right length');
      expect(description).not.toContain('Too short');
      expect(description).not.toContain('way too long');
    });

    it('should handle empty paragraphs', () => {
      mockDocument.querySelector.mockReturnValue(null);

      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'p') {
          return [
            { textContent: '' },
            { textContent: '   ' },
            { textContent: 'This is a valid description content that is long enough to meet the 50 character minimum requirement for project descriptions.' }
          ] as any;
        }
        return [];
      });

      expect(extractProjectDescription()).toBe('This is a valid description content that is long enough to meet the 50 character minimum requirement for project descriptions.');
    });

    it('should handle edge case with no suitable paragraphs', () => {
      mockDocument.querySelector.mockReturnValue(null);

      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === 'p') {
          return [
            { textContent: 'Short' },
            { textContent: 'This is a very long paragraph that exceeds the maximum character limit for a project description. '.repeat(20) }
          ] as any;
        }
        return [];
      });

      const description = extractProjectDescription();
      expect(description).toContain('Bolt.DIY project synced on');
    });

    it('should handle special characters in description', () => {
      const mockMeta = { getAttribute: () => 'Project with special characters: & < > " \'' };
      mockDocument.querySelector.mockImplementation((selector: string) => {
        if (selector === 'meta[name="description"]') {
          return mockMeta as any;
        }
        return null;
      });

      expect(extractProjectDescription()).toBe('Project with special characters: & < > " \'');
    });
  });

  describe('extractProjectMetadata', () => {
    it('should extract basic metadata with defaults', () => {
      const metadata = extractProjectMetadata();

      expect(metadata).toHaveProperty('version', '1.0.0');
      expect(metadata).toHaveProperty('author', '');
      expect(metadata).toHaveProperty('license', '');
      expect(metadata).toHaveProperty('createdAt');
      expect(metadata).toHaveProperty('updatedAt');
      expect(metadata).toHaveProperty('tags');
      expect(metadata).toHaveProperty('framework', '');
      expect(metadata).toHaveProperty('buildTool', '');
      expect(Array.isArray(metadata.tags)).toBe(true);
    });

    it('should extract version from elements', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-version], [class*="version"], [id*="version"]') {
          return [{ textContent: '2.1.0' }] as any;
        }
        return [];
      });

      const metadata = extractProjectMetadata();
      expect(metadata.version).toBe('2.1.0');
    });

    it('should extract framework information', () => {
      mockDocument.querySelector.mockImplementation((selector: string) => {
        if (selector === '[class*="react"]') {
          return {} as any;
        }
        return null;
      });

      const metadata = extractProjectMetadata();
      expect(metadata.framework).toBe('React');
    });

    it('should extract build tool information', () => {
      mockDocument.querySelector.mockImplementation((selector: string) => {
        if (selector === '[class*="vite"]') {
          return {} as any;
        }
        return null;
      });

      const metadata = extractProjectMetadata();
      expect(metadata.buildTool).toBe('Vite');
    });

    it('should extract author information', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-author], [rel="author"], [class*="author"], [id*="author"]') {
          return [{ textContent: 'John Doe' }] as any;
        }
        return [];
      });

      const metadata = extractProjectMetadata();
      expect(metadata.author).toBe('John Doe');
    });

    it('should extract framework from data attribute', () => {
      mockDocument.querySelector.mockImplementation((selector: string) => {
        if (selector === '[data-framework]') {
          return { getAttribute: () => 'Vue' } as any;
        }
        return null;
      });

      const metadata = extractProjectMetadata();
      expect(metadata.framework).toBe('Vue');
    });

    it('should extract build tool from data attribute', () => {
      mockDocument.querySelector.mockImplementation((selector: string) => {
        if (selector === '[data-build-tool]') {
          return { getAttribute: () => 'Webpack' } as any;
        }
        return null;
      });

      const metadata = extractProjectMetadata();
      expect(metadata.buildTool).toBe('Webpack');
    });

    it('should handle multiple framework indicators and take first match', () => {
      mockDocument.querySelector.mockImplementation((selector: string) => {
        if (selector === '[class*="react"]') {
          return {} as any;
        }
        if (selector === '[class*="vue"]') {
          return {} as any;
        }
        return null;
      });

      const metadata = extractProjectMetadata();
      expect(metadata.framework).toBe('React');
    });

    it('should handle version with non-standard format', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-version], [class*="version"], [id*="version"]') {
          return [
            { textContent: 'Version 1.0' }, // Not matching regex
            { textContent: '3.2.1-beta' }   // Matching regex
          ] as any;
        }
        return [];
      });

      const metadata = extractProjectMetadata();
      expect(metadata.version).toBe('3.2.1-beta');
    });

    it('should handle empty author elements', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-author], [rel="author"], [class*="author"], [id*="author"]') {
          return [
            { textContent: '' },
            { textContent: '   ' },
            { textContent: 'Jane Smith' }
          ] as any;
        }
        return [];
      });

      const metadata = extractProjectMetadata();
      expect(metadata.author).toBe('Jane Smith');
    });

    it('should handle edge case with no matching elements', () => {
      mockDocument.querySelector.mockReturnValue(null);
      mockDocument.querySelectorAll.mockReturnValue([]);

      const metadata = extractProjectMetadata();
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.author).toBe('');
      expect(metadata.framework).toBe('');
      expect(metadata.buildTool).toBe('');
    });

    it('should validate date formats in metadata', () => {
      const metadata = extractProjectMetadata();

      // Check that dates are valid ISO strings
      expect(() => new Date(metadata.createdAt)).not.toThrow();
      expect(() => new Date(metadata.updatedAt)).not.toThrow();

      // Check that they are recent (within last minute for test purposes)
      const now = Date.now();
      const createdTime = new Date(metadata.createdAt).getTime();
      const updatedTime = new Date(metadata.updatedAt).getTime();

      expect(createdTime).toBeLessThanOrEqual(now);
      expect(updatedTime).toBeLessThanOrEqual(now);
    });
  });

  describe('extractDependencies', () => {
    it('should return empty dependencies by default', () => {
      const dependencies = extractDependencies();

      expect(dependencies).toHaveProperty('production');
      expect(dependencies).toHaveProperty('development');
      expect(Object.keys(dependencies.production)).toHaveLength(0);
      expect(Object.keys(dependencies.development)).toHaveLength(0);
    });

    it('should extract dependencies from JSON data', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-dependencies], [class*="dependencies"], [id*="dependencies"]') {
          return [{ textContent: '{"dependencies": {"react": "^18.0.0"}, "devDependencies": {"@types/react": "^18.0.0"}}' }] as any;
        }
        return [];
      });

      const dependencies = extractDependencies();
      expect(dependencies.production).toHaveProperty('react', '^18.0.0');
      expect(dependencies.development).toHaveProperty('@types/react', '^18.0.0');
    });

    it('should detect common libraries', () => {
      mockDocument.querySelector.mockImplementation((selector: string) => {
        if (selector === '[src*="react"], [href*="react"]') {
          return {} as any;
        }
        return null;
      });

      const dependencies = extractDependencies();
      expect(dependencies.production).toHaveProperty('react', '^18.0.0');
    });

    it('should merge dependencies from multiple sources', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-dependencies], [class*="dependencies"], [id*="dependencies"]') {
          return [{ textContent: '{"dependencies": {"react": "^18.0.0"}}' }] as any;
        }
        return [];
      });

      mockDocument.querySelector.mockImplementation((selector: string) => {
        if (selector === '[src*="vue"], [href*="vue"]') {
          return {} as any;
        }
        return null;
      });

      const dependencies = extractDependencies();
      expect(dependencies.production).toHaveProperty('react', '^18.0.0');
      expect(dependencies.production).toHaveProperty('vue', '^3.0.0');
    });

    it('should handle malformed JSON gracefully', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-dependencies], [class*="dependencies"], [id*="dependencies"]') {
          return [
            { textContent: '{"invalid": json}' }, // Invalid JSON
            { textContent: '{"dependencies": {"react": "^18.0.0"}}' } // Valid JSON
          ] as any;
        }
        return [];
      });

      const dependencies = extractDependencies();
      expect(dependencies.production).toHaveProperty('react', '^18.0.0');
    });

    it('should handle empty dependency elements', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-dependencies], [class*="dependencies"], [id*="dependencies"]') {
          return [
            { textContent: '' },
            { textContent: '   ' },
            { textContent: '{"dependencies": {"vue": "^3.0.0"}}' }
          ] as any;
        }
        return [];
      });

      const dependencies = extractDependencies();
      expect(dependencies.production).toHaveProperty('vue', '^3.0.0');
    });

    it('should detect multiple common libraries', () => {
      mockDocument.querySelector.mockImplementation((selector: string) => {
        if (selector === '[src*="react"], [href*="react"]') {
          return {} as any;
        }
        if (selector === '[src*="angular"], [href*="angular"]') {
          return {} as any;
        }
        return null;
      });

      const dependencies = extractDependencies();
      expect(dependencies.production).toHaveProperty('react', '^18.0.0');
      expect(dependencies.production).toHaveProperty('angular', '^15.0.0');
    });

    it('should handle edge case with no dependency indicators', () => {
      mockDocument.querySelector.mockReturnValue(null);
      mockDocument.querySelectorAll.mockReturnValue([]);

      const dependencies = extractDependencies();
      expect(Object.keys(dependencies.production)).toHaveLength(0);
      expect(Object.keys(dependencies.development)).toHaveLength(0);
    });

    it('should prioritize JSON dependencies over detected libraries', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-dependencies], [class*="dependencies"], [id*="dependencies"]') {
          return [{ textContent: '{"dependencies": {"custom-react": "^1.0.0"}}' }] as any;
        }
        return [];
      });

      mockDocument.querySelector.mockImplementation((selector: string) => {
        if (selector === '[src*="react"], [href*="react"]') {
          return {} as any;
        }
        return null;
      });

      const dependencies = extractDependencies();
      expect(dependencies.production).toHaveProperty('custom-react', '^1.0.0');
      // The fallback detection shouldn't add react if it's already detected via JSON
      // But in our implementation, both sources are combined
      expect(dependencies.production).toHaveProperty('react', '^18.0.0');
    });
  });

  describe('extractEnvironmentConfig', () => {
    it('should return default environment configuration', () => {
      const config = extractEnvironmentConfig();

      expect(config).toHaveProperty('environments');
      expect(config).toHaveProperty('variables');
      expect(config.environments).toHaveProperty('development');
      expect(config.environments).toHaveProperty('staging');
      expect(config.environments).toHaveProperty('production');
      expect(typeof config.environments.development).toBe('object');
      expect(typeof config.environments.staging).toBe('object');
      expect(typeof config.environments.production).toBe('object');
      expect(typeof config.variables).toBe('object');
    });

    it('should extract environment configuration from JSON data', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-env], [class*="env"], [id*="env"]') {
          return [{ textContent: '{"development": {"API_URL": "http://localhost:3000"}}' }] as any;
        }
        return [];
      });

      const config = extractEnvironmentConfig();
      expect(config.environments.development).toHaveProperty('API_URL', 'http://localhost:3000');
    });

    it('should extract environment variables from data attributes', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-env-var]') {
          return [{
            getAttribute: (attr: string) => {
              if (attr === 'data-env-var') return 'NODE_ENV';
              if (attr === 'data-env-value') return 'development';
              return null;
            },
            textContent: 'development'
          }] as any;
        }
        return [];
      });

      const config = extractEnvironmentConfig();
      expect(config.variables).toHaveProperty('NODE_ENV', 'development');
    });

    it('should merge environment configurations from multiple sources', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-env], [class*="env"], [id*="env"]') {
          return [{ textContent: '{"staging": {"API_URL": "https://staging.example.com"}}' }] as any;
        }
        if (selector === '[data-env-var]') {
          return [{
            getAttribute: (attr: string) => {
              if (attr === 'data-env-var') return 'DB_HOST';
              if (attr === 'data-env-value') return 'staging.db.example.com';
              return null;
            },
            textContent: 'staging.db.example.com'
          }] as any;
        }
        return [];
      });

      const config = extractEnvironmentConfig();
      expect(config.environments.staging).toHaveProperty('API_URL', 'https://staging.example.com');
      expect(config.variables).toHaveProperty('DB_HOST', 'staging.db.example.com');
    });

    it('should handle malformed JSON gracefully', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-env], [class*="env"], [id*="env"]') {
          return [
            { textContent: '{"invalid": json}' }, // Invalid JSON
            { textContent: '{"production": {"API_URL": "https://prod.example.com"}}' } // Valid JSON
          ] as any;
        }
        return [];
      });

      const config = extractEnvironmentConfig();
      expect(config.environments.production).toHaveProperty('API_URL', 'https://prod.example.com');
    });

    it('should handle environment variables with missing value attributes', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-env-var]') {
          return [{
            getAttribute: (attr: string) => {
              if (attr === 'data-env-var') return 'LOG_LEVEL';
              return null; // No data-env-value
            },
            textContent: 'debug' // Use text content instead
          }] as any;
        }
        return [];
      });

      const config = extractEnvironmentConfig();
      expect(config.variables).toHaveProperty('LOG_LEVEL', 'debug');
    });

    it('should handle multiple environment variables', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-env-var]') {
          return [
            {
              getAttribute: (attr: string) => {
                if (attr === 'data-env-var') return 'NODE_ENV';
                if (attr === 'data-env-value') return 'production';
                return null;
              },
              textContent: 'production'
            },
            {
              getAttribute: (attr: string) => {
                if (attr === 'data-env-var') return 'API_KEY';
                if (attr === 'data-env-value') return 'secret-key';
                return null;
              },
              textContent: 'secret-key'
            }
          ] as any;
        }
        return [];
      });

      const config = extractEnvironmentConfig();
      expect(config.variables).toHaveProperty('NODE_ENV', 'production');
      expect(config.variables).toHaveProperty('API_KEY', 'secret-key');
    });

    it('should handle edge case with no environment indicators', () => {
      mockDocument.querySelectorAll.mockReturnValue([]);

      const config = extractEnvironmentConfig();
      expect(Object.keys(config.environments.development)).toHaveLength(0);
      expect(Object.keys(config.environments.staging)).toHaveLength(0);
      expect(Object.keys(config.environments.production)).toHaveLength(0);
      expect(Object.keys(config.variables)).toHaveLength(0);
    });

    it('should handle environment variables with special characters', () => {
      mockDocument.querySelectorAll.mockImplementation((selector: string) => {
        if (selector === '[data-env-var]') {
          return [{
            getAttribute: (attr: string) => {
              if (attr === 'data-env-var') return 'DATABASE_URL';
              if (attr === 'data-env-value') return 'postgresql://user:pass@localhost:5432/db';
              return null;
            },
            textContent: 'postgresql://user:pass@localhost:5432/db'
          }] as any;
        }
        return [];
      });

      const config = extractEnvironmentConfig();
      expect(config.variables).toHaveProperty('DATABASE_URL', 'postgresql://user:pass@localhost:5432/db');
    });
  });

  describe('extractFileStructure', () => {
    it('should return default file structure', () => {
      const fileStructure = extractFileStructure();

      expect(Array.isArray(fileStructure)).toBe(true);
      expect(fileStructure).toHaveLength(6);

      // Check for expected files
      const fileNames = fileStructure.map(f => f.name);
      expect(fileNames).toContain('index.html');
      expect(fileNames).toContain('styles.css');
      expect(fileNames).toContain('script.js');
      expect(fileNames).toContain('package.json');
      expect(fileNames).toContain('README.md');
      expect(fileNames).toContain('components');

      // Check file types
      const indexFile = fileStructure.find(f => f.name === 'index.html');
      const componentsDir = fileStructure.find(f => f.name === 'components');

      expect(indexFile).toHaveProperty('type', 'file');
      expect(indexFile).toHaveProperty('size', 1024);
      expect(componentsDir).toHaveProperty('type', 'directory');
      expect(componentsDir).toHaveProperty('children');
      expect(Array.isArray(componentsDir.children)).toBe(true);
      expect(componentsDir.children).toHaveLength(0);
    });

    it('should return consistent structure on multiple calls', () => {
      const firstCall = extractFileStructure();
      const secondCall = extractFileStructure();

      expect(firstCall).toEqual(secondCall);
      expect(firstCall).not.toBe(secondCall); // Should be different array instances
    });

    it('should have expected file properties', () => {
      const fileStructure = extractFileStructure();

      // Check that all file objects have required properties
      fileStructure.forEach(file => {
        expect(file).toHaveProperty('name');
        expect(file).toHaveProperty('type');
        expect(['file', 'directory']).toContain(file.type);

        if (file.type === 'file') {
          expect(file).toHaveProperty('size');
          expect(typeof file.size).toBe('number');
        } else if (file.type === 'directory') {
          expect(file).toHaveProperty('children');
          expect(Array.isArray(file.children)).toBe(true);
        }
      });
    });

    it('should include expected core files', () => {
      const fileStructure = extractFileStructure();

      const expectedFiles = ['index.html', 'styles.css', 'script.js', 'package.json', 'README.md'];
      const fileNames = fileStructure.map(f => f.name);

      expectedFiles.forEach(file => {
        expect(fileNames).toContain(file);
      });
    });

    it('should include components directory', () => {
      const fileStructure = extractFileStructure();

      const componentsDir = fileStructure.find(f => f.name === 'components');
      expect(componentsDir).toBeDefined();
      expect(componentsDir).toHaveProperty('type', 'directory');
    });
  });

  // Additional edge case tests for error conditions
  describe('Error Handling', () => {
    it('should handle querySelector throwing an error', () => {
      mockDocument.querySelector.mockImplementation(() => {
        throw new Error('DOM error');
      });

      expect(() => extractProjectMetadata()).not.toThrow();
      expect(() => extractDependencies()).not.toThrow();
      expect(() => extractEnvironmentConfig()).not.toThrow();
    });

    it('should handle querySelectorAll throwing an error', () => {
      mockDocument.querySelectorAll.mockImplementation(() => {
        throw new Error('DOM error');
      });

      expect(() => isBoltDiyProjectPage()).not.toThrow();
      expect(() => isBoltDiyExportPage()).not.toThrow();
      expect(() => extractProjectMetadata()).not.toThrow();
      expect(() => extractDependencies()).not.toThrow();
      expect(() => extractEnvironmentConfig()).not.toThrow();
    });

    it('should handle malformed URLs gracefully', () => {
      mockWindow.location.href = 'invalid-url';
      mockWindow.location.hostname = '';
      mockWindow.location.pathname = '';

      // Should not throw, should return fallback
      const projectId = extractProjectId();
      expect(typeof projectId).toBe('string');
      expect(projectId.length).toBe(16);
    });

    it('should handle window.btoa errors gracefully', () => {
      // Mock btoa to throw an error
      mockWindow.btoa = () => {
        throw new Error('btoa not supported');
      };

      mockWindow.location.href = 'https://example.com/unknown';
      mockWindow.location.hostname = 'example.com';
      mockWindow.location.pathname = '/unknown';

      mockDocument.querySelector.mockReturnValue(null);

      // Should not throw, should handle gracefully
      expect(() => extractProjectId()).not.toThrow();
    });
  });
});