/**
 * Migra IDs de documentos em `usuarios` de UIDs aleatórios (ex.: `3LB526IBs8eKj09...`)
 * para slugs derivados do nome (ex.: `agleston-teruo-hirano`).
 *
 * Passos por usuário:
 *  1) Gera slug do nome (com sufixo numérico se colidir).
 *  2) Copia o doc para o novo ID e atualiza todos os `supervisorId` que apontam para o ID antigo.
 *  3) Para ADM/PASTOR/DISCIPULADOR: recria o usuário no Firebase Auth com UID = slug,
 *     reaproveitando email/senha (senha é resetada — exige reenvio aos usuários).
 *  4) Deleta o doc antigo e o usuário Auth antigo.
 *
 * Uso (a partir de backend/):
 *   - Dry-run (não escreve nada):
 *       npx ts-node -r tsconfig-paths/register scripts/migrarIdsParaSlug.ts
 *   - Aplicar mudanças:
 *       npx ts-node -r tsconfig-paths/register scripts/migrarIdsParaSlug.ts --apply
 *   - Pular Auth (só Firestore):
 *       npx ts-node -r tsconfig-paths/register scripts/migrarIdsParaSlug.ts --apply --skip-auth
 */

import 'dotenv/config';
import { auth, db } from '../src/infrastructure/firebase/client';

const APPLY = process.argv.includes('--apply');
const SKIP_AUTH = process.argv.includes('--skip-auth');
const SENHA_PADRAO_ARG = process.argv.find((a) => a.startsWith('--senha-padrao='));
const SENHA_PADRAO = SENHA_PADRAO_ARG ? SENHA_PADRAO_ARG.split('=').slice(1).join('=') : undefined;

function slugify(text: string): string {
	return text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
}

function isLikelySlug(id: string): boolean {
	// slug: minúsculas, dígitos e hífens; precisa ter pelo menos um hífen.
	return /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(id);
}

async function reservarSlug(base: string, jaReservados: Set<string>): Promise<string> {
	let candidato = base;
	let sufixo = 2;
	while (jaReservados.has(candidato) || (await db.collection('usuarios').doc(candidato).get()).exists) {
		candidato = `${base}-${sufixo}`;
		sufixo++;
	}
	jaReservados.add(candidato);
	return candidato;
}

