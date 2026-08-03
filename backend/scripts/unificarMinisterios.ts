/**
 * Unifica ministérios duplicados em nomes canônicos.
 *
 * A coleção 'ministerios' acumulou nomes que são o mesmo ministério grafado de
 * formas diferentes (Audio/Áudio, Video/Vídeo, diaconia/Diaconia/Diaconato...),
 * porque a importação de planilha cria um ministério novo quando não encontra o
 * nome exato. Este script escolhe um doc sobrevivente por grupo, aponta todos os
 * membros para ele e apaga os demais.
 *
 * Trata as DUAS formas de vínculo existentes na base:
 *   - usuarios.ministerioId  -> referência ao doc (117 membros)
 *   - usuarios.ministerios[] -> array de nomes soltos (9 membros)
 *
 * Uso:
 *   npx ts-node -r tsconfig-paths/register scripts/unificarMinisterios.ts
 *   npx ts-node -r tsconfig-paths/register scripts/unificarMinisterios.ts --apply
 *
 * Sem --apply nada é gravado: só imprime o plano.
 * Com --apply, grava um backup em backend/backups/ antes de qualquer escrita.
 */

import * as fs from 'fs';
import * as path from 'path';
// env carrega backend/.env.dev automaticamente
import '../src/config/env';
import { db } from '../src/infrastructure/firebase/client';

const APPLY = process.argv.includes('--apply');

/**
 * Nome canônico + as grafias que devem ser absorvidas por ele.
 * O casamento é por igualdade EXATA da forma normalizada, nunca por "contém" —
 * assim nomes compostos legítimos ("Audio / Teatro", "produção e teatro",
 * "Kids e produção") não são afetados.
 */
const CANONICOS: { nome: string; aliases: string[] }[] = [
	{ nome: 'Vídeo', aliases: ['video'] },
	{ nome: 'Produção', aliases: ['producao'] },
	{ nome: 'Salas de Cura', aliases: ['salas de cura', 'sala de cura'] },
	{ nome: 'UV', aliases: ['uv'] },
	{ nome: 'Áudio', aliases: ['audio'] },
	{ nome: 'Diaconato', aliases: ['diaconato', 'diaconia'] },
	{ nome: 'Teatro', aliases: ['teatro'] },
];

const norm = (s?: unknown) =>
	String(s ?? '')
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.trim();

type MinisterioDoc = { id: string; nome: string; membrosPorId: number };

