# Sistema Aliança - Backend

API Express em TypeScript para o Sistema Aliança, usando Firebase Authentication e Cloud Firestore.

## Stack

- Node.js 20+
- TypeScript
- Express
- Firebase Admin SDK
- Cloud Firestore
- Zod

## Execucao

```bash
npm install
npm run dev
```

Para producao:

```bash
npm run build
npm start
```

## Variaveis de ambiente

Copie `.env.example` para `.env` e preencha:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_API_KEY`
- `FRONTEND_URL`

## Autenticacao

O backend valida tokens do Firebase enviados em:

```http
Authorization: Bearer <token>
```

## Endpoints principais

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
- `GET /api/dashboard/estatisticas`
- `GET /api/dashboard/hierarquia`

## Estrutura

```text
src/
	config/
	domain/
	infrastructure/
	shared/
	server.ts
```

## Observacao

Esta pasta contem apenas o backend. A execucao integrada do sistema esta documentada no README da raiz do monorepo.
