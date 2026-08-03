import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import { env } from '@config/env';

/**
 * No Cloud Functions a requisição chega proxiada pelo Firebase Hosting, então
 * `req.ip` é o IP do proxy. O IP real do cliente é o primeiro salto do
 * X-Forwarded-For. Usamos um keyGenerator explícito em vez de `trust proxy`
 * para não depender da configuração do Express (e evitar os avisos de
 * "permissive trust proxy" do express-rate-limit).
 */
function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const first = raw?.split(',')[0]?.trim();
  return first || req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Atenção: o store é em memória, por instância. No Cloud Functions cada
 * instância tem sua própria contagem, então o limite efetivo é
 * `max * instâncias ativas`. Serve como proteção contra abuso simples;
 * para limite rígido seria necessário um store compartilhado (Firestore/Redis).
 */
const shared = {
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp,
  validate: { trustProxy: false, xForwardedForHeader: false },
};

export const loginRateLimiter = rateLimit({
  ...shared,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_LOGIN_MAX_REQUESTS,
  message: { status: 'error', message: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
});

export const generalRateLimiter = rateLimit({
  ...shared,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: { status: 'error', message: 'Muitas requisições. Tente novamente em alguns minutos.' },
});
