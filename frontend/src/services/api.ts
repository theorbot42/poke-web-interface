import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401 / token refresh
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
          useAuthStore.setState({ token: data.token, refreshToken: data.refreshToken });
          original.headers.Authorization = `Bearer ${data.token}`;
          return apiClient(original);
        } catch {
          useAuthStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (username: string, email: string, password: string) =>
    apiClient.post('/auth/register', { username, email, password }),
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
  updateMe: (data: { username?: string }) => apiClient.put('/auth/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.put('/auth/change-password', { currentPassword, newPassword }),
  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),
};

export const chatApi = {
  getSessions: () => apiClient.get('/chat/sessions'),
  createSession: (title?: string) => apiClient.post('/chat/sessions', { title }),
  getSession: (sessionId: string) => apiClient.get(`/chat/sessions/${sessionId}`),
  deleteSession: (sessionId: string) => apiClient.delete(`/chat/sessions/${sessionId}`),
  updateSessionTitle: (sessionId: string, title: string) =>
    apiClient.put(`/chat/sessions/${sessionId}/title`, { title }),
  getMessages: (sessionId: string, page = 1) =>
    apiClient.get(`/chat/sessions/${sessionId}/messages?page=${page}`),
  sendMessage: (sessionId: string, content: string) =>
    apiClient.post(`/chat/sessions/${sessionId}/messages`, { content }),
  getHistory: () => apiClient.get('/chat/history'),
  clearHistory: () => apiClient.delete('/chat/history'),
};

export default apiClient;