async function main() {
	console.log(APPLY ? '=== MODO APLICAR (vai gravar) ===\n' : '=== DRY RUN (nada será gravado) ===\n');

	const [minsSnap, usersSnap] = await Promise.all([
		db.collection('ministerios').get(),
		db.collection('usuarios').get(),
	]);

	const membrosPorId: Record<string, string[]> = {};
	usersSnap.docs.forEach((d) => {
		const mid = d.data().ministerioId as string | undefined;
		if (mid) (membrosPorId[mid] = membrosPorId[mid] ?? []).push(d.id);
	});

	const todos: MinisterioDoc[] = minsSnap.docs.map((d) => ({
		id: d.id,
		nome: String(d.data().nome ?? ''),
		membrosPorId: (membrosPorId[d.id] ?? []).length,
	}));

	const renomear: { id: string; de: string; para: string }[] = [];
	const repontar: { usuarioId: string; de: string; para: string; nomeCanonico: string }[] = [];
	const apagar: MinisterioDoc[] = [];
	const renomearNoArray: { usuarioId: string; de: string; para: string }[] = [];

	for (const canonico of CANONICOS) {
		const grupo = todos.filter((m) => canonico.aliases.includes(norm(m.nome)));

		if (grupo.length === 0) {
			console.log(`- ${canonico.nome}: nenhum doc encontrado, ignorando`);
			continue;
		}

		// Sobrevivente: o que tem mais membros; empate -> o que já tem o nome certo.
		const sobrevivente = grupo.slice().sort(
			(a, b) =>
				b.membrosPorId - a.membrosPorId ||
				(norm(b.nome) === norm(canonico.nome) && b.nome === canonico.nome ? 1 : 0) -
					(norm(a.nome) === norm(canonico.nome) && a.nome === canonico.nome ? 1 : 0),
		)[0];

		const outros = grupo.filter((m) => m.id !== sobrevivente.id);

		console.log(`* ${canonico.nome}`);
		console.log(`    mantém  "${sobrevivente.nome}" (${sobrevivente.membrosPorId} membro(s)) id=${sobrevivente.id}`);

		if (sobrevivente.nome !== canonico.nome) {
			renomear.push({ id: sobrevivente.id, de: sobrevivente.nome, para: canonico.nome });
			console.log(`    renomeia "${sobrevivente.nome}" -> "${canonico.nome}"`);
		}

		for (const outro of outros) {
			for (const usuarioId of membrosPorId[outro.id] ?? []) {
				repontar.push({ usuarioId, de: outro.id, para: sobrevivente.id, nomeCanonico: canonico.nome });
			}
			apagar.push(outro);
			console.log(
				`    absorve "${outro.nome}" (${outro.membrosPorId} membro(s)) -> apaga id=${outro.id}`,
			);
		}
		console.log('');
	}

	// Nomes soltos no array 'ministerios' que precisam virar a grafia canônica.
	const canonicoPorAlias = new Map<string, string>();
	CANONICOS.forEach((c) => c.aliases.forEach((a) => canonicoPorAlias.set(a, c.nome)));

	usersSnap.docs.forEach((d) => {
		const arr = d.data().ministerios;
		if (!Array.isArray(arr)) return;
		arr.forEach((nome: unknown) => {
			const alvo = canonicoPorAlias.get(norm(nome));
			if (alvo && String(nome) !== alvo) {
				renomearNoArray.push({ usuarioId: d.id, de: String(nome), para: alvo });
			}
		});
	});

	console.log('--- RESUMO ---');
	console.log(`renomear doc de ministério : ${renomear.length}`);
	console.log(`membros a reapontar        : ${repontar.length}`);
	console.log(`nomes a corrigir no array  : ${renomearNoArray.length}`);
	console.log(`ministérios a apagar       : ${apagar.length}`);
	if (apagar.length) console.log(`   ${apagar.map((a) => JSON.stringify(a.nome)).join(', ')}`);

	if (!APPLY) {
		console.log('\nDry run: nada foi gravado. Rode com --apply para executar.');
		return;
	}

	// ---- backup antes de escrever ----
	const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
	const dir = path.resolve(__dirname, '..', 'backups', `ministerios-${stamp}`);
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, 'ministerios.json'),
		JSON.stringify(minsSnap.docs.map((d) => ({ id: d.id, ...d.data() })), null, 2),
		'utf8',
	);
	const afetados = new Set([...repontar.map((r) => r.usuarioId), ...renomearNoArray.map((r) => r.usuarioId)]);
	fs.writeFileSync(
		path.join(dir, 'usuarios-afetados.json'),
		JSON.stringify(
			usersSnap.docs.filter((d) => afetados.has(d.id)).map((d) => ({ id: d.id, ...d.data() })),
			null,
			2,
		),
		'utf8',
	);
	console.log(`\nbackup gravado em: ${dir}`);

	// ---- aplicar ----
	const batch = db.batch();

	renomear.forEach((r) => batch.update(db.collection('ministerios').doc(r.id), { nome: r.para }));
	repontar.forEach((r) => batch.update(db.collection('usuarios').doc(r.usuarioId), { ministerioId: r.para }));

	// Corrige os nomes dentro do array preservando os demais itens.
	const porUsuario = new Map<string, { de: string; para: string }[]>();
	renomearNoArray.forEach((r) => porUsuario.set(r.usuarioId, [...(porUsuario.get(r.usuarioId) ?? []), r]));
	porUsuario.forEach((trocas, usuarioId) => {
		const atual = usersSnap.docs.find((d) => d.id === usuarioId)!.data().ministerios as unknown[];
		const novo = atual.map((n) => trocas.find((t) => t.de === String(n))?.para ?? n);
		batch.update(db.collection('usuarios').doc(usuarioId), { ministerios: novo });
	});

	apagar.forEach((a) => batch.delete(db.collection('ministerios').doc(a.id)));

	await batch.commit();
	console.log('APLICADO com sucesso.');
}

main()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error('ERRO:', e?.message ?? e);
		process.exit(1);
	});
