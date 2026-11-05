const ALLOWED_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates binary magic bytes to ensure file contents genuinely match image types
 * @param {Buffer} buffer
 * @returns {string|null} detected MIME type or null
 */
function detectMimeFromMagicBytes(buffer) {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WEBP: RIFF (bytes 0-3: 52 49 46 46) and WEBP (bytes 8-11: 57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Validates a base64 Data URI string, checks size, MIME header, and actual magic bytes
 * @param {string} base64DataUri
 * @returns {{ buffer: Buffer, mimeType: string, extension: string }}
 */
function validateBase64Image(base64DataUri) {
  if (!base64DataUri || typeof base64DataUri !== 'string') {
    throw new Error('Image data must be a non-empty string.');
  }

  const matches = base64DataUri.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid image format. Expected a base64 Data URI (e.g. data:image/jpeg;base64,...).');
  }

  const declaredMime = matches[1].toLowerCase();
  const base64Data = matches[2];

  const extension = ALLOWED_MIME_TYPES[declaredMime];
  if (!extension) {
    throw new Error(`Unsupported image type "${declaredMime}". Allowed formats: JPEG, PNG, WEBP.`);
  }

  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length === 0) {
    throw new Error('Image file is empty.');
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
    throw new Error(`Image size exceeds 5 MB limit (actual: ${sizeMb} MB).`);
  }

  // Deep content validation: verify binary magic bytes
  const verifiedMime = detectMimeFromMagicBytes(buffer);
  if (!verifiedMime) {
    // If not matching JPEG/PNG/WEBP magic bytes, reject disguised files
    throw new Error('File content signature does not match a valid JPEG, PNG, or WEBP image.');
  }

  return {
    buffer,
    mimeType: verifiedMime,
    extension: ALLOWED_MIME_TYPES[verifiedMime] || extension,
    base64Data
  };
}

module.exports = {
  validateBase64Image,
  detectMimeFromMagicBytes,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES
};
