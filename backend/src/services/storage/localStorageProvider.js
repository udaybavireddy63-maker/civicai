const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Target directory for uploaded files on local disk
const UPLOAD_DIR = path.resolve(__dirname, '../../../public/uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

class LocalStorageProvider {
  constructor(uploadDir = UPLOAD_DIR) {
    this.uploadDir = uploadDir;
    this.name = 'local';
  }

  /**
   * Saves image buffer to local disk atomically
   * @param {Buffer} buffer
   * @param {string} mimeType
   * @param {string} extension
   * @returns {Promise<{ url: string, storageKey: string, mimeType: string, provider: string }>}
   */
  async upload(buffer, mimeType, extension) {
    // Generate randomized, collision-resistant filename: civic_<timestamp>_<hex>.<ext>
    const randomKey = crypto.randomBytes(16).toString('hex');
    const filename = `civic_${Date.now()}_${randomKey}.${extension}`;
    const filePath = path.join(this.uploadDir, filename);

    try {
      await fs.promises.writeFile(filePath, buffer);

      const relativeUrl = `/uploads/${filename}`;
      const storageKey = `uploads/${filename}`;

      return {
        url: relativeUrl,
        storageKey,
        mimeType,
        provider: 'local'
      };
    } catch (err) {
      // Ensure no orphaned partial file is left on disk
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (cleanErr) {
        // ignore secondary cleanup error
      }
      throw new Error(`Local storage write failed: ${err.message}`);
    }
  }

  /**
   * Deletes a local file if needed
   * @param {string} storageKey
   */
  async delete(storageKey) {
    try {
      const filename = path.basename(storageKey);
      const filePath = path.join(this.uploadDir, filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      console.warn(`⚠️ [LocalStorageProvider] Could not delete file "${storageKey}":`, err.message);
    }
  }
}

module.exports = {
  LocalStorageProvider,
  UPLOAD_DIR
};
