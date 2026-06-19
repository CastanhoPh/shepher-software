import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { User } from '../types';
import { authService } from '../services/api';
import { auth, firebaseConfigError } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  impersonatedUser: User | null;
  realUser: User | null;
  impersonate: (target: User) => void;
  stopImpersonating: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [realUser, setRealUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const user = impersonatedUser ?? realUser;
  const setUser = setRealUser;

  const impersonate = (target: User) => {
    if (realUser?.role !== 'ADM') return;
    if (target.id === realUser.id) return;
    setImpersonatedUser(target);
  };
  const stopImpersonating = () => setImpersonatedUser(null);

  useEffect(() => {
    if (!auth) {
      console.error(firebaseConfigError || 'Firebase nao configurado.');
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const freshToken = await firebaseUser.getIdToken();
        setToken(freshToken);

        // Busca o perfil diretamente do Firestore via authService
        const response = await authService.me();
        setUser(response.usuario);
      } catch (error) {
        console.error('Erro ao recuperar perfil do Firestore:', error);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, senha: string) => {
    if (!auth) throw new Error('Firebase não inicializado');

    try {
      const response = await authService.login(email, senha);
      setToken(response.token);
      setUser(response.usuario);
    } catch (error: any) {
      console.error('Erro no login:', error);
      // Mensagem amigável para erro de credenciais
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('E-mail ou senha incorretos. Tente novamente.');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setToken(null);
      setUser(null);
      setImpersonatedUser(null);
    }
  };

  const refreshUser = async () => {
    if (!auth || !auth.currentUser) return;

    try {
      const response = await authService.me();
      setUser(response.usuario);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser, impersonatedUser, realUser, impersonate, stopImpersonating }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
