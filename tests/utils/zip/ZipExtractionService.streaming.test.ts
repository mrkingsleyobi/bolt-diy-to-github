import { ZipExtractionService } from '../../../src/utils/zip/ZipExtractionService';
import { StreamEntry, StreamOptions } from '../../../src/types/streaming';
import { Readable } from 'stream';
import { ZipEntry, ZipExtractionResult } from '../../../src/types/zip';

// Mock fs module to prevent actual file system operations
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue(Buffer.from('mock zip content')),
  stat: jest.fn().mockRejectedValue(new Error('File not found')),
  writeFile: jest.fn().mockResolvedValue(undefined)
}));

// Mock fs module for createWriteStream
jest.mock('fs', () => ({
  createWriteStream: jest.fn().mockReturnValue({
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === 'finish') {
        setImmediate(callback);
      }
      return this;
    }),
    once: jest.fn().mockImplementation((event, callback) => {
      if (event === 'finish') {
        setImmediate(callback);
      }
      return this;
    }),
    write: jest.fn().mockReturnValue(true),
    end: jest.fn().mockImplementation(function() {
      setImmediate(() => {
        if (this.on) this.on('finish', () => {});
      });
      return this;
    }),
    pipe: jest.fn().mockImplementation(function(source) {
      setImmediate(() => {
        if (this.on) this.on('finish', () => {});
      });
      return this;
    }),
    emit: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn()
  })
}));

// Mock path module
jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/')),
  dirname: jest.fn().mockImplementation((path) => {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/');
  }),
  isAbsolute: jest.fn().mockReturnValue(false)
}));

// Mock yauzl to prevent actual ZIP file processing
jest.mock('yauzl', () => ({
  open: jest.fn().mockImplementation((filePath, options, callback) => {
    // Simulate successful opening of a ZIP file
    const mockZipFile = {
      entryCount: 0,
      close: jest.fn(),
      on: jest.fn().mockImplementation((event, handler) => {
        if (event === 'end') {
          setImmediate(() => {
            mockZipFile.close();
            handler();
          });
        }
      }),
      readEntry: jest.fn(),
      openReadStream: jest.fn().mockImplementation((entry, callback) => {
        callback(null, new Readable({
          read() {
            this.push(null);
          }
        }));
      })
    };
    callback(null, mockZipFile);
  }),
  fromBuffer: jest.fn().mockImplementation((buffer, options, callback) => {
    // Simulate successful opening of a ZIP file from buffer
    const mockZipFile = {
      entryCount: 0,
      close: jest.fn(),
      on: jest.fn().mockImplementation((event, handler) => {
        if (event === 'end') {
          setImmediate(() => {
            mockZipFile.close();
            handler();
          });
        }
      }),
      readEntry: jest.fn(),
      openReadStream: jest.fn().mockImplementation((entry, callback) => {
        callback(null, new Readable({
          read() {
            this.push(null);
          }
        }));
      })
    };
    callback(null, mockZipFile);
  })
}));

// Mock the streaming components to verify interactions
jest.mock('../../../src/utils/zip/StreamingZipExtractor');
jest.mock('../../../src/utils/zip/MemoryEfficientProcessor');
jest.mock('../../../src/utils/zip/BackpressureHandler');
jest.mock('../../../src/utils/zip/ChunkedProcessor');
jest.mock('../../../src/utils/zip/EntryFilter');

const mockStreamingZipExtractor = require('../../../src/utils/zip/StreamingZipExtractor');
const mockMemoryEfficientProcessor = require('../../../src/utils/zip/MemoryEfficientProcessor');
const mockBackpressureHandler = require('../../../src/utils/zip/BackpressureHandler');
const mockChunkedProcessor = require('../../../src/utils/zip/ChunkedProcessor');
const mockEntryFilter = require('../../../src/utils/zip/EntryFilter');

// Mock implementations for testing
const createMockReadableStream = (data: string | Buffer): Readable => {
  const stream = new Readable();
  stream.push(data);
  stream.push(null);
  return stream;
};

const createMockStreamEntry = (name: string, size: number, isDirectory: boolean = false): StreamEntry => {
  return {
    name,
    size,
    isDirectory,
    stream: createMockReadableStream('mock content')
  };
};

