/**
 * CivicAI Image URL Resolver Utility
 *
 * Resolves complaint image URLs across all environments (local disk & Cloudinary).
 *
 * Rules:
 * 1. Cloudinary / external HTTPS / HTTP / protocol-relative URLs are returned directly.
 * 2. Base64 Data URIs (e.g. data:image/...) are returned directly.
 * 3. Legacy/local relative paths (e.g. /uploads/... or uploads/...) are prepended
 *    with the backend server base URL, avoiding double slashes.
 * 4. Null, undefined, empty string, or malformed non-string inputs safely return null.
 *
 * @param {string|null|undefined} rawUrl - The image URL from the complaint record
 * @returns {string|null} Resolved accessible image URL or null
 */
export function getComplaintImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  // 1. Base64 Data URI
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // 2. Cloudinary / Absolute HTTP / HTTPS / Protocol-relative URLs
  if (/^(https?:)?\/\//i.test(trimmed)) {
    return trimmed;
  }

  // 3. Relative local/legacy path (e.g. /uploads/civic_... or uploads/civic_...)
  // Derive backend server origin from VITE_IMAGE_BASE_URL or VITE_API_BASE_URL
  const envObj = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
  const apiBase = envObj.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
  let serverBase = envObj.VITE_IMAGE_BASE_URL;

  if (!serverBase) {
    try {
      // If apiBase is an absolute URL, parse it to extract origin and any non-api prefix
      const parsed = new URL(apiBase, window?.location?.origin || 'http://localhost:5173');
      const cleanPath = parsed.pathname.replace(/\/api(\/v\d+)?\/?$/i, '');
      serverBase = `${parsed.origin}${cleanPath}`.replace(/\/+$/, '');
    } catch {
      serverBase = apiBase.replace(/\/api(\/v\d+)?\/?$/i, '').replace(/\/+$/, '');
    }
  }

  serverBase = (serverBase || 'http://localhost:5000').replace(/\/+$/, '');
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return `${serverBase}${normalizedPath}`;
}
