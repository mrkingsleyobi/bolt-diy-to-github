/**
 * Helper functions for ZIP extraction example
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as archiver from 'archiver';
import { createWriteStream } from 'fs';

/**
 * Creates a test ZIP file with the specified content
 */
export async function createTestZip(
  filePath: string,
  files: Array<{ name: string; content: string }>
): Promise<void> {
  const output = createWriteStream(filePath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level
  });

  // Pipe archive data to the file
  archive.pipe(output);

  // Append files
  for (const file of files) {
    archive.append(file.content, { name: file.name });
  }

  // Finalize the archive
  await archive.finalize();
}