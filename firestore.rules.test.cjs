/**
 * Testa firestore.rules no emulador — nunca contra producao.
 *
 * Rode com:
 *   npm run test:rules
 *
 * REQUER JAVA instalado e no PATH: o emulador do Firestore roda na JVM. Sem
 * Java o comando falha com "Could not spawn `java -version`". Nao amarrei o
 * deploy:rules a este teste justamente por isso — instale o Java para poder
 * usa-lo (e vale usar, porque cobre os casos negativos sem tocar em producao).
 *
 * Cobre os dois lados: quem DEVE conseguir ler e, principalmente, quem NAO
 * deve. Uma regra que nao nega de verdade nao protege nada.
 */
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

const PROJETO = 'shepher-rules-test';
let falhas = 0;

async function verificar(descricao, promessa) {
  try {
    await promessa;
    console.log(`  OK    ${descricao}`);
  } catch (e) {
    falhas++;
    console.log(` FALHA  ${descricao}`);
    console.log(`        ${e.message.split('\n')[0]}`);
  }
}

(async () => {
  const env = await initializeTestEnvironment({
    projectId: PROJETO,
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, 'firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });

  // Popula a base ignorando as regras, como o Admin SDK faz em producao.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc('usuarios/adm-1').set({ nome: 'ADM', funcao: 'ADM', ativo: true, email: 'adm@x.com' });
    await db.doc('usuarios/pastor-1').set({ nome: 'Pastor', funcao: 'PASTOR', ativo: true, email: 'p@x.com' });
    await db.doc('usuarios/lider-1').set({ nome: 'Lider', funcao: 'DISCIPULADOR', ativo: true, email: 'l@x.com' });
    await db.doc('usuarios/discipulo-1').set({ nome: 'Discipulo', funcao: 'DISCIPULO', ativo: true, email: 'd@x.com' });
    await db.doc('usuarios/lider-inativo').set({ nome: 'Inativo', funcao: 'DISCIPULADOR', ativo: false, email: 'i@x.com' });
    await db.doc('usuarios/sem-campo-ativo').set({ nome: 'Legado', funcao: 'PASTOR', email: 'legado@x.com' });
    await db.doc('ministerios/min-1').set({ nome: 'Louvor', ativo: true });
    await db.doc('historicoFuncoes/h-1').set({ usuarioId: 'lider-1', funcaoNova: 'DISCIPULADOR' });
    await db.doc('outraColecao/x-1').set({ segredo: true });
  });

  const como = (uid) => env.authenticatedContext(uid).firestore();
  const anonimo = () => env.unauthenticatedContext().firestore();

  console.log('\n=== QUEM DEVE LER (lideres ativos) ===');
  for (const uid of ['adm-1', 'pastor-1', 'lider-1']) {
    const db = como(uid);
    await verificar(`${uid}: le o proprio documento`, assertSucceeds(db.doc(`usuarios/${uid}`).get()));
    await verificar(`${uid}: le documento de outra pessoa`, assertSucceeds(db.doc('usuarios/discipulo-1').get()));
    await verificar(`${uid}: le a colecao inteira`, assertSucceeds(db.collection('usuarios').get()));
    await verificar(`${uid}: consulta por email (fallback do login)`, assertSucceeds(db.collection('usuarios').where('email', '==', 'adm@x.com').get()));
    await verificar(`${uid}: le ministerios`, assertSucceeds(db.collection('ministerios').get()));
    await verificar(`${uid}: le historicoFuncoes`, assertSucceeds(db.collection('historicoFuncoes').get()));
  }
  // Documento legado sem o campo 'ativo' deve continuar valendo (ativo != false)
  await verificar('sem-campo-ativo: doc sem o campo ativo ainda le', assertSucceeds(como('sem-campo-ativo').collection('usuarios').get()));

  console.log('\n=== QUEM NAO DEVE LER ===');
  await verificar('anonimo: negado', assertFails(anonimo().collection('usuarios').get()));
  await verificar('anonimo: negado no proprio doc', assertFails(anonimo().doc('usuarios/adm-1').get()));
  await verificar('DISCIPULO: negado (nao tem acesso ao sistema)', assertFails(como('discipulo-1').collection('usuarios').get()));
  await verificar('DISCIPULO: negado ate no proprio doc', assertFails(como('discipulo-1').doc('usuarios/discipulo-1').get()));
  await verificar('lider INATIVO: negado', assertFails(como('lider-inativo').collection('usuarios').get()));
  await verificar('conta SEM documento de membro: negado', assertFails(como('conta-nova-qualquer').collection('usuarios').get()));
  await verificar('conta SEM documento: negado em ministerios', assertFails(como('conta-nova-qualquer').collection('ministerios').get()));

  console.log('\n=== ESCRITA PELO CLIENTE (sempre negada) ===');
  await verificar('ADM: nao cria usuario', assertFails(como('adm-1').doc('usuarios/novo').set({ nome: 'X' })));
  await verificar('ADM: nao edita usuario', assertFails(como('adm-1').doc('usuarios/discipulo-1').update({ nome: 'Hackeado' })));
  await verificar('ADM: nao apaga usuario', assertFails(como('adm-1').doc('usuarios/discipulo-1').delete()));
  await verificar('ADM: nao edita o proprio perfil', assertFails(como('adm-1').doc('usuarios/adm-1').update({ funcao: 'ADM' })));
  await verificar('ADM: nao mexe em ministerios', assertFails(como('adm-1').doc('ministerios/min-1').set({ nome: 'X' })));
  await verificar('ADM: nao mexe em historicoFuncoes', assertFails(como('adm-1').doc('historicoFuncoes/h-2').set({ x: 1 })));

  console.log('\n=== COLECOES NAO DECLARADAS ===');
  await verificar('ADM: nao le colecao desconhecida', assertFails(como('adm-1').collection('outraColecao').get()));
  await verificar('ADM: nao escreve em colecao desconhecida', assertFails(como('adm-1').doc('outraColecao/x-2').set({ x: 1 })));

  await env.cleanup();
  console.log(falhas === 0 ? '\nTODOS OS TESTES DE REGRA PASSARAM' : `\n${falhas} TESTE(S) DE REGRA FALHARAM`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('ERRO INESPERADO:', e.message);
  process.exit(1);
});
