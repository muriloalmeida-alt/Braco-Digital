import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { createCredentialsCipher } from './credentials-cipher';
import { getGoogleOAuthConfig, isGoogleFullyConfigured } from './google-config';
import { GoogleApiClient } from './google-api-client';
import { GoogleConnectionController } from './google-connection.controller';
import { GoogleConnectionService } from './google-connection.service';
import { CREDENTIALS_CIPHER, GOOGLE_FETCH, GOOGLE_OAUTH_CONFIG } from './google.tokens';

@Module({
  imports: [PrismaModule],
  controllers: [GoogleConnectionController],
  providers: [
    {
      // `null` quando desabilitado — o módulo carrega em qualquer
      // ambiente sem `GOOGLE_CLIENT_ID`; só uma chamada real ao Google
      // falha (503), nunca o boot da aplicação inteira.
      provide: GOOGLE_OAUTH_CONFIG,
      useFactory: () => (isGoogleFullyConfigured() ? getGoogleOAuthConfig() : null),
    },
    // `fetch` global (Node 20+) injetado como token — testes substituem
    // por uma implementação fake sem precisar de rede real.
    { provide: GOOGLE_FETCH, useValue: fetch },
    {
      // Só construída quando totalmente configurado (a chave de cifra é
      // uma das variáveis obrigatórias) — nunca instanciada com uma
      // chave ausente/inválida por acidente.
      provide: CREDENTIALS_CIPHER,
      useFactory: () => (isGoogleFullyConfigured() ? createCredentialsCipher() : null),
    },
    GoogleApiClient,
    GoogleConnectionService,
  ],
  exports: [GoogleConnectionService],
})
export class GoogleModule {}
