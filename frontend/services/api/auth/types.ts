import { User } from '../../../types';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  usuario: User;
}

export interface AuthMeResponse {
  usuario: User;
}
