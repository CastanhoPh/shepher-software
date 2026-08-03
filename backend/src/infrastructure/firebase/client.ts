import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { env } from '@config/env';

if (!getApps().length) {
	if (env.serviceAccount) {
		// Execução local: usa a chave de service account do .env.dev
		initializeApp({
			credential: cert(env.serviceAccount),
			projectId: env.serviceAccount.projectId,
		});
	} else {
		// Cloud Functions: a service account do projeto já está disponível como
		// Application Default Credential — nenhuma chave privada é necessária.
		initializeApp({
			credential: applicationDefault(),
			projectId: env.projectId,
		});
	}
}

export const db = getFirestore();
export const auth = getAuth();
export { Timestamp, FieldValue };

/** Converte um DocumentSnapshot para objeto plain-JS, transformando Timestamps em ISO strings. */
export function docToData(
	doc: FirebaseFirestore.DocumentSnapshot,
): Record<string, unknown> | null {
	if (!doc.exists) return null;
	const raw = doc.data()!;
	const result: Record<string, unknown> = { id: doc.id };
	for (const [key, value] of Object.entries(raw)) {
		if (value && typeof value === 'object' && typeof (value as any).toDate === 'function') {
			result[key] = (value as any).toDate().toISOString();
		} else {
			result[key] = value;
		}
	}
	return result;
}
