import axios, { AxiosInstance, AxiosRequestHeaders } from 'axios';
import { auth } from '../../lib/firebase';

// Configurar a URL base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Criar instância do Axios
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token Firebase em todas as requisições
api.interceptors.request.use(
  async (config) => {
    if (!auth) {
      return config;
    }

    const token = await auth.currentUser?.getIdToken();
    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      } as AxiosRequestHeaders;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);
