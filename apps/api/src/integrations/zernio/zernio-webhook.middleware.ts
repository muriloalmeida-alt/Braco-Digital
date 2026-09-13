import type { INestApplication } from '@nestjs/common';
import { json, raw } from 'express';

export const ZERNIO_WEBHOOK_PATH = '/webhooks/zernio';

/**
 * Corpo bruto só em `/webhooks/zernio` (issue #30) — a assinatura HMAC
 * precisa dos bytes exatamente como chegaram na rede; reparsear/
 * reserializar JSON produziria bytes diferentes e quebraria a
 * verificação silenciosamente.
 *
 * Extraído para cá (em vez de inline em `main.ts`) porque os testes e2e
 * montam a aplicação via `Test.createTestingModule` + `app.init()`, sem
 * passar por `main.ts` — sem chamar isto também no `beforeAll` do spec,
 * o corpo já chegaria parseado no controller do teste (Nest/Express
 * fazem parse automático de JSON por padrão), e a verificação de
 * assinatura estaria testando um caminho que a produção não usa.
 */
export function applyZernioWebhookRawBody(app: INestApplication, jsonLimit = '20kb'): void {
  app.use(ZERNIO_WEBHOOK_PATH, raw({ type: 'application/json', limit: '256kb' }));
  app.use((req: { originalUrl: string }, res: unknown, next: (err?: unknown) => void) => {
    if (req.originalUrl === ZERNIO_WEBHOOK_PATH) return next();
    return json({ limit: jsonLimit })(req as never, res as never, next);
  });
}
