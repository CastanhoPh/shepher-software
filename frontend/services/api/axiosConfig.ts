import axios, { AxiosError, AxiosInstance, AxiosRequestHeaders } from 'axios';
import { auth } from '../../lib/firebase';

/**
 * URL base da API.
 *
 * O padrão é o caminho relativo `/api`: em produção o Firebase Hosting reescreve
 * `/api/**` para a Cloud Function (ver firebase.json) e em dev o Vite faz proxy
 * de `/api` para o backend local. Em ambos os casos é a MESMA origem do
 * frontend — sem host fixo no bundle e sem CORS.
 *
 * VITE_API_URL só precisa ser definida para apontar para um backend em outra
 * origem (situação incomum).
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // O Hosting encerra a requisição em 60s; falhamos um pouco antes com erro claro.
  timeout: 55_000,
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

/**
 * Normaliza a mensagem de erro.
 *
 * O backend responde `{ status: 'error', message }`. A UI já lê
 * `error.response?.data?.message`, então preservamos `error.response` intacto e
 * apenas melhoramos `error.message` — que antes vinha como "Request failed with
 * status code 500" — para os casos em que a UI cai no fallback.
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const backendMessage = error.response?.data?.message;

    if (backendMessage) {
      error.message = backendMessage;
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      error.message = 'A requisição demorou demais e foi cancelada. Tente novamente.';
    } else if (!error.response) {
      error.message = 'Não foi possível falar com o servidor. Verifique sua conexão.';
    }

    return Promise.reject(error);
  }
);
