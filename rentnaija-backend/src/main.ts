import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import { AppModule } from './app.module';

function parseAllowedOrigins(): string[] {
  const origins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()).filter(Boolean);
  return origins?.length ? origins : ['http://localhost:3000'];
}

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';

  // Fail fast if insecure JWT secret is used in production
  if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'rentnaija_secret_change_in_production')) {
    console.error('\n❌  FATAL: JWT_SECRET is not set or is using the default value. Set a strong secret in production.\n');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  const host = process.env.BACKEND_HOST ?? '0.0.0.0';
  const port = Number(process.env.PORT ?? process.env.BACKEND_PORT ?? 3001);

  app.use(helmet());
  app.enableShutdownHooks();
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: parseAllowedOrigins(),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      disableErrorMessages: isProd,
    }),
  );

  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(port, host);
  console.log(`\n🏠 RentNaija API running → http://${host}:${port}/api`);
  console.log(`   WebSocket Chat    → ws://${host}:${port}/chat`);
  console.log(`   Environment       → ${process.env.NODE_ENV ?? 'development'}\n`);
}

bootstrap();
