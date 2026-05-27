import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { User } from '../../../types';

export interface DashboardEstatisticas {
  totais: {
    discipulos: number;
    g12_diretos: number;
    celula: number;
    rede_completa: number;
  };
  espirituais: {
    batizados: number;
    universidade_vida: number;
    capacitacao_destino_1: number;
    capacitacao_destino_2: number;
    capacitacao_destino_3: number;
  };
  demograficos: {
    homens: number;
    mulheres: number;
    faixas_etarias: Record<string, number>;
  };
}

/**
 * Serviço de Dashboard (Calculando estatísticas no Frontend para dispensar backend)
 */
export const dashboardService = {
  /**
   * Obter estatísticas do dashboard diretamente do Firestore
   */
  async obterEstatisticas(): Promise<DashboardEstatisticas> {
    if (!db) throw new Error('Firestore não inicializado');

    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef);
    const querySnapshot = await getDocs(q);
    
    const usuarios = querySnapshot.docs
      .filter(doc => doc.data().ativo !== false)
      .map(doc => ({ id: doc.id, ...doc.data() as any }));

    const total = usuarios.length;
    const batizados = usuarios.filter(u => u.batizado === true || u.batizado === 'Sim').length;
    const uv = usuarios.filter(u => u.universidadeVida === true || u.universidadeDaVida === 'Sim').length;
    
    const cd1 = usuarios.filter(u => u.capacitacaoDestino1 === true || (u.capacitacaoDestino && u.capacitacaoDestino.includes('Nível 1'))).length;
    const cd2 = usuarios.filter(u => u.capacitacaoDestino2 === true || (u.capacitacaoDestino && u.capacitacaoDestino.includes('Nível 2'))).length;
    const cd3 = usuarios.filter(u => u.capacitacaoDestino3 === true || (u.capacitacaoDestino && (u.capacitacaoDestino.includes('Nível 3') || u.capacitacaoDestino === 'Concluído'))).length;

    const homens = usuarios.filter(u => u.genero === 'M' || u.sexo === 'M').length;
    const mulheres = usuarios.filter(u => u.genero === 'F' || u.sexo === 'F').length;

    const g12 = usuarios.filter(u => u.funcao === 'DISCIPULADOR' || u.role === 'DISCIPULADOR' || u.funcao === 'PASTOR' || u.role === 'PASTOR').length;
    const celula = usuarios.filter(u => u.funcao === 'DISCIPULO' || u.role === 'DISCIPULO').length;

    return {
      totais: {
        discipulos: total,
        g12_diretos: g12,
        celula: celula,
        rede_completa: total,
      },
      espirituais: {
        batizados,
        universidade_vida: uv,
        capacitacao_destino_1: cd1,
        capacitacao_destino_2: cd2,
        capacitacao_destino_3: cd3,
      },
      demograficos: {
        homens,
        mulheres,
        faixas_etarias: {
          '0-12': 0,
          '13-17': 0,
          '18-25': 0,
          '26-35': 0,
          '36-50': 0,
          '51+': 0,
        },
      },
    };
  },

  /**
   * Obter hierarquia diretamente do Firestore
   */
  async obterHierarquia(userId: string): Promise<any> {
    if (!db) throw new Error('Firestore não inicializado');
    
    const docRef = doc(db, 'usuarios', userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) throw new Error('Usuário não encontrado');
    
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('supervisorId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const discipulos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      usuario: { id: docSnap.id, ...docSnap.data() },
      discipulos_diretos: discipulos
    };
  }
};
