import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authAPI = {
  login: (password: string) => api.post('/auth/login', { password }),
  logout: () => api.post('/auth/logout'),
  check: () => api.get('/auth/check'),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data: any) => api.post('/settings', data),
  testResend: (testEmail: string) => api.post('/settings/test-resend', { testEmail }),
  testMongo: () => api.post('/settings/test-mongo'),
};

export const recipientsAPI = {
  list: (params?: { search?: string; tag?: string }) => api.get('/recipients', { params }),
  create: (data: any) => api.post('/recipients', data),
  bulkCreate: (emails: string[]) => api.post('/recipients/bulk', { emails }),
  bulkCreateCSV: (csvData: string) => api.post('/recipients/bulk-csv', { csvData }),
  delete: (id: string) => api.delete(`/recipients/${id}`),
};

export const campaignsAPI = {
  list: () => api.get('/campaigns'),
  get: (id: string) => api.get(`/campaigns/${id}`),
  create: (data: any) => api.post('/campaigns', data),
  send: (id: string, data: any) => api.post(`/campaigns/${id}/send`, data),
  delete: (id: string) => api.delete(`/campaigns/${id}`),
};

export const logsAPI = {
  list: (params?: { status?: string; limit?: number }) => api.get('/logs', { params }),
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export default api;
