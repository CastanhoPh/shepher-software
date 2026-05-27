import { db, docToData } from '@infrastructure/firebase/client';
import type { Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';

export class UsuarioRepository {
  async findById(id: string): Promise<Record<string, unknown> | null> {
    const doc = await db.collection('usuarios').doc(id).get();
    return docToData(doc);
  }

  async findRawById(id: string): Promise<FirebaseFirestore.DocumentSnapshot> {
    return db.collection('usuarios').doc(id).get();
  }

  async findActiveRawById(id: string): Promise<FirebaseFirestore.DocumentSnapshot | null> {
    const doc = await db.collection('usuarios').doc(id).get();
    if (!doc.exists || doc.data()?.ativo === false) return null;
    return doc;
  }

  async findMinisterioById(id: string): Promise<Record<string, unknown> | null> {
    const doc = await db.collection('ministerios').doc(id).get();
    return docToData(doc);
  }

  async findSupervisorBasicById(id: string): Promise<{ id: string; nome: unknown; funcao: unknown } | null> {
    const doc = await db.collection('usuarios').doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    return { id: doc.id, nome: data.nome, funcao: data.funcao };
  }

  async getUsuarioDocById(id: string): Promise<FirebaseFirestore.DocumentSnapshot> {
    return db.collection('usuarios').doc(id).get();
  }

  async getMinisterioDocById(id: string): Promise<FirebaseFirestore.DocumentSnapshot> {
    return db.collection('ministerios').doc(id).get();
  }

  async getDiscipulosBySupervisorId(supervisorId: string): Promise<FirebaseFirestore.QuerySnapshot> {
    return db
      .collection('usuarios')
      .where('supervisorId', '==', supervisorId)
      .select('id', 'nome', 'email', 'funcao', 'fotoUrl', 'ativo')
      .get();
  }

  async getDiscipulosDiretosIds(supervisorId: string): Promise<string[]> {
    const snap = await db
      .collection('usuarios')
      .where('supervisorId', '==', supervisorId)
      .select('ativo')
      .get();
    // Filtra em memória para permitir documentos sem o campo 'ativo'
    return snap.docs.filter(d => d.data().ativo !== false).map((d) => d.id);
  }

  async createUsuarioDoc(id: string, data: Record<string, unknown>): Promise<void> {
    await db.collection('usuarios').doc(id).set(data);
  }

  async updateUsuarioDoc(id: string, data: Record<string, unknown>): Promise<void> {
    await db.collection('usuarios').doc(id).update(data);
  }

  async getAllActiveUsuarioIds(): Promise<string[]> {
    const snap = await db.collection('usuarios').select('ativo').get();
    return snap.docs.filter(d => d.data().ativo !== false).map((d) => d.id);
  }

  async queryAdminUsuarios(
    filters: {
      funcao?: unknown;
      genero?: unknown;
      supervisor_id?: unknown;
      ministerio_id?: unknown;
      batizado?: unknown;
    },
    pageNum: number,
    limitNum: number,
  ): Promise<{ docs: QueryDocumentSnapshot[]; total: number }> {
    let firestoreQuery: Query = db.collection('usuarios');
    if (filters.funcao) firestoreQuery = firestoreQuery.where('funcao', '==', filters.funcao);
    if (filters.genero) firestoreQuery = firestoreQuery.where('genero', '==', filters.genero);
    if (filters.supervisor_id) firestoreQuery = firestoreQuery.where('supervisorId', '==', filters.supervisor_id);
    if (filters.ministerio_id) firestoreQuery = firestoreQuery.where('ministerioId', '==', filters.ministerio_id);
    if (filters.batizado !== undefined) firestoreQuery = firestoreQuery.where('batizado', '==', filters.batizado === 'true');
    firestoreQuery = firestoreQuery.orderBy('nome');

    const snap = await firestoreQuery.get();
    // Filtro manual para 'ativo' para suportar documentos sem o campo
    const allActiveDocs = snap.docs.filter(d => d.data().ativo !== false);
    
    const total = allActiveDocs.length;
    const pagedDocs = allActiveDocs.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return { docs: pagedDocs as QueryDocumentSnapshot[], total };
  }

  async fetchDocsByIds(
    collection: string,
    ids: string[],
  ): Promise<QueryDocumentSnapshot[]> {
    if (ids.length === 0) return [];
    const result: QueryDocumentSnapshot[] = [];
    for (let i = 0; i < ids.length; i += 30) {
      const batch = ids.slice(i, i + 30);
      const refs = batch.map((id) => db.collection(collection).doc(id));
      const snaps = await db.getAll(...refs);
      result.push(...(snaps.filter((s) => s.exists) as QueryDocumentSnapshot[]));
    }
    return result;
  }

  async batchCountDiscipulos(ids: string[]): Promise<Record<string, number>> {
    if (ids.length === 0) return {};
    const counts: Record<string, number> = {};
    ids.forEach((id) => (counts[id] = 0));

    for (let i = 0; i < ids.length; i += 30) {
      const batch = ids.slice(i, i + 30);
      const snap = await db
        .collection('usuarios')
        .where('supervisorId', 'in', batch)
        .select('supervisorId', 'ativo')
        .get();
      snap.docs.forEach((doc) => {
        const d = doc.data();
        if (d.ativo === false) return;
        const supId = d.supervisorId as string;
        if (supId && counts[supId] !== undefined) counts[supId]++;
      });
    }
    return counts;
  }

  async findMinisterioByNome(nome: string): Promise<FirebaseFirestore.QuerySnapshot> {
    return db.collection('ministerios').where('nome', '==', nome).limit(1).get();
  }

  async createMinisterio(nome: string, dataCadastro: FirebaseFirestore.FieldValue): Promise<string> {
    const ref = db.collection('ministerios').doc();
    await ref.set({
      nome,
      ativo: true,
      dataCadastro,
    });
    return ref.id;
  }

  async runPromocaoTransaction(params: {
    id: string;
    userId: string;
    funcaoAnterior: string;
    novaFuncao: string;
    motivo: string;
    dataAtualizacao: FirebaseFirestore.FieldValue;
    dataAlteracao: FirebaseFirestore.FieldValue;
  }): Promise<void> {
    const { id, userId, funcaoAnterior, novaFuncao, motivo, dataAtualizacao, dataAlteracao } = params;
    await db.runTransaction(async (tx) => {
      tx.update(db.collection('usuarios').doc(id), {
        funcao: novaFuncao,
        dataAtualizacao,
      });
      tx.set(db.collection('historicoFuncoes').doc(), {
        usuarioId: id,
        funcaoAnterior,
        funcaoNova: novaFuncao,
        alteradoPorId: userId,
        dataAlteracao,
        motivo,
      });
    });
  }
}
