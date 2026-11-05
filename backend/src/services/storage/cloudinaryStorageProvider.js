const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

class CloudinaryStorageProvider {
  constructor(config = {}) {
    this.name = 'cloudinary';
    this.cloudName = config.cloudName || process.env.CLOUDINARY_CLOUD_NAME || '';
    this.apiKey = config.apiKey || process.env.CLOUDINARY_API_KEY || '';
    this.apiSecret = config.apiSecret || process.env.CLOUDINARY_API_SECRET || '';

    this._isConfigured = Boolean(this.cloudName && this.apiKey && this.apiSecret);

    if (this._isConfigured) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
        secure: true
      });
    }
  }

  /**
   * Check whether Cloudinary has valid credentials configured
   */
  isConfigured() {
    return this._isConfigured;
  }

  /**
   * Upload image buffer to Cloudinary
   * @param {Buffer} buffer
   * @param {string} mimeType
   * @param {string} extension
   * @returns {Promise<{ url: string, storageKey: string, mimeType: string, provider: string }>}
   */
  async upload(buffer, mimeType, extension) {
    if (!this._isConfigured) {
      throw new Error(
        'Cloudinary is not configured. Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET.'
      );
    }

    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const publicId = `complaint_${Date.now()}_${randomSuffix}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'civicai/complaints',
          public_id: publicId,
          resource_type: 'image',
          timeout: 25000, // 25s timeout
          overwrite: false
        },
        (error, result) => {
          if (error) {
            // Mask any internal secrets in error message
            const safeError = new Error(
              `Cloudinary upload error: ${error.message || 'Unknown network or authentication failure'}`
            );
            safeError.code = error.http_code === 401 ? 'CLOUDINARY_AUTH_ERROR' : 'CLOUDINARY_UPLOAD_ERROR';
            safeError.status = error.http_code || 500;
            return reject(safeError);
          }

          if (!result || !result.secure_url) {
            return reject(new Error('Cloudinary response did not include a secure_url.'));
          }

          resolve({
            url: result.secure_url,
            storageKey: result.public_id,
            mimeType,
            provider: 'cloudinary'
          });
        }
      );

      // Handle stream pipe errors
      uploadStream.on('error', (streamErr) => {
        reject(new Error(`Cloudinary upload stream failed: ${streamErr.message}`));
      });

      uploadStream.end(buffer);
    });
  }

  /**
   * Deletes an asset by public_id
   * @param {string} publicId
   */
  async delete(publicId) {
    if (!this._isConfigured || !publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (err) {
      console.warn(`⚠️ [CloudinaryStorageProvider] Could not delete asset "${publicId}":`, err.message);
    }
  }
}

module.exports = {
  CloudinaryStorageProvider
};
