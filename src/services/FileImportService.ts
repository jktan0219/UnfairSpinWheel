/**
 * FileImportService
 *
 * Reads wheel items from a plain-text CSV file on the Android device's
 * Downloads folder (e.g. Downloads/spinwheel_items.txt).
 *
 * File format (one item per line):
 *   Item Label,weight
 *   Item Label          ← weight defaults to 1
 *
 * When running in a browser (dev mode), this service falls back gracefully
 * with an error rather than crashing.
 */

import { StringHelper } from '@/helpers/StringHelper';

export const ITEMS_FILENAME = 'spinwheel_items.txt';

export interface FileImportResult {
  success: boolean;
  items: { label: string; weight: number }[];
  groupName: string;
  error?: string;
}

export class FileImportService {
  /**
   * Reads `spinwheel_items.txt` from the device's Downloads folder.
   * Uses @capacitor/filesystem when available (Android), falls back to
   * an error message in plain browser environments.
   */
  public static async readItemsFile(): Promise<FileImportResult> {
    try {
      // Dynamically import Capacitor Filesystem so the app still works
      // in a plain browser (dev mode) without crashing at module load time.
      const { Filesystem, Directory } = await import('@capacitor/filesystem');

      const result = await Filesystem.readFile({
        path: ITEMS_FILENAME,
        // Directory.ExternalStorage = Android primary external storage root
        // which includes the Downloads folder on most devices.
        directory: Directory.ExternalStorage
      });

      // result.data is string (base64) or Blob depending on platform/encoding.
      let text: string;
      if (typeof result.data === 'string') {
        // Capacitor returns base64 when no encoding is set — decode it.
        try {
          text = atob(result.data);
        } catch {
          // If atob fails it may already be plain text (some platforms)
          text = result.data;
        }
      } else {
        // Blob — read as text
        text = await (result.data as Blob).text();
      }

      // Strip comment lines (lines starting with #) before parsing
      const stripped = text
        .split('\n')
        .filter((line) => !line.trim().startsWith('#'))
        .join('\n');

      const items = StringHelper.csvParse(stripped, true); // fixWeight=true adds ",1" to bare lines

      if (items.length === 0) {
        return {
          success: false,
          items: [],
          groupName: '',
          error: `File "${ITEMS_FILENAME}" is empty or has no valid items.`
        };
      }

      // Derive group name from filename (without extension)
      const groupName = ITEMS_FILENAME.replace(/\.[^.]+$/, '');

      return { success: true, items, groupName };
    } catch (err: any) {
      const message: string =
        err?.message?.includes('File does not exist') ||
        err?.message?.includes('does not exist') ||
        err?.code === 'ENOENT'
          ? `File not found.\nPlease place "${ITEMS_FILENAME}" in your device's Downloads folder.`
          : `Failed to read file: ${err?.message ?? String(err)}`;

      return { success: false, items: [], groupName: '', error: message };
    }
  }
}
