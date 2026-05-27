import { db } from './backend/src/infrastructure/database/firebase/client';

async function test() {
  const users = await db.collection('usuarios').get();
  console.log('Total users:', users.size);
  users.docs.forEach(doc => {
    const data = doc.data();
    console.log(\`ID: \${doc.id}, Nome: \${data.nome}, Funcao: \${data.funcao}, Ativo: \${data.ativo}, SupervisorId: \${data.supervisorId}\`);
  });
}

test();
