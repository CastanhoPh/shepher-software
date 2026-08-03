// ATENÇÃO: importe SEMPRE o subpath específico (`firebase-functions/v2/https`).
//
// Nunca importe o barrel `firebase-functions/v2`: ele carrega todos os
// providers, inclusive o de Realtime Database, que exige `@firebase/app` —
// um módulo que NÃO é instalado no deploy (só as dependências de
// backend/package.json vão para a nuvem). Localmente o erro fica invisível,
// porque o node_modules da raiz do monorepo tem o SDK web `firebase` do
// frontend fornecendo `@firebase/app`; na Cloud Function o container morre no
// boot com "Cannot find module '@firebase/app'".
import { onRequest } from 'firebase-functions/v2/https';
import { createApp } from './app';

/**
 * Entrypoint do Cloud Functions (2ª geração).
 *
 * O Firebase Hosting reescreve `/api/**` para esta function (firebase.json),
 * então o frontend fala com o backend na MESMA origem — sem URL externa,
 * sem CORS e sem cold start de 20s de servidor gratuito.
 *
 * REGIÃO: southamerica-east1, a MESMA do banco Firestore.
 *
 * Isso não é detalhe: o handler faz várias consultas em sequência e, quando a
 * function rodava em us-central1 (Iowa) com o banco em São Paulo, cada uma
 * pagava a ida e volta entre os continentes. Ficar junto do banco — e também
 * mais perto de quem usa o sistema, no Brasil — corta essa latência.
 *
 * Ao mudar daqui, atualize também o `region` do rewrite no firebase.json.
 */
export const REGION = 'southamerica-east1';

export const api = onRequest(
	{
		region: REGION,
		memory: '512MiB',
		// O Hosting corta a requisição em 60s; o extra vale para chamadas diretas
		// à URL da function (ex.: importação grande de Excel).
		timeoutSeconds: 120,
		concurrency: 40,
		// Teto de instâncias para não haver surpresa na fatura.
		maxInstances: 10,
		// Chamável pelo navegador; a autorização real é o Firebase ID token
		// validado no authMiddleware.
		invoker: 'public',
		cors: false,
	},
	createApp(),
);
