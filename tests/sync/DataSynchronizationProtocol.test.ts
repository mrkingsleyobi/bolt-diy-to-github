// DataSynchronizationProtocol.test.ts - Tests for Data Synchronization Protocol components
// Phase 2: Data Synchronization Protocol - Task 31: Create Comprehensive Tests

import { BasicChangeDetector } from '../../src/sync/BasicChangeDetector';
import { DeltaGenerator } from '../../src/sync/DeltaGenerator';
import { DeltaApplier } from '../../src/sync/DeltaApplier';
import { BasicSyncEngine } from '../../src/sync/BasicSyncEngine';
import {
  ChangeDetectionConfig,
  ChangeDetectionMethod,
  ChangeEventType
} from '../../src/sync/ChangeDetector';
import {
  DeltaOperationType,
  InsertOperation,
  UpdateOperation,
  DeleteOperation
} from '../../src/sync/DeltaOperation';
import {
  SyncEngineConfig,
  SyncMode,
  ConflictResolutionStrategy
} from '../../src/sync/SyncEngine';

describe('Data Synchronization Protocol', () => {
  describe('BasicChangeDetector', () => {
    let changeDetector: BasicChangeDetector;
    let config: ChangeDetectionConfig;

    beforeEach(() => {
      changeDetector = new BasicChangeDetector();
      config = {
        interval: 1000,
        methods: [ChangeDetectionMethod.POLLING],
        includePatterns: ['**/*'],
        excludePatterns: ['**/node_modules/**'],
        recursive: true,
        enableContentHashing: false,
        hashAlgorithm: 'sha256'
      };
    });

    test('should initialize with default configuration', async () => {
      await changeDetector.initialize(config);
      const retrievedConfig = changeDetector.getConfig();

      expect(retrievedConfig.interval).toBe(1000);
      expect(retrievedConfig.methods).toContain(ChangeDetectionMethod.POLLING);
    });

    test('should detect changes', async () => {
      await changeDetector.initialize(config);

      const changes = await changeDetector.detectChanges();

      // In the mock implementation, we expect some changes
      expect(changes).toBeDefined();
      expect(Array.isArray(changes)).toBe(true);
    });

    test('should start and stop detection', async () => {
      await changeDetector.initialize(config);

      await changeDetector.start();
      const status = changeDetector.getStatus();
      expect(status.running).toBe(true);

      await changeDetector.stop();
      const stoppedStatus = changeDetector.getStatus();
      expect(stoppedStatus.running).toBe(false);
    });
  });

  describe('DeltaGenerator', () => {
    let deltaGenerator: DeltaGenerator;

    beforeEach(() => {
      deltaGenerator = new DeltaGenerator({
        compression: false,
        optimization: true,
        maxBatchSize: 100
      });
    });

    test('should generate delta operations from change events', () => {
      const events = [
        {
          path: '/test/file1.txt',
          type: ChangeEventType.CREATED,
          timestamp: Date.now(),
          currentState: { content: 'test content' },
          size: 12
        },
        {
          path: '/test/file2.txt',
          type: ChangeEventType.MODIFIED,
          timestamp: Date.now(),
          previousState: { content: 'old content' },
          currentState: { content: 'new content' },
          size: 11
        }
      ];

      const operations = deltaGenerator.generateDelta(events);

      expect(operations).toHaveLength(2);
      expect(operations[0].type).toBe(DeltaOperationType.INSERT);
      expect(operations[1].type).toBe(DeltaOperationType.UPDATE);
    });

    test('should optimize operations', () => {
      // Create events that should be optimized
      const events = [
        {
          path: '/test/file.txt',
          type: ChangeEventType.CREATED,
          timestamp: Date.now(),
          currentState: { content: 'initial content' },
          size: 15
        },
        {
          path: '/test/file.txt',
          type: ChangeEventType.MODIFIED,
          timestamp: Date.now() + 1000,
          previousState: { content: 'initial content' },
          currentState: { content: 'updated content' },
          size: 13
        }
      ];

      const operations = deltaGenerator.generateDelta(events);

      // With optimization, the insert and update should be combined
      expect(operations).toHaveLength(1);
      expect(operations[0].type).toBe(DeltaOperationType.INSERT);
    });
  });

  describe('DeltaApplier', () => {
    let deltaApplier: DeltaApplier;

    beforeEach(() => {
      deltaApplier = new DeltaApplier({
        validateBeforeApply: true,
        enableBackup: true,
        maxBatchSize: 50,
        timeout: 5000
      });
    });

    test('should apply insert operations', async () => {
      const operations: InsertOperation[] = [
        {
          type: DeltaOperationType.INSERT,
          path: '/test/file.txt',
          content: 'test content',
          metadata: {
            id: 'test-1',
            timestamp: Date.now(),
            author: 'test',
            version: '1.0',
            source: 'test'
          },
          validate(): boolean { return true; },
          serialize(): string { return JSON.stringify(this); },
          getSize(): number { return JSON.stringify(this).length; }
        }
      ];

      const result = await deltaApplier.applyDelta(operations);

      expect(result.applied).toBe(1);
      expect(result.failed).toBe(0);

      // Check that the file was created
      const fileSystem = deltaApplier.getFileSystem();
      expect(fileSystem.has('/test/file.txt')).toBe(true);
      expect(fileSystem.get('/test/file.txt')).toBe('test content');
    });

    test('should apply update operations', async () => {
      // First insert a file
      const insertOps: InsertOperation[] = [
        {
          type: DeltaOperationType.INSERT,
          path: '/test/file.txt',
          content: 'initial content',
          metadata: {
            id: 'test-1',
            timestamp: Date.now(),
            author: 'test',
            version: '1.0',
            source: 'test'
          },
          validate(): boolean { return true; },
          serialize(): string { return JSON.stringify(this); },
          getSize(): number { return JSON.stringify(this).length; }
        }
      ];

      await deltaApplier.applyDelta(insertOps);

      // Then update it
      const updateOps: UpdateOperation[] = [
        {
          type: DeltaOperationType.UPDATE,
          path: '/test/file.txt',
          content: 'updated content',
          metadata: {
            id: 'test-2',
            timestamp: Date.now(),
            author: 'test',
            version: '1.0',
            source: 'test'
          },
          validate(): boolean { return true; },
          serialize(): string { return JSON.stringify(this); },
          getSize(): number { return JSON.stringify(this).length; }
        }
      ];

      const result = await deltaApplier.applyDelta(updateOps);

      expect(result.applied).toBe(1);
      expect(result.failed).toBe(0);

      // Check that the file was updated
      const fileSystem = deltaApplier.getFileSystem();
      expect(fileSystem.get('/test/file.txt')).toBe('updated content');
    });

    test('should apply delete operations', async () => {
      // First insert a file
      const insertOps: InsertOperation[] = [
        {
          type: DeltaOperationType.INSERT,
          path: '/test/file.txt',
          content: 'test content',
          metadata: {
            id: 'test-1',
            timestamp: Date.now(),
            author: 'test',
            version: '1.0',
            source: 'test'
          },
          validate(): boolean { return true; },
          serialize(): string { return JSON.stringify(this); },
          getSize(): number { return JSON.stringify(this).length; }
        }
      ];

      await deltaApplier.applyDelta(insertOps);

      // Then delete it
      const deleteOps: DeleteOperation[] = [
        {
          type: DeltaOperationType.DELETE,
          path: '/test/file.txt',
          metadata: {
            id: 'test-2',
            timestamp: Date.now(),
            author: 'test',
            version: '1.0',
            source: 'test'
          },
          validate(): boolean { return true; },
          serialize(): string { return JSON.stringify(this); },
          getSize(): number { return JSON.stringify(this).length; }
        }
      ];

      const result = await deltaApplier.applyDelta(deleteOps);

      expect(result.applied).toBe(1);
      expect(result.failed).toBe(0);

      // Check that the file was deleted
      const fileSystem = deltaApplier.getFileSystem();
      expect(fileSystem.has('/test/file.txt')).toBe(false);
    });
  });

  describe('BasicSyncEngine', () => {
    let syncEngine: BasicSyncEngine;
    let config: SyncEngineConfig;

    beforeEach(() => {
      syncEngine = new BasicSyncEngine();
      config = {
        mode: SyncMode.BATCH,
        batchSize: 50,
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        compression: true,
        encryption: false,
        conflictResolution: ConflictResolutionStrategy.LAST_WRITE_WINS,
        deltaSync: true
      };
    });

    test('should initialize with configuration', async () => {
      await syncEngine.initialize(config);
      const retrievedConfig = syncEngine.getConfig();

      expect(retrievedConfig.mode).toBe(SyncMode.BATCH);
      expect(retrievedConfig.batchSize).toBe(50);
      expect(retrievedConfig.conflictResolution).toBe(ConflictResolutionStrategy.LAST_WRITE_WINS);
    });

    test('should start and stop sync', async () => {
      await syncEngine.initialize(config);

      await syncEngine.start();
      const status = syncEngine.getStatus();
      expect(status.state).toBe('syncing');

      await syncEngine.stop();
      const stoppedStatus = syncEngine.getStatus();
      expect(stoppedStatus.state).toBe('idle');
    });

    test('should generate delta operations', async () => {
      await syncEngine.initialize(config);

      const events = [
        {
          path: '/test/file.txt',
          type: ChangeEventType.CREATED,
          timestamp: Date.now(),
          currentState: { content: 'test content' },
          size: 12
        }
      ];

      const operations = await syncEngine.generateDelta(events);

      expect(operations).toHaveLength(1);
      expect(operations[0].type).toBe(DeltaOperationType.INSERT);
    });

    test('should detect conflicts', async () => {
      await syncEngine.initialize(config);

      const operations = [
        {
          type: DeltaOperationType.INSERT,
          path: '/test/file.txt',
          content: 'test content',
          metadata: {
            id: 'test-1',
            timestamp: Date.now(),
            author: 'test',
            version: '1.0',
            source: 'test'
          },
          validate(): boolean { return true; },
          serialize(): string { return JSON.stringify(this); },
          getSize(): number { return JSON.stringify(this).length; }
        }
      ];

      const conflicts = await syncEngine.detectConflicts(operations);

      // In the mock implementation, we expect no conflicts
      expect(conflicts).toHaveLength(0);
    });
  });
});