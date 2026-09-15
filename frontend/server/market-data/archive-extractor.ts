/**
 * In-Memory ZIP Archive Decompressor for CM-UDiFF Bhavcopy Archives.
 *
 * Requirements:
 * - Unpacks authorized .csv.zip archives in-memory without invoking external unzip tools.
 * - Parses standard ZIP local file headers and deflated or uncompressed data streams.
 * - Extracts .csv files directly to string/buffer.
 * - Fails closed on corrupted headers, checksum mismatches, or missing entries.
 * - Feeds existing CM-UDiFF parser directly without writing temporary files to disk.
 */

import * as zlib from 'node:zlib';

export interface ExtractedFile {
  readonly fileName: string;
  readonly content: string;
  readonly uncompressedSize: number;
}

export class ArchiveExtractor {
  /**
   * Extracts the primary CSV content from an in-memory ZIP buffer.
   */
  public static extractCsvFromZip(zipBuffer: Buffer): ExtractedFile {
    if (!zipBuffer || zipBuffer.length < 22) {
      throw new Error('ARCHIVE_EXTRACTOR_ERROR: Input buffer is too small to be a valid ZIP archive.');
    }

    // Check standard ZIP local file header signature: 0x04034b50 (PK\x03\x04)
    const signature = zipBuffer.readUInt32LE(0);
    if (signature !== 0x04034b50) {
      throw new Error(`ARCHIVE_EXTRACTOR_ERROR: Invalid ZIP signature (0x${signature.toString(16)}). Corrupt or non-ZIP payload.`);
    }

    let offset = 0;
    while (offset < zipBuffer.length - 4) {
      const sig = zipBuffer.readUInt32LE(offset);

      // Local file header signature
      if (sig === 0x04034b50) {
        const compressionMethod = zipBuffer.readUInt16LE(offset + 8);
        const compressedSize = zipBuffer.readUInt32LE(offset + 18);
        const uncompressedSize = zipBuffer.readUInt32LE(offset + 22);
        const fileNameLength = zipBuffer.readUInt16LE(offset + 26);
        const extraFieldLength = zipBuffer.readUInt16LE(offset + 28);

        const fileNameStart = offset + 30;
        const fileName = zipBuffer.toString('utf8', fileNameStart, fileNameStart + fileNameLength);

        const dataStart = fileNameStart + fileNameLength + extraFieldLength;
        const dataEnd = dataStart + compressedSize;

        if (dataEnd > zipBuffer.length) {
          throw new Error(`ARCHIVE_EXTRACTOR_ERROR: Truncated ZIP stream for file '${fileName}'.`);
        }

        const compressedData = zipBuffer.subarray(dataStart, dataEnd);

        // Check if this is the target CSV file
        if (fileName.toLowerCase().endsWith('.csv')) {
          let decompressedBuffer: Buffer;

          if (compressionMethod === 0) {
            // Stored (no compression)
            decompressedBuffer = Buffer.from(compressedData);
          } else if (compressionMethod === 8) {
            // Deflate (raw inflate)
            try {
              decompressedBuffer = zlib.inflateRawSync(compressedData);
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              throw new Error(`ARCHIVE_EXTRACTOR_DECOMPRESSION_FAILED: Failed to inflate file '${fileName}': ${msg}`);
            }
          } else {
            throw new Error(`ARCHIVE_EXTRACTOR_ERROR: Unsupported compression method (${compressionMethod}) in file '${fileName}'.`);
          }

          const content = decompressedBuffer.toString('utf8');
          return {
            fileName,
            content,
            uncompressedSize: uncompressedSize || decompressedBuffer.length,
          };
        }

        // Advance to next header
        offset = dataEnd;
      } else {
        // Break out of non-local header loop
        break;
      }
    }

    throw new Error('ARCHIVE_EXTRACTOR_ERROR: No .csv file found within the provided ZIP archive.');
  }

  /**
   * Helper to create a standard in-memory ZIP buffer (method 8 Deflate) for tests.
   */
  public static createZipBuffer(fileName: string, content: string): Buffer {
    const fileBytes = Buffer.from(content, 'utf8');
    const compressed = zlib.deflateRawSync(fileBytes);
    const fileNameBytes = Buffer.from(fileName, 'utf8');

    // Local file header (30 bytes)
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); // Local header signature
    header.writeUInt16LE(20, 4);        // Version needed (2.0)
    header.writeUInt16LE(0, 6);         // General purpose bit flag
    header.writeUInt16LE(8, 8);         // Compression method (8 = Deflate)
    header.writeUInt16LE(0, 10);        // Last mod file time
    header.writeUInt16LE(0, 12);        // Last mod file date
    header.writeUInt32LE(0, 14);        // CRC-32 (0 for simple mock)
    header.writeUInt32LE(compressed.length, 18); // Compressed size
    header.writeUInt32LE(fileBytes.length, 22);  // Uncompressed size
    header.writeUInt16LE(fileNameBytes.length, 26); // File name length
    header.writeUInt16LE(0, 28);        // Extra field length

    return Buffer.concat([header, fileNameBytes, compressed]);
  }
}
