import { PrismaService } from './prisma/prisma.service.js';

async function bootstrap() {
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('./app.module.js');

  const app = await NestFactory.createApplicationContext(AppModule);
  const prismaService = app.get(PrismaService);

  prismaService.enableShutdownHooks(app);
}

bootstrap();
