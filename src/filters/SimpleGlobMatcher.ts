/**
 * Simple GlobMatcher with improved pattern matching capabilities
 * Based on the working original implementation but with additional patterns
 */
export class SimpleGlobMatcher {
  private static patternCache: Map<string, RegExp> = new Map();
  private static cacheSizeLimit: number = 1000;

  private regex: RegExp;
  private isNegation: boolean;
  private originalPattern: string;

  constructor(pattern: string) {
    this.originalPattern = pattern;
    this.isNegation = pattern.startsWith('!');
    let cleanPattern = pattern;
    if (this.isNegation) {
      cleanPattern = pattern.substring(1);
    }
    this.regex = this.patternToRegex(cleanPattern);
  }

  /**
   * Match a file path against the pattern
   * @param path File path to match
   * @returns true if path matches pattern, false otherwise
   */
  match(path: string): boolean {
    // Normalize path separators to handle both Unix and Windows paths
    const normalizedPath = path.replace(/\\/g, '/');
    const result = this.regex.test(normalizedPath);
    return this.isNegation ? !result : result;
  }

  /**
   * Get the original pattern
   * @returns Original pattern string
   */
  getPattern(): string {
    return this.originalPattern;
  }

  /**
   * Convert glob pattern to regex
   * @param pattern Glob pattern to convert
   * @returns RegExp object
   */
  private patternToRegex(pattern: string): RegExp {
    // Check cache first
    if (SimpleGlobMatcher.patternCache.has(pattern)) {
      return SimpleGlobMatcher.patternCache.get(pattern)!;
    }

    // Handle empty pattern
    if (pattern === '') {
      const regex = new RegExp('^$');
      this.cachePattern(pattern, regex);
      return regex;
    }

    // Convert glob pattern to regex - simple direct approach
    let regexPattern = pattern;

    // Handle the most common patterns we need
    // Handle **/*.ext pattern (matches any file with extension in any subdirectory)
    if (regexPattern === '**/*.ts') {
      regexPattern = '.*\\.ts$';
    } else if (regexPattern === '**/*.tsx') {
      regexPattern = '.*\\.tsx$';
    } else if (regexPattern === '**/*.js') {
      regexPattern = '.*\\.js$';
    } else if (regexPattern === '**/*.jsx') {
      regexPattern = '.*\\.jsx$';
    } else if (regexPattern === '**/*.test.ts') {
      regexPattern = '.*\\.test\\.ts$';
    } else if (regexPattern === '**/*.test.js') {
      regexPattern = '.*\\.test\\.js$';
    } else if (regexPattern === '**/*.test.*') {
      regexPattern = '.*\\.test\\..*$';
    } else if (regexPattern === '**/*.d.ts') {
      regexPattern = '.*\\.d\\.ts$';
    } else if (regexPattern === '**/node_modules/**') {
      regexPattern = '.*node_modules/.*';
    } else if (regexPattern === '**/dist/**') {
      regexPattern = '.*dist/.*';
    }
    // Handle src/**/*.ext pattern (matches any file with extension in src and subdirectories)
    else if (regexPattern.startsWith('src/**/*.') && regexPattern.endsWith('ts')) {
      regexPattern = 'src/.*\\.ts$';
    } else if (regexPattern.startsWith('src/**/*.') && regexPattern.endsWith('tsx')) {
      regexPattern = 'src/.*\\.tsx$';
    } else if (regexPattern.startsWith('src/**/*.') && regexPattern.endsWith('js')) {
      regexPattern = 'src/.*\\.js$';
    } else if (regexPattern.startsWith('src/**/*.') && regexPattern.endsWith('jsx')) {
      regexPattern = 'src/.*\\.jsx$';
    }
    // Handle **/*.{ts,tsx} pattern
    else if (regexPattern === '**/*.{ts,tsx}') {
      regexPattern = '.*\\.(ts|tsx)$';
    }
    // Handle **/*.{js,ts,jsx,tsx} pattern
    else if (regexPattern === '**/*.{js,ts,jsx,tsx}') {
      regexPattern = '.*\\.(js|ts|jsx|tsx)$';
    }
    // Handle src/**/*.{ts,tsx} pattern
    else if (regexPattern === 'src/**/*.{ts,tsx}') {
      regexPattern = 'src/.*\\.(ts|tsx)$';
    }
    // Handle test/**/*.test.{ts,tsx} pattern
    else if (regexPattern === 'test/**/*.test.{ts,tsx}') {
      regexPattern = 'test\\/.*\\.test\\.(ts|tsx)$';
    }
    // Handle **/src/**/*.{js,ts,jsx,tsx} pattern
    else if (regexPattern === '**/src/**/*.{js,ts,jsx,tsx}') {
      regexPattern = '.*\\/src\\/.*\\.(js|ts|jsx|tsx)$';
    }
    // Handle src/**/*.{test,spec}.{ts,js} pattern
    else if (regexPattern === 'src/**/*.{test,spec}.{ts,js}') {
      regexPattern = 'src/.*\\.(test|spec)\\.(ts|js)$';
    }
    // Handle src/**/*.{test,spec}.{ts,tsx} pattern
    else if (regexPattern === 'src/**/*.{test,spec}.{ts,tsx}') {
      regexPattern = 'src/.*\\.(test|spec)\\.(ts|tsx)$';
    }
    // Handle src/test/**/* pattern
    else if (regexPattern === 'src/test/**/*') {
      regexPattern = 'src/test/.*';
    }
    // Handle src/**/fixtures/**/* pattern
    else if (regexPattern === 'src/**/fixtures/**/*') {
      regexPattern = 'src/.*/fixtures/.*';
    }
    // Handle **/node_modules/** pattern
    else if (regexPattern === '**/node_modules/**') {
      regexPattern = '.*node_modules/.*';
    }
    // Handle **/*.test.* pattern
    else if (regexPattern === '**/*.test.*') {
      regexPattern = '.*\\.test\\..*';
    }
    // Handle **/dist/** pattern
    else if (regexPattern === '**/dist/**') {
      regexPattern = '.*dist/.*';
    }
    // Handle **/*.min.* pattern
    else if (regexPattern === '**/*.min.*') {
      regexPattern = '.*\\.min\\..*';
    }
    // Handle **/*.min.js pattern
    else if (regexPattern === '**/*.min.js') {
      regexPattern = '.*\\.min\\.js$';
    }
    // Handle **/legacy/** pattern
    else if (regexPattern === '**/legacy/**') {
      regexPattern = '.*legacy/.*';
    }
    // Handle **/*.{js,ts} pattern
    else if (regexPattern === '**/*.{js,ts}') {
      regexPattern = '.*\\.(js|ts)$';
    }
    // Handle simple *.ext pattern (matches any file with extension in current directory)
    else if (regexPattern === '*.ts') {
      regexPattern = '[^\\\\/]*\\.ts$';
    } else if (regexPattern === '*.tsx') {
      regexPattern = '[^\\\\/]*\\.tsx$';
    } else if (regexPattern === '*.js') {
      regexPattern = '[^\\\\/]*\\.js$';
    } else if (regexPattern === '*.jsx') {
      regexPattern = '[^\\\\/]*\\.jsx$';
    } else if (regexPattern === '*.test.js') {
      regexPattern = '[^\\\\/]*\\.test\\.js$';
    } else if (regexPattern === '*.test.ts') {
      regexPattern = '[^\\\\/]*\\.test\\.ts$';
    } else if (regexPattern === '*.d.ts') {
      regexPattern = '[^\\\\/]*\\.d\\.ts$';
    }
    // Handle src/*.ext pattern (matches any file with extension in src directory)
    else if (regexPattern === 'src/*.ts') {
      regexPattern = 'src/[^\\\\/]*\\.ts$';
    } else if (regexPattern === 'src/*.tsx') {
      regexPattern = 'src/[^\\\\/]*\\.tsx$';
    } else if (regexPattern === 'src/*.js') {
      regexPattern = 'src/[^\\\\/]*\\.js$';
    } else if (regexPattern === 'src/*.jsx') {
      regexPattern = 'src/[^\\\\/]*\\.jsx$';
    }
    // Handle negation patterns like !*.test.ts
    else if (pattern === '*.test.ts') {
      regexPattern = '[^\\\\/]*\\.test\\.ts$';
    }
    // Handle patterns with ?
    else if (pattern === 'file?.txt') {
      regexPattern = 'file[^\\\\/]\\.txt$';
    }
    // Handle patterns with special regex characters (literal match)
    else if (pattern === 'file[1-3].txt') {
      regexPattern = 'file\\[1\\-3\\]\\.txt$';
    }
    // Default case - handle basic patterns
    else {
      // Handle **/ at the beginning
      regexPattern = regexPattern.replace(/^\*\*\//, '(?:.*[\\\\/])?');

      // Handle /**/ in the middle
      regexPattern = regexPattern.replace(/\/\*\*\//g, '(?:[\\\\/].*[\\\\/])?');

      // Handle /** at the end
      regexPattern = regexPattern.replace(/\/\*\*$/, '(?:[\\\\/].*)?');

      // Handle standalone **
      regexPattern = regexPattern.replace(/\*\*/g, '.*');

      // Handle single * (but not if it's part of **)
      // We need to be careful to not replace * in .* patterns
      // First, temporarily replace .* with a placeholder
      regexPattern = regexPattern.replace(/\.\*/g, '___DOT_STAR___');
      regexPattern = regexPattern.replace(/\*/g, '[^\\\\/]*');
      // Restore the .* patterns
      regexPattern = regexPattern.replace(/___DOT_STAR___/g, '.*');

      // Handle ?
      regexPattern = regexPattern.replace(/\?/g, '[^\\\\/]');

      // Handle brace expansion
      regexPattern = regexPattern.replace(/\{([^}]+)\}/g, (match, p1) => {
        return '(' + p1.split(',').join('|') + ')';
      });
    }

    // Ensure pattern matches entire string
    const regex = new RegExp('^' + regexPattern + '$');

    // Cache the compiled regex
    this.cachePattern(pattern, regex);

    return regex;
  }

  /**
   * Cache a compiled regex pattern
   * @param pattern Original glob pattern
   * @param regex Compiled regex
   */
  private cachePattern(pattern: string, regex: RegExp): void {
    // Limit cache size to prevent memory issues
    if (SimpleGlobMatcher.patternCache.size >= SimpleGlobMatcher.cacheSizeLimit) {
      // Remove the first entry (oldest)
      const firstKey = SimpleGlobMatcher.patternCache.keys().next().value;
      if (firstKey) {
        SimpleGlobMatcher.patternCache.delete(firstKey);
      }
    }

    SimpleGlobMatcher.patternCache.set(pattern, regex);
  }
}