import api, { setAuthToken } from './api';

export const authService = {
  /**
   * Register a new resident account
   */
  async register({ name, email, password }) {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.data?.token) {
      setAuthToken(res.data.token);
    }
    return res.data.user;
  },

  /**
   * Authenticate citizen or admin
   */
  async login({ email, password }) {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.token) {
      setAuthToken(res.data.token);
    }
    return res.data.user;
  },

  /**
   * Genuine session invalidation and cookie clearing
   */
  async logout() {
    try {
      await api.post('/auth/logout', {});
    } catch (err) {
      console.warn('Logout API warning:', err.message);
    } finally {
      setAuthToken(null);
    }
  },

  /**
   * Restore user session from HttpOnly cookie
   */
  async getMe() {
    const res = await api.get('/auth/me');
    return res.data.user;
  }
};

export default authService;
