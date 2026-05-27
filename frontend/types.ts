export type Role = 'ADM' | 'PASTOR' | 'DISCIPULADOR' | 'DISCIPULO';

export type UserId = string;

export interface User {
  id: UserId;
  name: string;
  role: Role;
  email: string;
  password?: string;
  senha?: string; // Backend usa 'senha' em vez de 'password'
  pastorId?: UserId | null;
  discipuladorId?: UserId | null;
  contato?: string;
  ministerio?: string;
  ministerios?: string[];
  atividade: number;
  batizado: boolean;
  g12: boolean;
  universidadeDaVida: string;
  capacitacaoDestino: string;
  sexo: 'M' | 'F';
  nascimento?: string;
  // Computed property for internal use
  isUser?: boolean;
}

export interface StatData {
  avgAge: string;
  genderData: { name: string; value: number }[];
  baptismData: { name: string; value: number }[];
  uvData: { name: string; value: number }[];
  cdData: { name: string; percentage: number }[];
}

export type ViewState = 'login' | 'dashboard' | 'analytics' | 'pastors' | 'leaders' | 'disciples' | 'study_prep' | 'form';