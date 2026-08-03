import { env } from '@config/env';
import { createApp } from './app';
import { db } from '@infrastructure/firebase/client';

/**
 * Servidor HTTP para desenvolvimento local (`npm run dev`).
 *
 * Em produção o backend NÃO roda aqui: ele é publicado como Cloud Function
 * (ver src/index.ts) e servido pelo Firebase Hosting em /api/**.
 *
 * O Vite faz proxy de /api para esta porta (frontend/vite.config.ts), então o
 * frontend usa exatamente o mesmo caminho relativo em dev e em produção.
 */
const app = createApp();
const PORT = env.PORT;

const server = app.listen(PORT, async () => {
	try {
		await db.collection('_health').limit(1).get();
		console.log('✅ Conexão com Firebase/Firestore estabelecida');
	} catch (error) {
		console.error('❌ Erro ao conectar com Firebase:', error);
		process.exit(1);
	}

	console.log(`🚀 Backend local na porta ${PORT}`);
	console.log(`📝 Ambiente: ${env.NODE_ENV} | Projeto: ${env.projectId ?? 'desconhecido'}`);
	console.log(`🔗 http://localhost:${PORT}/api`);
	console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

const gracefulShutdown = () => {
	console.log('\n🛑 Encerrando servidor...');

	server.close(() => {
		console.log('✅ Servidor HTTP fechado');
		process.exit(0);
	});

	setTimeout(() => {
		console.error('⚠️ Forçando encerramento do servidor...');
		process.exit(1);
	}, 10_000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export { app };
