# Sistema Aliança - Frontend

Aplicacao React com Vite para o painel do Sistema Aliança.

## Stack

- React
- TypeScript
- Vite
- Firebase Web SDK
- Axios

## Execucao

```bash
npm install
npm run dev
```

## Ambiente

Copie `.env.example` para `.env` e configure as chaves do Firebase Web SDK.

### Teste local sem backend/login

Para abrir o frontend sem depender do backend e sem login real:

1. Defina `VITE_LOCAL_TEST_MODE=true` no `.env` do frontend.
2. Execute `npm run dev`.

Nesse modo, o app cria um usuario local (ADM) automaticamente e carrega dados mock de `constants.ts`.

O frontend usa `VITE_API_URL=/api` por padrao para funcionar junto com o backend no monolito.

## Integracao

- O login e feito com Firebase Authentication no cliente.
- O token do usuario autenticado e enviado automaticamente para a API.
- Em desenvolvimento, o Vite faz proxy de `/api` e `/health` para o backend.
- Em producao, o backend serve o build do frontend.

## Estrutura principal

```text
components/
contexts/
lib/
services/
App.tsx
```

## Observacao

Esta pasta contem apenas o frontend. A execucao integrada do sistema esta documentada no README da raiz do monorepo.
