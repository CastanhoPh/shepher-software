import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  getAuth
} from 'firebase/auth';
import { 
  getDoc, 
  doc, 
  getFirestore,
  Timestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import { User } from '../../../types';
import { AuthResponse } from './types';

// Adaptador para converter o formato do Firestore para o formato da Interface (Frontend)
const adaptUserFromFirestore = (id: string, u: any): User => {
  let capacitacao = 'Não Iniciou';
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
    ministerios: Array.isArray(u.ministerios) ? u.ministerios : (u.ministerio?.nome ? [u.ministerio.nome] : (typeof u.ministerio === 'string' && u.ministerio ? [u.ministerio] : [])),
    atividade: u.nivelAtividade || u.atividade || 3,
    batizado: u.batizado === true || u.batizado === 'Sim',
    g12: u.funcao === 'PASTOR' || u.funcao === 'DISCIPULADOR' || u.role === 'PASTOR' || u.role === 'DISCIPULADOR' || u.g12 === true,
    universidadeDaVida: u.universidadeVida === true || u.universidadeDaVida === 'Sim' ? 'Sim' : 'Não',
    capacitacaoDestino: u.capacitacaoDestino || capacitacao,
    sexo: u.genero || u.sexo || 'M',
    nascimento: u.dataNascimento instanceof Timestamp ? u.dataNascimento.toDate().toISOString().split('T')[0] : (u.dataNascimento || u.nascimento || ''),
  };
};

/**
 * Serviço de Autenticação (Utilizando Firebase Auth & Firestore diretamente no Frontend)
 */
export const authService = {
  /**
   * Login do usuário utilizando Firebase Auth
   */
  async login(email: string, senha: string): Promise<AuthResponse> {
    if (!auth || !db) throw new Error('Firebase não inicializado');

    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const firebaseUser = userCredential.user;
    const token = await firebaseUser.getIdToken();

    // Buscar dados complementares no Firestore
    const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
    let userDocSnap = await getDoc(userDocRef);
    
    // Caso o usuário exista no Auth mas não no Firestore com o UID (ex: importação manual por email)
    if (!userDocSnap.exists()) {
      const usuariosRef = collection(db, 'usuarios');
      const q = query(usuariosRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          return {
              token,
              usuario: adaptUserFromFirestore(userDoc.id, userDoc.data())
          };
      }
      
      throw new Error('Usuário não encontrado na base de dados (Firestore). Entre em contato com o suporte.');
    }

    return {
      token,
      usuario: adaptUserFromFirestore(userDocSnap.id, userDocSnap.data()),
    };
  },

  /**
   * Logout do usuário
   */
  async logout(): Promise<void> {
    if (!auth) return;
    await signOut(auth);
  },

  /**
   * Buscar perfil do usuário atual logado
   */
  async me(): Promise<AuthResponse> {
    if (!auth || !db || !auth.currentUser) throw new Error('Nenhum usuário logado');

    const firebaseUser = auth.currentUser;
    const token = await firebaseUser.getIdToken();

    const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
    let userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
       const email = firebaseUser.email;
       if (email) {
           const usuariosRef = collection(db, 'usuarios');
           const q = query(usuariosRef, where('email', '==', email));
           const querySnapshot = await getDocs(q);
           
           if (!querySnapshot.empty) {
               const userDoc = querySnapshot.docs[0];
               return {
                   token,
                   usuario: adaptUserFromFirestore(userDoc.id, userDoc.data())
               };
           }
       }
       throw new Error('Perfil não encontrado');
    }

    return {
      token,
      usuario: adaptUserFromFirestore(userDocSnap.id, userDocSnap.data()),
    };
  },
};
