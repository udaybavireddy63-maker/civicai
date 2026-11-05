const config = require('../../config/env');
const { LocalStorageProvider, UPLOAD_DIR } = require('./localStorageProvider');
const { CloudinaryStorageProvider } = require('./cloudinaryStorageProvider');
const {
  validateBase64Image,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES
} = require('./imageValidator');

// Initialize singleton instances of providers
const localProvider = new LocalStorageProvider(UPLOAD_DIR);
const cloudinaryProvider = new CloudinaryStorageProvider(config.storage?.cloudinary);

const SUPPORTED_PROVIDERS = ['local', 'cloudinary'];

/**
 * Determines which storage provider to use based on configuration and environment
 * Strictly enforces that Cloudinary never falls back to local storage silently.
 *
 * @param {string} [overrideProviderName] - Optional provider name to test/evaluate
 * @returns {LocalStorageProvider | CloudinaryStorageProvider}
 */
function getActiveProvider(overrideProviderName = null) {
  const configuredProvider = (
    overrideProviderName ||
    config.storage?.provider ||
    (config.nodeEnv === 'development' ? 'local' : 'local')
  ).toLowerCase();

  if (!SUPPORTED_PROVIDERS.includes(configuredProvider)) {
    throw new Error(
      `Invalid or unsupported STORAGE_PROVIDER "${configuredProvider}". Supported providers: ${SUPPORTED_PROVIDERS.map((p) => `"${p}"`).join(', ')}.`
    );
  }

  if (configuredProvider === 'cloudinary') {
    if (!cloudinaryProvider.isConfigured()) {
      throw new Error(
        'Cloudinary storage is configured as the active provider, but CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET is missing. Silent fallback to local disk storage is prohibited.'
      );
    }
    return cloudinaryProvider;
  }

  // Development or local provider
  return localProvider;
}

/**
 * Validates and saves an image, delegating to the active storage provider (Local or Cloudinary)
 * Preserves 100% backward compatibility with existing complaint APIs and records.
 *
 * @param {string} base64DataUri - Base64 Data URI or existing relative URL
 * @param {Object} [overrideOptions] - Optional provider override (e.g. for testing)
 * @returns {Promise<{ url: string, storageKey: string, mimeType: string } | null>}
 */
async function saveBase64Image(base64DataUri, overrideOptions = {}) {
  if (!base64DataUri || typeof base64DataUri !== 'string') {
    return null;
  }

  // 1. Backward compatibility: if already a stored URL (local /uploads or external /images or https://)
  if (
    base64DataUri.startsWith('/images/') ||
    base64DataUri.startsWith('/uploads/') ||
    base64DataUri.startsWith('http://') ||
    base64DataUri.startsWith('https://')
  ) {
    return {
      url: base64DataUri,
      storageKey: base64DataUri.replace(/^\//, ''),
      mimeType: 'image/jpeg'
    };
  }

  // 2. Validate format, size limit (5MB), and binary magic bytes
  const { buffer, mimeType, extension } = validateBase64Image(base64DataUri);

  // 3. Select appropriate storage provider (Cloudinary in production/Render, Local in dev)
  const provider = overrideOptions.provider || getActiveProvider(overrideOptions.providerName);

  try {
    const result = await provider.upload(buffer, mimeType, extension);
    return {
      url: result.url,
      storageKey: result.storageKey,
      mimeType: result.mimeType
    };
  } catch (uploadErr) {
    console.error(`❌ [ImageStorage] Upload failed via ${provider.name}:`, uploadErr.message);
    throw uploadErr;
  }
}

/**
 * Get name of currently active storage provider
 */
function getActiveStorageProviderName() {
  return getActiveProvider().name;
}

module.exports = {
  saveBase64Image,
  getActiveProvider,
  getActiveStorageProviderName,
  localProvider,
  cloudinaryProvider,
  LocalStorageProvider,
  CloudinaryStorageProvider,
  SUPPORTED_PROVIDERS,
  UPLOAD_DIR,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES
};
