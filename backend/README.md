# Sistema Aliança - Backend

API Express em TypeScript, publicada como **Cloud Function** (2ª geração) e
servida pelo Firebase Hosting em `/api/**`. Usa Firebase Authentication e
Cloud Firestore.

## Stack

- Node.js 22 (runtime da function)
- TypeScript
- Express
- Firebase Functions (2ª geração)
- Firebase Admin SDK
- Cloud Firestore
- Zod

## Entrypoints

O app Express é montado em um único lugar (`src/app.ts`) e reaproveitado por
dois entrypoints:

| Arquivo         | Usado em                | Como sobe                       |
|-----------------|-------------------------|---------------------------------|
| `src/index.ts`  | produção                | `firebase deploy --only functions` |
| `src/server.ts` | desenvolvimento local   | `npm run dev` (porta 3000)      |

As rotas ficam montadas sob `/api` nos dois casos: o rewrite do Hosting repassa
o caminho completo para a function, então `/api/usuarios` chega como
`/api/usuarios`.

## Execucao

```bash
npm install
npm run dev          # servidor local em http://localhost:3000
```

Para rodar como function, do jeito que roda em produção (inclui o rewrite do
Hosting de verdade), use os emuladores a partir da raiz do monorepo:

```bash
npm run emulators    # Hosting :5000  |  Functions :5001
```

## Variaveis de ambiente

**Em produção nenhuma variável é obrigatória.** A function autentica no
Firestore e no Auth pela service account do próprio projeto (Application
Default Credentials) — não há chave privada no deploy.

Para desenvolvimento local, preencha `.env.dev` (ignorado pelo git):

- `NODE_ENV`
- `PORT`
- `ALLOWED_ORIGINS` — origens extras para o CORS, separadas por vírgula
- `ADMIN_PROJECT_ID`
- `ADMIN_CLIENT_EMAIL`
- `ADMIN_PRIVATE_KEY`
- `WEB_API_KEY` — Web API key do projeto, usada pelo login via REST
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `RATE_LIMIT_LOGIN_MAX_REQUESTS`

> **Não renomeie `.env.dev` para `.env`.** O Firebase CLI carrega o `.env` da
> pasta de functions automaticamente e **rejeita** chaves com prefixo
> `FIREBASE_` (reservadas pelo runtime), fazendo o deploy falhar. Por isso as
> chaves usam o prefixo `ADMIN_` e o arquivo tem outro nome.

## Autenticacao

O backend valida tokens do Firebase enviados em:

```http
Authorization: Bearer <token>
```

`DISCIPULO` não tem acesso à API (bloqueado no `authMiddleware`).

## Endpoints principais

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/usuarios`
- `GET /api/usuarios/:id`
- `POST /api/usuarios`
- `PUT /api/usuarios/:id`
- `PATCH /api/usuarios/:id/promover`
- `PATCH /api/usuarios/:id/senha`
- `DELETE /api/usuarios/:id`
- `GET /api/usuarios/modelo-importacao`
- `POST /api/usuarios/importar-excel`
- `GET /api/usuarios/relatorio/exportar`
- `GET /api/dashboard/estatisticas`
- `GET /api/dashboard/hierarquia`

## Estrutura

```text
src/
	app.ts            monta o app Express
	index.ts          entrypoint do Cloud Functions
	server.ts         entrypoint local
	config/
	errors/
	http/
		controllers/
		middlewares/
		routes/
	infrastructure/
		firebase/
	repositories/
	services/
	validators/
```

## Pastas que NAO vao para producao

Estas ficam de fora do deploy (ver `functions.ignore` no `firebase.json`):

- `scripts/` — ferramentas de manutencao rodadas a mao com ts-node
  (`exportarBanco`, `migrarIdsParaSlug`, `gerarModeloExemplo`).
- `templates/` — planilhas de **exemplo**, para referencia humana. O endpoint
  `/api/usuarios/modelo-importacao` **nao le estes arquivos**: ele gera o xlsx
  em memoria com a lib `xlsx`. Mexer aqui nao muda o que a API devolve.
- `backups/` — exports do banco gerados por `scripts/exportarBanco.ts`.
  Contem dados pessoais; nunca versionar nem publicar.

## Notas de implementacao

- **Upload de Excel**: não usa multer. No Cloud Functions o corpo da requisição
  já foi consumido pelo runtime antes do Express, então `uploadSingle`
  (`http/middlewares/uploadMiddleware.ts`) faz o parse do multipart com busboy a
  partir de `req.rawBody`, com fallback para o stream quando roda local.
- **Rate limit**: o store é em memória, por instância. Com várias instâncias
  ativas o limite efetivo é `max × instâncias`. Para limite rígido seria
  necessário um store compartilhado.
- **Timeout**: o Firebase Hosting encerra a requisição em 60s, independente do
  `timeoutSeconds` da function.

## Observacao

Esta pasta contem apenas o backend. A arquitetura e o deploy do sistema estao
documentados no README da raiz do monorepo.
