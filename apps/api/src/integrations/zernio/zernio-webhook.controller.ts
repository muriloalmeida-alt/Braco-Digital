import { Controller, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ZernioWebhookService } from './zernio-webhook.service';

/**
 * Webhook público do Zernio (issue #30). `req.body` chega como `Buffer`
 * bruto — `main.ts` monta `express.raw()` só nesta rota, antes do parser
 * JSON global, justamente para que a assinatura HMAC seja verificada
 * sobre os bytes exatos recebidos (reparsear/reserializar JSON produz
 * bytes diferentes e quebraria a verificação).
 */
@Controller('webhooks/zernio')
export class ZernioWebhookController {
  constructor(private readonly service: ZernioWebhookService) {}

  @Post()
  @HttpCode(200)
  async receive(@Req() req: Request) {
    const rawBody = req.body as Buffer;
    await this.service.handleWebhook(rawBody, {
      signature: req.header('x-zernio-signature') ?? undefined,
      eventId: req.header('x-zernio-event-id') ?? undefined,
      eventType: req.header('x-zernio-event') ?? undefined,
    });
    return { received: true };
  }
}
