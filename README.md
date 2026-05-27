# Sistema Alianca

Monorepo do Sistema Alianca com frontend React e backend Express, integrados em uma estrutura monolitica de execucao e deploy.

## Arquitetura atual

- `frontend/`: interface React com Vite
- `backend/`: API Express em TypeScript
- Autenticacao com Firebase Authentication
- Persistencia com Cloud Firestore
- Em producao, o backend serve o build do frontend

## Requisitos

- Node.js 20+
- Projeto Firebase configurado
- Credenciais de servico do Firebase para o backend

## Instalar dependencias

```bash
npm install
```

## Variaveis de ambiente

### Backend

Configure em `backend/.env`:

- `NODE_ENV`
- `PORT`
- `FRONTEND_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_API_KEY`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`

### Frontend

Configure em `frontend/.env`:

- `VITE_API_URL=/api`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Desenvolvimento

Para subir frontend e backend juntos:

```bash
npm run dev
```

Comandos uteis:

```bash
npm run dev:backend
npm run dev:frontend
npm run build
npm run start
```

## Fluxo de autenticacao

1. O frontend autentica o usuario no Firebase.
2. O Firebase retorna um ID token.
3. O frontend envia esse token para a API no header `Authorization`.
4. O backend valida o token com Firebase Admin.
5. O backend carrega o perfil complementar do usuario no Firestore.

## Estrutura do projeto

```text
backend/
frontend/
package.json
```

## Endpoints principais

- `GET /health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/usuarios`
- `POST /api/usuarios`
- `PATCH /api/usuarios/:id/promover`
- `GET /api/dashboard/estatisticas`
- `GET /api/dashboard/hierarquia`

## Documentacao mantida

- Este README descreve a execucao integrada do sistema.
- `backend/README.md` descreve detalhes da API.
- `frontend/README.md` descreve detalhes da interface.
- `backend/TESTES-API.md` pode ser usado como guia manual de testes.