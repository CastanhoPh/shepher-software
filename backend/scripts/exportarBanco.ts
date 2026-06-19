/**
 * Exporta todas as coleções relevantes do Firestore para arquivos JSON locais.
 * Também exporta os usuários do Firebase Auth (uid, email, displayName, etc).
 *
 * Saída: backend/backups/<timestamp>/
 *   - usuarios.json
 *   - ministerios.json
 *   - historicoFuncoes.json
 *   - auth.json
 *   - resumo.json
 *
 * Uso (a partir de backend/):
 *   npx ts-node -r tsconfig-paths/register scripts/exportarBanco.ts
 *
 * Para incluir coleções extras, passe os nomes como argumentos:
 *   npx ts-node -r tsconfig-paths/register scripts/exportarBanco.ts celulas estudos
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { auth, db } from '../src/infrastructure/firebase/client';

const COLECOES_PADRAO = ['usuarios', 'ministerios', 'historicoFuncoes'];

function timestamp(): string {
	const d = new Date();
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function serializar(value: unknown): unknown {
	if (value === null || value === undefined) return value;
	if (Array.isArray(value)) return value.map(serializar);
	if (typeof value === 'object') {
		// Timestamp do Firestore
		if (typeof (value as any).toDate === 'function') {
			return { __type: 'timestamp', iso: (value as any).toDate().toISOString() };
		}
		// DocumentReference
		if (typeof (value as any).path === 'string' && typeof (value as any).id === 'string') {
			return { __type: 'reference', path: (value as any).path };
		}
		// GeoPoint
		if (
			typeof (value as any).latitude === 'number' &&
			typeof (value as any).longitude === 'number' &&
			Object.keys(value as any).length === 2
		) {
			return { __type: 'geopoint', lat: (value as any).latitude, lng: (value as any).longitude };
		}
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			out[k] = serializar(v);
		}
		return out;
	}
	return value;
}

async function exportarColecao(nome: string, dir: string): Promise<number> {
	const snap = await db.collection(nome).get();
	const docs = snap.docs.map((d) => ({ id: d.id, data: serializar(d.data()) }));
	const arquivo = path.join(dir, `${nome}.json`);
	fs.writeFileSync(arquivo, JSON.stringify(docs, null, 2), 'utf8');
	console.log(`  ${nome}: ${docs.length} docs -> ${path.basename(arquivo)}`);
	return docs.length;
}

async function exportarAuth(dir: string): Promise<number> {
	const usuarios: any[] = [];
	let pageToken: string | undefined = undefined;
	do {
		const result = await auth.listUsers(1000, pageToken);
		for (const u of result.users) {
			usuarios.push({
				uid: u.uid,
				email: u.email ?? null,
				emailVerified: u.emailVerified,
				displayName: u.displayName ?? null,
				disabled: u.disabled,
				phoneNumber: u.phoneNumber ?? null,
				metadata: {
					creationTime: u.metadata.creationTime,
					lastSignInTime: u.metadata.lastSignInTime,
				},
				providerData: u.providerData.map((p) => ({
					providerId: p.providerId,
					uid: p.uid,
					email: p.email ?? null,
				})),
			});
		}
		pageToken = result.pageToken;
	} while (pageToken);
	const arquivo = path.join(dir, 'auth.json');
	fs.writeFileSync(arquivo, JSON.stringify(usuarios, null, 2), 'utf8');
	console.log(`  auth: ${usuarios.length} usuários -> auth.json`);
	return usuarios.length;
}

async function main() {
	const extras = process.argv.slice(2);
	const colecoes = [...COLECOES_PADRAO, ...extras];

	const baseDir = path.resolve(__dirname, '..', 'backups');
	const dir = path.join(baseDir, timestamp());
	fs.mkdirSync(dir, { recursive: true });

	console.log(`Exportando para: ${dir}\n`);

	const contagem: Record<string, number> = {};
	for (const nome of colecoes) {
		try {
			contagem[nome] = await exportarColecao(nome, dir);
		} catch (err: any) {
			console.error(`  ! Erro em ${nome}: ${err.message ?? err}`);
			contagem[nome] = -1;
		}
	}

	try {
		contagem['auth'] = await exportarAuth(dir);
	} catch (err: any) {
		console.error(`  ! Erro no Auth: ${err.message ?? err}`);
		contagem['auth'] = -1;
	}

	const resumo = {
		exportadoEm: new Date().toISOString(),
		projeto: process.env.FIREBASE_PROJECT_ID,
		contagem,
	};
	fs.writeFileSync(path.join(dir, 'resumo.json'), JSON.stringify(resumo, null, 2), 'utf8');

	console.log('\nExportação concluída.');
	console.log(JSON.stringify(resumo, null, 2));
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
