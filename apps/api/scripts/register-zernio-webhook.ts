/**
 * Registro idempotente do webhook do Zernio (issue #30).
 *
 * `ZernioConnectionService.ensureWebhookRegistered()` já é seguro para
 * rodar mais de uma vez — compara a URL/lista de eventos com o que já
 * está salvo (`ZernioWebhookRegistration`) antes de chamar o Zernio de
 * novo — mas não é disparado automaticamente no bootstrap da
 * aplicação (issue #30: "não criar nova assinatura em todo deploy").
 * Rode este script manualmente uma vez por ambiente: na primeira
 * configuração, sempre que a URL pública do apps/api mudar, ou quando
 * a lista de eventos precisar de ajuste.
 *
 * Uso:
 *   npm run zernio:register-webhook
 *
 * Requer ZERNIO_API_KEY/ZERNIO_WEBHOOK_SECRET/ZERNIO_REDIRECT_URL já
 * configuradas no ambiente em que este script roda (`.env` local, ou
 * `railway run npm run zernio:register-webhook` em produção) — nunca
 * passe segredos por linha de comando nem hardcoded aqui.
 *
 * A URL do webhook é derivada de ZERNIO_REDIRECT_URL (mesmo domínio
 * público do apps/api que já recebe o callback de OAuth), em vez de
 * exigir uma segunda variável de ambiente só para isso.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getZernioConfig, isZernioFullyConfigured } from '../src/integrations/zernio/zernio-config';
import { ZernioConnectionService } from '../src/integrations/zernio/zernio-connection.service';

// Lista completa pedida na issue #30, seção "Webhook" — eventos de
// mensagem/conta mais os de status do número do WhatsApp.
const ZERNIO_WEBHOOK_EVENTS = [
  'message.received',
  'message.sent',
  'message.delivered',
  'message.read',
  'message.failed',
  'account.connected',
  'account.disconnected',
  'whatsapp.number.activated',
  'whatsapp.number.declined',
  'whatsapp.number.action_required',
  'whatsapp.number.verification_required',
  'whatsapp.number.suspended',
  'whatsapp.number.reactivated',
  'whatsapp.number.released',
];

async function main() {
  if (!isZernioFullyConfigured()) {
    throw new Error(
      'Zernio não está totalmente configurado neste ambiente ' +
        '(ZERNIO_API_KEY/ZERNIO_WEBHOOK_SECRET/ZERNIO_REDIRECT_URL). ' +
        'Configure as variáveis antes de rodar este script.',
    );
  }
  const config = getZernioConfig();
  const webhookUrl = new URL('/webhooks/zernio', config.redirectUrl).toString();

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const connectionService = app.get(ZernioConnectionService);
    const result = await connectionService.ensureWebhookRegistered(webhookUrl, config.webhookSecret, ZERNIO_WEBHOOK_EVENTS);
    console.log(`Webhook do Zernio: ${result} (url=${webhookUrl}, ${ZERNIO_WEBHOOK_EVENTS.length} eventos).`);
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
