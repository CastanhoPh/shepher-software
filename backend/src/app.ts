import express, { type Express } from 'express';
import cors from 'cors';
import { env } from '@config/env';
import { router } from '@http/routes';
import { errorHandler } from '@http/middlewares/errorHandler';
import { generalRateLimiter } from '@http/middlewares/rateLimiter';
import { AppError } from '@errors/AppError';

/**
 * Monta a aplicação Express.
 *
 * Não chama `listen()` — quem decide isso é o entrypoint:
 * - `index.ts`  -> Cloud Functions (produção)
 * - `server.ts` -> servidor local de desenvolvimento
 *
 * Em produção o app é servido pelo Firebase Hosting no caminho `/api/**` (ver
 * os rewrites em firebase.json), ou seja: mesma origem do frontend. Por isso as
 * rotas continuam montadas sob `/api` — o Hosting repassa o path completo.
 */
export function createApp(): Express {
	const app = express();

	// Desabilita o header X-Powered-By
	app.disable('x-powered-by');

	// Atrás do Firebase Hosting / Cloud Run existe sempre 1 proxy na frente.
	app.set('trust proxy', 1);

	// Como o frontend é servido na mesma origem que a API, o CORS só entra em
	// cena em dev (Vite em outra porta) ou ao chamar a function direto pela URL.
	app.use(
		cors({
			origin: (origin, callback) => {
				if (!origin || env.allowedOrigins.includes(origin)) {
					callback(null, true);
					return;
				}
				callback(new AppError(`Origem não permitida pelo CORS: ${origin}`, 403));
			},
			credentials: true,
		}),
	);

	app.use(express.json({ limit: '1mb' }));
	app.use(express.urlencoded({ extended: true, limit: '1mb' }));

	const health = (_req: express.Request, res: express.Response) => {
		res.json({
			status: 'ok',
			timestamp: new Date().toISOString(),
			environment: env.NODE_ENV,
			runtime: env.isCloudRuntime ? 'cloud-functions' : 'local',
			projectId: env.projectId ?? null,
		});
	};

	// /api/health é o que passa pelo rewrite do Hosting; /health atende chamadas
	// diretas à URL da function e o servidor local.
	app.get('/api/health', health);
	app.get('/health', health);

	app.use('/api', generalRateLimiter);
	app.use('/api', router);

	// Qualquer outra rota sob /api é 404 em JSON (e não o index.html do SPA).
	app.use('/api', (req, _res, next) => {
		next(new AppError(`Rota não encontrada: ${req.method} ${req.originalUrl}`, 404));
	});

	// Handler de erros (deve ser o último middleware)
	app.use(errorHandler);

	return app;
}
