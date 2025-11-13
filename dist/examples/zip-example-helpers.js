"use strict";
/**
 * Helper functions for ZIP extraction example
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestZip = createTestZip;
const archiver_1 = __importDefault(require("archiver"));
const fs_1 = require("fs");
/**
 * Creates a test ZIP file with the specified content
 */
async function createTestZip(filePath, files) {
    const output = (0, fs_1.createWriteStream)(filePath);
    const archive = (0, archiver_1.default)('zip', {
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
//# sourceMappingURL=zip-example-helpers.js.map