const dotenv = require('dotenv');
const path = require('path');

// Ensure .env is loaded from backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPPORTED_STORAGE_PROVIDERS = ['local', 'cloudinary'];

function validateEnv(env = process.env) {
  const errors = [];

  if (!env.MONGODB_URI) {
    errors.push('MONGODB_URI is required. Please specify it in backend/.env');
  }

  if (!env.JWT_SECRET || env.JWT_SECRET === 'replace_with_a_secure_jwt_secret_key') {
    if (env.NODE_ENV === 'production') {
      errors.push('JWT_SECRET must be configured with a secure key in production');
    }
  }

  // Storage provider validation
  const rawProvider = env.STORAGE_PROVIDER ? env.STORAGE_PROVIDER.trim().toLowerCase() : '';
  const storageProvider = rawProvider || (env.NODE_ENV === 'production' && env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' : 'local');

  if (rawProvider && !SUPPORTED_STORAGE_PROVIDERS.includes(rawProvider)) {
    errors.push(
      `Invalid STORAGE_PROVIDER "${env.STORAGE_PROVIDER}". Supported providers: ${SUPPORTED_STORAGE_PROVIDERS.map((p) => `"${p}"`).join(', ')}.`
    );
  }

  // Cloudinary credential requirements
  if (storageProvider === 'cloudinary') {
    const missingCloudinary = [];
    if (!env.CLOUDINARY_CLOUD_NAME) missingCloudinary.push('CLOUDINARY_CLOUD_NAME');
    if (!env.CLOUDINARY_API_KEY) missingCloudinary.push('CLOUDINARY_API_KEY');
    if (!env.CLOUDINARY_API_SECRET) missingCloudinary.push('CLOUDINARY_API_SECRET');

    if (missingCloudinary.length > 0) {
      if (env.NODE_ENV === 'production') {
        errors.push(
          `Production configuration error: STORAGE_PROVIDER is set to "cloudinary", but required credentials are missing: ${missingCloudinary.join(', ')}. Silent fallback to local disk storage is prohibited in production.`
        );
      } else if (rawProvider === 'cloudinary') {
        errors.push(
          `STORAGE_PROVIDER is set to "cloudinary", but required credentials are missing: ${missingCloudinary.join(', ')}.`
        );
      }
    }
  }

  if (errors.length > 0) {
    console.error('❌ [Environment Configuration Error]');
    errors.forEach((err) => console.error(`  - ${err}`));
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }

  return {
    port: parseInt(env.PORT, 10) || 5000,
    mongoUri: env.MONGODB_URI,
    jwtSecret: env.JWT_SECRET || 'dev_jwt_secret_civicai_2026',
    clientOrigin: env.CLIENT_ORIGIN || 'http://localhost:5173',
    nodeEnv: env.NODE_ENV || 'development',
    geminiApiKey: env.GEMINI_API_KEY || env.AI_PROVIDER_API_KEY || '',
    geminiModel: env.GEMINI_MODEL || env.AI_MODEL || 'gemini-2.5-flash',
    aiProviderApiKey: env.GEMINI_API_KEY || env.AI_PROVIDER_API_KEY || '',
    aiModel: env.GEMINI_MODEL || env.AI_MODEL || 'gemini-2.5-flash',
    adminSeed: {
      email: env.ADMIN_SEED_EMAIL || 'admin@civicai.org',
      password: env.ADMIN_SEED_PASSWORD || 'CivicAdmin#2026',
      name: env.ADMIN_SEED_NAME || 'Municipal Administrator'
    },
    storage: {
      provider: storageProvider,
      cloudinary: {
        cloudName: env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: env.CLOUDINARY_API_KEY || '',
        apiSecret: env.CLOUDINARY_API_SECRET || ''
      }
    }
  };
}

const config = validateEnv();

module.exports = config;
module.exports.validateEnv = validateEnv;
module.exports.SUPPORTED_STORAGE_PROVIDERS = SUPPORTED_STORAGE_PROVIDERS;
