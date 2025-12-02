import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: { email: string; password: string; name?: string; cpf?: string; rg?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
};

// Crypto
export const cryptoApi = {
  list: (params?: { limit?: number; offset?: number; search?: string }) =>
    api.get('/crypto', { params }),
  getById: (id: number) =>
    api.get(`/crypto/${id}`),
  getHistory: (id: number, timeframe: string) =>
    api.get(`/crypto/${id}/history`, { params: { timeframe } }),
};

// Sources
export const sourcesApi = {
  list: () =>
    api.get('/sources'),
  search: (query?: string) =>
    api.get('/sources/search', { params: { q: query } }),
  validate: (id: number) =>
    api.post(`/sources/${id}/validate`),
  stats: () =>
    api.get('/sources/stats'),
  add: (data: { name: string; url: string; type?: string }) =>
    api.post('/sources', data),
  delete: (id: number) =>
    api.delete(`/sources/${id}`),
};

// Analysis
export const analysisApi = {
  top25: () =>
    api.get('/analysis/top25'),
  history: (cryptoId: number, limit?: number) =>
    api.get(`/analysis/${cryptoId}/history`, { params: { limit } }),
  refresh: () =>
    api.post('/analysis/refresh'),
};

// Simulation
export const simulationApi = {
  list: () =>
    api.get('/simulation'),
  create: (data: { cryptoId: number; amount?: number; days?: number }) =>
    api.post('/simulation', data),
  top25: () =>
    api.get('/simulation/top25'),
  portfolio: () =>
    api.get('/simulation/portfolio'),
  addToPortfolio: (data: { cryptoId: number; amount: number }) =>
    api.post('/simulation/portfolio', data),
};

// Admin
export const adminApi = {
  stats: () =>
    api.get('/admin/stats'),
  collect: () =>
    api.post('/admin/collect'),
  validateSources: () =>
    api.post('/admin/validate-sources'),
  analyze: () =>
    api.post('/admin/analyze'),
  users: () =>
    api.get('/admin/users'),
  updateUser: (id: number, data: { isAdmin: boolean }) =>
    api.patch(`/admin/users/${id}`, data),
  updateCrypto: (id: number, data: { isTracked: boolean }) =>
    api.patch(`/admin/cryptocurrencies/${id}/track`, data),
  logs: () =>
    api.get('/admin/logs'),
};

export default api;
