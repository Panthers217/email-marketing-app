import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Firebase token to requests
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (idToken: string) => 
    api.post('/auth/login', { idToken }),
  logout: () => api.post('/auth/logout'),
  verify: () => api.post('/auth/verify'),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data: any) => api.post('/settings', data),
  testResend: (testEmail: string) => api.post('/settings/test-resend', { testEmail }),
  testMongo: () => api.post('/settings/test-mongo'),
};

export const recipientsAPI = {
  list: (params?: { search?: string; tag?: string; searchField?: string; type?: string }) => api.get('/recipients', { params }),
  create: (data: any) => api.post('/recipients', data),
  update: (id: string, data: any) => api.put(`/recipients/${id}`, data),
  bulkCreate: (emails: string[], type: 'church' | 'artist' = 'church') => api.post('/recipients/bulk', { emails, type }),
  bulkCreateCSV: (csvData: string) => api.post('/recipients/bulk-csv', { csvData }),
  delete: (id: string) => api.delete(`/recipients/${id}`),
};

export const campaignsAPI = {
  list: () => api.get('/campaigns'),
  get: (id: string) => api.get(`/campaigns/${id}`),
  create: (data: any) => api.post('/campaigns', data),
  update: (id: string, data: any) => api.put(`/campaigns/${id}`, data),
  send: (id: string, data: any) => api.post(`/campaigns/${id}/send`, data),
  getSendStatus: (id: string) => api.get(`/campaigns/${id}/send-status`),
  getPreviousRecipients: (id: string) => api.get(`/campaigns/${id}/previous-recipients`),
  delete: (id: string) => api.delete(`/campaigns/${id}`),
};

export const logsAPI = {
  list: (params?: { status?: string; limit?: number; name?: string; city?: string; county?: string; subject?: string; date?: string; time?: string }) => api.get('/logs', { params }),
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export default api;