async function main() {
	console.log(`Modo: ${APPLY ? 'APLICAR' : 'DRY-RUN'}${SKIP_AUTH ? ' (sem Auth)' : ''}`);

	const snap = await db.collection('usuarios').get();
	console.log(`Total de usuários: ${snap.size}`);

	const renomeios: { oldId: string; newId: string; nome: string; funcao: string; email?: string }[] = [];
	const reservados = new Set<string>();

	for (const doc of snap.docs) {
		const data = doc.data();
		const nome = (data.nome as string) || '';
		const funcao = (data.funcao as string) || 'DISCIPULO';
		const email = data.email as string | undefined;

		if (isLikelySlug(doc.id)) {
			continue;
		}

		const base = slugify(nome);
		if (!base) {
			console.warn(`! Ignorando ${doc.id}: nome inválido para slug ("${nome}")`);
			continue;
		}

		const newId = await reservarSlug(base, reservados);
		renomeios.push({ oldId: doc.id, newId, nome, funcao, email });
	}

	console.log(`Usuários a renomear: ${renomeios.length}`);
	renomeios.forEach((r) => console.log(`  - ${r.oldId}  ->  ${r.newId}   (${r.funcao} — ${r.nome})`));

	if (!APPLY) {
		console.log('\nDry-run concluído. Rode com --apply para executar.');
		return;
	}

	const mapaIds = new Map(renomeios.map((r) => [r.oldId, r.newId]));

	for (const r of renomeios) {
		console.log(`\n>> ${r.oldId} -> ${r.newId}`);

		const oldRef = db.collection('usuarios').doc(r.oldId);
		const newRef = db.collection('usuarios').doc(r.newId);

		const oldSnap = await oldRef.get();
		if (!oldSnap.exists) {
			console.warn('  (doc antigo não existe mais, pulando)');
			continue;
		}
		const oldData = oldSnap.data()!;

		// supervisorId pode também estar sendo renomeado nesta rodada
		const supervisorIdAtual = oldData.supervisorId as string | undefined;
		const novoSupervisorId =
			supervisorIdAtual && mapaIds.has(supervisorIdAtual) ? mapaIds.get(supervisorIdAtual)! : supervisorIdAtual ?? null;

		await newRef.set({
			...oldData,
			supervisorId: novoSupervisorId,
		});
		console.log('  doc copiado');

		// Reaponta quem tinha esse usuário como supervisor (paginado pelo Firestore)
		const dependentes = await db.collection('usuarios').where('supervisorId', '==', r.oldId).get();
		if (!dependentes.empty) {
			const batch = db.batch();
			dependentes.docs.forEach((dep) => {
				const depFinalId = mapaIds.get(dep.id) ?? dep.id;
				if (depFinalId === dep.id) {
					batch.update(dep.ref, { supervisorId: r.newId });
				}
				// se o próprio dependente também será renomeado, será reescrito com supervisorId correto na cópia dele
			});
			await batch.commit();
			console.log(`  ${dependentes.size} dependentes atualizados`);
		}

		// Histórico de funções: usuarioId e alteradoPorId
		const [histUsuario, histAlterador] = await Promise.all([
			db.collection('historicoFuncoes').where('usuarioId', '==', r.oldId).get(),
			db.collection('historicoFuncoes').where('alteradoPorId', '==', r.oldId).get(),
		]);
		if (!histUsuario.empty || !histAlterador.empty) {
			const batch = db.batch();
			histUsuario.docs.forEach((h) => batch.update(h.ref, { usuarioId: r.newId }));
			histAlterador.docs.forEach((h) => batch.update(h.ref, { alteradoPorId: r.newId }));
			await batch.commit();
			console.log(`  histórico atualizado (usuarioId: ${histUsuario.size}, alteradoPorId: ${histAlterador.size})`);
		}

		// Firebase Auth — só para quem tem login (ADM/PASTOR/DISCIPULADOR)
		// Importante: o email é único no Auth, então temos que DELETAR o usuário antigo
		// antes de criar o novo. Caso contrário cai em `auth/email-already-exists`.
		if (!SKIP_AUTH && (r.funcao === 'ADM' || r.funcao === 'PASTOR' || r.funcao === 'DISCIPULADOR')) {
			try {
				const oldUser = await auth.getUser(r.oldId).catch(() => null);
				if (!oldUser) {
					console.log('  Auth antigo não encontrado, pulando');
				} else {
					const emailPreservado = oldUser.email ?? r.email;
					const displayPreservado = oldUser.displayName ?? r.nome;
					const emailVerifiedPreservado = oldUser.emailVerified;
					const disabledPreservado = oldUser.disabled;

					await auth.deleteUser(r.oldId);

					const senhaUsada = SENHA_PADRAO ?? gerarSenhaTemporaria();
					await auth.createUser({
						uid: r.newId,
						email: emailPreservado,
						displayName: displayPreservado,
						emailVerified: emailVerifiedPreservado,
						disabled: disabledPreservado,
						password: senhaUsada,
					});

					if (SENHA_PADRAO) {
						console.log(`  Auth recriado com senha padrão.`);
					} else if (emailPreservado) {
						try {
							const link = await auth.generatePasswordResetLink(emailPreservado);
							console.log(`  Auth recriado. Link de reset: ${link}`);
						} catch (e: any) {
							console.warn(`  Auth recriado, mas falhou gerar link de reset: ${e.message ?? e}`);
						}
					} else {
						console.log('  Auth recriado (sem email — não foi possível gerar link de reset)');
					}
				}
			} catch (err: any) {
				console.error(`  ! Erro no Auth: ${err.message ?? err}`);
			}
		}

		// Apaga doc antigo
		await oldRef.delete();
		console.log('  doc antigo removido');
	}

	console.log('\nMigração concluída. Verificando consistência…');
	await verificarConsistencia();
}

async function verificarConsistencia(): Promise<void> {
	const snap = await db.collection('usuarios').get();
	const idsExistentes = new Set(snap.docs.map((d) => d.id));

	let referenciasOrfas = 0;
	let authFaltando = 0;

	for (const doc of snap.docs) {
		const d = doc.data();
		const supId = d.supervisorId as string | undefined;
		if (supId && !idsExistentes.has(supId)) {
			console.warn(`! ${doc.id} (${d.nome}) referencia supervisorId inexistente: ${supId}`);
			referenciasOrfas++;
		}

		if (!SKIP_AUTH) {
			const funcao = d.funcao as string;
			if (funcao === 'ADM' || funcao === 'PASTOR' || funcao === 'DISCIPULADOR') {
				const authUser = await auth.getUser(doc.id).catch(() => null);
				if (!authUser) {
					console.warn(`! ${doc.id} (${funcao}) sem usuário no Firebase Auth`);
					authFaltando++;
				}
			}
		}
	}

	console.log(`\nReferências de supervisor órfãs: ${referenciasOrfas}`);
	if (!SKIP_AUTH) console.log(`Usuários Auth faltando: ${authFaltando}`);
	if (referenciasOrfas === 0 && authFaltando === 0) {
		console.log('OK: nenhum problema encontrado.');
	}
}

function gerarSenhaTemporaria(): string {
	// 16 chars aleatórios — usuário precisará redefinir
	return Array.from({ length: 16 }, () => Math.random().toString(36).slice(2, 3)).join('') + 'A1!';
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
