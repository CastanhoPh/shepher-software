# Sistema Alianca (Shepher)

Monorepo com frontend React e backend Express. Tudo roda dentro do Firebase:
o frontend no Firebase Hosting, o backend como Cloud Function e os dados no
Cloud Firestore.

## Arquitetura

```text
navegador
   |
   v
Firebase Hosting  (shephersoftware.web.app)
   |
   +-- /**        -> frontend/dist  (SPA React + Vite)
   |
   +-- /api/**    -> Cloud Function "api"  (Express + Firebase Admin)
                          |
                          v
                    Cloud Firestore
```

O ponto central: **o frontend chama sempre o caminho relativo `/api`**. Não
existe URL de backend no bundle. O Firebase Hosting reescreve `/api/**` para a
Cloud Function (ver `firebase.json`), então frontend e backend estão na mesma
origem — sem CORS, sem host externo e sem serviço gratuito dormindo.

O frontend também lê o Firestore diretamente (SDK web) no login e no dashboard.
Toda **escrita** passa pela API, que valida permissões com o Admin SDK.

- `frontend/`: interface React com Vite
- `backend/`: API Express em TypeScript, publicada como Cloud Function
  - `src/app.ts`: monta o app Express (compartilhado pelos dois entrypoints)
  - `src/index.ts`: entrypoint do Cloud Functions (produção)
  - `src/server.ts`: servidor HTTP local (`npm run dev`)
- `firestore.rules` / `firestore.indexes.json`: regras e índices do banco

## Requisitos

- Node.js 20+ (o runtime da function é o Node 22)
- Firebase CLI (`npm i -g firebase-tools`) autenticado (`firebase login`)
- **Plano Blaze** no projeto Firebase — Cloud Functions não existe no plano
  gratuito Spark. O uso desta API fica dentro da cota gratuita mensal, mas o
  cartão precisa estar cadastrado.

## Instalar dependencias

```bash
npm install
```

## Variaveis de ambiente

### Backend

Em produção **nenhuma variável é obrigatória**: a Cloud Function autentica no
Firestore e no Auth pela service account do próprio projeto (Application
Default Credentials). Não há mais chave privada no deploy.

Para rodar localmente, configure `backend/.env.dev` (ignorado pelo git):

- `NODE_ENV`
- `PORT`
- `ALLOWED_ORIGINS` (origens extras para o CORS, separadas por vírgula)
- `ADMIN_PROJECT_ID`
- `ADMIN_CLIENT_EMAIL`
- `ADMIN_PRIVATE_KEY`
- `WEB_API_KEY` (Web API key do projeto, usada pelo login via REST)
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `RATE_LIMIT_LOGIN_MAX_REQUESTS`

> Por que `.env.dev` e não `.env`? O Firebase CLI carrega automaticamente o
> `.env` da pasta de functions e **rejeita** chaves com prefixo `FIREBASE_`
> (nomes reservados do runtime), o que fazia o deploy falhar. O `.env.dev` é
> carregado explicitamente por `src/config/env.ts` e ignorado pelo CLI.

### Frontend

Configure em `frontend/.env`:

- `VITE_API_URL=/api` (deixe assim — é o que mantém frontend e backend na mesma origem)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Desenvolvimento

Frontend + backend juntos (o Vite faz proxy de `/api` para a porta 3000):

```bash
npm run dev
```

Para testar exatamente como em produção, com o rewrite do Hosting de verdade:

```bash
npm run build:frontend
npm run emulators          # Hosting em :5000, Functions em :5001
```

## Deploy

```bash
npm run deploy             # frontend (hosting) + backend (functions)
npm run deploy:frontend    # somente hosting
npm run deploy:backend     # somente a function
npm run logs               # logs da function em produção
```

Regras e índices do Firestore são publicados separadamente, de propósito
(revise antes — eles mudam o acesso ao banco):

```bash
npm run deploy:rules
npm run deploy:indexes
```

## Fluxo de autenticacao

1. O frontend autentica o usuario no Firebase Auth (SDK web).
2. O Firebase retorna um ID token.
3. O axios injeta esse token no header `Authorization` de toda chamada a `/api`.
4. A Cloud Function valida o token com o Firebase Admin.
5. O backend carrega o perfil do usuario no Firestore e aplica as permissoes.

## Endpoints principais

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/usuarios`
- `POST /api/usuarios`
- `PATCH /api/usuarios/:id/promover`
- `POST /api/usuarios/importar-excel`
- `GET /api/dashboard/estatisticas`
- `GET /api/dashboard/hierarquia`

## Documentacao mantida

- Este README descreve a arquitetura e o deploy.
- `backend/README.md` descreve detalhes da API.
- `frontend/README.md` descreve detalhes da interface.
- `backend/TESTES-API.md` pode ser usado como guia manual de testes.