describe('ZipExtractionService - Streaming (London School TDD)', () => {
  const mockZipFilePath = '/path/to/test.zip';
  const mockDestinationPath = '/path/to/destination';

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockStreamingZipExtractor.StreamingZipExtractor.mockImplementation(() => {
      return {
        extractStreams: jest.fn().mockResolvedValue([]),
        getMemoryLimit: jest.fn().mockReturnValue(100 * 1024 * 1024),
        isMemoryLimitExceeded: jest.fn().mockReturnValue(false)
      };
    });

    mockMemoryEfficientProcessor.MemoryEfficientProcessor.mockImplementation(() => {
      return {
        processStreamEntry: jest.fn().mockResolvedValue(Buffer.from('processed content')),
        getMemoryLimit: jest.fn().mockReturnValue(100 * 1024 * 1024),
        isMemoryLimitExceeded: jest.fn().mockReturnValue(false),
        processStream: jest.fn().mockResolvedValue(Buffer.from('processed content'))
      };
    });

    mockBackpressureHandler.BackpressureHandler.mockImplementation(() => {
      return {
        applyBackpressure: jest.fn().mockImplementation((stream) => stream),
        isMemoryLimitExceeded: jest.fn().mockReturnValue(false),
        applyAdaptiveBackpressure: jest.fn().mockImplementation((stream) => stream)
      };
    });

    mockChunkedProcessor.ChunkedProcessor.mockImplementation(() => {
      return {
        processStreamEntryInChunks: jest.fn().mockResolvedValue({
          chunks: [Buffer.from('chunk1'), Buffer.from('chunk2')],
          totalSize: 100,
          processingTime: 10,
          memoryUsage: 1024
        }),
        isMemoryLimitExceeded: jest.fn().mockReturnValue(false),
        processStreamInChunks: jest.fn().mockResolvedValue([Buffer.from('chunk1')])
      };
    });

    mockEntryFilter.EntryFilter.mockImplementation(() => {
      return {
        filterEntries: jest.fn().mockImplementation((entries) => entries),
        addIncludePattern: jest.fn(),
        addExcludePattern: jest.fn(),
        setSizeLimits: jest.fn()
      };
    });
  });

  describe('extract method with streaming', () => {
    it('should use streaming extraction when useStreaming option is true', async () => {
      // Arrange
      const options = { useStreaming: true };
      const mockEntries = [createMockStreamEntry('file1.txt', 100)];

      // Mock fs.readFile to return a buffer
      const fsPromises = require('fs/promises');
      fsPromises.readFile.mockResolvedValue(Buffer.from('mock zip content'));

      // Mock the streaming extractor to return some entries
      const mockExtractor = {
        extractStreams: jest.fn().mockResolvedValue(mockEntries),
        getMemoryLimit: jest.fn().mockReturnValue(100 * 1024 * 1024),
        isMemoryLimitExceeded: jest.fn().mockReturnValue(false)
      };
      mockStreamingZipExtractor.StreamingZipExtractor.mockImplementation(() => mockExtractor);

      // Mock the entry filter to return filtered entries
      mockEntryFilter.EntryFilter.mockImplementation(() => {
        return {
          filterEntries: jest.fn().mockReturnValue(mockEntries),
          addIncludePattern: jest.fn(),
          addExcludePattern: jest.fn(),
          setSizeLimits: jest.fn()
        };
      });

      // Act
      const result = await ZipExtractionService.extract(mockZipFilePath, mockDestinationPath, options);

      // Assert
      expect(result).toBeDefined();
      expect(result.extractedCount).toBeGreaterThanOrEqual(0);
      // Verify that StreamingZipExtractor was instantiated
      expect(mockStreamingZipExtractor.StreamingZipExtractor).toHaveBeenCalled();
      // Verify that extractStreams was called
      expect(mockExtractor.extractStreams).toHaveBeenCalled();
    });

    it('should use streaming extraction when maxSize exceeds 50MB', async () => {
      // Arrange
      const options = { maxSize: 60 * 1024 * 1024 }; // 60MB
      const mockEntries = [createMockStreamEntry('largefile.bin', 60 * 1024 * 1024)];

      // Mock fs.readFile to return a buffer
      const fsPromises = require('fs/promises');
      fsPromises.readFile.mockResolvedValue(Buffer.from('mock zip content'));

      // Mock the streaming extractor to return some entries
      const mockExtractor = {
        extractStreams: jest.fn().mockResolvedValue(mockEntries),
        getMemoryLimit: jest.fn().mockReturnValue(100 * 1024 * 1024),
        isMemoryLimitExceeded: jest.fn().mockReturnValue(false)
      };
      mockStreamingZipExtractor.StreamingZipExtractor.mockImplementation(() => mockExtractor);

      // Mock the entry filter to return filtered entries
      mockEntryFilter.EntryFilter.mockImplementation(() => {
        return {
          filterEntries: jest.fn().mockReturnValue(mockEntries),
          addIncludePattern: jest.fn(),
          addExcludePattern: jest.fn(),
          setSizeLimits: jest.fn()
        };
      });

      // Act
      const result = await ZipExtractionService.extract(mockZipFilePath, mockDestinationPath, options);

      // Assert
      expect(result).toBeDefined();
      // Verify that StreamingZipExtractor was instantiated
      expect(mockStreamingZipExtractor.StreamingZipExtractor).toHaveBeenCalled();
      // Verify that extractStreams was called
      expect(mockExtractor.extractStreams).toHaveBeenCalled();
    });

    it('should process stream entries with adaptive processing based on size', async () => {
      // Arrange
      const options = { useStreaming: true };
      const mockEntries = [
        createMockStreamEntry('small.txt', 5 * 1024 * 1024), // 5MB - regular processing
        createMockStreamEntry('large.bin', 60 * 1024 * 1024)   // 60MB - chunked processing
      ];

      // Mock fs.readFile to return a buffer
      const fsPromises = require('fs/promises');
      fsPromises.readFile.mockResolvedValue(Buffer.from('mock zip content'));

      // Mock the streaming extractor to return entries
      mockStreamingZipExtractor.StreamingZipExtractor.mockImplementation(() => {
        return {
          extractStreams: jest.fn().mockResolvedValue(mockEntries),
          getMemoryLimit: jest.fn().mockReturnValue(100 * 1024 * 1024),
          isMemoryLimitExceeded: jest.fn().mockReturnValue(false)
        };
      });

      // Mock the entry filter to return filtered entries
      mockEntryFilter.EntryFilter.mockImplementation(() => {
        return {
          filterEntries: jest.fn().mockReturnValue(mockEntries),
          addIncludePattern: jest.fn(),
          addExcludePattern: jest.fn(),
          setSizeLimits: jest.fn()
        };
      });

      // Mock processors to verify they are called appropriately
      const mockProcessor = {
        processStreamEntry: jest.fn().mockResolvedValue(Buffer.from('processed content')),
        getMemoryLimit: jest.fn().mockReturnValue(100 * 1024 * 1024),
        isMemoryLimitExceeded: jest.fn().mockReturnValue(false),
        processStream: jest.fn().mockResolvedValue(Buffer.from('processed content'))
      };

      const mockChunker = {
        processStreamEntryInChunks: jest.fn().mockResolvedValue({
          chunks: [Buffer.from('chunk1'), Buffer.from('chunk2')],
          totalSize: 60 * 1024 * 1024,
          processingTime: 100,
          memoryUsage: 2048
        }),
        isMemoryLimitExceeded: jest.fn().mockReturnValue(false),
        processStreamInChunks: jest.fn().mockResolvedValue([Buffer.from('chunk1')])
      };

      mockMemoryEfficientProcessor.MemoryEfficientProcessor.mockImplementation(() => mockProcessor);
      mockChunkedProcessor.ChunkedProcessor.mockImplementation(() => mockChunker);

      // Act
      const result = await ZipExtractionService.extract(mockZipFilePath, mockDestinationPath, options);

      // Assert
      expect(result).toBeDefined();
      // Verify that both processors were instantiated
      expect(mockMemoryEfficientProcessor.MemoryEfficientProcessor).toHaveBeenCalled();
      expect(mockChunkedProcessor.ChunkedProcessor).toHaveBeenCalled();
      // Verify that the regular processor was called for the small file
      expect(mockProcessor.processStreamEntry).toHaveBeenCalled();
      // Verify that the chunked processor was called for the large file
      expect(mockChunker.processStreamEntryInChunks).toHaveBeenCalled();
    });

    it('should apply backpressure handling for large files', async () => {
      // Arrange
      const options = { useStreaming: true, highWaterMark: 1024 };
      const mockEntries = [createMockStreamEntry('large.txt', 15 * 1024 * 1024)]; // 15MB

      // Mock fs.readFile to return a buffer
      const fsPromises = require('fs/promises');
      fsPromises.readFile.mockResolvedValue(Buffer.from('mock zip content'));

      // Mock the streaming extractor to return entries
      mockStreamingZipExtractor.StreamingZipExtractor.mockImplementation(() => {
        return {
          extractStreams: jest.fn().mockResolvedValue(mockEntries),
          getMemoryLimit: jest.fn().mockReturnValue(100 * 1024 * 1024),
          isMemoryLimitExceeded: jest.fn().mockReturnValue(false)
        };
      });

      // Mock the entry filter to return filtered entries
      mockEntryFilter.EntryFilter.mockImplementation(() => {
        return {
          filterEntries: jest.fn().mockReturnValue(mockEntries),
          addIncludePattern: jest.fn(),
          addExcludePattern: jest.fn(),
          setSizeLimits: jest.fn()
        };
      });

      // Mock backpressure handler to verify it is called
      const mockHandler = {
        applyBackpressure: jest.fn().mockImplementation((stream) => stream),
        isMemoryLimitExceeded: jest.fn().mockReturnValue(false),
        applyAdaptiveBackpressure: jest.fn().mockImplementation((stream) => stream)
      };

      mockBackpressureHandler.BackpressureHandler.mockImplementation(() => mockHandler);

      // Act
      const result = await ZipExtractionService.extract(mockZipFilePath, mockDestinationPath, options);

      // Assert
      expect(result).toBeDefined();
      // Verify that backpressure handler was instantiated and called
      expect(mockBackpressureHandler.BackpressureHandler).toHaveBeenCalled();
      expect(mockHandler.applyBackpressure).toHaveBeenCalled();
    });

    it('should filter entries according to provided patterns', async () => {
      // Arrange
      const options = {
        useStreaming: true,
        includePatterns: ['**/*.txt'],
        excludePatterns: ['**/secret/**'],
        maxSize: 100 * 1024 * 1024
      };

      const mockEntries = [
        createMockStreamEntry('file1.txt', 100),
        createMockStreamEntry('file2.js', 200),
        createMockStreamEntry('secret/password.txt', 50)
      ];

      // Mock fs.readFile to return a buffer
      const fsPromises = require('fs/promises');
      fsPromises.readFile.mockResolvedValue(Buffer.from('mock zip content'));

      // Mock the streaming extractor to return entries
      mockStreamingZipExtractor.StreamingZipExtractor.mockImplementation(() => {
        return {
          extractStreams: jest.fn().mockResolvedValue(mockEntries),
          getMemoryLimit: jest.fn().mockReturnValue(100 * 1024 * 1024),
          isMemoryLimitExceeded: jest.fn().mockReturnValue(false)
        };
      });

      // Mock the entry filter to simulate filtering behavior
      const mockFilter = {
        filterEntries: jest.fn().mockReturnValue([mockEntries[0]]), // Only file1.txt should pass
        addIncludePattern: jest.fn(),
        addExcludePattern: jest.fn(),
        setSizeLimits: jest.fn()
      };

      mockEntryFilter.EntryFilter.mockImplementation(() => mockFilter);

      // Act
      const result = await ZipExtractionService.extract(mockZipFilePath, mockDestinationPath, options);

      // Assert
      expect(result).toBeDefined();
      // Verify that entry filter was instantiated and configured
      expect(mockEntryFilter.EntryFilter).toHaveBeenCalled();
      expect(mockFilter.addIncludePattern).toHaveBeenCalledWith('**/*.txt');
      expect(mockFilter.addExcludePattern).toHaveBeenCalledWith('**/secret/**');
      expect(mockFilter.setSizeLimits).toHaveBeenCalledWith(0, 100 * 1024 * 1024);
      // Verify that filterEntries was called with the extracted entries
      expect(mockFilter.filterEntries).toHaveBeenCalledWith(mockEntries);
    });

    it('should handle progress callbacks during streaming extraction', async () => {
      // Arrange
      const progressCallback = jest.fn();
      const options = {
        useStreaming: true,
        onProgress: progressCallback
      };

      const mockEntries = [createMockStreamEntry('file1.txt', 100)];

      // Mock fs.readFile to return a buffer
      const fsPromises = require('fs/promises');
      fsPromises.readFile.mockResolvedValue(Buffer.from('mock zip content'));

      // Mock the streaming extractor to return entries and call progress callback
      mockStreamingZipExtractor.StreamingZipExtractor.mockImplementation(() => {
        return {
          extractStreams: jest.fn().mockImplementation((buffer, opts) => {
            // Simulate progress updates
            if (opts.onProgress) {
              opts.onProgress({ percentage: 50, processed: 1, total: 2, memoryUsage: 1024 });
              opts.onProgress({ percentage: 100, processed: 2, total: 2, memoryUsage: 2048 });
            }
            return Promise.resolve(mockEntries);
          }),
          getMemoryLimit: jest.fn().mockReturnValue(100 * 1024 * 1024),
          isMemoryLimitExceeded: jest.fn().mockReturnValue(false)
        };
      });

      // Mock the entry filter to return filtered entries
      mockEntryFilter.EntryFilter.mockImplementation(() => {
        return {
          filterEntries: jest.fn().mockReturnValue(mockEntries),
          addIncludePattern: jest.fn(),
          addExcludePattern: jest.fn(),
          setSizeLimits: jest.fn()
        };
      });

      // Act
      const result = await ZipExtractionService.extract(mockZipFilePath, mockDestinationPath, options);

      // Assert
      expect(result).toBeDefined();
      // Verify that progress callback was called
      expect(progressCallback).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenCalledWith(50);
      expect(progressCallback).toHaveBeenCalledWith(100);
    });

    it('should handle entry extraction callbacks during streaming', async () => {
      // Arrange
      const entryCallback = jest.fn();
      const options = {
        useStreaming: true,
        onEntryExtracted: entryCallback
      };

      const mockEntries = [createMockStreamEntry('file1.txt', 100)];

      // Mock fs.readFile to return a buffer
      const fsPromises = require('fs/promises');
      fsPromises.readFile.mockResolvedValue(Buffer.from('mock zip content'));

      // Mock the streaming extractor to return entries
      mockStreamingZipExtractor.StreamingZipExtractor.mockImplementation(() => {
        return {
          extractStreams: jest.fn().mockResolvedValue(mockEntries),
          getMemoryLimit: jest.fn().mockReturnValue(100 * 1024 * 1024),
          isMemoryLimitExceeded: jest.fn().mockReturnValue(false)
        };
      });

      // Mock the entry filter to return filtered entries
      mockEntryFilter.EntryFilter.mockImplementation(() => {
        return {
          filterEntries: jest.fn().mockReturnValue(mockEntries),
          addIncludePattern: jest.fn(),
          addExcludePattern: jest.fn(),
          setSizeLimits: jest.fn()
        };
      });

      // Act
      const result = await ZipExtractionService.extract(mockZipFilePath, mockDestinationPath, options);

      // Assert
      expect(result).toBeDefined();
      // Verify that entry callback was called
      expect(entryCallback).toHaveBeenCalled();
      // Verify the callback was called with a ZipEntry object
      const callbackArg = entryCallback.mock.calls[0][0];
      expect(callbackArg).toMatchObject({
        name: 'file1.txt',
        size: 100,
        isDirectory: false,
        isFile: true
      });
    });

    it('should handle memory limit exceeded errors during streaming extraction', async () => {
      // Arrange
      const options = { useStreaming: true };

      // Mock fs.readFile to return a buffer
      const fsPromises = require('fs/promises');
      fsPromises.readFile.mockResolvedValue(Buffer.from('mock zip content'));

      // Mock the streaming extractor to throw memory limit error
      mockStreamingZipExtractor.StreamingZipExtractor.mockImplementation(() => {
        return {
          extractStreams: jest.fn().mockRejectedValue(new Error('Memory limit exceeded during processing')),
          getMemoryLimit: jest.fn().mockReturnValue(0), // Very small limit
          isMemoryLimitExceeded: jest.fn().mockReturnValue(true)
        };
      });

      // Act & Assert
      await expect(ZipExtractionService.extract(mockZipFilePath, mockDestinationPath, options))
        .rejects
        .toThrow('Streaming extraction failed: Memory limit exceeded during processing');
    });

    it('should handle directory entries during streaming extraction', async () => {
      // Arrange
      const options = { useStreaming: true };
      const mockEntries = [
        createMockStreamEntry('dir1/', 0, true),
        createMockStreamEntry('dir1/file1.txt', 100)
      ];

      // Mock fs.readFile to return a buffer
      const fsPromises = require('fs/promises');
      fsPromises.readFile.mockResolvedValue(Buffer.from('mock zip content'));

      // Mock the streaming extractor to return entries
      mockStreamingZipExtractor.StreamingZipExtractor.mockImplementation(() => {
        return {
          extractStreams: jest.fn().mockResolvedValue(mockEntries),
          getMemoryLimit: jest.fn().mockReturnValue(100 * 1024 * 1024),
          isMemoryLimitExceeded: jest.fn().mockReturnValue(false)
        };
      });

      // Mock the entry filter to return filtered entries
      mockEntryFilter.EntryFilter.mockImplementation(() => {
        return {
          filterEntries: jest.fn().mockReturnValue(mockEntries),
          addIncludePattern: jest.fn(),
          addExcludePattern: jest.fn(),
          setSizeLimits: jest.fn()
        };
      });

      // Act
      const result = await ZipExtractionService.extract(mockZipFilePath, mockDestinationPath, options);

      // Assert
      expect(result).toBeDefined();
      expect(result.entries).toHaveLength(2);
      // Verify directory entry
      expect(result.entries[0]).toMatchObject({
        name: 'dir1/',
        size: 0,
        isDirectory: true,
        isFile: false
      });
      // Verify file entry
      expect(result.entries[1]).toMatchObject({
        name: 'dir1/file1.txt',
        size: 100,
        isDirectory: false,
        isFile: true
      });
    });
  });

  describe('extractStreaming method', () => {
    it('should extract using streaming components with proper coordination', async () => {
      // Arrange
      const options: StreamOptions = {
        highWaterMark: 1024,
        maxMemoryUsage: 50 * 1024 * 1024,
        onProgress: jest.fn(),
        onEntry: jest.fn().mockResolvedValue(undefined)
      };

      const mockEntries = [
        createMockStreamEntry('file1.txt', 100),
        createMockStreamEntry('file2.js', 200)
      ];

      // Mock fs.readFile to return a buffer
      const fsPromises = require('fs/promises');
      fsPromises.readFile.mockResolvedValue(Buffer.from('mock zip content'));

      // Mock the streaming extractor to return entries
      mockStreamingZipExtractor.StreamingZipExtractor.mockImplementation(() => {
        return {
          extractStreams: jest.fn().mockResolvedValue(mockEntries),
          getMemoryLimit: jest.fn().mockReturnValue(100 * 1024 * 1024),
          isMemoryLimitExceeded: jest.fn().mockReturnValue(false)
        };
      });

      // Mock the entry filter to return filtered entries
      mockEntryFilter.EntryFilter.mockImplementation(() => {
        return {
          filterEntries: jest.fn().mockReturnValue(mockEntries),
          addIncludePattern: jest.fn(),
          addExcludePattern: jest.fn(),
          setSizeLimits: jest.fn()
        };
      });

      // Act
      const result = await ZipExtractionService.extractStreaming(mockZipFilePath, mockDestinationPath, options as any);

      // Assert
      expect(result).toBeDefined();
      expect(result.extractedCount).toBeGreaterThanOrEqual(0);
      // Verify all streaming components were instantiated
      expect(mockStreamingZipExtractor.StreamingZipExtractor).toHaveBeenCalledWith(50 * 1024 * 1024);
      expect(mockMemoryEfficientProcessor.MemoryEfficientProcessor).toHaveBeenCalledWith(50 * 1024 * 1024);
      expect(mockBackpressureHandler.BackpressureHandler).toHaveBeenCalledWith(50 * 1024 * 1024);
      expect(mockChunkedProcessor.ChunkedProcessor).toHaveBeenCalledWith(50 * 1024 * 1024);
      expect(mockEntryFilter.EntryFilter).toHaveBeenCalled();
    });
  });
});