import { User } from '../../../types';

export interface LoginRequest {
  email: string;
  senha: string;
}

/**
 * Retorno de `authService.login` e `authService.me`.
 *
 * Os dois devolvem o mesmo formato: o login e feito com o Firebase Auth no
 * cliente e o perfil vem do Firestore, entao em ambos os casos temos o ID
 * token junto com o usuario.
 */
export interface AuthResponse {
  token: string;
  usuario: User;
}

/** @deprecated use AuthResponse */
export type LoginResponse = AuthResponse;

/** @deprecated use AuthResponse — `me()` tambem devolve o token */
export type AuthMeResponse = AuthResponse;
