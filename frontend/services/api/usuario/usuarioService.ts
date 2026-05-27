import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';
import { User, UserId } from '../../../types';
import { ImportacaoExcelResponse } from './types';
import { api } from '../axiosConfig';

// Adaptador para converter o formato do Firestore para o formato da Interface (Frontend)
const adaptUserFromFirestore = (id: string, u: any): User => {
  let capacitacao = u.capacitacaoDestino || 'Não Iniciou';
  if (u.capacitacaoDestino3) capacitacao = 'Concluído';
  else if (u.capacitacaoDestino2) capacitacao = 'Nível 2';
  else if (u.capacitacaoDestino1) capacitacao = 'Nível 1';

  return {
    id: id,
    name: u.nome || u.name || '',
    role: u.funcao || u.role || 'DISCIPULO',
    email: u.email || '',
    pastorId: u.supervisorId || u.pastorId || null,
    discipuladorId: u.supervisorId || u.discipuladorId || null,
    contato: u.telefone || u.contato || '',
    ministerio: u.ministerio?.nome || u.ministerio || '',
    atividade: u.nivelAtividade || u.atividade || 3,
    batizado: u.batizado === true || u.batizado === 'Sim',
    g12: u.funcao === 'PASTOR' || u.funcao === 'DISCIPULADOR' || u.role === 'PASTOR' || u.role === 'DISCIPULADOR' || u.g12 === true,
    universidadeDaVida: u.universidadeVida === true || u.universidadeDaVida === 'Sim' ? 'Sim' : 'Não',
    capacitacaoDestino: capacitacao,
    sexo: u.genero || u.sexo || 'M',
    nascimento: u.dataNascimento ? (typeof u.dataNascimento === 'string' ? u.dataNascimento.split('T')[0] : (u.dataNascimento instanceof Timestamp ? u.dataNascimento.toDate().toISOString().split('T')[0] : u.dataNascimento)) : '',
    ministerios: Array.isArray(u.ministerios) ? u.ministerios : (u.ministerio?.nome ? [u.ministerio.nome] : (typeof u.ministerio === 'string' && u.ministerio ? [u.ministerio] : [])),
  };
};

/**
 * Serviço de Usuários
 */
export const usuarioService = {
  /**
   * Listar todos os usuários acessíveis para o usuário atual
   */
  async listar(): Promise<User[]> {
    const response = await api.get<any[]>('/usuarios');
    // Se a API retornar o objeto paginado { data: [...], total: ... }
    const data = (response.data as any).data || response.data;
    return data.map((u: any) => adaptUserFromFirestore(u.id, u));
  },

  /**
   * Buscar usuário por ID
   */
  async buscarPorId(id: UserId): Promise<User | null> {
    const response = await api.get(`/usuarios/${id}`);
    return adaptUserFromFirestore(response.data.id, response.data);
  },

  /**
   * Criar novo usuário via API (para garantir criação no Firebase Authentication)
   */
  async criar(usuario: Partial<User>): Promise<User> {
    const payload = {
      nome: usuario.name,
      email: usuario.email,
      senha: usuario.senha || usuario.password || '123456',
      telefone: usuario.contato,
      genero: usuario.sexo,
      funcao: usuario.role,
      supervisorId: usuario.pastorId || usuario.discipuladorId || null,
      ministerio: usuario.ministerio,
      ministerios: usuario.ministerios || [],
      batizado: usuario.batizado,
      universidadeVida: usuario.universidadeDaVida === 'Sim',
      capacitacaoDestino1: usuario.capacitacaoDestino?.includes('Nível 1'),
      capacitacaoDestino2: usuario.capacitacaoDestino?.includes('Nível 2'),
      capacitacaoDestino3: usuario.capacitacaoDestino?.includes('Nível 3') || usuario.capacitacaoDestino === 'Concluído',
      nivelAtividade: usuario.atividade,
      dataNascimento: usuario.nascimento,
    };

    const response = await api.post('/usuarios', payload);
    return adaptUserFromFirestore(response.data.id, response.data);
  },

  /**
   * Atualizar usuário existente via API
   */
  async atualizar(id: UserId, usuario: Partial<User>): Promise<void> {
    const payload = {
      nome: usuario.name,
      telefone: usuario.contato,
      genero: usuario.sexo,
      ministerio: usuario.ministerio,
      ministerios: usuario.ministerios || [],
      batizado: usuario.batizado,
      universidadeVida: usuario.universidadeDaVida === 'Sim',
      supervisorId: usuario.pastorId || usuario.discipuladorId || null,
      nivelAtividade: usuario.atividade,
      dataNascimento: usuario.nascimento,
      capacitacaoDestino1: usuario.capacitacaoDestino?.includes('Nível 1'),
      capacitacaoDestino2: usuario.capacitacaoDestino?.includes('Nível 2'),
      capacitacaoDestino3: usuario.capacitacaoDestino?.includes('Nível 3') || usuario.capacitacaoDestino === 'Concluído',
    };

    await api.put(`/usuarios/${id}`, payload);
  },

  /**
   * Promover usuário via API
   */
  async promover(id: UserId, novaRole: string): Promise<void> {
    await api.patch(`/usuarios/${id}/promover`, { novaFuncao: novaRole });
  },

  /**
   * Deletar usuário (Desativação lógica) via API
   */
  async deletar(id: UserId): Promise<void> {
    await api.delete(`/usuarios/${id}`);
  },

  /**
   * Atualizar senha
   */
  async atualizarSenha(id: UserId, senhaAtual: string, novaSenha: string): Promise<void> {
    await api.patch(`/usuarios/${id}/senha`, { senhaAtual, novaSenha });
  },

  /**
   * Exportar relatório CSV
   */
  async exportarRelatorioCSV(): Promise<Blob> {
    const response = await api.get('/usuarios/relatorio/exportar', { responseType: 'blob' });
    return response.data;
  },

  /**
   * Baixar modelo de importação XLSX (gerado pelo backend, com aba "Instruções"
   * e comentários nos cabeçalhos explicando cada campo)
   */
  async baixarModeloImportacao(): Promise<void> {
    const response = await api.get('/usuarios/modelo-importacao', { responseType: 'blob' });
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo-importacao-usuarios.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Importar usuários via Excel chamando a API do Backend
   */
  async importarExcel(file: File): Promise<ImportacaoExcelResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ImportacaoExcelResponse>('/usuarios/importar-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};
