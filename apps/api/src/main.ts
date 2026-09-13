import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Limite de payload (docs/technical/20-sprint-02-tech-readiness.md §7):
  // nenhum campo de Track A/B justifica um corpo maior que isto — reduz
  // superfície de DoS de aplicação nas rotas públicas novas sem afetar
  // payloads legítimos existentes.
  app.use(json({ limit: '20kb' }));

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
