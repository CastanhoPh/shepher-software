import { db } from '@infrastructure/firebase/client';
import { Timestamp } from 'firebase-admin/firestore';

type Role = 'ADM' | 'PASTOR' | 'DISCIPULADOR' | 'DISCIPULO';

export class DashboardRepository {
  async getRedeIds(userId: string, userRole: Role): Promise<string[]> {
    if (userRole === 'ADM') {
      const snap = await db.collection('usuarios').select('ativo').get();
      // Filtra documentos onde 'ativo' não é explicitamente false
      return snap.docs.filter(d => d.data().ativo !== false).map((d) => d.id);
    }
    if (userRole === 'PASTOR') {
      return this.getRedeRecursiva(userId);
    }
    if (userRole === 'DISCIPULADOR') {
      const snap = await db
        .collection('usuarios')
        .where('supervisorId', '==', userId)
        .select('ativo')
        .get();
      const directIds = snap.docs.filter(d => d.data().ativo !== false).map((d) => d.id);
      return [userId, ...directIds];
    }
    return [userId];
  }

  async getUsuarioById(userId: string): Promise<FirebaseFirestore.DocumentSnapshot> {
    return db.collection('usuarios').doc(userId).get();
  }

  async getDiscipulosDiretos(userId: string): Promise<FirebaseFirestore.QuerySnapshot> {
    return db
      .collection('usuarios')
      .where('supervisorId', '==', userId)
      .orderBy('nome')
      .get();
  }

  async fetchBatchUsuarios(ids: string[]): Promise<Record<string, any>[]> {
    const result: Record<string, any>[] = [];
    for (let i = 0; i < ids.length; i += 30) {
      const batch = ids.slice(i, i + 30);
      const refs = batch.map((id) => db.collection('usuarios').doc(id));
      const snaps = await db.getAll(...refs);
      snaps.forEach((snap) => {
        if (snap.exists) {
          const d = snap.data()!;
          if (d.ativo === false) return; // Oculta inativos
          
          let dataNascimento: Date | null = null;
          if (d.dataNascimento instanceof Timestamp) {
            dataNascimento = d.dataNascimento.toDate();
          } else if (d.dataNascimento) {
            const parsed = new Date(d.dataNascimento);
            if (!isNaN(parsed.getTime())) {
              dataNascimento = parsed;
            }
          }

          result.push({
            id: snap.id,
            genero: d.genero,
            dataNascimento,
            batizado: d.batizado === true,
            universidadeVida: d.universidadeVida === true,
            capacitacaoDestino1: d.capacitacaoDestino1 === true,
            capacitacaoDestino2: d.capacitacaoDestino2 === true,
            capacitacaoDestino3: d.capacitacaoDestino3 === true,
            supervisorId: d.supervisorId ?? null,
            funcao: d.funcao
          });
        }
      });
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

  private async getRedeRecursiva(userId: string): Promise<string[]> {
    const ids: string[] = [userId];
    const queue: string[] = [userId];
    const visited = new Set<string>();
    visited.add(userId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const snap = await db
        .collection('usuarios')
        .where('supervisorId', '==', current)
        .select('ativo')
        .get();
      
      for (const doc of snap.docs) {
        const d = doc.data();
        if (d.ativo === false) continue;

        if (!visited.has(doc.id)) {
          ids.push(doc.id);
          queue.push(doc.id);
          visited.add(doc.id);
        }
      }
    }
    return ids;
  }
}
