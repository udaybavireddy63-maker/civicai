const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const TOKEN_KEY = 'civicai_auth_token';
let inMemoryToken = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null;

export function setAuthToken(token) {
  inMemoryToken = token || null;
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    // ignore sessionStorage access errors
  }
}

export function getAuthToken() {
  if (inMemoryToken) return inMemoryToken;
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null;
  } catch {
    return null;
  }
}

/**
 * Custom API Client sending and receiving HttpOnly cookies via credentials: 'include'
 * with Authorization Bearer header support as cross-origin / cross-port defense-in-depth.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = getAuthToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const config = {
    ...options,
    credentials: 'include', // Ensures HttpOnly cookies are sent and stored
    headers: {
      ...defaultHeaders,
      ...authHeader,
      ...options.headers
    }
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    throw new Error('Network error. Please check your connection to the server.');
  }

  const contentType = response.headers.get('content-type');
  let data = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401) {
      setAuthToken(null);
    }
    const errorMsg = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.code = data?.error?.code || 'API_ERROR';
    err.data = data;
    throw err;
  }

  return data;
}

const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' })
};

export default api;
