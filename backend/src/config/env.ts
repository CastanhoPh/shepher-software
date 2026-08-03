import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

/**
 * Detecta se estamos rodando dentro do Cloud Functions / Cloud Run.
 * - FUNCTION_TARGET: definido pelo Cloud Functions 2ª geração
 * - K_SERVICE: definido pelo Cloud Run (que roda por baixo das functions gen2)
 */
export const isCloudRuntime = Boolean(process.env.FUNCTION_TARGET || process.env.K_SERVICE);
export const isFunctionsEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

/**
 * Fora da nuvem (npm run dev) carregamos as credenciais de `backend/.env.dev`.
 * Esse nome é intencional: o Firebase CLI carrega automaticamente `.env` e
 * `.env.<projeto>` da pasta de functions e rejeita chaves com prefixo `FIREBASE_`
 * (nomes reservados), o que quebraria o deploy. `.env.dev` é ignorado pelo CLI.
 */
const runningLocally = !isCloudRuntime || isFunctionsEmulator;

if (runningLocally) {
  // src/config -> backend/  |  dist/config -> backend/
  dotenv.config({ path: path.resolve(__dirname, '../../.env.dev') });
}

/**
 * Número vindo de variável de ambiente, tolerante a valor inválido.
 *
 * O runtime do Google injeta suas próprias variáveis (o emulador de functions,
 * por exemplo, define PORT com um valor não numérico). Um valor estranho aqui
 * não pode derrubar a API inteira no boot — cai no default.
 */
const envNumber = (fallback: number) =>
  z.coerce.number().positive().catch(fallback).default(fallback);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: envNumber(3000),

  /**
   * Credenciais de service account — usadas SOMENTE em execução local.
   * No Cloud Functions a autenticação vem da Application Default Credential
   * da própria service account do projeto.
   */
  ADMIN_PROJECT_ID: z.string().optional(),
  ADMIN_CLIENT_EMAIL: z.string().email().optional(),
  ADMIN_PRIVATE_KEY: z.string().optional(),

  /** Web API key (pública) usada pelo login via REST do Firebase Auth. */
  WEB_API_KEY: z.string().optional(),

  /** Origens extras permitidas no CORS, separadas por vírgula. */
  ALLOWED_ORIGINS: z.string().optional(),

  RATE_LIMIT_WINDOW_MS: envNumber(60_000),
  RATE_LIMIT_MAX_REQUESTS: envNumber(100),
  RATE_LIMIT_LOGIN_MAX_REQUESTS: envNumber(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:', parsed.error.format());
  throw new Error('Variáveis de ambiente inválidas');
}

const raw = parsed.data;

/** Descobre o project id: explícito no .env.dev ou injetado pelo runtime do Google. */
function resolveProjectId(): string | undefined {
  if (raw.ADMIN_PROJECT_ID) return raw.ADMIN_PROJECT_ID;
  if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
  if (process.env.GOOGLE_CLOUD_PROJECT) return process.env.GOOGLE_CLOUD_PROJECT;
  if (process.env.FIREBASE_CONFIG) {
    try {
      return JSON.parse(process.env.FIREBASE_CONFIG).projectId as string;
    } catch {
      /* ignora JSON inválido */
    }
  }
  return undefined;
}

const projectId = resolveProjectId();

/**
 * Usa service account explícita apenas em execução local (incluindo o emulador
 * de functions, que também não tem ADC). Em produção sempre cai na Application
 * Default Credential da service account do projeto.
 */
const useServiceAccount =
  runningLocally &&
  Boolean(raw.ADMIN_PROJECT_ID && raw.ADMIN_CLIENT_EMAIL && raw.ADMIN_PRIVATE_KEY);

/** Origens padrão: domínios do Firebase Hosting + Vite local. */
const defaultOrigins = [
  projectId ? `https://${projectId}.web.app` : null,
  projectId ? `https://${projectId}.firebaseapp.com` : null,
  'http://localhost:5173',
  'http://localhost:4173',
].filter((origin): origin is string => Boolean(origin));

const extraOrigins = (raw.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  ...raw,
  projectId,
  useServiceAccount,
  isCloudRuntime,
  isFunctionsEmulator,
  allowedOrigins: Array.from(new Set([...defaultOrigins, ...extraOrigins])),
  serviceAccount: useServiceAccount
    ? {
        projectId: raw.ADMIN_PROJECT_ID!,
        clientEmail: raw.ADMIN_CLIENT_EMAIL!,
        // o .env.dev guarda a chave com \n escapado
        privateKey: raw.ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }
    : null,
};
