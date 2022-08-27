async function bootstrap() {
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('./app.module.js');

  const app = await NestFactory.createApplicationContext(AppModule);

  app.enableShutdownHooks();
}

bootstrap();
