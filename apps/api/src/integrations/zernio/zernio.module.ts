import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { getZernioConfig, isZernioFullyConfigured } from './zernio-config';
import { ZernioClient } from './zernio-client';
import { ZernioConnectionController } from './zernio-connection.controller';
import { ZernioConnectionService } from './zernio-connection.service';
import { ZernioMessagesService } from './zernio-messages.service';
import { ZernioMetrics } from './zernio-metrics';
import { ZernioWebhookController } from './zernio-webhook.controller';
import { ZernioWebhookService } from './zernio-webhook.service';
import { ZERNIO_CONFIG, ZERNIO_FETCH } from './zernio.tokens';

@Module({
  imports: [PrismaModule],
  controllers: [ZernioConnectionController, ZernioWebhookController],
  providers: [
    {
      // `null` quando desabilitado — o módulo carrega em qualquer
      // ambiente sem `ZERNIO_API_KEY`; só uma chamada real ao provedor
      // falha (503), nunca o boot da aplicação inteira.
      provide: ZERNIO_CONFIG,
      useFactory: () => (isZernioFullyConfigured() ? getZernioConfig() : null),
    },
    // `fetch` global (Node 20+) injetado como token — testes substituem
    // por uma implementação fake sem precisar de rede real.
    { provide: ZERNIO_FETCH, useValue: fetch },
    ZernioClient,
    ZernioMetrics,
    ZernioConnectionService,
    ZernioMessagesService,
    ZernioWebhookService,
  ],
  exports: [ZernioMessagesService, ZernioConnectionService],
})
export class ZernioModule {}
