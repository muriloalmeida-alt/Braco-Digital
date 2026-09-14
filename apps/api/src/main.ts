import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { assertGoogleEnvValid, isGoogleFullyConfigured } from './integrations/google/google-config';
import { assertCredentialsCipherEnvValid } from './integrations/google/kms/gcp-kms-config';
import { assertZernioEnvValid } from './integrations/zernio/zernio-config';
import { applyZernioWebhookRawBody } from './integrations/zernio/zernio-webhook.middleware';

async function bootstrap() {
  // Issue #30: falha cedo e claro se a integração estiver parcialmente
  // configurada (ZERNIO_API_KEY presente mas faltando alguma outra
  // variável obrigatória) — nunca em silêncio, nunca só descoberto no
  // primeiro request real. Sem ZERNIO_API_KEY, não faz nada (integração
  // simplesmente desabilitada, não é um erro de ambiente).
  assertZernioEnvValid();
  // Issue #31: mesmo princípio, para o OAuth do Google (Calendar+Tasks).
  assertGoogleEnvValid();
  // Issue de KMS production-grade: fail-closed — em produção, com Google
  // habilitado, nunca aceita CREDENTIALS_CIPHER_PROVIDER=env (não
  // production-grade). Nunca derruba o boot fora de produção.
  assertCredentialsCipherEnvValid(process.env, isGoogleFullyConfigured());

  // `bodyParser: false` — o parser JSON automático do Nest roda ANTES de
  // qualquer `app.use()` adicionado depois de `create()` e já consome o
  // stream da requisição; com ele ligado, o `raw()` do webhook do Zernio
  // (abaixo) sempre recebia um corpo vazio/já processado, quebrando a
  // verificação HMAC silenciosamente (só descoberto testando de verdade
  // contra a app montada, não só typecheck/build). Registramos os dois
  // parsers nós mesmos, na ordem certa, via `applyZernioWebhookRawBody`.
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Limite de payload (docs/technical/20-sprint-02-tech-readiness.md §7):
  // nenhum campo de Track A/B justifica um corpo maior que isto — reduz
  // superfície de DoS de aplicação nas rotas públicas novas sem afetar
  // payloads legítimos existentes. `/webhooks/zernio` fica de fora (corpo
  // bruto, próprio limite) — ver `zernio-webhook.middleware.ts`.
  applyZernioWebhookRawBody(app, '20kb');

  // CORS_ORIGIN: lista separada por vírgula de origens exatas permitidas em
  // produção (ex.: a URL pública do serviço apps/web no Railway). Localhost
  // continua sempre permitido para desenvolvimento.
  const configuredOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: [/^http:\/\/localhost:\d+$/, ...configuredOrigins],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`BRACO API rodando em http://localhost:${port}`);
}

bootstrap();
